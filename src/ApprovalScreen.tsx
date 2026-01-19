import React, { useState } from 'react';
import { DataSubmission, ApprovalStatus } from './types';

interface ApprovalScreenProps {
  submission: DataSubmission;
  onApprovalComplete: (submission: DataSubmission) => void;
  onBack: () => void;
}

const ApprovalScreen: React.FC<ApprovalScreenProps> = ({ submission, onApprovalComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState<ApprovalStatus['step']>(submission.approvalStatus.step);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApproval = async (step: 'laudista' | 'aprovador', approved: boolean) => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const updatedSubmission = { ...submission };
    const reviewer = step === 'laudista' ? 'Eng. João Silva (Analista)' : 'Eng. Maria Santos (COORD)';

    if (step === 'laudista') {
      updatedSubmission.approvalStatus.laudistaApproval = {
        approved,
        timestamp: new Date(),
        reviewer,
        comments: approved ? 'Protocolo validado. Valores em conformidade.' : 'Pendência na calibração dos dados.'
      };
      updatedSubmission.approvalStatus.step = approved ? 'aprovador' : 'laudista';
    } else if (step === 'aprovador') {
      updatedSubmission.approvalStatus.aprovadorApproval = {
        approved,
        timestamp: new Date(),
        reviewer,
        comments: approved ? 'Aprovação final concedida.' : 'Retornado para reanálise.'
      };
      if (approved) {
        updatedSubmission.approvalStatus.step = 'completed';
        updatedSubmission.reportGenerated = true;
        updatedSubmission.reportUrl = '/D00001F.pdf';
      } else {
        updatedSubmission.approvalStatus.step = 'laudista';
      }
    }

    setCurrentStep(updatedSubmission.approvalStatus.step);
    setIsProcessing(false);
    onApprovalComplete(updatedSubmission);
  };

  const renderApprovalStep = (step: 'laudista' | 'aprovador', title: string, description: string) => {
    const approval = step === 'laudista' ? submission.approvalStatus.laudistaApproval : submission.approvalStatus.aprovadorApproval;

    return (
      <div className={`approval-step-card ${approval ? 'approved' : 'pending'}`}>
        <h4 className="approval-title" style={{ color: approval ? '#10b981' : '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          {approval ? '✓' : '⏳'} {title}
        </h4>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '15px' }}>{description}</p>

        {approval ? (
          <div className="approval-info" style={{ fontSize: '0.85rem' }}>
            <div style={{ marginBottom: '4px' }}><span style={{ color: '#64748b' }}>Responsável:</span> {approval.reviewer}</div>
            <div style={{ marginBottom: '4px' }}><span style={{ color: '#64748b' }}>Data:</span> {approval.timestamp?.toLocaleString()}</div>
            <div style={{ color: approval.approved ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
              STATUS: {approval.approved ? 'APROVADO' : 'REPROVADO'}
            </div>
          </div>
        ) : (
          <div className="approval-controls">
            {isProcessing ? (
              <div style={{ textAlign: 'center', padding: '10px', color: '#38bdf8' }}>🔄 Sincronizando...</div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleApproval(step, true)} className="btn btn-success" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>APROVAR</button>
                <button onClick={() => handleApproval(step, false)} className="btn btn-danger" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>REPROVAR</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="screen">
      <div className="report-panel" style={{ maxWidth: '800px' }}>
        <header className="report-header">
          <img src="/daimer_logo.png" alt="DAIMER" className="logo" style={{ maxWidth: '150px' }} />
          <h1>Fluxo de Aprovação Digital</h1>
          <h2>Submissão Técnica #{submission.id}</h2>
        </header>

        {/* Timeline Visual */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '30px 0', borderBottom: '1px solid #1e293b', paddingBottom: '30px' }}>
          {['laudista', 'aprovador', 'completed'].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', 
                background: currentStep === s ? '#38bdf8' : 
                           (i === 0 && submission.approvalStatus.laudistaApproval ? '#059669' : 
                            i === 1 && submission.approvalStatus.aprovadorApproval ? '#059669' : '#1e293b'),
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem'
              }}>{i + 1}</div>
              <span style={{ fontSize: '0.8rem', color: currentStep === s ? '#fff' : '#64748b' }}>
                {s === 'laudista' ? 'Análise' : s === 'aprovador' ? 'Revisão' : 'Concluído'}
              </span>
              {i < 2 && <div style={{ width: '40px', height: '1px', background: '#334155' }} />}
            </div>
          ))}
        </div>

        <div className="approval-content" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 250px', gap: '24px' }}>
          <div className="approval-steps">
            {renderApprovalStep('laudista', 'Verificação Técnica', 'Análise detalhada das resistências e curvas de ensaio.')}
            
            {(submission.approvalStatus.laudistaApproval?.approved || currentStep === 'aprovador') && 
              renderApprovalStep('aprovador', 'Certificação Final', 'Homologação e emissão do certificado de ensaio.')}
            
            {currentStep === 'completed' && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #059669', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
                <h4 style={{ color: '#10b981', marginBottom: '8px' }}>✓ Processo Finalizado</h4>
                <button onClick={() => window.open(submission.reportUrl, '_blank')} className="btn btn-primary" style={{ width: '100%' }}>BAIXAR RELATÓRIO PDF</button>
              </div>
            )}
          </div>

          <div className="submission-data" style={{ background: '#020617', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <h4 style={{ color: '#38bdf8', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '16px' }}>Ensaios Coletados</h4>
            {submission.testResults.map((test, idx) => (
              <div key={idx} style={{ marginBottom: '12px', fontSize: '0.8rem', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
                <div style={{ color: '#059669', fontWeight: 'bold' }}>✓ {test.name}</div>
                <div style={{ color: '#475569' }}>{test.timestamp.toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </div>

        <footer style={{ marginTop: '40px', textAlign: 'center' }}>
          <button className="btn btn-secondary" onClick={onBack}>VOLTAR AO MENU</button>
        </footer>
      </div>
    </div>
  );
};

export default ApprovalScreen;