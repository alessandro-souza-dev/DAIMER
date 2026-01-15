import React, { useState, useEffect } from 'react';
import { PartialDischargeState } from './types';
import EnvironmentalData from './EnvironmentalData';
import PartialDischargeChart from './PartialDischargeChart';

interface PartialDischargeScreenProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

const PartialDischargeScreen: React.FC<PartialDischargeScreenProps> = ({ onComplete, onBack }) => {
  const [state, setState] = useState<PartialDischargeState>({
    isRunning: false,
    appliedVoltage: 500,
    dischargeLevel: 0,
    pulseCount: 0,
    time: 0,
    measurements: []
  });

  const [discharges, setDischarges] = useState<Array<{ phase: number; magnitude: number; count: number }>>([]);

  // Steps de tensão de 500V em 500V
  const voltageSteps = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000];

  useEffect(() => {
    let interval: number;

    if (state.isRunning) {
      interval = setInterval(() => {
        setState(prev => {
          const newTime = prev.time + 1;

          // Simular descargas parciais baseadas na tensão aplicada
          const baseDischargeLevel = (prev.appliedVoltage / 10000) * 15000; // pC
          const variation = (Math.random() - 0.5) * 2000;
          const dischargeLevel = Math.max(0, baseDischargeLevel + variation);

          // Contagem de pulsos aumenta com o tempo e tensão
          const newPulses = Math.floor(Math.random() * 5) + 1;
          const pulseCount = prev.pulseCount + newPulses;

          // Gerar novos pontos de descarga
          const newDischarges: Array<{ phase: number; magnitude: number; count: number }> = [];

          for (let i = 0; i < newPulses; i++) {
            // Concentrar descargas principalmente em 45-90° e 225-270° (como na imagem)
            let phase;
            if (Math.random() < 0.4) {
              // 40% das descargas entre 45-90°
              phase = 45 + Math.random() * 45;
            } else if (Math.random() < 0.7) {
              // 30% das descargas entre 225-270°
              phase = 225 + Math.random() * 45;
            } else {
              // 30% distribuídas aleatoriamente
              phase = Math.random() * 360;
            }

            const magnitude = Math.random() * dischargeLevel;

            newDischarges.push({
              phase,
              magnitude,
              count: 1
            });
          }

          // Atualizar array de descargas (manter últimas 500 para performance)
          setDischarges(prevDischarges => {
            const updated = [...prevDischarges, ...newDischarges];
            return updated.slice(-500);
          });

          return {
            ...prev,
            time: newTime,
            dischargeLevel,
            pulseCount
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isRunning, state.appliedVoltage]);

  const startTest = () => {
    setState(prev => ({ ...prev, isRunning: true, time: 0, pulseCount: 0 }));
    setDischarges([]);
  };

  const stopTest = () => {
    setState(prev => {
      const measurement = {
        voltage: prev.appliedVoltage,
        dischargeLevel: prev.dischargeLevel,
        pulseCount: prev.pulseCount,
        time: prev.time,
        dischargePattern: [...discharges]
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
      type: 'partial_discharge',
      measurements: state.measurements,
      appliedVoltage: state.appliedVoltage,
      finalDischargeLevel: state.dischargeLevel,
      totalPulseCount: state.pulseCount,
      dischargePattern: discharges,
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
          <h1 className="equipment-title">Descarga Parcial</h1>
          <p>Detecção e Análise de Descargas Parciais</p>
          <div className="equipment-image">
            <img src="/ddx_tettex.png" alt="DDX Tettex 9121b" style={{maxWidth: '400px', height: 'auto', margin: '20px 0', borderRadius: '8px'}} />
            <p style={{fontSize: '0.9rem', opacity: 0.8}}>Tettex DDX 9121b - Detector de Descargas Parciais</p>
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
                <div style={{ color: '#ffd700', fontSize: '16px', marginBottom: '10px' }}>📊 DETECTOR DDX 9121b</div>
                <div>┌─────────────────────┐</div>
                <div>│ ⚡ HV INPUT         │ ← Cabo Coaxial</div>
                <div>│ 📡 ANTENA           │</div>
                <div>│ 🔌 CALIBRATION      │ ← Calibração</div>
                <div>│ ⚡ GND               │ ← Terra</div>
                <div>└─────────────────────┘</div>
                <div style={{ marginTop: '8px', fontSize: '12px' }}>Sensor: Capacitivo/Ôhmico</div>
              </div>
            </div>

            {/* Instruções de Conexão */}
            <div style={{ flex: '1', color: 'white' }}>
              <h4 style={{ color: '#ffd700', marginBottom: '10px' }}>📋 Passos de Conexão:</h4>
              <ol style={{ lineHeight: '1.6', fontSize: '14px' }}>
                <li><strong>1.</strong> Desenergize o gerador completamente</li>
                <li><strong>2.</strong> Instale sensor capacitivo ou resistor ôhmico no terminal do enrolamento</li>
                <li><strong>3.</strong> Conecte cabo coaxial do sensor ao <span style={{color: '#ff6b6b'}}>HV INPUT</span> do detector</li>
                <li><strong>4.</strong> Posicione antena próxima ao equipamento sob teste</li>
                <li><strong>5.</strong> Conecte terra do detector ao terra do gerador</li>
                <li><strong>6.</strong> Realize calibração do sistema (usando pulso de calibração)</li>
                <li><strong>7.</strong> Configure limiares de detecção (sensibilidade)</li>
                <li><strong>8.</strong> Energize gradualmente e monitore descargas</li>
              </ol>

              <div style={{
                background: 'rgba(255, 193, 7, 0.2)',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                padding: '10px',
                marginTop: '15px',
                fontSize: '12px'
              }}>
                <strong>⚠️ IMPORTANTE:</strong> Ambiente deve estar livre de ruídos elétricos externos. Calibre o sistema antes de cada teste.
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
              <div className="display-label">Nível de Descarga</div>
              <div className="display-value">{state.dischargeLevel.toFixed(0)} pC</div>
            </div>
            <div className="display">
              <div className="display-label">Contagem de Pulsos</div>
              <div className="display-value">{state.pulseCount}</div>
            </div>
            <div className="display">
              <div className="display-label">Taxa de Repetição</div>
              <div className="display-value">
                {state.time > 0 ? (state.pulseCount / state.time).toFixed(1) : '0.0'} pulsos/s
              </div>
            </div>
          </div>
        </div>

        {discharges.length > 0 && (
          <PartialDischargeChart
            discharges={discharges}
            width={600}
            height={400}
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
                  <th>Tensão (V)</th>
                  <th>Nível Max (pC)</th>
                  <th>Total Pulsos</th>
                  <th>Duração (s)</th>
                </tr>
              </thead>
              <tbody>
                {state.measurements.map((measurement, index) => (
                  <tr key={index}>
                    <td>Teste {index + 1}</td>
                    <td>{measurement.voltage}</td>
                    <td>{measurement.dischargeLevel.toFixed(0)}</td>
                    <td>{measurement.pulseCount}</td>
                    <td>{measurement.time}</td>
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

export default PartialDischargeScreen;