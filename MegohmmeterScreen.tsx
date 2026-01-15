import React, { useState, useEffect } from 'react';
import { MegohmmeterState } from './types';
import EnvironmentalData from './EnvironmentalData';
import Chart from './Chart';

interface MegohmmeterScreenProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

const MegohmmeterScreen: React.FC<MegohmmeterScreenProps> = ({ onComplete, onBack }) => {
  const [state, setState] = useState<MegohmmeterState>({
    testMode: 'IP',
    testVoltage: 500,
    isRunning: false,
    appliedVoltage: 0,
    resistance: 0,
    current: 0,
    timeConstant: 0,
    capacitanceCC: 0,
    time: 0,
    measurements: []
  });

  const [chartData, setChartData] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [stepTime, setStepTime] = useState<number>(0);
  const [svSteps, setSvSteps] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);

  // Steps de tensão de 500V em 500V
  const voltageSteps = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000];

  useEffect(() => {
    let interval: number;

    if (state.isRunning) {
      interval = setInterval(() => {
        setState(prev => {
          const newTime = prev.time + 1;

          // Simular valores baseados no relatório
          // Resistência de isolamento aumenta com o tempo
          const baseResistance = 2430; // MΩ (valor aos 30 minutos do relatório)
          const timeVariation = Math.log(newTime + 1) * 200; // Crescimento logarítmico
          const resistance = baseResistance + timeVariation + (Math.random() - 0.5) * 100;

          // Corrente diminui com o aumento da resistência (I = V/R)
          const current = (prev.testVoltage / 1000) / resistance; // μA

          // Capacitância CC baseada no relatório (69 nF para fase R)
          const capacitanceCC = 69 + (Math.random() - 0.5) * 5; // nF

          // Constante de tempo = Resistência (MΩ) × Capacitância (nF) / 1000
          // Baseado na observação do relatório: "A constante de tempo é o resultado da resistência de isolamento medida em 30 minutos multiplicados pela capacitância"
          const timeConstant = (resistance * capacitanceCC) / 1000; // segundos

          const newState = {
            ...prev,
            time: newTime,
            appliedVoltage: prev.testVoltage,
            resistance,
            current,
            timeConstant,
            capacitanceCC
          };

          // Atualizar dados do gráfico
          setChartData(prevData => {
            const newData = [...prevData, resistance];
            return newData.slice(-20);
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
  }, [state.isRunning, state.testVoltage]);

  const startTest = () => {
    setState(prev => ({ ...prev, isRunning: true, time: 0 }));
    setChartData([]);
    setChartLabels([]);
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
          </div>
        </div>

        {chartData.length > 0 && (
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

export default MegohmmeterScreen;