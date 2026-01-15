import React, { useState, useEffect } from 'react';
import { ScheringBridgeState } from './types';
import EnvironmentalData from './EnvironmentalData';
import Chart from './Chart';
import AmplitudeSpectrumChart from './AmplitudeSpectrumChart';
import TestInfo from './TestInfo';
import TabComponent from './TabComponent';

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
  const [harmonicsData, setHarmonicsData] = useState<{ frequency: number; amplitude: number }[]>([]);

  const voltageSteps = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000];

  useEffect(() => {
    let interval: any;

    if (state.isRunning) {
      interval = setInterval(() => {
        setState(prev => {
          const newTime = prev.time + 1;

          const baseTanDelta = 0.0045;
          const variation = (Math.random() - 0.5) * 0.00001;
          const tanDelta = baseTanDelta + variation;

          const capacitance = 2850 + (Math.random() - 0.5) * 5;

          const capacitanceFarads = capacitance * 1e-12;
          const frequency = 60;
          const currentAC = 2 * Math.PI * frequency * capacitanceFarads * prev.appliedVoltage * 1000;

          const harmonicsArray = Array.from({ length: 10 }, (_, i) => {
            const baseValue = i === 0 ? 100 : Math.max(0, 20 - i * 2);
            return baseValue + (Math.random() - 0.5) * 5;
          });

          const harmonicsObjectsArray = Array.from({ length: 10 }, (_, i) => {
            const baseValue = i === 0 ? 100 : Math.max(0, 20 - i * 2);
            const amplitude = baseValue + (Math.random() - 0.5) * 5;
            return {
              frequency: (i + 1) * 60,
              amplitude: amplitude
            };
          });

          const newState = {
            ...prev,
            time: newTime,
            tanDelta,
            currentAC,
            capacitance,
            harmonics: harmonicsArray
          };

          setChartData(prevData => {
            const newData = [...prevData, tanDelta * 100];
            return newData;
          });

          setChartLabels(prevLabels => {
            const newLabels = [...prevLabels, `${newTime}s`];
            return newLabels;
          });

          setHarmonicsData(harmonicsObjectsArray);

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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: '#4CAF50', marginBottom: '30px' }}>Ponte de Schering - Medição de Tangente Delta</h2>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img src="/midas_system.png" alt="MIDAS - Ponte de Schering" style={{ maxWidth: '250px', height: 'auto', borderRadius: '8px' }} />
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>Tettex MIDAS - Medidor de Tangente Delta</p>
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

                <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Tensão de Teste:</label>
                    <select
                      value={state.appliedVoltage}
                      onChange={(e) => setState(prev => ({ ...prev, appliedVoltage: parseInt(e.target.value) }))}
                      disabled={state.isRunning}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #ddd',
                        backgroundColor: '#f5f5f5'
                      }}
                    >
                      {voltageSteps.map(voltage => (
                        <option key={voltage} value={voltage}>{voltage} V</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <button
                    onClick={startMeasurement}
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
                    Iniciar Medição
                  </button>
                  <button
                    onClick={stopMeasurement}
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
                    Parar Medição
                  </button>
                  <button
                    onClick={sendToPlatform}
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
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Tensão Aplicada</p>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                      {state.appliedVoltage} V
                    </p>
                  </div>
                  <div style={{
                    padding: '15px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Tangente Delta</p>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                      {(state.tanDelta * 100).toFixed(3)} %
                    </p>
                  </div>
                  <div style={{
                    padding: '15px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Corrente AC</p>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1A237E' }}>
                      {state.currentAC.toFixed(2)} mA
                    </p>
                  </div>
                  <div style={{
                    padding: '15px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Capacitância</p>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
                      {state.capacitance.toFixed(0)} pF
                    </p>
                  </div>
                  <div style={{
                    padding: '15px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Tempo</p>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
                      {formatTime(state.time)}
                    </p>
                  </div>
                </div>

                <TestInfo
                  objective="Medição do fator de dissipação (tan δ) e capacitância do isolamento para avaliação do envelhecimento."
                  necessity={[
                    'Determinar o estado de envelhecimento do isolamento com alta precisão',
                    'Detectar contaminação, umidade e enfraquecimento das propriedades dielétricas',
                    'Analisar espectro de harmônicos para identificar problemas de condução incipiente',
                    'Medir capacitância do isolamento em diferentes condições de tensão AC'
                  ]}
                />

                {chartData.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4>Gráfico de Tangente Delta vs Tempo</h4>
                    <Chart
                      data={chartData}
                      labels={chartLabels}
                      title="Evolução de Tan δ"
                      yAxisLabel="Tangente Delta (%)"
                    />
                  </div>
                )}

                {harmonicsData.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4>Espectro de Harmônicos</h4>
                    <AmplitudeSpectrumChart
                      harmonics={harmonicsData}
                      title="Amplitude Spectrum"
                      width={500}
                      height={300}
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
                          <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Teste</th>
                          <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Tensão (V)</th>
                          <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Tan δ (%)</th>
                          <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Corrente AC (mA)</th>
                          <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Capacitância (pF)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.measurements.map((measurement, index) => (
                          <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>Teste {index + 1}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{measurement.voltage}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{(measurement.tanDelta * 100).toFixed(3)}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{measurement.currentAC.toFixed(2)}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{measurement.capacitance.toFixed(0)}</td>
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
            label: 'Set Voltage AC',
            icon: '📈',
            content: (
              <div>
                <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Set Voltage AC (Step Voltage AC)</h3>

                <p>
                  Esta tecnica consiste em aplicar uma tensao AC em multiplos degraus obedecendo aos limites da IEC 62071,
                  onde sao registrados automaticamente os parametros de tensao, corrente AC, capacitancia e tan delta.
                </p>

                <h4 style={{ color: '#455A64' }}>Principio de Funcionamento</h4>
                <p>
                  A tecnica "Step Voltage AC" (SVAC) e similar a SVDC, mas utiliza tensao alternada. Quando a tensao AC aplicada 
                  e aumentada em degraus, um isolante em boas condicoes mantém tan delta estavel ou ligeiramente decrescente. 
                  Porem, se houver contaminacao, umidade ou defeitos (trincas ou cavidades na isolacao), tan delta aumenta 
                  abruptamente, indicando degradacao do dielétrico por condutividade ou polarizacao.
                </p>

                <h4 style={{ color: '#455A64' }}>Analise de Resultados</h4>
                <ul>
                  <li><strong>Isolacao Saudavel:</strong> Tan delta mantém-se baixo e estavel com aumento de tensao</li>
                  <li><strong>Isolacao Contaminada:</strong> Tan delta aumenta significativamente em degraus intermediarios</li>
                  <li><strong>Isolacao Envelhecida:</strong> Tan delta alto em todos os niveis de tensao</li>
                  <li><strong>Defeitos Incipientes:</strong> Comportamento nao linear da curva tensao vs. tan delta</li>
                </ul>

                <h4 style={{ color: '#455A64' }}>Tabela de Tensoes IEEE/IEC</h4>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginTop: '10px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Degrau</th>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Tensao (V)</th>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Observacoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: '#e8f5e9' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>1</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>500 V</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Tensao de referencia inicial</td>
                    </tr>
                    <tr style={{ backgroundColor: '#f1f8e9' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>2</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>1000 V</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Segundo degrau</td>
                    </tr>
                    <tr style={{ backgroundColor: '#c8e6c9' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>3</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>2000 V</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Terceiro degrau</td>
                    </tr>
                    <tr style={{ backgroundColor: '#ECEFF1' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>4</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>5000 V</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Quarto degrau</td>
                    </tr>
                    <tr style={{ backgroundColor: '#CFD8DC' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>5</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>10000 V</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Degrau maximo IEEE</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          },
          {
            label: 'Explicacao',
            icon: '📖',
            content: (
              <div>
                <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Fator de Dissipação - Tangente Delta</h3>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Objetivo</h4>
                <p>
                  O teste de Tangente Delta (tan δ) tem como objetivo medir o fator de dissipação de um material dielétrico ou 
                  de um sistema de isolamento elétrico. É uma indicação do grau de pureza do meio dielétrico e da qualidade, ou 
                  da dissipação relativa de calor no meio dielétrico quando submetido a um campo elétrico alternado.
                </p>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Princípio Físico</h4>
                <p>
                  O fator de dissipação pode ser determinado pela razão entre a potência útil e a potência reativa do sistema 
                  capacitivo. Quanto menor for a amplitude da corrente resistiva com relação à corrente capacitiva, menor será o 
                  ângulo delta (δ) entre a corrente capacitiva e a corrente total, menor o valor de tan δ e melhor a condição do 
                  dielétrico.
                </p>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Análise de Harmônicos</h4>
                <p>
                  Esta técnica consiste em aplicar uma tensão alternada nos enrolamentos estatóricos, onde são registradas e 
                  analisadas as distorções harmônicas contidas na corrente de fuga, com o objetivo de avaliar as condições do 
                  isolamento em função do percentual da distorção e da predominância das harmônicas ímpares ou pares.
                </p>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Necessidade da Realização do Teste</h4>
                <ul style={{ color: '#555', lineHeight: '1.8' }}>
                  <li><strong>Diagnóstico de Envelhecimento:</strong> Tan δ é um indicador sensível de envelhecimento do isolamento, permitindo detectar degradação antes de falha.</li>
                  <li><strong>Detecção de Contaminação:</strong> Umidade, sujeira e contaminação aumentam significativamente o valor de tan δ.</li>
                  <li><strong>Avaliação de Qualidade Dielétrica:</strong> Valores baixos indicam isolação de qualidade; valores altos indicam necessidade de intervenção.</li>
                  <li><strong>Monitoramento Preventivo:</strong> Testes periódicos permitem acompanhar a evolução do estado do isolamento.</li>
                  <li><strong>Conformidade com Normas:</strong> IEEE 286, IEC 60247 e outras normas exigem este teste para máquinas de alta tensão.</li>
                </ul>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Interpretação dos Resultados</h4>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginTop: '10px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Faixa de Tan δ (%)</th>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Condição</th>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Ação Recomendada</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: '#c8e6c9' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>0 - 0.5%</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Excelente</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Equipamento aceito, continuar operação normal</td>
                    </tr>
                    <tr style={{ backgroundColor: '#ECEFF1' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>0.5 - 1.0%</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Aceitável</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Monitorar, realizar testes periódicos</td>
                    </tr>
                    <tr style={{ backgroundColor: '#CFD8DC' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>1.0 - 2.0%</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Questionável</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Aumento de frequência de testes, avaliar reparos</td>
                    </tr>
                    <tr style={{ backgroundColor: '#B0BEC5' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Acima de 2.0%</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Inadequado</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Equipamento rejeitado, reparação obrigatória</td>
                    </tr>
                  </tbody>
                </table>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Harmônicos e Seus Significados</h4>
                <ul style={{ color: '#555', lineHeight: '1.8' }}>
                  <li><strong>Harmônicas Ímpares Elevadas:</strong> Indicam envelhecimento do isolamento com presença de produtos de degradação condutivos.</li>
                  <li><strong>Harmônicas Pares Elevadas:</strong> Sugerem contaminação por umidade ou presença de sujeira condutiva.</li>
                  <li><strong>Distorção Harmônica Baixa:</strong> Indica isolação em bom estado com alto grau de pureza dielétrica.</li>
                </ul>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Normas Aplicáveis</h4>
                <ul style={{ color: '#555', lineHeight: '1.8' }}>
                  <li><strong>IEEE 286:</strong> "Insulation Systems - General Evaluation and Selection"</li>
                  <li><strong>IEC 60247:</strong> "Insulating liquids - Measurement of relative permittivity, dielectric dissipation factor and d.c. resistivity"</li>
                  <li><strong>ASTM D150:</strong> "Standard Test Methods for A-C Loss Characteristics and Permittivity (Dielectric Constant) of Solid Electrical Insulation"</li>
                  <li><strong>IEC 60814:</strong> "Fluids for electrotechnical applications - Unused mineral insulating oils for transformers and switchgear"</li>
                </ul>
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

export default ScheringBridgeScreen;
