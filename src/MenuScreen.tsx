import React, { useState } from 'react';

interface MenuScreenProps {
  completedTests: string[];
  onSelectTest: (testId: string) => void;
  onGenerateReport: () => void;
  onSubmitData: () => void;
}

const MenuScreen: React.FC<MenuScreenProps> = ({ 
  onSubmitData,
  completedTests, 
  onSelectTest, 
  onGenerateReport 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerateReportClick = async () => {
    setIsProcessing(true);
    // Simula o processamento
    await new Promise(resolve => setTimeout(resolve, 2500));
    setIsProcessing(false);
    onGenerateReport();
  };

  const tests = [
    {
      id: 'microhmeter',
      name: 'Resistência Ôhmica',
      description: 'Medição da resistência ôhmica dos enrolamentos usando microhmímetro',
      equipment: 'Microhmímetro'
    },
    {
      id: 'megohmmeter',
      name: 'Resistência de Isolamento',
      description: 'Medição da resistência de isolamento com diferentes modos de teste',
      equipment: 'Megôhmetro'
    },
    {
      id: 'schering',
      name: 'Tangente Delta',
      description: 'Medição do fator de dissipação e análise de harmônicos',
      equipment: 'Ponte de Schering'
    },
    {
      id: 'partial-discharge',
      name: 'Descarga Parcial',
      description: 'Detecção e análise de descargas parciais no isolamento',
      equipment: 'Ponte de Schering'
    }
  ];

  const allTestsCompleted = tests.every(test => completedTests.includes(test.id));

  return (
    <div className="screen menu-screen">
      <header className="menu-header">
        <img src="/daimer_logo.png" alt="DAIMER Logo" className="logo" />
      </header>
      
      <h1 className="title">Menu de Ensaios</h1>
      <p className="subtitle">Selecione o ensaio técnico para iniciar a medição</p>
      
      <div className="test-grid">
        {tests.map(test => {
          const isCompleted = completedTests.includes(test.id);
          
          return (
            <div
              key={test.id}
              className={`test-card ${isCompleted ? 'completed' : ''}`}
              onClick={() => onSelectTest(test.id)}
            >
              <div className="test-card-content">
                <h3>{test.name}</h3>
                <p><strong>Equipamento:</strong> {test.equipment}</p>
                <p>{test.description}</p>
              </div>
              
              <div className={`status-badge ${isCompleted ? 'status-completed' : 'status-pending'}`}>
                {isCompleted ? '✓ Concluído' : '○ Pendente'}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="action-buttons-panel">
        {allTestsCompleted && (
          <button
            className="btn btn-primary pulse-animation"
            onClick={onSubmitData}
            disabled={isProcessing}
          >
            {isProcessing ? 'Sincronizando...' : 'Enviar Dados para DAIMER'}
          </button>
        )}
        <button
          className={`btn ${allTestsCompleted ? 'btn-success' : 'btn-secondary'}`}
          onClick={handleGenerateReportClick}
          disabled={!allTestsCompleted || isProcessing}
        >
          {isProcessing ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="spinner"></span> Processando Relatório...
            </span>
          ) : (
            allTestsCompleted ? 'Processar e Gerar Relatório' : `Ensaios: ${completedTests.length} de ${tests.length}`
          )}
        </button>
      </div>

      <div className="status-footer">
        {allTestsCompleted ? (
          <div className="status-message success">
            <p><strong>Protocolo Completo:</strong> Todos os ensaios foram realizados com sucesso.</p>
            <p>Prossiga com o envio dos dados para validação técnica.</p>
          </div>
        ) : (
          <div className="status-message info">
            <p>Aguardando conclusão de todos os ensaios para liberação do relatório.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuScreen;
