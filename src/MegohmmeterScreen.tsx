import React, { useState, useEffect } from 'react';
import { MegohmmeterState } from './types';
import EnvironmentalData from './EnvironmentalData';
import Chart from './Chart';
import TestInfo from './TestInfo';
import TabComponent from './TabComponent';

interface MegohmmeterScreenProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

const MegohmmeterScreen: React.FC<MegohmmeterScreenProps> = ({ onComplete, onBack }) => {
  const IP_DURATION = 600;
  const DD_CHARGE_DURATION = 1800;
  const DD_DISCHARGE_DURATION = 120;
  const SV_STEP_DURATION = 60;
  const SV_STEPS_COUNT = 5;

  const getTimeStep = (mode: string) => {
    if (mode === 'DD') return 60;
    if (mode === 'SV') return 20;
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
    r30s: undefined,
    r60s: undefined,
    r600s: undefined,
    time: 0,
    measurements: []
  });

  const [chartData, setChartData] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [svChartData, setSvChartData] = useState<number[]>([]);
  const [svChartLabels, setSvChartLabels] = useState<string[]>([]);

  // Steps de tensão de 500V em 500V
  const voltageSteps = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000];

  useEffect(() => {
    let interval: any;

    if (state.isRunning) {
      interval = setInterval(() => {
        setState(prev => {
          const timeStep = getTimeStep(prev.testMode);
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

          if (prev.testMode === 'SV') {
            const steps = getSvSteps(prev.testVoltage);
            const prevStepIndex = Math.min(Math.floor(prev.time / SV_STEP_DURATION), steps.length - 1);
            const stepIndex = Math.min(Math.floor(newTime / SV_STEP_DURATION), steps.length - 1);

            appliedVoltage = steps[stepIndex];
            resistance = 1200 + stepIndex * 120 + Math.random() * 15;
            current = (appliedVoltage / 1000) / resistance;
            capacitanceCC = 69 + (Math.random() - 0.5) * 3;
            timeConstant = (resistance * capacitanceCC) / 1000;

            if (stepIndex !== prevStepIndex || prev.time === 0) {
              setSvChartData(prevData => [...prevData, resistance]);
              setSvChartLabels(prevLabels => [...prevLabels, `${appliedVoltage} V`]);
            }
          } else if (prev.testMode === 'DD') {
            const chargePhase = newTime <= DD_CHARGE_DURATION;
            const chargeTime = Math.min(newTime, DD_CHARGE_DURATION);
            const dischargeTime = Math.max(0, newTime - DD_CHARGE_DURATION);

            appliedVoltage = chargePhase ? prev.testVoltage : 0;

            const baseResistance = 900 + Math.log(chargeTime / 60 + 1) * 900;
            resistance = baseResistance + (Math.random() - 0.5) * 10;

            if (chargePhase) {
              current = 5 * Math.exp(-chargeTime / 300) + 0.3;
            } else {
              current = 5 * Math.exp(-dischargeTime / 15) + 0.1;
            }

            capacitanceCC = 69 + (Math.random() - 0.5) * 3;
            timeConstant = (resistance * capacitanceCC) / 1000;

            setChartData(prevData => [...prevData, current]);
            setChartLabels(prevLabels => [...prevLabels, formatTime(newTime)]);
          } else {
            const tMin = newTime / 60;
            const baseResistance = 800;
            const timeVariation = Math.log(tMin + 1) * 700;
            resistance = baseResistance + timeVariation + (Math.random() - 0.5) * 8;
            current = (prev.testVoltage / 1000) / resistance;
            capacitanceCC = 69 + (Math.random() - 0.5) * 3;
            timeConstant = (resistance * capacitanceCC) / 1000;

            if (!r30s && newTime >= 30) r30s = resistance;
            if (!r60s && newTime >= 60) r60s = resistance;
            if (!r600s && newTime >= 600) r600s = resistance;

            setChartData(prevData => [...prevData, resistance]);
            setChartLabels(prevLabels => [...prevLabels, formatTime(newTime)]);
          }

          const absorptionIndex = r30s && r60s ? r60s / r30s : prev.absorptionIndex;
          const polarizationIndex = r60s && r600s ? r600s / r60s : prev.polarizationIndex;

          const newState = {
            ...prev,
            time: newTime,
            appliedVoltage,
            resistance,
            current,
            timeConstant,
            capacitanceCC,
            r30s,
            r60s,
            r600s,
            absorptionIndex,
            polarizationIndex
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
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isRunning, state.testVoltage, state.testMode]);

  const startTest = () => {
    setChartData([]);
    setChartLabels([]);
    setSvChartData([]);
    setSvChartLabels([]);

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
      r30s: undefined,
      r60s: undefined,
      r600s: undefined
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
          title="Megôhmetro"
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
                <div>
                  {/* Seção de Conexão */}
        <div className="connection-section" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '20px',
          margin: '20px 0',
          border: '2px solid rgba(255, 215, 0, 0.3)'
        }}>
          <h3 style={{ color: '#ffd700', marginBottom: '15px', textAlign: 'center' }}>
            🔌 Como Conectar ao Gerador
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            {/* Diagrama Visual */}
            <div style={{ flex: '1', textAlign: 'center' }}>
              <div style={{
                background: 'rgba(0,0,0,0.8)',
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '10px',
                fontFamily: 'monospace',
                fontSize: '14px',
                color: '#00ff00'
              }}>
                <div>🏭 GERADOR WEG</div>
                <div style={{ margin: '10px 0' }}>
                  <div>┌─────────────┐</div>
                  <div>│ TERMINAL R  │ ← 🟢 TESTE</div>
                  <div>│ TERMINAL S  │</div>
                  <div>│ TERMINAL T  │</div>
                  <div>│ TERRA (GND) │ ← 🟡 TERRA</div>
                  <div>└─────────────┘</div>
                </div>
                <div>⚡ 13.2 kV</div>
              </div>

              <div style={{
                background: 'rgba(0,0,0,0.8)',
                borderRadius: '10px',
                padding: '15px',
                marginTop: '10px'
              }}>
                <div style={{ color: '#ffd700', fontSize: '16px', marginBottom: '10px' }}>📊 MEGÔMETRO MIT515</div>
                <div>┌─────────────────┐</div>
                <div>│ ⚡ TEST (VERMELHO) │</div>
                <div>│ ⚡ GUARD (AZUL)   │</div>
                <div>│ ⚡ GROUND (VERDE) │</div>
                <div>└─────────────────┘</div>
              </div>
            </div>

            {/* Instruções de Conexão */}
            <div style={{ flex: '1', color: 'white' }}>
              <h4 style={{ color: '#ffd700', marginBottom: '10px' }}>📋 Passos de Conexão:</h4>
              <ol style={{ lineHeight: '1.6', fontSize: '14px' }}>
                <li><strong>1.</strong> Desenergize completamente o gerador</li>
                <li><strong>2.</strong> Identifique os terminais R, S, T do enrolamento</li>
                <li><strong>3.</strong> Conecte o cabo <span style={{color: '#ff6b6b'}}>VERMELHO (TESTE)</span> ao terminal do enrolamento a testar</li>
                <li><strong>4.</strong> Conecte o cabo <span style={{color: '#4ecdc4'}}>AZUL (GUARD)</span> ao terminal adjacente (proteção)</li>
                <li><strong>5.</strong> Conecte o cabo <span style={{color: '#45b7d1'}}>VERDE (TERRA)</span> ao terra do gerador</li>
                <li><strong>6.</strong> Verifique isolamento dos cabos antes de energizar</li>
                <li><strong>7.</strong> Mantenha distância segura durante o teste</li>
              </ol>

              <div style={{
                background: 'rgba(255, 193, 7, 0.2)',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                padding: '10px',
                marginTop: '15px',
                fontSize: '12px'
              }}>
                <strong>⚠️ ATENÇÃO:</strong> Alto tensão! Certifique-se de que todos os procedimentos de segurança sejam seguidos.
              </div>
            </div>
          </div>
        </div>

        <div className="controls-section">
          <h3>Configurações</h3>
          <div className="control-group">
            <label>Modo de Teste:</label>
            <select
              value={state.testMode}
              onChange={(e) => setState(prev => ({ ...prev, testMode: e.target.value }))}
              disabled={state.isRunning}
            >
              <option value="IP">IP (Índice de Polarização)</option>
              <option value="DD">DD (Razão de Absorção Dielétrica)</option>
              <option value="SV">SV (Step Voltage)</option>
            </select>
          </div>

          <div className="control-group">
            <label>Tensão de Teste:</label>
            <select
              value={state.testVoltage}
              onChange={(e) => setState(prev => ({ ...prev, testVoltage: parseInt(e.target.value) }))}
              disabled={state.isRunning}
            >
              {voltageSteps.map(voltage => (
                <option key={voltage} value={voltage}>{voltage} V</option>
              ))}
            </select>
          </div>
        </div>

        <div className="display-section">
          <h3>Leituras</h3>
          <div className="displays">
            <div className="display">
              <div className="display-label">Tensão Aplicada</div>
              <div className="display-value">{state.appliedVoltage.toFixed(0)} V</div>
            </div>
            <div className="display">
              <div className="display-label">Resistência</div>
              <div className="display-value">{state.resistance.toFixed(0)} MΩ</div>
            </div>
            <div className="display">
              <div className="display-label">Corrente</div>
              <div className="display-value">{state.current.toFixed(3)} μA</div>
            </div>
            <div className="display">
              <div className="display-label">Constante Tempo</div>
              <div className="display-value">{state.timeConstant.toFixed(1)} s</div>
            </div>
            <div className="display">
              <div className="display-label">Capacitância CC</div>
              <div className="display-value">{state.capacitanceCC.toFixed(1)} nF</div>
            </div>
            {state.testMode === 'IP' && (
              <>
                <div className="display">
                  <div className="display-label">Índice de Absorção (IA)</div>
                  <div className="display-value">{state.absorptionIndex ? state.absorptionIndex.toFixed(2) : '--'}</div>
                </div>
                <div className="display">
                  <div className="display-label">Índice de Polarização (IP)</div>
                  <div className="display-value">{state.polarizationIndex ? state.polarizationIndex.toFixed(2) : '--'}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {state.testMode === 'SV' && svChartData.length > 0 && (
          <Chart
            data={svChartData}
            labels={svChartLabels}
            title="Resistência vs Tensão (Step Voltage)"
            yAxisLabel="Resistência (MΩ)"
            color="#ffd700"
            type="bar"
            width={500}
            height={250}
          />
        )}

        {state.testMode === 'DD' && chartData.length > 0 && (
          <Chart
            data={chartData}
            labels={chartLabels}
            title="Corrente de Descarga vs Tempo"
            yAxisLabel="Corrente (μA)"
            color="#ff6b6b"
            type="line"
            width={500}
            height={250}
          />
        )}

        {state.testMode === 'IP' && chartData.length > 0 && (
          <Chart
            data={chartData}
            labels={chartLabels}
            title="Resistência de Isolamento vs Tempo"
            yAxisLabel="Resistência (MΩ)"
            color="#00ff00"
            type="line"
            width={500}
            height={250}
          />
        )}

        <div className="timer">
          <h3>Tempo: {formatTime(state.time)}</h3>
        </div>

        <div className="controls">
          {!state.isRunning ? (
            <button className="btn btn-primary" onClick={startTest}>
              Iniciar Teste
            </button>
          ) : (
            <button className="btn btn-danger" onClick={stopTest}>
              Parar Teste
            </button>
          )}
        </div>

        {state.measurements.length > 0 && (
          <div className="measurements-section">
            <h3>Medições Realizadas</h3>
            <table className="measurements-table">
              <thead>
                <tr>
                  <th>Teste</th>
                  <th>Modo</th>
                  <th>Tensão (V)</th>
                  <th>Resistência (MΩ)</th>
                  <th>Constante Tempo (s)</th>
                  <th>IA</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {state.measurements.map((measurement, index) => (
                  <tr key={index}>
                    <td>Teste {index + 1}</td>
                    <td>{measurement.mode}</td>
                    <td>{measurement.voltage}</td>
                    <td>{measurement.resistance.toFixed(0)}</td>
                    <td>{measurement.timeConstant.toFixed(1)}</td>
                    <td>{measurement.absorptionIndex ? measurement.absorptionIndex.toFixed(2) : '-'}</td>
                    <td>{measurement.polarizationIndex ? measurement.polarizationIndex.toFixed(2) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={onBack}>
            Voltar ao Menu
          </button>
          {state.measurements.length > 0 && (
            <button className="btn btn-success" onClick={sendToPlatform}>
              Enviar para DAIMER
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