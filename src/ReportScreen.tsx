import React from 'react';
import { TestResult } from './types';

interface ReportScreenProps {
  testResults: TestResult[];
  onNewSimulation: () => void;
}

const ReportScreen: React.FC<ReportScreenProps> = ({ testResults, onNewSimulation }) => {
  const downloadReport = () => {
    // Criar um link para download do PDF existente
    const link = document.createElement('a');
    link.href = '/D00001F.pdf';
    link.download = 'Relatorio_Ensaios_DAIMER.pdf';
    link.click();
  };

  return (
    <div className="screen">
      <div className="report-panel">
        <div className="report-header">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '30px',
            marginBottom: '30px'
          }}>
            <img src="/daimer_logo.png" alt="DAIMER Logo" style={{ maxWidth: '200px', height: 'auto' }} />
            <img src="/data_logo.png" alt="DATA Logo" style={{ maxWidth: '150px', height: 'auto' }} />
          </div>

          <h1 style={{
            color: 'white',
            textAlign: 'center',
            fontSize: '2.5rem',
            marginBottom: '20px'
          }}>
            Relatório de Ensaios Elétricos
          </h1>

          <h2 style={{
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            fontSize: '1.5rem',
            marginBottom: '30px'
          }}>
            DAIMER - Valores Baseados no Relatório
          </h2>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          padding: '30px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>
            🎯 Ensaios Concluídos com Valores do Relatório
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '30px'
          }}>
            {testResults.map((test, index) => (
              <div key={index} style={{
                background: 'rgba(0, 255, 0, 0.2)',
                border: '2px solid #00ff00',
                borderRadius: '8px',
                padding: '15px',
                color: 'white'
              }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  ✓ {test.name}
                </div>
                <div style={{ fontSize: '0.9rem' }}>
                  Concluído em: {test.timestamp.toLocaleString()}
                </div>
                {test.id === 'microhmeter' && (
                  <div style={{ fontSize: '0.8rem', marginTop: '5px', color: '#ffd700' }}>
                    <strong>Relatório:</strong> 0.065164 Ω
                    <br />
                    <span style={{ color: '#00ff00' }}>
                      Simulado: {test.data.finalResistance.toFixed(6)} Ω
                    </span>
                  </div>
                )}
                {test.id === 'megohmmeter' && (
                  <div style={{ fontSize: '0.8rem', marginTop: '5px', color: '#ffd700' }}>
                    <strong>Relatório:</strong> 2430 MΩ
                    <br />
                    <span style={{ color: '#00ff00' }}>
                      Simulado: {test.data.finalResistance.toFixed(0)} MΩ
                    </span>
                  </div>
                )}
                {test.id === 'schering' && (
                  <div style={{ fontSize: '0.8rem', marginTop: '5px', color: '#ffd700' }}>
                    <strong>Relatório:</strong> 0.45%
                    <br />
                    <span style={{ color: '#00ff00' }}>
                      Simulado: {(test.data.finalTanDelta * 100).toFixed(3)}%
                    </span>
                  </div>
                )}
                {test.id === 'partial-discharge' && (
                  <div style={{ fontSize: '0.8rem', marginTop: '5px', color: '#ffd700' }}>
                    <strong>Relatório:</strong> 45 pC
                    <br />
                    <span style={{ color: '#00ff00' }}>
                      Simulado: {test.data.finalDischargeLevel.toFixed(0)} pC
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <h4 style={{ color: '#ffd700', marginBottom: '15px' }}>
              📊 Valores de Referência do Relatório D00001F.pdf
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px',
              color: 'rgba(255,255,255,0.9)'
            }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '5px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Microhmímetro</div>
                <div style={{ fontSize: '0.8rem' }}>0.065164 Ω</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>10A @ 0.65164V</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '5px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Megôhmetro</div>
                <div style={{ fontSize: '0.8rem' }}>2430 MΩ</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>30min @ 5kV</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '5px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Tangente Delta</div>
                <div style={{ fontSize: '0.8rem' }}>0.45%</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>10kV @ 2850pF</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '5px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Descarga Parcial</div>
                <div style={{ fontSize: '0.8rem' }}>45 pC</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>1250 pulsos</div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <h4 style={{ color: 'white', marginBottom: '15px' }}>
              Equipamento Testado
            </h4>
            <div style={{ color: 'rgba(255,255,255,0.9)' }}>
              <p><strong>Tipo:</strong> Gerador Síncrono Brushless</p>
              <p><strong>Potência:</strong> 1750 kW</p>
              <p><strong>Tensão:</strong> 13200 V</p>
              <p><strong>Fabricante:</strong> WEG</p>
              <p><strong>Modelo:</strong> RER</p>
              <p><strong>Frequência:</strong> 60 Hz</p>
            </div>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <h4 style={{ color: 'white', marginBottom: '15px' }}>
              Status do Envio
            </h4>
            <div style={{
              color: '#00ff00',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}>
              ✓ Dados enviados com sucesso para a DAIMER
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.8)',
              marginTop: '10px',
              fontSize: '0.9rem'
            }}>
              Todos os ensaios foram processados e integrados ao sistema
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          marginTop: '30px'
        }}>
          <button
            className="btn btn-success"
            onClick={downloadReport}
            style={{
              fontSize: '1.2rem',
              padding: '15px 30px',
              background: 'linear-gradient(45deg, #28a745, #20c997)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
            }}
          >
            📋 Abrir Relatório do PDF (D00001F.pdf)
          </button>

          <button
            className="btn btn-secondary"
            onClick={onNewSimulation}
            style={{
              fontSize: '1.2rem',
              padding: '15px 30px',
              background: 'rgba(108, 117, 125, 0.8)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Nova Simulação
          </button>
        </div>

        <div style={{
          marginTop: '30px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.9rem'
        }}>
          <p>🎯 Simulação baseada nos valores reais do relatório D00001F.pdf</p>
          <p>Plataforma DAIMER - Diagnose Avançada do Isolamento de Máquinas Elétricas Rotativas</p>
        </div>
      </div>
    </div>
  );
};

export default ReportScreen;