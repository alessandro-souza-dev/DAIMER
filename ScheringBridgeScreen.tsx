import React, { useState, useEffect } from 'react';
import { ScheringBridgeState } from './types';
import EnvironmentalData from './EnvironmentalData';
import Chart from './Chart';

interface ScheringBridgeScreenProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

const ScheringBridgeScreen: React.FC<ScheringBridgeScreenProps> = ({ onComplete, onBack }) => {
  const [state, setState] = useState<ScheringBridgeState>({
    isRunning: false,
    appliedVoltage: 500,
    tanDelta: 0,
    currentAC: 0,
    capacitance: 0,
    harmonics: [],
    time: 0,
    measurements: []
  });

  const [chartData, setChartData] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [harmonicsData, setHarmonicsData] = useState<number[]>([]);

  // Steps de tensão de 500V em 500V
  const voltageSteps = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000];

  useEffect(() => {
    let interval: number;

    if (state.isRunning) {
      interval = setInterval(() => {
        setState(prev => {
          const newTime = prev.time + 1;

          // Simular valores baseados no relatório
          const baseTanDelta = 0.0045; // 0.45% baseado no relatório
          const variation = (Math.random() - 0.5) * 0.0002;
          const tanDelta = baseTanDelta + variation;

          // Capacitância baseada no relatório
          const capacitance = 2850 + (Math.random() - 0.5) * 50; // pF

          // Corrente AC correta: I = 2πfCV (f=60Hz)
          // Converter pF para F: C_F = C_pF * 10^-12
          const capacitanceFarads = capacitance * 1e-12; // Capacitância em Farads
          const frequency = 60; // Hz
          const currentAC = 2 * Math.PI * frequency * capacitanceFarads * prev.appliedVoltage * 1000; // mA

          // Gerar harmônicos (1ª a 10ª harmônica)
          const harmonics = Array.from({ length: 10 }, (_, i) => {
            const baseValue = i === 0 ? 100 : Math.max(0, 20 - i * 2); // Fundamental = 100%, demais decrescem
            return baseValue + (Math.random() - 0.5) * 5;
          });

          const newState = {
            ...prev,
            time: newTime,
            tanDelta,
            currentAC,
            capacitance,
            harmonics
          };

          // Atualizar dados do gráfico de tangente delta
          setChartData(prevData => {
            const newData = [...prevData, tanDelta * 100]; // Converter para %
            return newData.slice(-20);
          });

          setChartLabels(prevLabels => {
            const newLabels = [...prevLabels, `${newTime}s`];
            return newLabels.slice(-20);
          });

          // Atualizar dados dos harmônicos
          setHarmonicsData(harmonics);

          return newState;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isRunning]);

  const startMeasurement = () => {
    setState(prev => ({ ...prev, isRunning: true, time: 0 }));
    setChartData([]);
    setChartLabels([]);
  };

  const stopMeasurement = () => {
    setState(prev => {
      const measurement = {
        voltage: prev.appliedVoltage,
        tanDelta: prev.tanDelta,
        currentAC: prev.currentAC,
        capacitance: prev.capacitance,
        harmonics: [...prev.harmonics],
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
      type: 'schering_bridge',
      measurements: state.measurements,
      appliedVoltage: state.appliedVoltage,
      finalTanDelta: state.tanDelta,
      finalCurrentAC: state.currentAC,
      finalCapacitance: state.capacitance,
      finalHarmonics: state.harmonics,
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
          <h1 className="equipment-title">Ponte de Schering</h1>
          <p>Medição de Tangente Delta e Análise de Harmônicos</p>
          <div className="equipment-image">
            <img src="/midas_system.png" alt="Sistema MIDAS" style={{maxWidth: '300px', height: 'auto', margin: '20px 0', borderRadius: '8px'}} />
            <p style={{fontSize: '0.9rem', opacity: 0.8}}>Tettex MIDAS - Sistema de Diagnóstico de Isolamento Móvel</p>
          </div>
        </div>

        <EnvironmentalData />

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
                  <div>│ TERMINAL R  │ ← ⚡ HV AC</div>
                  <div>│ TERMINAL S  │</div>
                  <div>│ TERMINAL T  │</div>
                  <div>│ TERRA (GND) │ ← ⚡ TERRA</div>
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
                <div style={{ color: '#ffd700', fontSize: '16px', marginBottom: '10px' }}>📊 PONTE DE SCHERING (MIDAS)</div>
                <div>┌─────────────────────┐</div>
                <div>│ ⚡ HV (VERMELHO)     │ ← Fonte AC</div>
                <div>│ ⚡ GUARD (AZUL)      │</div>
                <div>│ ⚡ MEAS (AMARELO)    │</div>
                <div>│ ⚡ GND (VERDE)       │ ← Terra</div>
                <div>└─────────────────────┘</div>
                <div style={{ marginTop: '8px', fontSize: '12px' }}>Fonte AC: 500V - 10kV</div>
              </div>
            </div>

            {/* Instruções de Conexão */}
            <div style={{ flex: '1', color: 'white' }}>
              <h4 style={{ color: '#ffd700', marginBottom: '10px' }}>📋 Passos de Conexão:</h4>
              <ol style={{ lineHeight: '1.6', fontSize: '14px' }}>
                <li><strong>1.</strong> Desenergize o gerador completamente</li>
                <li><strong>2.</strong> Identifique os terminais R, S, T dos enrolamentos</li>
                <li><strong>3.</strong> Conecte o cabo <span style={{color: '#ff6b6b'}}>VERMELHO (HV)</span> ao enrolamento a ser testado</li>
                <li><strong>4.</strong> Conecte o cabo <span style={{color: '#4ecdc4'}}>AZUL (GUARD)</span> ao terminal adjacente (blindagem)</li>
                <li><strong>5.</strong> Conecte o cabo <span style={{color: '#f9ca24'}}>AMARELO (MEAS)</span> para medição de corrente</li>
                <li><strong>6.</strong> Conecte o cabo <span style={{color: '#45b7d1'}}>VERDE (GND)</span> ao terra do gerador</li>
                <li><strong>7.</strong> Ligue a fonte de tensão AC (500V a 10kV)</li>
                <li><strong>8.</strong> Aguarde estabilização antes de iniciar medição</li>
              </ol>

              <div style={{
                background: 'rgba(220, 53, 69, 0.2)',
                border: '1px solid #dc3545',
                borderRadius: '8px',
                padding: '10px',
                marginTop: '15px',
                fontSize: '12px'
              }}>
                <strong>⚠️ PERIGO:</strong> Alta tensão! Use EPI completo. Mantenha distância segura. Apenas pessoal qualificado.
              </div>
            </div>
          </div>
        </div>

        <div className="controls-section">
          <h3>Configurações</h3>
          <div className="control-group">
            <label>Tensão de Teste:</label>
            <select
              value={state.appliedVoltage}
              onChange={(e) => setState(prev => ({ ...prev, appliedVoltage: parseInt(e.target.value) }))}
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
              <div className="display-value">{state.appliedVoltage} V</div>
            </div>
            <div className="display">
              <div className="display-label">Tangente Delta</div>
              <div className="display-value">{(state.tanDelta * 100).toFixed(3)} %</div>
            </div>
            <div className="display">
              <div className="display-label">Corrente AC</div>
              <div className="display-value">{state.currentAC.toFixed(2)} mA</div>
            </div>
            <div className="display">
              <div className="display-label">Capacitância</div>
              <div className="display-value">{state.capacitance.toFixed(0)} pF</div>
            </div>
            <div className="display">
              <div className="display-label">Harmônicos (%)</div>
              <div className="display-value">
                {state.harmonics.length > 0 ?
                  `H2: ${state.harmonics[1]?.toFixed(1)}% | H3: ${state.harmonics[2]?.toFixed(1)}%` :
                  '0.0%'
                }
              </div>
            </div>
          </div>
        </div>

        {chartData.length > 0 && (
          <Chart
            data={chartData}
            labels={chartLabels}
            title="Tangente Delta vs Tempo"
            yAxisLabel="Tangente Delta (%)"
            color="#00ff00"
            type="line"
            width={500}
            height={250}
          />
        )}

        {harmonicsData.length > 0 && (
          <Chart
            data={harmonicsData}
            labels={harmonicsData.map((_, i) => `H${i + 1}`)}
            title="Espectro de Harmônicos"
            yAxisLabel="Amplitude (%)"
            color="#ff6600"
            type="bar"
            width={500}
            height={250}
          />
        )}

        <div className="timer">
          <h3>Tempo: {formatTime(state.time)}</h3>
        </div>

        <div className="controls">
          {!state.isRunning ? (
            <button className="btn btn-primary" onClick={startMeasurement}>
              Iniciar Medição
            </button>
          ) : (
            <button className="btn btn-danger" onClick={stopMeasurement}>
              Parar Medição
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
                  <th>Tensão (V)</th>
                  <th>Tan δ (%)</th>
                  <th>Corrente AC (mA)</th>
                  <th>Capacitância (pF)</th>
                </tr>
              </thead>
              <tbody>
                {state.measurements.map((measurement, index) => (
                  <tr key={index}>
                    <td>Teste {index + 1}</td>
                    <td>{measurement.voltage}</td>
                    <td>{(measurement.tanDelta * 100).toFixed(3)}</td>
                    <td>{measurement.currentAC.toFixed(2)}</td>
                    <td>{measurement.capacitance.toFixed(0)}</td>
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
    </div>
  );
};

export default ScheringBridgeScreen;