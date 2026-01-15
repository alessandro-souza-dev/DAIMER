import React, { useState, useEffect } from 'react';
import { MicrohmeterState } from './types';
import EnvironmentalData from './EnvironmentalData';
import Chart from './Chart';

interface MicrohmeterScreenProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

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

  const [chartData, setChartData] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);

  useEffect(() => {
    let interval: number;

    if (state.isRunning) {
      interval = setInterval(() => {
        setState(prev => {
          const newTime = prev.time + 1;

          // Valores baseados no relatório - corrente em mA, não A
          const currentValue = parseFloat(prev.currentScale.split(' ')[0]);
          const injectedCurrent = currentValue * 1000; // Converter A para mA

          // Simular resistência baseada nos valores do relatório (0.065164 Ω)
          const baseResistance = 0.065164;
          const variation = (Math.random() - 0.5) * 0.001;
          const resistance = baseResistance + variation;

          // Calcular tensão usando Lei de Ohm (V = I * R)
          const voltage = (injectedCurrent / 1000) * resistance; // Converter mA para A para cálculo

          const newState = {
            ...prev,
            time: newTime,
            injectedCurrent,
            resistance,
            voltage
          };

          // Atualizar dados do gráfico
          setChartData(prevData => {
            const newData = [...prevData, resistance];
            return newData.slice(-20); // Manter apenas os últimos 20 pontos
          });

          setChartLabels(prevLabels => {
            const newLabels = [...prevLabels, `${newTime}s`];
            return newLabels.slice(-20);
          });

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
        resistance: prev.resistance,
        current: prev.injectedCurrent,
        voltage: prev.voltage,
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
      type: 'microhmeter',
      measurements: state.measurements,
      currentScale: state.currentScale,
      finalResistance: state.resistance,
      finalCurrent: state.injectedCurrent,
      finalVoltage: state.voltage,
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
          <h1 className="equipment-title">Microhmímetro</h1>
          <p>Medição de Resistência Ôhmica</p>
          <div className="equipment-image">
            <img src="/megohmetro_dlro.png" alt="Microhmímetro DLRO10HD" style={{maxWidth: '300px', height: 'auto', margin: '20px 0', borderRadius: '8px'}} />
            <p style={{fontSize: '0.9rem', opacity: 0.8}}>Megger DLRO10HD - Microhmímetro Digital</p>
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
                  <div>│ TERMINAL R  │ ← ⚡ POSITIVO</div>
                  <div>│ TERMINAL S  │</div>
                  <div>│ TERMINAL T  │</div>
                  <div>│ TERRA (GND) │ ← ⚡ NEGATIVO</div>
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
                <div style={{ color: '#ffd700', fontSize: '16px', marginBottom: '10px' }}>📊 MICROHMÍMETRO DLRO10HD</div>
                <div>┌──────────────────┐</div>
                <div>│ ⚡ POS (VERMELHO) │</div>
                <div>│ ⚡ NEG (PRETO)    │</div>
                <div>│ 🔄 CORRENTE DC    │</div>
                <div>└──────────────────┘</div>
              </div>
            </div>

            {/* Instruções de Conexão */}
            <div style={{ flex: '1', color: 'white' }}>
              <h4 style={{ color: '#ffd700', marginBottom: '10px' }}>📋 Passos de Conexão:</h4>
              <ol style={{ lineHeight: '1.6', fontSize: '14px' }}>
                <li><strong>1.</strong> Desenergize completamente o gerador</li>
                <li><strong>2.</strong> Identifique os terminais do enrolamento a testar</li>
                <li><strong>3.</strong> Conecte o cabo <span style={{color: '#ff6b6b'}}>VERMELHO (POSITIVO)</span> a um terminal do enrolamento</li>
                <li><strong>4.</strong> Conecte o cabo <span style={{color: '#000'}}>PRETO (NEGATIVO)</span> ao outro terminal do mesmo enrolamento</li>
                <li><strong>5.</strong> Garanta contato elétrico firme (limpe os terminais se necessário)</li>
                <li><strong>6.</strong> Verifique que não há circuitos paralelos</li>
                <li><strong>7.</strong> Selecione a escala de corrente apropriada (1A, 10A, 100A)</li>
              </ol>

              <div style={{
                background: 'rgba(255, 193, 7, 0.2)',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                padding: '10px',
                marginTop: '15px',
                fontSize: '12px'
              }}>
                <strong>⚠️ ATENÇÃO:</strong> Corrente alta! Use cabos adequados para a corrente selecionada. Evite contato com partes energizadas.
              </div>
            </div>
          </div>
        </div>

        <div className="controls-section">
          <h3>Configurações</h3>
          <div className="control-group">
            <label>Escala de Corrente:</label>
            <select
              value={state.currentScale}
              onChange={(e) => setState(prev => ({ ...prev, currentScale: e.target.value }))}
              disabled={state.isRunning}
            >
              <option value="1 A">1 A</option>
              <option value="10 A">10 A</option>
              <option value="100 A">100 A</option>
            </select>
          </div>
        </div>

        <div className="display-section">
          <h3>Leituras</h3>
          <div className="displays">
            <div className="display">
              <div className="display-label">Corrente Injetada</div>
              <div className="display-value">{state.injectedCurrent.toFixed(1)} mA</div>
            </div>
            <div className="display">
              <div className="display-label">Resistência</div>
              <div className="display-value">{state.resistance.toFixed(6)} Ω</div>
            </div>
            <div className="display">
              <div className="display-label">Tensão</div>
              <div className="display-value">{state.voltage.toFixed(4)} V</div>
            </div>
          </div>
        </div>

        {chartData.length > 0 && (
          <Chart
            data={chartData}
            labels={chartLabels}
            title="Resistência vs Tempo"
            yAxisLabel="Resistência (Ω)"
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
                  <th>Medição</th>
                  <th>Resistência (Ω)</th>
                  <th>Corrente (mA)</th>
                </tr>
              </thead>
              <tbody>
                {state.measurements.map((measurement, index) => (
                  <tr key={index}>
                    <td>Medição {index + 1}</td>
                    <td>{measurement.resistance.toFixed(6)}</td>
                    <td>{measurement.current.toFixed(1)}</td>
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

export default MicrohmeterScreen;