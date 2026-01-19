import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MicrohmeterState } from './types';
import EnvironmentalData from './EnvironmentalData';
import TestInfo from './TestInfo';

interface MicrohmeterScreenProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

// Componente de Knob Rotativo Interativo (Reutilizado do Megôhmetro)
interface KnobProps {
  value: number | string;
  options: { value: number | string; label: string; angle: number }[];
  onChange: (value: number | string) => void;
  size?: number;
  disabled?: boolean;
  label?: string;
}

const RotaryKnob: React.FC<KnobProps> = ({ value, options, onChange, size = 80, disabled = false, label }) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const currentOption = options.find(o => o.value === value) || options[0];
  const currentAngle = currentOption?.angle || 0;

  const getAngleFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!knobRef.current) return 0;
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    return Math.atan2(y, x) * (180 / Math.PI) + 90;
  }, []);

  const findClosestOption = useCallback((angle: number) => {
    let normalizedAngle = angle % 360;
    if (normalizedAngle < 0) normalizedAngle += 360;
    
    let closest = options[0];
    let minDiff = Math.abs(normalizedAngle - options[0].angle);
    
    options.forEach(opt => {
      const diff = Math.abs(normalizedAngle - opt.angle);
      if (diff < minDiff) {
        minDiff = diff;
        closest = opt;
      }
    });
    
    return closest;
  }, [options]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    
    // Get angle from click
    if (!knobRef.current) return;
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    const angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    
    const closest = findClosestOption(angle);
    if (closest.value !== value) {
      onChange(closest.value);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || disabled) return;
      const angle = getAngleFromEvent(e);
      const closest = findClosestOption(angle);
      if (closest.value !== value) {
        onChange(closest.value);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, disabled, getAngleFromEvent, findClosestOption, value, onChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
      {label && <div style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{label}</div>}
      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #3a3a3a, #1a1a1a)',
          boxShadow: isDragging 
            ? '0 0 15px rgba(255,215,0,0.5), inset 0 2px 5px rgba(0,0,0,0.5)'
            : '0 4px 8px rgba(0,0,0,0.5), inset 0 2px 5px rgba(0,0,0,0.3)',
          cursor: disabled ? 'not-allowed' : 'grab',
          position: 'relative',
          border: '3px solid #555',
          transition: 'box-shadow 0.2s'
        }}
      >
        {/* Indicador do knob */}
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            width: '4px',
            height: size / 2 - 8,
            background: 'linear-gradient(to bottom, #ffd700, #ff8c00)',
            borderRadius: '2px',
            transformOrigin: 'bottom center',
            transform: `translate(-50%, -100%) rotate(${currentAngle}deg)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            boxShadow: '0 0 5px rgba(255,215,0,0.5)'
          }}
        />
        {/* Centro do knob */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: size / 4,
            height: size / 4,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #555, #333)',
            border: '2px solid #666'
          }}
        />
      </div>
      <div style={{ 
        color: '#ffd700', 
        fontSize: '11px', 
        fontWeight: 'bold',
        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        background: 'rgba(0,0,0,0.6)',
        padding: '2px 8px',
        borderRadius: '4px'
      }}>
        {currentOption?.label || value}
      </div>
    </div>
  );
};

const MicrohmeterScreen: React.FC<MicrohmeterScreenProps> = ({ onComplete, onBack }) => {
  const [state, setState] = useState<MicrohmeterState>({
    currentScale: '10 A',
    isRunning: false,
    injectedCurrent: 0,
    resistance: 0,
    voltage: 0,
    time: 0,
    measurements: []
  });

  const [isStabilized, setIsStabilized] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    let interval: any;

    if (state.isRunning) {
      interval = setInterval(() => {
        setState(prev => {
          const newTime = prev.time + 1;

          const currentValue = parseFloat(prev.currentScale.split(' ')[0]);
          const injectedCurrent = currentValue * 1000;

          const baseResistance = 0.065164;
          const variation = (Math.random() - 0.5) * 0.00001;
          const resistance = baseResistance + variation;

          const voltage = (injectedCurrent / 1000) * resistance;

          // Check if stabilization time (2.5 seconds) has been reached
          if (newTime >= 2.5 && !isStabilized) {
            setIsStabilized(true);
          }

          const newState = {
            ...prev,
            time: newTime,
            injectedCurrent,
            resistance,
            voltage,
            measurements: [...prev.measurements, { time: newTime, resistance, voltage, current: injectedCurrent }]
          };

          return newState;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [state.isRunning, state.currentScale]);

  const handleStart = () => {
    setIsStabilized(false);
    setState(prev => ({
      ...prev,
      isRunning: true,
      measurements: [],
      time: 0
    }));
  };

  const handleStop = () => {
    setState(prev => ({
      ...prev,
      isRunning: false
    }));
  };

  const handleComplete = () => {
    const avgResistance = state.measurements.length > 0
      ? state.measurements.reduce((sum, m) => sum + (m.resistance || 0), 0) / state.measurements.length
      : 0;
      
    onComplete({
      type: 'Microhmeter',
      measurements: state.measurements,
      currentScale: state.currentScale,
      maxResistance: Math.max(...state.measurements.map(m => m.resistance || 0)),
      avgResistance: avgResistance,
      finalResistance: avgResistance
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', color: '#fff' }}>
      <div style={{ padding: '20px', width: '100%', maxWidth: '1200px' }}>
        <h2 style={{ color: '#4CAF50', marginBottom: '20px', textAlign: 'center' }}>DLRO - Microhmímetro</h2>

        {/* Container de Abas Customizado */}
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid rgba(76, 175, 80, 0.3)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
            <button 
              onClick={() => setActiveTab(0)}
              style={{ 
                flex: '1 1 0%', 
                padding: '16px 20px', 
                border: 'none',
                borderBottom: activeTab === 0 ? '3px solid rgb(76, 175, 80)' : 'none',
                background: activeTab === 0 ? 'rgba(76, 175, 80, 0.2)' : 'transparent', 
                color: activeTab === 0 ? 'rgb(76, 175, 80)' : 'rgba(255, 255, 255, 0.6)', 
                cursor: 'pointer', 
                fontSize: '16px', 
                fontWeight: activeTab === 0 ? '600' : '400', 
                transition: '0.3s', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px' 
              }}
            >
              <span style={{ fontSize: '18px' }}>📊</span>Medição
            </button>
            <button 
              onClick={() => setActiveTab(1)}
              style={{ 
                flex: '1 1 0%', 
                padding: '16px 20px', 
                border: 'none', 
                borderBottom: activeTab === 1 ? '3px solid rgb(76, 175, 80)' : 'none',
                background: activeTab === 1 ? 'rgba(76, 175, 80, 0.2)' : 'transparent', 
                color: activeTab === 1 ? 'rgb(76, 175, 80)' : 'rgba(255, 255, 255, 0.6)', 
                cursor: 'pointer', 
                fontSize: '16px', 
                fontWeight: activeTab === 1 ? '600' : '400', 
                transition: '0.3s', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px' 
              }}
            >
              <span style={{ fontSize: '18px' }}>📖</span>Explicação
            </button>
          </div>
          
          <div style={{ padding: '24px', minHeight: '400px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.6' }}>
            {activeTab === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ color: 'rgb(76, 175, 80)', marginBottom: '20px', alignSelf: 'flex-start' }}>Leituras em Tempo Real</h3>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '60px', 
                  width: '100%', 
                  padding: '20px 0',
                  minHeight: '500px'
                }}>
                  {/* Área do Equipamento */}
                  <div style={{ 
                    position: 'relative', 
                    width: '100%', 
                    maxWidth: '650px',
                    backgroundColor: '#1a1a1a',
                    overflow: 'visible', // Permitir que os cabos saiam
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    borderRadius: '8px'
                  }}>
                    {/* Imagem de Fundo */}
                    <img 
                      src="/tela micro ohimetro.png" 
                      alt="Microhmímetro DLRO" 
                      style={{ 
                        width: '100%', 
                        height: 'auto', 
                        display: 'block',
                        borderRadius: '8px'
                      }} 
                    />

                    {/* SVG para os Cabos de Conexão (Simples) */}
                    <svg 
                      viewBox="0 0 650 500" 
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        pointerEvents: 'none', 
                        zIndex: 20,
                        overflow: 'visible'
                      }}>
                      {/* Cabo Vermelho Único (C1) */}
                      <path 
                        d="M 586,70 C 750,70 820,290 900,290" 
                        fill="none" 
                        stroke="#ff4444" 
                        strokeWidth="10" 
                        strokeLinecap="round"
                        style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))' }}
                      />
                      <circle cx="586" cy="70" r="16" fill="#ff4444" stroke="#222" strokeWidth="3" />
                      <text x="570" y="55" fill="#fff" fontSize="14" fontWeight="bold">C1</text>

                      {/* Cabo Preto Único (C2) */}
                      <path 
                        d="M 586,176 C 750,176 820,370 900,370" 
                        fill="none" 
                        stroke="#111" 
                        strokeWidth="10" 
                        strokeLinecap="round"
                        style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))' }}
                      />
                      <circle cx="586" cy="176" r="16" fill="#111" stroke="#333" strokeWidth="3" />
                      <text x="570" y="160" fill="#fff" fontSize="14" fontWeight="bold">C2</text>
                    </svg>

                    {/* Overlay do Display Digital */}
                    <div style={{
                      position: 'absolute',
                      top: '35%',
                      left: '42%',
                      transform: 'translateX(-50%)',
                      width: '42%',
                      height: '24%',
                      backgroundColor: 'transparent',
                      borderRadius: '10px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 5
                    }}>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        width: '100%', 
                        gap: '14px' 
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: '#4CAF50', fontSize: '9px', marginBottom: '5px' }}>CORRENTE (mA)</div>
                          <div style={{ 
                            fontFamily: '"Courier New", Courier, monospace',
                            fontSize: '25px',
                            fontWeight: 'bold',
                            color: isStabilized ? '#00ff00' : '#4CAF50',
                            textShadow: '0 0 10px rgba(0,255,0,0.3)'
                          }}>
                            {state.injectedCurrent.toFixed(1)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: '#2196F3', fontSize: '9px', marginBottom: '5px' }}>TENSÃO (mV)</div>
                          <div style={{ 
                            fontFamily: '"Courier New", Courier, monospace',
                            fontSize: '25px',
                            fontWeight: 'bold',
                            color: isStabilized ? '#64b5f6' : '#2196F3',
                            textShadow: '0 0 10px rgba(33,150,243,0.3)'
                          }}>
                            {state.voltage.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: '14px', textAlign: 'center' }}>
                        <div style={{ color: '#FF9800', fontSize: '10px', marginBottom: '5px' }}>RESISTÊNCIA (Ω)</div>
                        <div style={{ 
                          fontFamily: '"Courier New", Courier, monospace',
                          fontSize: '34px',
                          fontWeight: 'bold',
                          color: isStabilized ? '#FF9800' : '#ffb74d',
                          textShadow: '0 0 15px rgba(255, 152, 0, 0.4)'
                        }}>
                          {state.resistance.toFixed(6)}
                        </div>
                      </div>
                    </div>

                    {/* Controles Independentes */}
                    
                    {/* 1. Knob de Escala de Corrente */}
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '5.5%', 
                      left: '60.5%', 
                      zIndex: 10,
                      pointerEvents: 'auto' 
                    }}>
                      <RotaryKnob
                        value={state.currentScale}
                        options={[
                          { value: '10 A', label: '10A', angle: 60 },
                          { value: '50 A', label: '50A', angle: 100 },
                          { value: '100 A', label: '100A', angle: 140 }
                        ]}
                        onChange={(v) => setState(prev => ({ ...prev, currentScale: v as string }))}
                        size={85}
                        disabled={state.isRunning}
                      />
                    </div>

                    {/* 2. Botão de TESTE (START/STOP) */}
                    <div 
                      onClick={state.isRunning ? handleStop : handleStart}
                      style={{
                        position: 'absolute',
                        bottom: '15%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '55px',
                        height: '55px',
                        borderRadius: '50%',
                        background: state.isRunning 
                          ? 'linear-gradient(145deg, #ff4444, #cc0000)'
                          : 'linear-gradient(145deg, #4CAF50, #2E7D32)',
                        border: '6px solid #333',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: state.isRunning
                          ? '0 0 30px rgba(255,0,0,0.6), inset 0 -5px 15px rgba(0,0,0,0.4)'
                          : '0 10px 20px rgba(0,0,0,0.5), inset 0 -5px 15px rgba(0,0,0,0.4)',
                        transition: 'all 0.2s',
                        pointerEvents: 'auto',
                        zIndex: 12
                      }}
                      onMouseDown={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(0.95)'}
                      onMouseUp={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
                    >
                      <span style={{ 
                        color: '#fff', 
                        fontWeight: 'bold', 
                        fontSize: '13px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        marginBottom: '2px'
                      }}>
                        {state.isRunning ? 'STOP' : 'TESTE'}
                      </span>
                      <span style={{ fontSize: '20px' }}>
                        {state.isRunning ? '⏹' : '▶'}
                      </span>
                    </div>

                    {/* 3. Botão Concluir */}
                    <button
                      onClick={handleComplete}
                      disabled={state.measurements.length === 0 || state.isRunning}
                      style={{
                        position: 'absolute',
                        bottom: '39.5%',
                        right: '20.5%',
                        padding: '10px 18px',
                        backgroundColor: (state.measurements.length === 0 || state.isRunning) ? '#444' : '#2e7d32',
                        color: '#fff',
                        border: '3px solid #333',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: (state.measurements.length === 0 || state.isRunning) ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s',
                        zIndex: 10
                      }}
                    >
                      CONCLUIR E ENVIAR
                    </button>
                  </div>

                  {/* Lado Direito: Caixa com Terminais */}
                  <div style={{ 
                    width: '320px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    padding: '25px',
                    borderRadius: '20px',
                    border: '2px solid rgba(255, 152, 0, 0.3)',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                    marginTop: '40px'
                  }}>
                    <svg width="240" height="250" viewBox="0 0 240 250">
                      {/* Pontos de Conexão Centralizados (Bolas Vermelha e Preta) */}
                      <g transform="translate(100, 80)">
                        <circle cx="20" cy="40" r="16" fill="#ff4444" stroke="#222" strokeWidth="3" />
                        <text x="45" y="45" fill="#ff4444" fontSize="14" fontWeight="bold">C1/P1</text>
                        
                        <circle cx="20" cy="120" r="16" fill="#111" stroke="#222" strokeWidth="3" />
                        <text x="45" y="125" fill="#ccc" fontSize="14" fontWeight="bold">C2/P2</text>
                      </g>

                      <text x="50%" y="240" textAnchor="middle" fill="#FF9800" fontSize="14" fontWeight="bold">Terminais de Teste</text>
                    </svg>
                    
                    <div style={{ marginTop: '15px', textAlign: 'center' }}>
                      <div style={{ color: '#FF9800', fontSize: '13px', fontWeight: 'bold' }}>
                         Configuração: Kelvin (4 Fios)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabela de Resultados abaixo de tudo na aba */}
                {state.measurements.length > 0 && (
                  <div style={{ marginTop: '20px', width: '100%', maxWidth: '900px' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      marginTop: '10px',
                      backgroundColor: '#2a2a2a',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #444' }}>Corrente Injetada</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #444' }}>Resistência Medida</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #444' }}>Tensão Medida</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '12px', borderBottom: '1px solid #444', color: '#fff', fontWeight: 'bold' }}>{state.injectedCurrent.toFixed(2)} mA</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #444', color: '#fff', fontWeight: 'bold' }}>{state.resistance.toFixed(6)} Ω</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #444', color: '#fff', fontWeight: 'bold' }}>{state.voltage.toFixed(2)} mV</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#ccc' }}>
                <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Resistência Ôhmica</h3>

                <TestInfo
                  objective="Verificar se o valor da resistência ôhmica está conforme a especificação de fábrica do enrolamento."
                  necessity={[
                    'Detectar mudanças na resistência dos enrolamentos causadas por falhas ou degradação',
                    'Comparar valores medidos com referências históricas para identificar tendências',
                    'Validar continuidade dos circuitos de potência',
                    'Máximo desvio admissível é de 5% em relação aos valores de referência'
                  ]}
                />

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Princípio de Funcionamento</h4>
                <p>
                  O teste injeta uma corrente contínua (DC) através do enrolamento e mede a queda de tensão resultante. 
                  Usando a lei de Ohm (R = V / I), calcula-se a resistência. Este teste é muito sensível a mudanças nas 
                  propriedades do material e conexões.
                </p>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Critérios de Aceitação</h4>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginTop: '10px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#333', color: '#4CAF50' }}>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Critério</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Condição</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #444' }}>
                      <td style={{ padding: '10px' }}>Dentro de tolerância</td>
                      <td style={{ padding: '10px' }}>Desvio menor que 5% da referência</td>
                      <td style={{ padding: '10px', color: '#4CAF50' }}>Equipamento aceito</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #444' }}>
                      <td style={{ padding: '10px' }}>Leve variação</td>
                      <td style={{ padding: '10px' }}>Desvio de 5% a 10% da referência</td>
                      <td style={{ padding: '10px', color: '#ff9800' }}>Monitorar periodicamente</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #444' }}>
                      <td style={{ padding: '10px' }}>Alteração significativa</td>
                      <td style={{ padding: '10px' }}>Desvio acima de 10% da referência</td>
                      <td style={{ padding: '10px', color: '#f44336' }}>Investigação e possível manutenção</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Condições Ambientais ABAIXO do container de abas */}
        <div style={{ marginBottom: '20px' }}>
          <EnvironmentalData />
        </div>

        {/* Botão Voltar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button
            onClick={onBack}
            style={{
              padding: '12px 24px',
              backgroundColor: '#444',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#555'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#444'}
          >
            Voltar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MicrohmeterScreen;
