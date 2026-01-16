import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MegohmmeterState } from './types';
import EnvironmentalData from './EnvironmentalData';
import Chart from './Chart';
import DualAxisChart from './DualAxisChart';
import TestInfo from './TestInfo';
import TabComponent from './TabComponent';

interface MegohmmeterScreenProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

// Componente de Knob Rotativo Interativo
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
          transition: 'box-shadow 0.2s',
          opacity: disabled ? 0.6 : 1
        }}
      >
        {/* Indicador do knob */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
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

const MegohmmeterScreen: React.FC<MegohmmeterScreenProps> = ({ onComplete, onBack }) => {
  const IP_DURATION = 600;
  const DD_CHARGE_DURATION = 1800; // 30 minutos de carga
  const DD_DISCHARGE_DURATION = 60; // 1 minuto de descarga
  const SV_STEP_DURATION = 60;
  const SV_STEPS_COUNT = 5;

  const getTimeStep = (mode: string, time?: number) => {
    if (mode === 'DD') {
      // Durante a fase de descarga (após 30 min), usar timeStep menor para mais pontos
      if (time !== undefined && time >= DD_CHARGE_DURATION) {
        return 1; // 1 segundo durante descarga para curva suave
      }
      return 5; // 5 segundos durante carga
    }
    if (mode === 'SV') return 5;
    if (mode === 'IP') return 2; // Mais pontos para gráfico IP mais suave
    return 30;
  };

  const getMaxTime = (mode: string) => {
    if (mode === 'IP') return IP_DURATION;
    if (mode === 'DD') return DD_CHARGE_DURATION + DD_DISCHARGE_DURATION;
    return SV_STEP_DURATION * SV_STEPS_COUNT;
  };

  const getSvSteps = (voltage: number) =>
    Array.from({ length: SV_STEPS_COUNT }, (_, index) => Math.round(((index + 1) / SV_STEPS_COUNT) * voltage));

  const [state, setState] = useState<MegohmmeterState>({
    testMode: 'IP',
    testVoltage: 500,
    isRunning: false,
    appliedVoltage: 0,
    resistance: 0,
    current: 0,
    timeConstant: 0,
    capacitanceCC: 0,
    absorptionIndex: undefined,
    polarizationIndex: undefined,
    ddIndex: undefined,
    r30s: undefined,
    r60s: undefined,
    r600s: undefined,
    sv1m: undefined,
    sv2m: undefined,
    sv3m: undefined,
    sv4m: undefined,
    time: 0,
    measurements: []
  });

  const [chartData, setChartData] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartCurrentData, setChartCurrentData] = useState<number[]>([]);
  const [ddChargeCurrent, setDdChargeCurrent] = useState<number[]>([]);
  const [ddDischargeCurrent, setDdDischargeCurrent] = useState<number[]>([]);
  const [svChartData, setSvChartData] = useState<number[]>([]);
  const [svChartCurrentData, setSvChartCurrentData] = useState<number[]>([]);
  const [svChartLabels, setSvChartLabels] = useState<string[]>([]);

  useEffect(() => {
    let interval: any;

    if (state.isRunning) {
      interval = setInterval(() => {
        setState(prev => {
          const timeStep = getTimeStep(prev.testMode, prev.time);
          const maxTime = getMaxTime(prev.testMode);
          const newTime = Math.min(prev.time + timeStep, maxTime);

          let appliedVoltage = prev.testVoltage;
          let resistance = prev.resistance;
          let current = prev.current;
          let capacitanceCC = prev.capacitanceCC;
          let timeConstant = prev.timeConstant;
          let r30s = prev.r30s;
          let r60s = prev.r60s;
          let r600s = prev.r600s;
          let sv1m = prev.sv1m;
          let sv2m = prev.sv2m;
          let sv3m = prev.sv3m;
          let sv4m = prev.sv4m;
          let r15s = (prev as any).r15s;
          let r180s = (prev as any).r180s;

          if (prev.testMode === 'SV') {
            const steps = getSvSteps(prev.testVoltage);
            const stepIndex = Math.min(Math.floor(newTime / SV_STEP_DURATION), steps.length - 1);

            appliedVoltage = steps[stepIndex];
            
            // Simulação baseada no cenário
            if (prev.svScenario === 'great') {
                // Ótimo: Resistência aumenta com a tensão
                // Base 1200 + aumento de ~10% a cada step
                resistance = 1200 * (1 + (stepIndex * 0.1)) + Math.random() * 15;
            } else if (prev.svScenario === 'good') {
                // Bom: Resistência se mantém estável ou leve aumento
                resistance = 1200 + stepIndex * 15 + Math.random() * 15;
            } else if (prev.svScenario === 'warning') {
                // Atenção: Queda de até 35% em algum step
                // Vamos simular uma queda progressiva que atinge ~20-30% no último step
                const dropFactor = stepIndex * 0.07; // 4 * 0.07 = 28% de queda no final
                resistance = 1200 * (1 - dropFactor) + Math.random() * 10;
            } else if (prev.svScenario === 'dangerous') {
                // Perigoso: Queda acima de 35%
                // Queda brusca a partir do 3º step ou progressiva forte
                const dropFactor = stepIndex * 0.15; // 4 * 0.15 = 60% queda no final
                resistance = 1200 * (1 - dropFactor) + Math.random() * 10;
            } else {
                 // Fallback sem cenário
                 resistance = 1200 + stepIndex * 120 + Math.random() * 15;
            }

            // Garante que não fique negativo ou zero (casos extremos random)
            resistance = Math.max(10, resistance);

            current = appliedVoltage / resistance;
            capacitanceCC = 69 + (Math.random() - 0.5) * 3;
            timeConstant = (resistance * capacitanceCC) / 1000;

            // Coletar dados APENAS ao final de cada step (mudança de tensão)
            // Os pontos devem ser coletados em 1m, 2m, 3m, 4m, 5m
            if (newTime > 0 && newTime % 60 === 0) {
              // Pegamos os valores anteriores (do final do minuto) para registrar
              // O step que acabou de terminar corresponde ao índice: (newTime/60) - 1
              const recordedStepIndex = (newTime / 60) - 1;
              const recordedVoltage = steps[recordedStepIndex];
              
              setSvChartData(prevData => [...prevData, prev.resistance]);
              setSvChartCurrentData(prevData => [...prevData, prev.current]);
              setSvChartLabels(prevLabels => [...prevLabels, `${recordedVoltage}`]);
            }
            
            // Adicionar label só quando entra em um novo step (Removido - agora labels são adicionados com os dados)

            // Capturar leituras de fim de step (1m, 2m, 3m, 4m)
            // Usamos prev.resistance pois representa o valor ao final do step anterior
            if (prev.time < 60 && newTime >= 60) sv1m = prev.resistance;
            if (prev.time < 120 && newTime >= 120) sv2m = prev.resistance;
            if (prev.time < 180 && newTime >= 180) sv3m = prev.resistance;
            if (prev.time < 240 && newTime >= 240) sv4m = prev.resistance;

          } else if (prev.testMode === 'DD') {
            const chargePhase = newTime <= DD_CHARGE_DURATION;
            const chargeTime = Math.min(newTime, DD_CHARGE_DURATION);
            const dischargeTime = Math.max(0, newTime - DD_CHARGE_DURATION);

            appliedVoltage = chargePhase ? prev.testVoltage : 0;

            const baseResistance = 900 + Math.log(chargeTime / 60 + 1) * 900;
            resistance = baseResistance + (Math.random() - 0.5) * 10;

            let chargeCurrent = 0;
            let dischargeCurrent = 0;
            
            // Corrente máxima inicial de carga (para referência do pico de descarga)
            const maxChargeCurrent = 7.0;
            // Corrente final de carga (estabilizada)
            const finalChargeCurrent = 0.3;

            if (chargePhase) {
              // Curva de carga com joelho mais acentuado (decaimento exponencial mais rápido no início)
              // Usando constante de tempo menor (60s) para decaimento mais rápido
              chargeCurrent = (maxChargeCurrent - finalChargeCurrent) * Math.exp(-chargeTime / 60) + finalChargeCurrent;
              dischargeCurrent = 0;
              current = chargeCurrent;
              // Coletar pontos de carga (plota até 30 min)
              setDdChargeCurrent(prevData => [...prevData, chargeCurrent]);
              setDdDischargeCurrent(prevData => [...prevData, 0]);
              setChartLabels(prevLabels => [...prevLabels, formatTime(newTime)]);
              
              // Se este é o último ponto da fase de carga (exatamente 30 min), 
              // adiciona também o ponto inicial da descarga para continuidade visual
              if (newTime === DD_CHARGE_DURATION) {
                // Adiciona ponto de transição: carga termina e descarga começa no mesmo valor
                setDdChargeCurrent(prevData => [...prevData, 0]);
                setDdDischargeCurrent(prevData => [...prevData, -finalChargeCurrent]);
                setChartLabels(prevLabels => [...prevLabels, formatTime(newTime)]);
              }
            } else if (dischargeTime <= DD_DISCHARGE_DURATION) {
              // Fase de descarga: começa em 30 min
              // Valor inicial da descarga = valor final da carga (negativo)
              // Pico de descarga = ~1.3x a corrente máxima de carga (negativo)
              const peakDischargeCurrent = -(maxChargeCurrent * 1.3);
              // A descarga começa no valor final da carga (negativo) e vai até o pico rapidamente
              // Depois decai de volta tentando ir a zero com curva suave (joelho)
              const peakTime = 3; // tempo para atingir o pico (3 segundos) - descida rápida
              const decayTime = 25; // constante de tempo maior para retorno suave
              
              if (dischargeTime <= peakTime) {
                // Descida rápida do valor inicial até o pico (exponencial rápido)
                const t = dischargeTime / peakTime;
                // Usar curva exponencial para descida mais natural
                const expFactor = 1 - Math.exp(-3 * t); // Curva exponencial rápida
                dischargeCurrent = -finalChargeCurrent + (peakDischargeCurrent + finalChargeCurrent) * expFactor;
              } else {
                // Retorno suave do pico tentando ir a zero (joelho exponencial)
                const timeAfterPeak = dischargeTime - peakTime;
                dischargeCurrent = peakDischargeCurrent * Math.exp(-timeAfterPeak / decayTime);
              }
              
              chargeCurrent = 0;
              current = Math.abs(dischargeCurrent);
              // Carga fica em 0 após 30 min, descarga começa a ser plotada
              setDdChargeCurrent(prevData => [...prevData, 0]);
              setDdDischargeCurrent(prevData => [...prevData, dischargeCurrent]);
              setChartLabels(prevLabels => [...prevLabels, formatTime(newTime)]);
            }

            capacitanceCC = 69 + (Math.random() - 0.5) * 3;
            timeConstant = (resistance * capacitanceCC) / 1000;
            
            // Calcular DD em 31 min (1860 segundos) - 1 minuto após remoção da tensão
            // DD = I1min / (V × C)
            // I1min = corrente de descarga em mA, 1 minuto após remoção da tensão
            // V = tensão de teste em Volts
            // C = capacitância em Farads
            const DD_CALC_TIME = 1860; // 31 minutos em segundos (30 min carga + 1 min descarga)
            if (newTime >= DD_CALC_TIME && !prev.ddIndex) {
              // Converter unidades:
              // current está em μA -> converter para mA: dividir por 1000
              // capacitanceCC está em nF -> converter para F: dividir por 10^9
              // testVoltage está em V (já correto)
              const currentMA = current / 1000; // μA para mA
              const capacitanceF = capacitanceCC / 1e9; // nF para F
              const ddValue = currentMA / (prev.testVoltage * capacitanceF);
              return {
                ...prev,
                time: newTime,
                appliedVoltage,
                resistance,
                current,
                capacitanceCC,
                timeConstant,
                ddIndex: ddValue
              };
            }
          } else {
            const tMin = newTime / 60;
            
            // Simulação baseada no cenário IP
            let targetPI = 3.0;
            let k = 0.5; // inclinação da curva log

            if (prev.ipScenario === 'poor') {
                 // PI < 1
                 // Resistência plana ou caindo
                 targetPI = 0.9;
                 k = Math.log10(targetPI); // negativo ou zero
            } else if (prev.ipScenario === 'questionable') {
                 // 1 <= PI <= 2
                 targetPI = 1.5;
                 k = Math.log10(targetPI); 
            } else if (prev.ipScenario === 'acceptable') {
                 // 2 <= PI <= 4
                 targetPI = 3.0; // Padrão
                 k = Math.log10(targetPI);
            } else if (prev.ipScenario === 'good') {
                 // PI > 4
                 targetPI = 6.0;
                 k = Math.log10(targetPI);
            }

            // R(t) = R1min * t^k (com t em minutos)
            const r1minBase = 800 + Math.random() * 50; 
            const safeTMin = Math.max(tMin, 1/60); // 1s min
            
            resistance = r1minBase * Math.pow(safeTMin, k) + (Math.random() - 0.5) * 5;

            current = prev.testVoltage / resistance;
            capacitanceCC = 69 + (Math.random() - 0.5) * 3;
            timeConstant = (resistance * capacitanceCC) / 1000;
            
            if (!r15s && newTime >= 15) r15s = resistance;
            if (!r30s && newTime >= 30) r30s = resistance;
            if (!r60s && newTime >= 60) r60s = resistance;
            if (!r180s && newTime >= 180) r180s = resistance;
            if (!r600s && newTime >= 600) r600s = resistance;

            setChartData(prevData => [...prevData, resistance]);
            setChartCurrentData(prevData => [...prevData, current]);
            setChartLabels(prevLabels => [...prevLabels, formatTime(newTime)]);
          }

          // DA = R3min / R30s
          const daIndex = r180s && r30s ? r180s / r30s : (prev as any).daIndex;
          // IA = R1min / R30s
          const absorptionIndex = r60s && r30s ? r60s / r30s : prev.absorptionIndex;
          // IP = R10min / R1min
          const polarizationIndex = r60s && r600s ? r600s / r60s : prev.polarizationIndex;

          const newState = {
            ...prev,
            time: newTime,
            appliedVoltage,
            resistance,
            current,
            timeConstant,
            capacitanceCC,
            r15s,
            r30s,
            r60s,
            r180s,
            r600s,
            sv1m,
            sv2m,
            sv3m,
            sv4m,
            absorptionIndex,
            polarizationIndex,
            daIndex
          };

          if (newTime >= maxTime) {
            const measurement = {
              mode: newState.testMode,
              voltage: newState.testVoltage,
              resistance: newState.resistance,
              current: newState.current,
              timeConstant: newState.timeConstant,
              capacitanceCC: newState.capacitanceCC,
              absorptionIndex: newState.absorptionIndex,
              polarizationIndex: newState.polarizationIndex,
              time: newState.time
            };

            return {
              ...newState,
              isRunning: false,
              measurements: [...prev.measurements, measurement]
            };
          }

          return newState;
        });
      }, 67);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isRunning, state.testVoltage, state.testMode]);

  const startTest = () => {
    setChartData([]);
    setChartLabels([]);
    setChartCurrentData([]);
    setDdChargeCurrent([]);
    setDdDischargeCurrent([]);
    setSvChartData([]);
    setSvChartCurrentData([]);
    setSvChartLabels([]);

    // Sortear cenário para SV
    const svScenarios: ('great' | 'good' | 'warning' | 'dangerous')[] = ['great', 'good', 'warning', 'dangerous'];
    const randomSvScenario = svScenarios[Math.floor(Math.random() * svScenarios.length)];
    
    // Sortear cenário para IP
    const ipScenarios: ('poor' | 'questionable' | 'acceptable' | 'good')[] = ['poor', 'questionable', 'acceptable', 'good'];
    const randomIpScenario = ipScenarios[Math.floor(Math.random() * ipScenarios.length)];

    setState(prev => ({
      ...prev,
      isRunning: true,
      time: 0,
      appliedVoltage: 0,
      resistance: 0,
      current: 0,
      timeConstant: 0,
      capacitanceCC: 0,
      absorptionIndex: undefined,
      polarizationIndex: undefined,
      ddIndex: undefined,
      r15s: undefined,
      r30s: undefined,
      r60s: undefined,
      r180s: undefined,
      r600s: undefined,
      daIndex: undefined,
      svScenario: randomSvScenario,
      ipScenario: randomIpScenario
    }));
  };

  const stopTest = () => {
    setState(prev => {
      const measurement = {
        mode: prev.testMode,
        voltage: prev.testVoltage,
        resistance: prev.resistance,
        current: prev.current,
        timeConstant: prev.timeConstant,
        capacitanceCC: prev.capacitanceCC,
        absorptionIndex: prev.absorptionIndex,
        polarizationIndex: prev.polarizationIndex,
        time: prev.time
      };

      return {
        ...prev,
        isRunning: false,
        measurements: [...prev.measurements, measurement]
      };
    });
  };

  const sendToPlatform = () => {
    const data = {
      type: 'megohmmeter',
      measurements: state.measurements,
      testMode: state.testMode,
      testVoltage: state.testVoltage,
      finalResistance: state.resistance,
      finalCurrent: state.current,
      timeConstant: state.timeConstant,
      capacitanceCC: state.capacitanceCC,
      absorptionIndex: state.absorptionIndex,
      polarizationIndex: state.polarizationIndex,
      totalTime: state.time
    };

    onComplete(data);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getSimulatedResistance = (startTime: number, time: number, mode: string, voltage: number, scenario?: string) => {
    // Implementar lógica de simulação baseada no cenário SV selecionado
    return 1000;
  };

  const getSvDiagnosis = (scenario: string | undefined): { label: string, color: string, reason: string } => {
    if (!scenario) return { label: '---', color: '#666', reason: '' };
    switch(scenario) {
      case 'great': return { 
          label: 'ÓTIMO', 
          color: '#81C784',
          reason: 'Resistência de isolamento aumentou com o aumento da tensão, indicando boas condições do isolante e efeito de polarização.'
      };
      case 'good': return { 
          label: 'BOM', 
          color: '#4CAF50',
          reason: 'Resistência de isolamento manteve-se estável com o aumento da tensão.'
      };
      case 'warning': return { 
          label: 'ATENÇÃO', 
          color: '#ffc107',
          reason: 'Identificada queda de resistência de isolamento de até 35% durante os degraus de tensão.'
      };
      case 'dangerous': return { 
          label: 'PERIGOSO', 
          color: '#ff6b6b',
          reason: 'Identificada queda de resistência superior a 35%, indicando provável contaminação severa, umidade ou defeitos na isolação.'
      };
      default: return { label: '---', color: '#666', reason: '' };
    }
  };

  return (
    <div className="screen">
      <div className="equipment-panel">
        <div className="equipment-header">
          <h1 className="equipment-title">Megôhmetro</h1>
          <p>Medição de Resistência de Isolamento</p>
          <div className="equipment-image">
            <img src="/megohmetro_mit.png" alt="Megôhmetro MIT515" style={{maxWidth: '300px', height: 'auto', margin: '20px 0', borderRadius: '8px'}} />
            <p style={{fontSize: '0.9rem', opacity: 0.8}}>Megger MIT515 - Testador de Isolamento Digital</p>
          </div>
        </div>

        <EnvironmentalData />

        <TestInfo 
          objective="Medição da resistência de isolamento entre os enrolamentos, entre fases e entre enrolamento e terra para avaliação do estado de degradação do isolamento através de diferentes modos de teste (SV, DD, IP)."
          necessity={[
            "Avaliar o estado de degradação do isolamento através de modos específicos: SV (Step Voltage), DD (Descarga Dielétrica) e IP (Índice de Polarização)",
            "Detectar presença de umidade, contaminação ou envelhecimento do material isolante",
            "Medir constante de tempo (Resistência × Capacitância) para identificar contaminação",
            "Aplicar diferentes níveis de tensão CC (500V a 10000V) para análise progressiva",
            "Acompanhamento temporal das medições para identificar tendências de deterioração"
          ]}
        />

        <TabComponent 
          tabs={[
            {
              label: 'Medição',
              icon: '📊',
              content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Painel do Megger com imagem de fundo */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '700px',
                    margin: '0 auto',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                  }}>
                    {/* Imagem do Megger como fundo */}
                    <img 
                      src="/Tela Megger.png" 
                      alt="Megger MIT515" 
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block'
                      }}
                    />
                    
                    {/* Overlay com controles */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '15px',
                      pointerEvents: 'none'
                    }}>
                      
                      {/* Display Digital no topo */}
                      <div style={{
                        position: 'absolute',
                        top: '36%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(0,20,0,0)',
                        border: '3px solid #333',
                        borderRadius: '8px',
                        padding: '2px 12px',
                        minWidth: '202px',
                        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8)'
                      }}>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: '1px',
                          fontFamily: "'Courier New', monospace"
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#444444', fontSize: '8px', opacity: 0.7, margin: '1px 0' }}>RESISTÊNCIA</div>
                            <div style={{ color: '#444444', fontSize: '18px', fontWeight: 'bold', textShadow: 'none', margin: '0' }}>
                              {state.resistance.toFixed(0)} <span style={{fontSize: '10px'}}>MΩ</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#444444', fontSize: '8px', opacity: 0.7, margin: '1px 0' }}>TENSÃO</div>
                            <div style={{ color: '#444444', fontSize: '18px', fontWeight: 'bold', textShadow: 'none', margin: '0' }}>
                              {state.appliedVoltage.toFixed(0)} <span style={{fontSize: '10px'}}>V</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#444444', fontSize: '8px', opacity: 0.7, margin: '1px 0' }}>CORRENTE</div>
                            <div style={{ color: '#444444', fontSize: '14px', fontWeight: 'bold', textShadow: 'none', margin: '0' }}>
                              {state.current.toFixed(3)} <span style={{fontSize: '9px'}}>μA</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#444444', fontSize: '8px', opacity: 0.7, margin: '1px 0' }}>TEMPO</div>
                            <div style={{ color: '#444444', fontSize: '14px', fontWeight: 'bold', textShadow: 'none', margin: '0' }}>
                              {formatTime(state.time)}
                            </div>
                          </div>
                        </div>
                        {state.testMode === 'IP' && (
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr 1fr', 
                            gap: '1px',
                            marginTop: '1px',
                            paddingTop: '1px',
                            borderTop: '1px solid #44444433'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>DA</div>
                              <div style={{ color: '#666666', fontSize: '10px', fontWeight: 'bold', margin: '0' }}>
                                {/* DA = R3min/R30s */}
                                {(state as any).daIndex ? (state as any).daIndex.toFixed(2) : '--'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>IA</div>
                              <div style={{ color: '#666666', fontSize: '10px', fontWeight: 'bold', margin: '0' }}>
                                {state.absorptionIndex ? state.absorptionIndex.toFixed(2) : '--'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>PI</div>
                              <div style={{ color: '#666666', fontSize: '10px', fontWeight: 'bold', margin: '0' }}>
                                {state.polarizationIndex ? state.polarizationIndex.toFixed(2) : '--'}
                              </div>
                            </div>
                          </div>
                        )}
                        {state.testMode === 'DD' && (
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr 1fr', 
                            gap: '1px',
                            marginTop: '1px',
                            paddingTop: '1px',
                            borderTop: '1px solid #44444433'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>CAP CC</div>
                              <div style={{ color: '#666666', fontSize: '10px', fontWeight: 'bold', margin: '0' }}>
                                {state.capacitanceCC ? state.capacitanceCC.toFixed(1) : '--'} <span style={{fontSize: '7px'}}>nF</span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>DD</div>
                              <div style={{ color: '#666666', fontSize: '10px', fontWeight: 'bold', margin: '0' }}>
                                {state.ddIndex ? state.ddIndex.toFixed(2) : '--'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>COND.</div>
                              <div style={{ 
                                fontSize: '9px', 
                                fontWeight: 'bold', 
                                margin: '0',
                                color: state.ddIndex !== undefined ? (
                                  state.ddIndex > 7 ? '#cc0000' : 
                                  state.ddIndex > 4 ? '#ff6600' : 
                                  state.ddIndex > 2 ? '#ccaa00' : 
                                  state.ddIndex > 0 ? '#00aa00' : '#0066cc'
                                ) : '#666666'
                              }}>
                                {state.ddIndex !== undefined ? (
                                  state.ddIndex > 7 ? 'RUIM' : 
                                  state.ddIndex > 4 ? 'POBRE' : 
                                  state.ddIndex > 2 ? 'QUEST.' : 
                                  state.ddIndex > 0 ? 'BOA' : 'HOMOG.'
                                ) : '--'}
                              </div>
                            </div>
                          </div>
                        )}
                        {state.testMode === 'SV' && (
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr 1fr 1fr', 
                            gap: '1px',
                            marginTop: '1px',
                            paddingTop: '1px',
                            borderTop: '1px solid #44444433'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>1m</div>
                              <div style={{ color: '#666666', fontSize: '9px', fontWeight: 'bold', margin: '0' }}>
                                {state.sv1m ? state.sv1m.toFixed(0) : '--'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>2m</div>
                              <div style={{ color: '#666666', fontSize: '9px', fontWeight: 'bold', margin: '0' }}>
                                {state.sv2m ? state.sv2m.toFixed(0) : '--'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>3m</div>
                              <div style={{ color: '#666666', fontSize: '9px', fontWeight: 'bold', margin: '0' }}>
                                {state.sv3m ? state.sv3m.toFixed(0) : '--'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>4m</div>
                              <div style={{ color: '#666666', fontSize: '9px', fontWeight: 'bold', margin: '0' }}>
                                {state.sv4m ? state.sv4m.toFixed(0) : '--'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Knobs na parte inferior */}
                      <div style={{
                        position: 'absolute',
                        bottom: '16.5%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '100%',
                        height: '100px',
                        pointerEvents: 'auto'
                      }}>
                        {/* Knob de Modo de Teste */}
                        <div style={{ 
                          position: 'absolute',
                          left: '27%',
                          bottom: 0,
                          transform: 'translateX(-50%) translateX(-17px)',
                          marginBottom: '1%',
                          pointerEvents: 'auto'
                        }}>
                          <RotaryKnob
                            
                            value={state.testMode}
                            options={[
                              { value: 'IP', label: 'IP', angle: 0 },
                              { value: 'DD', label: 'DD', angle: 30 },
                              { value: 'SV', label: 'SV', angle: 60 }
                            ]}
                            onChange={(v) => setState(prev => ({ ...prev, testMode: v as string }))}
                            size={70}
                          />
                        </div>

                        {/* Knob de Tensão */}
                        <div style={{ 
                          position: 'absolute',
                          left: '49.75%',
                          bottom: 0,
                          transform: 'translateX(-50%)',
                          marginBottom: '1%',
                          pointerEvents: 'auto'
                        }}>
                          <RotaryKnob
                            
                            value={state.testVoltage}
                            options={[
                              { value: 250, label: '250V', angle: 20},
                              { value: 500, label: '500V', angle: 45},
                              { value: 1000, label: '1kV', angle: 68 },                   
                              { value: 2500, label: '2.5kV', angle: 90 },                           
                              { value: 5000, label: '5kV', angle: 105 },
                           
                            ]}
                            onChange={(v) => setState(prev => ({ ...prev, testVoltage: v as number }))}
                            size={70}
                          />
                        </div>

                        {/* Botão de Teste (START/STOP) */}
                        <div 
                          onClick={state.isRunning ? stopTest : startTest}
                          style={{
                            position: 'absolute',
                            right: '26%',
                            bottom: '68%',
                            transform: 'translateX(50%) translateX(7px)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: state.isRunning 
                              ? 'linear-gradient(145deg, #ff6666, #cc0000)'
                              : 'linear-gradient(145deg, #ff6666, #cc0000)',
                            border: '4px solid #333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: state.isRunning
                              ? '0 0 20px rgba(255,0,0,0.5), inset 0 -3px 10px rgba(0,0,0,0.3)'
                              : '0 0 20px rgba(255,0,0,0.5), inset 0 -3px 10px rgba(0,0,0,0.3)',
                            transition: 'all 0.2s',
                            flexDirection: 'column',
                            pointerEvents: 'auto'
                          }}
                        >
                          <span style={{ 
                            color: '#fff', 
                            fontWeight: 'bold', 
                            fontSize: '9px',
                            textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                          }}>
                            {state.isRunning ? 'STOP' : 'TEST'}
                          </span>
                          <span style={{ fontSize: '16px' }}>
                            {state.isRunning ? '⏹' : '▶'}
                          </span>
                        </div>
                      </div>

                      {/* Cabos do Megôhmetro */}
                      <svg style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 10
                      }}>
                        {/* Cabo Vermelho - Fase do Motor (2% esquerda) */}
                        <path
                          d="M 241 140 Q 186 125 136 165 Q 86 205 66 265 L 46 305"
                          fill="none"
                          stroke="#cc0000"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        {/* Conector vermelho - início */}
                        <circle cx="244" cy="140" r="10" fill="#cc0000" stroke="#990000" strokeWidth="2" />
                        {/* Conector vermelho - fim */}
                        <circle cx="49" cy="305" r="10" fill="#cc0000" stroke="#990000" strokeWidth="2" />
                        <text x="31" y="330" fill="#cc0000" fontSize="10" fontWeight="bold">FASE</text>
                        
                        {/* Cabo Preto - Ground (2% cima, 1% direita) */}
                        <path
                          d="M 452 135 Q 510 125 560 160 Q 600 200 620 270 L 635 310"
                          fill="none"
                          stroke="#333333"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        {/* Conector preto - início */}
                        <circle cx="452" cy="139" r="10" fill="#333333" stroke="#111111" strokeWidth="2" />
                        {/* Conector preto - fim */}
                        <circle cx="635" cy="314" r="10" fill="#333333" stroke="#111111" strokeWidth="2" />
                        <text x="620" y="365" fill="#cccccc" fontSize="12" fontWeight="bold">GND</text>
                        
                        {/* Símbolo de Ground */}
                        <g transform="translate(635, 380)">
                          <line x1="-12" y1="0" x2="12" y2="0" stroke="#cccccc" strokeWidth="2.5" />
                          <line x1="-8" y1="5" x2="8" y2="5" stroke="#cccccc" strokeWidth="2.5" />
                          <line x1="-4" y1="10" x2="4" y2="10" stroke="#cccccc" strokeWidth="2.5" />
                        </g>
                        
                        {/* Cabo Vermelho com animação */}
                        <path
                          d="M 241 140 Q 186 125 136 165 Q 86 205 66 265 L 46 305"
                          fill="none"
                          stroke="#cc0000"
                          strokeWidth="6"
                          strokeLinecap="round"
                          style={{
                            animation: state.isRunning ? 'cablePulse 0.3s ease-in-out infinite' : 'none',
                            filter: state.isRunning ? 'drop-shadow(0 0 8px #ff0000)' : 'none'
                          }}
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Gráficos */}
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {state.testMode === 'SV' && svChartData.length > 0 && (
                      <DualAxisChart
                        data1={svChartData}
                        data2={svChartCurrentData}
                        labels={svChartLabels}
                        title="Step Voltage DC - Fase S"
                        yLabel1="RI (MΩ)"
                        yLabel2="Corrente (μA)"
                        xLabel="Tensão (V)"
                        width={600}
                        height={300}
                        color1="#1f77b4"
                        color2="#cc0000"
                        numericXAxis={true}
                      />
                    )}
                    
                    {/* Diagnóstico SV - Exibir apenas após o teste finalizar e se houver dados */}
                    {state.testMode === 'SV' && !state.isRunning && svChartData.length > 0 && (
                      <div style={{
                        marginTop: '15px',
                        padding: '15px',
                        background: 'rgba(0,0,0,0.6)',
                        borderRadius: '8px',
                        border: '1px solid #444',
                        maxWidth: '600px',
                        textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                           <span style={{ color: '#ccc', fontSize: '14px' }}>Diagnóstico Automático:</span>
                           <span style={{ 
                             color: getSvDiagnosis(state.svScenario).color,
                             fontWeight: 'bold', 
                             fontSize: '16px',
                             textTransform: 'uppercase',
                             border: `1px solid ${getSvDiagnosis(state.svScenario).color}`,
                             padding: '2px 8px',
                             borderRadius: '4px',
                             backgroundColor: `${getSvDiagnosis(state.svScenario).color}20`
                           }}>
                             {getSvDiagnosis(state.svScenario).label}
                           </span>
                        </div>
                        <div style={{ color: '#ddd', fontSize: '13px', fontStyle: 'italic', lineHeight: '1.4' }}>
                           {getSvDiagnosis(state.svScenario).reason}
                        </div>
                      </div>
                    )}

                    {state.testMode === 'DD' && (ddChargeCurrent.length > 0 || ddDischargeCurrent.length > 0) && (
                      <DualAxisChart
                        data1={ddChargeCurrent}
                        data2={ddDischargeCurrent}
                        labels={chartLabels}
                        title="Polarização e Despolarização"
                        yLabel1="Corrente Carga (μA)"
                        yLabel2="Corrente Descarga (μA)"
                        width={500}
                        height={250}
                        singleAxis={true}
                        singleAxisLabel="Corrente (μA)"
                      />
                    )}

                    {state.testMode === 'IP' && chartData.length > 0 && (
                      <DualAxisChart
                        data1={chartData}
                        data2={chartCurrentData}
                        labels={chartLabels}
                        title="Índice de Polarização"
                        yLabel1="Resistência (MΩ)"
                        yLabel2="Corrente (μA)"
                        width={500}
                        height={250}
                      />
                    )}
                  </div>

                  {/* Tabela de Medições */}
                  {state.measurements.length > 0 && (
                    <div style={{ 
                      background: 'rgba(0,0,0,0.3)', 
                      borderRadius: '8px', 
                      padding: '15px',
                      border: '1px solid rgba(255,215,0,0.3)'
                    }}>
                      <h3 style={{ color: '#ffd700', marginTop: 0 }}>📋 Medições Realizadas</h3>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,215,0,0.2)' }}>
                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ffd700' }}>Teste</th>
                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ffd700' }}>Modo</th>
                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ffd700' }}>Tensão</th>
                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ffd700' }}>Resistência</th>
                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ffd700' }}>τ (s)</th>
                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ffd700' }}>IA</th>
                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ffd700' }}>IP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {state.measurements.map((measurement, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              <td style={{ padding: '8px' }}>#{index + 1}</td>
                              <td style={{ padding: '8px', color: '#ffd700' }}>{measurement.mode}</td>
                              <td style={{ padding: '8px' }}>{measurement.voltage} V</td>
                              <td style={{ padding: '8px', color: '#00ff00' }}>{measurement.resistance.toFixed(0)} MΩ</td>
                              <td style={{ padding: '8px' }}>{measurement.timeConstant.toFixed(1)}</td>
                              <td style={{ padding: '8px' }}>{measurement.absorptionIndex ? measurement.absorptionIndex.toFixed(2) : '-'}</td>
                              <td style={{ padding: '8px' }}>{measurement.polarizationIndex ? measurement.polarizationIndex.toFixed(2) : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Botões de Ação */}
                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    <button className="btn btn-secondary" onClick={onBack}>
                      ← Voltar ao Menu
                    </button>
                    {state.measurements.length > 0 && (
                      <button className="btn btn-success" onClick={sendToPlatform}>
                        📤 Enviar para DAIMER
                      </button>
                    )}
                  </div>
                </div>
              )
            },
            {
              label: 'Resistência de Isolamento',
              icon: '⚡',
              content: (
                <div>
                  <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Resistência de Isolamento e Índice de Polarização</h3>
                  
                  <p>
                    Este ensaio é feito com tensões contínuas, com amplitude que depende da magnitude da tensão nominal 
                    da máquina a ser ensaiada. O megôhmetro é o instrumento típico para a realização deste ensaio. Os megôhmetros 
                    possuem escalas de 500 a 15.000V e os fatores de temperatura ambiente e a umidade relativa do ar influenciam 
                    fortemente as medições. Por isso, é muito importante sempre referenciar estes dois fatores ambientais com a medição.
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Tabela de Seleção de Tensão CC (IEEE43)</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(76, 175, 80, 0.2)' }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Tensão Nominal (VCA)</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Tensão de Teste CC (VCC)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>≤ 1000</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>500</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>1000 – 2500</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>500 - 1000</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>2501 – 5000</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>1000 - 2500</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>5001 – 12000</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>2500 - 5000</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>&gt;12000</td><td style={{ padding: '8px' }}>5000 - 10000</td></tr>
                    </tbody>
                  </table>

                  <h4 style={{ color: '#FF9800' }}>Componentes da Corrente de Isolamento</h4>
                  <ul>
                    <li><strong>Corrente de Fuga Condutiva (IL):</strong> Pequena quantidade de corrente (μA) que flui através do isolante. Aumenta à medida que a isolação se deteriora.</li>
                    <li><strong>Corrente Capacitiva (IC):</strong> Ocorre devido à proximidade dos condutores. Dura apenas alguns segundos até que a isolação seja carregada.</li>
                    <li><strong>Corrente de Absorção de Polarização (Ia):</strong> Causada pelo deslocamento de cargas dentro do material dielétrico. Em equipamentos contaminados, não há decréscimo por um longo período.</li>
                  </ul>

                  <h4 style={{ color: '#FF9800' }}>Índices IP e IAbs</h4>
                  <p>
                    <strong>Índice de Polarização (IP):</strong> IP = R(10 minutos) / R(1 minuto)<br/>
                    <strong>Índice de Absorção (IAbs):</strong> IAbs = R(1 minuto) / R(30 segundos)
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Critérios de Avaliação (IEEE43)</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(76, 175, 80, 0.2)' }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Índice de Absorção</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Índice de Polarização</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Avaliação</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>—</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>&le; 1</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ff6b6b' }}>Ruim</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>&lt; 1,1</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>&lt; 1,5</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ff9800' }}>Perigoso</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>1,1 - 1,25</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>1,5 - 2,0</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ffc107' }}>Regular</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>1,25 - 1,4</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>2,0 - 3,0</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#4CAF50' }}>Bom</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>1,4 - 1,6</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>3,0 - 4,0</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#4CAF50' }}>Muito Bom</td></tr>
                      <tr><td style={{ padding: '8px' }}>&gt; 1,6</td><td style={{ padding: '8px' }}>&gt; 4,0</td><td style={{ padding: '8px', color: '#81C784' }}>Ótimo</td></tr>
                    </tbody>
                  </table>
                </div>
              )
            },
            {
              label: 'Set Voltage DC',
              icon: '📈',
              content: (
                <div>
                  <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Set Voltage DC (Step Voltage DC)</h3>
                  
                  <p>
                    Esta técnica consiste em aplicar uma tensão CC em cinco passos obedecendo ao limite da IEEE43-2013, 
                    onde são registrados automaticamente no instrumento os parâmetros de tensão, corrente e resistência de isolamento.
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Princípio de Funcionamento</h4>
                  <p>
                    Um isolante em boas condições, quando a tensão aplicada é aumentada, a corrente de fuga também aumenta 
                    e a resistência de isolamento se mantém ou até aumenta devido ao efeito capacitivo (constante de tempo). 
                    Porém, se houver contaminação e/ou defeitos (trincas ou cavidades na isolação), a resistência de isolamento 
                    diminui abruptamente com o aumento da tensão aplicada, isto ocorre devido à contaminação e/ou à ionização nestes defeitos.
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Análise de Resultados</h4>
                  <ul>
                    <li><strong>Isolação Saudável:</strong> Resistência mantém-se estável ou aumenta com os degraus de tensão</li>
                    <li><strong>Isolação Defeituosa:</strong> Resistência diminui abruptamente indicando contaminação ou ionização</li>
                    <li><strong>Defeitos Incipientes:</strong> Comportamento não linear da curva tensão vs. resistência</li>
                  </ul>
                </div>
              )
            },
            {
              label: 'Descarga Dielétrica',
              icon: '🔌',
              content: (
                <div>
                  <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Descarga Dielétrica (DD)</h3>
                  
                  <p>
                    O teste de Descarga Dielétrica (DD) é um método relativamente novo. Enquanto os outros métodos convencionais 
                    medem as correntes que fluem durante o processo de carga, o teste "DD" mede a corrente que flui durante a 
                    descarga da amostra em teste. Como tal, não é um teste de resistência de isolamento puro simplesmente e sim 
                    um adjunto aos testes de isolamento tradicionais.
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Processo de Descarga</h4>
                  <p>
                    A carga que se armazena durante o teste se descarrega automaticamente ao final do teste quando os resistores 
                    de descarga do equipamento são inseridos nos terminais. A rapidez da descarga depende somente dos resistores 
                    de descarga e da quantidade de carga armazenada no isolamento.
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Detecção de Defeitos</h4>
                  <p>
                    Quando há uma camada defeituosa entre duas camadas boas, sua resistência de isolamento decrescerá, enquanto 
                    a capacitância provavelmente permanecerá igual. Um teste normal de resistência de isolamento (RI) não irá 
                    revelar esta condição, mas durante a descarga dielétrica, a constante de tempo da camada defeituosa irá 
                    desemparelhar das outras camadas para produzir um valor de DD mais alto.
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Interpretação de Valores</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(76, 175, 80, 0.2)' }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Valor de DD</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Condições do Isolamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>&gt; 7</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ff6b6b' }}>Ruim</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>4 &le; DD ≤ 7</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ff9800' }}>Questionável</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>2 &le; DD ≤ 4</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#4CAF50' }}>Bom</td></tr>
                      <tr><td style={{ padding: '8px' }}>&le; 2</td><td style={{ padding: '8px', color: '#81C784' }}>Ótimo</td></tr>
                    </tbody>
                  </table>

                  <p style={{ marginTop: '15px' }}>
                    Um valor de DD baixo indica que a corrente de reabsorção decai rapidamente e a constante de tempo é similar. 
                    Um valor alto indica que a reabsorção exibe tempos de relaxamento longos, que podem indicar um problema.
                  </p>
                </div>
              )
            }
          ]}
        />
      </div>
    </div>
  );
};

export default MegohmmeterScreen;
