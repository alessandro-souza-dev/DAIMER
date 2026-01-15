import React, { useState, useEffect } from 'react';
import { MicrohmeterState } from './types';
import EnvironmentalData from './EnvironmentalData';
import Chart from './Chart';
import TestInfo from './TestInfo';
import TabComponent from './TabComponent';

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

          const newState = {
            ...prev,
            time: newTime,
            injectedCurrent,
            resistance,
            voltage,
            measurements: [...prev.measurements, { time: newTime, resistance, voltage, current: injectedCurrent }]
          };

          setChartData(prevData => [...prevData, resistance]);
          setChartLabels(prevLabels => [...prevLabels, `${newTime}s`]);

          return newState;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [state.isRunning, state.currentScale]);

  const handleStart = () => {
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

  const handleScaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(prev => ({
      ...prev,
      currentScale: e.target.value
    }));
  };

  const handleComplete = () => {
    onComplete({
      type: 'Microhmeter',
      measurements: state.measurements,
      currentScale: state.currentScale,
      maxResistance: Math.max(...state.measurements.map(m => m.resistance || 0)),
      avgResistance: state.measurements.length > 0
        ? state.measurements.reduce((sum, m) => sum + (m.resistance || 0), 0) / state.measurements.length
        : 0
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: '#4CAF50', marginBottom: '30px' }}>Microhmímetro - Medição de Resistência Ôhmica</h2>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img src="/megohmetro_dlro.png" alt="Microhmímetro DLRO" style={{ maxWidth: '250px', height: 'auto', borderRadius: '8px' }} />
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>Megôhmetro DLRO - Medição de Resistência Ôhmica</p>
      </div>

      <EnvironmentalData />

      <TabComponent
        tabs={[
          {
            label: 'Medicao',
            icon: '📊',
            content: (
              <div>
                <h3>Configuração da Medição</h3>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Escala de Corrente:</label>
                  <select
                    value={state.currentScale}
                    onChange={handleScaleChange}
                    disabled={state.isRunning}
                    style={{
                      padding: '10px',
                      borderRadius: '5px',
                      border: '1px solid #ddd',
                      backgroundColor: '#f5f5f5'
                    }}
                  >
                    <option>1 A</option>
                    <option>5 A</option>
                    <option>10 A</option>
                    <option>25 A</option>
                    <option>50 A</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <button
                    onClick={handleStart}
                    disabled={state.isRunning}
                    style={{
                      padding: '12px 24px',
                      marginRight: '10px',
                      backgroundColor: state.isRunning ? '#ccc' : '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: state.isRunning ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    Iniciar Teste
                  </button>
                  <button
                    onClick={handleStop}
                    disabled={!state.isRunning}
                    style={{
                      padding: '12px 24px',
                      marginRight: '10px',
                      backgroundColor: !state.isRunning ? '#ccc' : '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: !state.isRunning ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    Parar Teste
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={state.measurements.length === 0}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: state.measurements.length === 0 ? '#ccc' : '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: state.measurements.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    Concluir Teste
                  </button>
                </div>

                <h3>Leituras em Tempo Real</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '15px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    padding: '15px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Corrente Injetada</p>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                      {state.injectedCurrent.toFixed(2)} mA
                    </p>
                  </div>
                  <div style={{
                    padding: '15px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Resistência Medida</p>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                      {state.resistance.toFixed(6)} Ω
                    </p>
                  </div>
                  <div style={{
                    padding: '15px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Tensão Medida</p>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1A237E' }}>
                      {state.voltage.toFixed(2)} mV
                    </p>
                  </div>
                </div>

                <TestInfo
                  objective="Verificar se o valor da resistência ôhmica está conforme a especificação de fábrica do enrolamento."
                  necessity={[
                    'Detectar mudanças na resistência dos enrolamentos causadas por falhas ou degradação',
                    'Comparar valores medidos com referências históricas para identificar tendências',
                    'Validar continuidade dos circuitos de potência',
                    'Máximo desvio admissível é de 5% em relação aos valores de referência'
                  ]}
                />

                {chartData.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4>Gráfico de Resistência vs Tempo</h4>
                    <Chart
                      data={chartData}
                      labels={chartLabels}
                      title="Evolução da Resistencia"
                      yAxisLabel="Resistencia (Ohm)"
                    />
                  </div>
                )}

                {state.measurements.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h3>Medições Realizadas</h3>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      marginTop: '10px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                          <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Tempo</th>
                          <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Resistencia (Ohm)</th>
                          <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Tensao (mV)</th>
                          <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Corrente (mA)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.measurements.map((m, idx) => (
                          <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{m.time}s</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{m.resistance.toFixed(6)}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{m.voltage.toFixed(2)}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{m.current.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          },
          {
            label: 'Explicacao',
            icon: '📖',
            content: (
              <div>
                <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Resistencia Ohmica</h3>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Objetivo</h4>
                <p>
                  O teste de resistencia ohmica tem como objetivo verificar se o valor da resistencia dos enrolamentos esta 
                  conforme a especificacao de fabrica. A resistencia ohmica e uma propriedade fundamental que reflete o estado 
                  do cobre dos enrolamentos e pode indicar problemas como: oxidacao, envelhecimento, solda deficiente entre 
                  espiras ou danos causados por sobrecarga termica.
                </p>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Principio de Funcionamento</h4>
                <p>
                  O teste injeta uma corrente continua (DC) atraves do enrolamento e mede a queda de tensao resultante. 
                  Usando a lei de Ohm (R = V / I), calcula-se a resistencia. Este teste e muito sensivel a mudancas nas 
                  propriedades do material e conexoes.
                </p>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Necessidade da Realizacao do Teste</h4>
                <ul style={{ color: '#555', lineHeight: '1.8' }}>
                  <li><strong>Deteccao de Falhas:</strong> Mudancas na resistencia indicam problemas internos nos enrolamentos.</li>
                  <li><strong>Comparacao com Referencia:</strong> Valores historicos permitem acompanhar a evolucao do estado.</li>
                  <li><strong>Validacao de Continuidade:</strong> Identifica aberturas ou seccionamentos no circuito.</li>
                  <li><strong>Avaliacoes Periodicas:</strong> Monitoramento preventivo detecta degradacao incipiente.</li>
                </ul>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Criterios de Aceitacao</h4>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginTop: '10px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Criterio</th>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Condicao</th>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Acao</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: '#c8e6c9' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Dentro de tolerancia</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Desvio menor que 5% da referencia</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Equipamento aceito</td>
                    </tr>
                    <tr style={{ backgroundColor: '#ECEFF1' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Ligeira variacao</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Desvio de 5% a 10% da referencia</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Monitorar periodicamente</td>
                    </tr>
                    <tr style={{ backgroundColor: '#CFD8DC' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Alteracao significativa</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Desvio acima de 10% da referencia</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Investigacao e possivel manutencao</td>
                    </tr>
                  </tbody>
                </table>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Interpretacao dos Resultados</h4>
                <ul style={{ color: '#555', lineHeight: '1.8' }}>
                  <li><strong>Aumento de Resistencia:</strong> Indica envelhecimento do cobre ou oxidacao das conexoes.</li>
                  <li><strong>Diminuicao Abrupta:</strong> Pode indicar espiras em curto-circuito ou falha na isolacao.</li>
                  <li><strong>Desvio Asimetrico:</strong> Um enrolamento muito diferente dos outros sugere problema localizado.</li>
                  <li><strong>Variacao Lenta:</strong> Mudancas graduais podem indicar degradacao progressiva normal com a idade.</li>
                </ul>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Influencias Externas</h4>
                <p>
                  A temperatura ambiente influencia fortemente os valores medidos. O coeficiente de temperatura do cobre 
                  e aproximadamente 0.4% por grau Celsius. Por isso, e muito importante registrar a temperatura durante 
                  a medicao e corrigir os valores para a temperatura padrao de 20°C usando a formula de correcao apropriada.
                </p>
              </div>
            )
          }
        ]}
      />

      <div style={{
        marginTop: '30px',
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-start'
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px',
            backgroundColor: '#9e9e9e',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Voltar
        </button>
      </div>
    </div>
  );
};

export default MicrohmeterScreen;
