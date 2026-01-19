import React from 'react';
import { TestResult } from './types';

interface ReportScreenProps {
  testResults: TestResult[];
  onNewSimulation: () => void;
}

const ReportScreen: React.FC<ReportScreenProps> = ({ testResults, onNewSimulation }) => {
  const downloadReport = () => {
    const link = document.createElement('a');
    link.href = '/D00001F.pdf';
    link.download = 'Relatorio_Ensaios_DAIMER.pdf';
    link.click();
  };

  return (
    <div className="screen">
      <div className="report-panel" style={{ maxWidth: '900px' }}>
        <header className="report-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', marginBottom: '30px' }}>
            <img src="/daimer_logo.png" alt="DAIMER" style={{ maxWidth: '180px' }} />
            <div style={{ width: '2px', height: '40px', background: '#334155' }} />
            <img src="/data_logo.png" alt="DATA" style={{ maxWidth: '120px' }} />
          </div>

          <h1>Certificado de Ensaios Elétricos</h1>
          <h2>Documentação Técnica de Conformidade - Plataforma DAIMER</h2>
        </header>

        <div className="report-summary-card">
          <h3 style={{ color: '#f8fafc', marginBottom: '25px', textAlign: 'center', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Resultados Homologados
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {testResults.map((test, index) => (
              <div key={index} className="result-badge">
                <div className="result-badge-title">✓ {test.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '10px' }}>
                  FINALIZADO EM: {test.timestamp.toLocaleString()}
                </div>
                
                <div className="result-badge-data">
                  {test.id === 'microhmeter' && (
                    <>
                      <div style={{ color: '#38bdf8' }}>MEDIDO: {(test.data.finalResistance || 0).toFixed(6)} Ω</div>
                      <div style={{ color: '#475569', fontSize: '0.7rem' }}>NOMINAL: 0.065164 Ω</div>
                    </>
                  )}
                  {test.id === 'megohmmeter' && (
                    <>
                      <div style={{ color: '#38bdf8' }}>MEDIDO: {(test.data.finalResistance || 0).toFixed(0)} MΩ</div>
                      <div style={{ color: '#475569', fontSize: '0.7rem' }}>NOMINAL: 2430 MΩ</div>
                    </>
                  )}
                  {test.id === 'schering' && (
                    <>
                      <div style={{ color: '#38bdf8' }}>MEDIDO: {((test.data.finalTanDelta || 0) * 100).toFixed(3)}%</div>
                      <div style={{ color: '#475569', fontSize: '0.7rem' }}>NOMINAL: 0.45%</div>
                    </>
                  )}
                  {test.id === 'partial-discharge' && (
                    <>
                      <div style={{ color: '#38bdf8' }}>MEDIDO: {(test.data.finalDischargeLevel || 0).toFixed(0)} pC</div>
                      <div style={{ color: '#475569', fontSize: '0.7rem' }}>NOMINAL: 45 pC</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="reference-section">
            <h4 style={{ color: '#38bdf8', marginBottom: '20px', fontSize: '0.85rem', textTransform: 'uppercase' }}>
              Parâmetros de Referência (ID: D00001F)
            </h4>
            <div className="reference-grid">
              <div className="reference-item">
                <div className="reference-label">Resistência</div>
                <div className="reference-value">0.065164 Ω</div>
                <div style={{ fontSize: '0.65rem', color: '#475569' }}>10A CONT.</div>
              </div>
              <div className="reference-item">
                <div className="reference-label">Isolação</div>
                <div className="reference-value">2430 MΩ</div>
                <div style={{ fontSize: '0.65rem', color: '#475569' }}>5.0 kV DC</div>
              </div>
              <div className="reference-item">
                <div className="reference-label">Tan Delta</div>
                <div className="reference-value">0.45 %</div>
                <div style={{ fontSize: '0.65rem', color: '#475569' }}>60 Hz Un</div>
              </div>
              <div className="reference-item">
                <div className="reference-label">D. Parcial</div>
                <div className="reference-value">45 pC</div>
                <div style={{ fontSize: '0.65rem', color: '#475569' }}>IEC 60270</div>
              </div>
            </div>
          </div>
        </div>

        <div className="equipment-info-panel" style={{ background: '#020617', padding: '24px', borderRadius: '8px', border: '1px solid #1e293b', margin: '20px 0' }}>
            <h4 style={{ color: '#38bdf8', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '16px' }}>Especificações do Ativo</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', color: '#94a3b8', fontSize: '0.9rem' }}>
              <div><strong>Ativo:</strong> Gerador Síncrono</div>
              <div><strong>Potência:</strong> 1750 kW</div>
              <div><strong>Tensão:</strong> 13.2 kV</div>
              <div><strong>Fabricante:</strong> WEG</div>
            </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
          <button className="btn btn-primary" onClick={downloadReport} style={{ flex: 1, padding: '15px' }}>
             GERAR RELATÓRIO PDF
          </button>
          <button className="btn btn-secondary" onClick={onNewSimulation} style={{ flex: 1, padding: '15px' }}>
            NOVA SIMULAÇÃO
          </button>
        </div>

        <footer style={{ marginTop: '40px', textAlign: 'center', color: '#475569', fontSize: '0.8rem' }}>
          <p>Diagnose Avançada do Isolamento de Máquinas Elétricas Rotativas</p>
          <p>© 2026 DAIMER - Automação de Ensaios Elétricos</p>
        </footer>
      </div>
    </div>
  );
};

export default ReportScreen;