import React, { useState, useEffect } from 'react';
import { PartialDischargeState } from './types';
import EnvironmentalData from './EnvironmentalData';
import Chart from './Chart';
import PRPDChart from './PRPDChart';
import DualAxisChart from './DualAxisChart';
import TestInfo from './TestInfo';
import TabComponent from './TabComponent';

interface PartialDischargeScreenProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

const PartialDischargeScreen: React.FC<PartialDischargeScreenProps> = ({ onComplete, onBack }) => {
  const [state, setState] = useState<PartialDischargeState>({
    appliedVoltage: 1000,
    isRunning: false,
    dischargeLevel: 0,
    pulseCount: 0,
    time: 0,
    measurements: []
  });

  const [chartData, setChartData] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [prpdData, setPRPDData] = useState<{ phase: number; magnitude: number; count?: number }[]>([]);
  const [voltageData, setVoltageData] = useState<number[]>([]);

  useEffect(() => {
    let interval: any;

    if (state.isRunning) {
      interval = setInterval(() => {
        setState(prev => {
          const newTime = prev.time + 1;

          // Simular PD (Partial Discharge) baseado na tensão aplicada
          const basePD = (prev.appliedVoltage / 1000) * 5;
          const variation = (Math.random() - 0.5) * 2;
          const dischargeLevel = Math.max(0, basePD + variation);

          // Atividade de PD - pulsos por segundo
          const pulseCount = Math.random() * (dischargeLevel / 10);

          // Gerar dados PRPD (Phase Resolved PD)
          const phase = (newTime * 36) % 360;
          const magnitude = dischargeLevel + (Math.random() - 0.5) * 1;

          // Simular voltage variando conforme o tempo
          const voltageValue = (prev.appliedVoltage / 1000) * (0.8 + 0.4 * Math.sin(newTime * 0.3));

          const dischargePattern = [
            { phase: phase, magnitude: magnitude, count: 1 }
          ];

          const newMeasurement = {
            voltage: prev.appliedVoltage,
            dischargeLevel: dischargeLevel,
            pulseCount: pulseCount,
            time: newTime,
            dischargePattern: dischargePattern
          };

          // Atualizar gráfico de forma acumulativa
          setChartData(prevData => [...prevData, dischargeLevel]);
          setChartLabels(prevLabels => [...prevLabels, `${newTime}s`]);

          // Adicionar dados PRPD
          setPRPDData(prevData => [...prevData, { phase: phase, magnitude: magnitude }]);

          // Adicionar dados de voltage
          setVoltageData(prevData => [...prevData, voltageValue]);

          return {
            ...prev,
            time: newTime,
            dischargeLevel: dischargeLevel,
            pulseCount: pulseCount,
            measurements: [...prev.measurements, newMeasurement]
          };
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [state.isRunning, state.appliedVoltage, state.dischargeLevel, state.time]);

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

  const handleVoltageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const voltage = parseFloat(e.target.value);
    setState(prev => ({
      ...prev,
      appliedVoltage: voltage
    }));
  };

  const handleComplete = () => {
    onComplete({
      type: 'Descarga Parcial',
      appliedVoltage: state.appliedVoltage,
      maxPD: Math.max(...state.measurements.map(m => m.dischargeLevel || 0)),
      avgPulseCount: state.measurements.length > 0
        ? state.measurements.reduce((sum, m) => sum + (m.pulseCount || 0), 0) / state.measurements.length
        : 0,
      measurements: state.measurements
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: '#4CAF50', marginBottom: '30px' }}>Teste de Descarga Parcial (PD)</h2>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img src="/ddx_tettex.png" alt="DDX - Descarga Parcial" style={{ maxWidth: '250px', height: 'auto', borderRadius: '8px' }} />
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>Tettex DDX - Deteccao de Descargas Parciais</p>
      </div>

      <EnvironmentalData />

      <TabComponent
        tabs={[
          {
            label: 'Medicao',
            icon: '📊',
            content: (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h3>Configuração do Teste de PD</h3>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label>Tensão de Teste: </label>
                    <input 
                      type="range" 
                      min="500" 
                      max="10000" 
                      step="100"
                      value={state.testVoltage}
                      onChange={handleVoltageChange}
                      disabled={state.isRunning}
                      style={{ marginLeft: '10px', width: '300px' }}
                    />
                    <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>{state.testVoltage} V</span>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <button 
                      onClick={handleStart}
                      disabled={state.isRunning}
                      style={{
                        padding: '10px 20px',
                        marginRight: '10px',
                        backgroundColor: state.isRunning ? '#ccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: state.isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      Iniciar Teste
                    </button>
                    <button 
                      onClick={handleStop}
                      disabled={!state.isRunning}
                      style={{
                        padding: '10px 20px',
                        marginRight: '10px',
                        backgroundColor: !state.isRunning ? '#ccc' : '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: !state.isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      Parar Teste
                    </button>
                    <button 
                      onClick={handleComplete}
                      disabled={state.measurements.length === 0}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: state.measurements.length === 0 ? '#ccc' : '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: state.measurements.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      Concluir Teste
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    padding: '15px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Valor de PD</p>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#4CAF50' }}>
                      {state.dischargeLevel.toFixed(2)} pC
                    </p>
                  </div>
                  <div style={{
                    padding: '15px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}>
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>Atividade de PD</p>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#2196F3' }}>
                      {state.pulseCount.toFixed(2)} pulsos/s
                    </p>
                  </div>
                </div>

                <TestInfo
                  objective="Detectar e quantificar descargas parciais na isolação do equipamento durante aplicação de tensão AC elevada."
                  necessity={[
                    'Identificar degradação incipiente da isolação',
                    'Quantificar atividade de descargas através da medição em pC (picocoulombs)',
                    'Avaliar a integridade estrutural da isolação sob stress elétrico',
                    'Realizar diagnóstico preventivo de falhas iminentes'
                  ]}
                />

                <div style={{ marginTop: '20px' }}>
                  <h4>Gráfico de Evolução de PD</h4>
                  <Chart 
                    data={chartData} 
                    labels={chartLabels}
                    title="Descarga Parcial ao Longo do Tempo"
                    yAxisLabel="PD (pC)"
                  />
                </div>

                {prpdData.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4>Gráfico PRPD (Phase Resolved Partial Discharge)</h4>
                    <PRPDChart
                      data={prpdData}
                      title="PD FASE R - Distribuição de Fase"
                      width={500}
                      height={300}
                    />
                  </div>
                )}

                {chartData.length > 0 && voltageData.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4>Gráfico Q vs V (Dual Axis)</h4>
                    <DualAxisChart
                      data1={chartData}
                      data2={voltageData}
                      labels={chartLabels}
                      title="Descargas Parciais vs Tensão Aplicada"
                      yLabel1="Q (pC)"
                      yLabel2="V (kV)"
                      width={600}
                      height={300}
                    />
                  </div>
                )}

                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '5px',
                  borderLeft: '4px solid #ff9800'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#ff6f00' }}>Tempo Total do Teste</h4>
                  <p style={{ margin: 0, fontSize: '18px', color: '#333' }}>{state.time} segundos</p>
                </div>
              </div>
            )
          },
          {
            label: 'Explicacao',
            icon: '📖',
            content: (
              <div>
                <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Teste de Descarga Parcial (PD)</h3>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Objetivo</h4>
                <p>
                  O teste de descarga parcial (PD) tem como objetivo detectar e quantificar descargas parciais que ocorrem 
                  dentro da isolação de máquinas e equipamentos elétricos. As descargas parciais são ruptura localizada do 
                  dielétrico que não atravessa completamente a isolação, mas causam degradação progressiva. A detecção de PD 
                  permite identificar problemas na isolação em estágios iniciais, possibilitando manutenção preventiva antes 
                  de falhas catastróficas.
                </p>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Necessidade da Realização do Teste</h4>
                <ul style={{ color: '#555', lineHeight: '1.8' }}>
                  <li><strong>Diagnóstico de Degradação da Isolação:</strong> PD é um indicador de envelhecimento e degradação do dielétrico, permitindo avaliação do estado real da isolação.</li>
                  <li><strong>Prevenção de Falhas Catastróficas:</strong> A detecção precoce de PD evita que a degradação prograda até ruptura total e falha da máquina.</li>
                  <li><strong>Avaliação de Integridade Estrutural:</strong> Identifica problemas como vazios (voids), contaminação, umidade e delamination na isolação.</li>
                  <li><strong>Garantia de Confiabilidade:</strong> Essencial para máquinas críticas e em operação contínua, onde falhas causam grandes perdas operacionais.</li>
                  <li><strong>Conformidade com Normas:</strong> IEC 60270, IEEE 1415 e outras normas internacionais exigem testes de PD para máquinas de alta tensão.</li>
                </ul>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Procedimento do Teste</h4>
                <p>
                  O teste de PD é realizado aplicando uma tensão AC no equipamento sob teste (tipicamente 1.0 a 1.5 vezes a tensão nominal) 
                  e medindo descargas parciais com sensores de corrente ou capacitivos. A tensão é aumentada gradualmente até atingir a 
                  tensão de teste especificada. As descargas são quantificadas em picocoulombs (pC) e registradas ao longo do tempo.
                </p>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Critérios de Aceitação</h4>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginTop: '10px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Faixa de PD (pC)</th>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Condição</th>
                      <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Ação Recomendada</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: '#c8e6c9' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>0 - 5 pC</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Excelente</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Equipamento aceito, continuar operação normal</td>
                    </tr>
                    <tr style={{ backgroundColor: '#ECEFF1' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>5 - 20 pC</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Aceitável</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Monitorar, realizar testes periódicos</td>
                    </tr>
                    <tr style={{ backgroundColor: '#CFD8DC' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>20 - 50 pC</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Questionável</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Aumento de frequência de testes, avaliar reparos</td>
                    </tr>
                    <tr style={{ backgroundColor: '#B0BEC5' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Acima de 50 pC</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Inadequado</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>Equipamento rejeitado, reparação obrigatória antes de operação</td>
                    </tr>
                  </tbody>
                </table>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Interpretação dos Resultados</h4>
                <p>
                  <strong>Magnitude de PD:</strong> Quanto maior o valor em pC, maior a degradação da isolação. Valores elevados indicam 
                  presença de vazios, contaminação ou delamination significativa.
                </p>
                <p>
                  <strong>Atividade de PD:</strong> A frequência de pulsos (pulsos/segundo) indica a taxa de degradação. Atividade alta 
                  com valores baixos pode indicar problemas localizados. Atividade baixa com valores altos pode indicar degradação distribuída.
                </p>
                <p>
                  <strong>Tendência Temporal:</strong> O aumento gradual de PD ao longo do tempo durante o teste indica degradação progressiva 
                  e possível iminência de falha.
                </p>

                <h4 style={{ color: '#2196F3', marginTop: '20px' }}>Normas Aplicáveis</h4>
                <ul style={{ color: '#555', lineHeight: '1.8' }}>
                  <li><strong>IEC 60270:</strong> "High-voltage test techniques - Partial discharge measurements"</li>
                  <li><strong>IEEE 1415:</strong> "IEEE Guide for Induction Machinery Maintenance Testing and Failure Analysis"</li>
                  <li><strong>IEEE 1681:</strong> "IEEE Guide for the Statistical Characterization of Human Exposure to Radiofrequency Fields"</li>
                  <li><strong>ASTM D6927:</strong> "Standard Practice for Detecting Partial Discharges in Insulation Using Acousto-Ultrasonic Technique"</li>
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

export default PartialDischargeScreen;
