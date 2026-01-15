import React from 'react';

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
    <div className="screen">
      <img src="/daimer_logo.png" alt="DAIMER Logo" className="logo" />
      
      <h1 className="title">Menu de Ensaios</h1>
      <p className="subtitle">Selecione o ensaio que deseja simular</p>
      
      <div className="test-grid">
        {tests.map(test => {
          const isCompleted = completedTests.includes(test.id);
          
          return (
            <div
              key={test.id}
              className={`test-card ${isCompleted ? 'completed' : ''}`}
              onClick={() => onSelectTest(test.id)}
            >
              <h3>{test.name}</h3>
              <p><strong>Equipamento:</strong> {test.equipment}</p>
              <p>{test.description}</p>
              
              <div className={`status-badge ${isCompleted ? 'status-completed' : 'status-pending'}`}>
                {isCompleted ? 'Concluído' : 'Pendente'}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="action-buttons">
        {allTestsCompleted && (
          <button
            className="btn btn-primary"
            onClick={onSubmitData}
            style={{ marginBottom: '10px' }}
          >
            Enviar Dados para DAIMER
          </button>
        )}
        <button
          className="btn btn-success"
          onClick={onGenerateReport}
          disabled={!allTestsCompleted}
        >
          {allTestsCompleted ? 'Gerar Relatório Final' : `Ensaios Concluídos: ${completedTests.length}/${tests.length}`}
        </button>
      </div>

      <div style={{ marginTop: '20px', color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
        {allTestsCompleted ? (
          <>
            <p>✅ Todos os ensaios concluídos!</p>
            <p>1. Clique em "Enviar Dados para DAIMER" para iniciar aprovação</p>
            <p>2. Após aprovação, clique em "Gerar Relatório Final"</p>
          </>
        ) : (
          <p>Complete todos os ensaios para gerar o relatório final</p>
        )}
      </div>
    </div>
  );
};

export default MenuScreen;

