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

    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    const updatedSubmission = { ...submission };
    const reviewer = step === 'laudista' ? 'João Silva - Eng. Elétrico' : 'Maria Santos - Coordenadora Técnica';

    if (step === 'laudista') {
      updatedSubmission.approvalStatus.laudistaApproval = {
        approved,
        timestamp: new Date(),
        reviewer,
        comments: approved ? 'Análise técnica aprovada. Valores dentro dos padrões.' : 'Pendências identificadas na análise.'
      };
      updatedSubmission.approvalStatus.step = approved ? 'aprovador' : 'laudista';
    } else if (step === 'aprovador') {
      updatedSubmission.approvalStatus.aprovadorApproval = {
        approved,
        timestamp: new Date(),
        reviewer,
        comments: approved ? 'Aprovação final concedida. Proceder com geração do relatório.' : 'Retornado para revisão técnica.'
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
      <div style={{
        background: approval ? 'rgba(0, 255, 0, 0.1)' : 'rgba(0, 0, 0, 0.5)',
        border: approval ? '2px solid #00ff00' : '2px solid #ffa500',
        borderRadius: '15px',
        padding: '20px',
        margin: '15px 0',
        color: 'white'
      }}>
        <h4 style={{ color: '#ffd700', marginBottom: '10px' }}>
          {approval ? '✓' : '⏳'} {title}
        </h4>
        <p style={{ marginBottom: '15px', opacity: 0.9 }}>{description}</p>

        {approval ? (
          <div style={{ fontSize: '0.9rem' }}>
            <div style={{ marginBottom: '5px' }}>
              <strong>Revisor:</strong> {approval.reviewer}
            </div>
            <div style={{ marginBottom: '5px' }}>
              <strong>Data:</strong> {approval.timestamp?.toLocaleString()}
            </div>
            <div>
              <strong>Status:</strong> {approval.approved ? 'APROVADO' : 'REPROVADO'}
            </div>
            {approval.comments && (
              <div style={{ marginTop: '10px', fontStyle: 'italic' }}>
                <strong>Comentários:</strong> {approval.comments}
              </div>
            )}
          </div>
        ) : (
          <div>
            {isProcessing ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>🔄 Processando...</div>
                <div style={{ color: '#00ff00' }}>Aguarde a análise {step === 'laudista' ? 'técnica' : 'final'}...</div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <button
                  onClick={() => handleApproval(step, true)}
                  style={{
                    padding: '10px 20px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  ✅ APROVAR
                </button>
                <button
                  onClick={() => handleApproval(step, false)}
                  style={{
                    padding: '10px 20px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  ❌ REPROVAR
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="screen">
      <div className="report-panel" style={{ maxWidth: '1000px' }}>
        <div className="report-header">
          <img src="/daimer_logo.png" alt="DAIMER Logo" style={{ maxWidth: '200px', height: 'auto', marginBottom: '20px' }} />

          <h1 style={{
            color: 'white',
            textAlign: 'center',
            fontSize: '2.2rem',
            marginBottom: '10px'
          }}>
            Fluxo de Aprovação - DAIMER
          </h1>

          <h2 style={{
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            fontSize: '1.3rem',
            marginBottom: '30px'
          }}>
            Submissão #{submission.id}
          </h2>
        </div>

        {/* Status do Processo */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          padding: '20px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#ffd700', marginBottom: '15px' }}>
            Status Atual: {currentStep === 'laudista' ? 'Análise Técnica (Laudista)' :
                          currentStep === 'aprovador' ? 'Aprovação Final (Coordenador)' :
                          'Processo Concluído'}
          </h3>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '30px',
            margin: '20px 0'
          }}>
            <div style={{
              padding: '10px 15px',
              borderRadius: '20px',
              background: currentStep === 'laudista' ? '#00ff00' :
                         (submission.approvalStatus.laudistaApproval?.approved ? '#28a745' : '#6c757d'),
              color: 'white',
              fontWeight: 'bold'
            }}>
              1. Laudista
            </div>
            <div style={{ color: 'white', fontSize: '1.5rem' }}>→</div>
            <div style={{
              padding: '10px 15px',
              borderRadius: '20px',
              background: currentStep === 'aprovador' ? '#00ff00' :
                         currentStep === 'completed' ? '#28a745' : '#6c757d',
              color: 'white',
              fontWeight: 'bold'
            }}>
              2. Aprovador
            </div>
            <div style={{ color: 'white', fontSize: '1.5rem' }}>→</div>
            <div style={{
              padding: '10px 15px',
              borderRadius: '20px',
              background: currentStep === 'completed' ? '#00ff00' : '#6c757d',
              color: 'white',
              fontWeight: 'bold'
            }}>
              3. Relatório
            </div>
          </div>
        </div>

        {/* Detalhes da Submissão */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '10px',
          padding: '20px',
          margin: '20px 0'
        }}>
          <h4 style={{ color: '#ffd700', marginBottom: '15px' }}>
            📋 Dados Submetidos
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '10px'
          }}>
            {submission.testResults.map((test, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '10px',
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#00ff00' }}>✓</div>
                <div style={{ fontSize: '0.8rem' }}>{test.name}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                  {test.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '15px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
            <strong>Data de Submissão:</strong> {submission.submittedAt.toLocaleString()}
          </div>
        </div>

        {/* Etapas de Aprovação */}
        {renderApprovalStep(
          'laudista',
          'Análise Técnica - Laudista',
          'O especialista técnico analisa os dados coletados e valida os resultados dos ensaios elétricos.'
        )}

        {submission.approvalStatus.laudistaApproval?.approved && renderApprovalStep(
          'aprovador',
          'Aprovação Final - Coordenador',
          'O coordenador técnico realiza a aprovação final e autoriza a geração do relatório.'
        )}

        {/* Resultado Final */}
        {currentStep === 'completed' && (
          <div style={{
            background: 'rgba(0, 255, 0, 0.2)',
            border: '2px solid #00ff00',
            borderRadius: '15px',
            padding: '30px',
            textAlign: 'center',
            margin: '30px 0'
          }}>
            <h3 style={{ color: '#00ff00', marginBottom: '15px', fontSize: '1.5rem' }}>
              🎉 Processo de Aprovação Concluído
            </h3>
            <p style={{ color: 'white', marginBottom: '20px' }}>
              Todos os dados foram aprovados e o relatório foi gerado com sucesso!
            </p>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
              O relatório técnico está disponível para download.
            </div>
          </div>
        )}

        {/* Ações */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          marginTop: '30px'
        }}>
          {currentStep === 'completed' ? (
            <button
              onClick={() => window.open(submission.reportUrl, '_blank')}
              className="btn btn-success"
              style={{
                fontSize: '1.2rem',
                padding: '15px 30px'
              }}
            >
              📄 Abrir Relatório
            </button>
          ) : (
            <button
              onClick={onBack}
              className="btn btn-secondary"
              style={{
                fontSize: '1.2rem',
                padding: '15px 30px'
              }}
            >
              ← Voltar ao Menu
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalScreen;