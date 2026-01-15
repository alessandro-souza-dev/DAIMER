import { useState } from 'react';
import './App.css';
import { SimulatorState, DataSubmission } from './src/types';
import HomeScreen from './src/HomeScreen';
import MenuScreen from './src/MenuScreen';
import MicrohmeterScreen from './src/MicrohmeterScreen';
import MegohmmeterScreen from './src/MegohmmeterScreen';
import ScheringBridgeScreen from './src/ScheringBridgeScreen';
import PartialDischargeScreen from './src/PartialDischargeScreen';
import ReportScreen from './src/ReportScreen';
import ApprovalScreen from './src/ApprovalScreen';

function App() {
  const [simulatorState, setSimulatorState] = useState<SimulatorState>({
    currentScreen: 'home',
    completedTests: [],
    testResults: []
  });

  const navigateToScreen = (screen: SimulatorState['currentScreen']) => {
    setSimulatorState((prev: SimulatorState) => ({ ...prev, currentScreen: screen }));
  };

  const completeTest = (testId: string, data: any) => {
    setSimulatorState((prev: SimulatorState) => ({
      ...prev,
      completedTests: [...prev.completedTests, testId],
      testResults: [...prev.testResults, {
        id: testId,
        name: getTestName(testId),
        completed: true,
        data,
        timestamp: new Date()
      }]
    }));
    navigateToScreen('menu');
  };

  const getTestName = (testId: string): string => {
    const names: { [key: string]: string } = {
      'microhmeter': 'Resistência Ôhmica',
      'megohmmeter': 'Resistência de Isolamento',
      'schering': 'Tangente Delta',
      'partial-discharge': 'Descarga Parcial'
    };
    return names[testId] || testId;
  };

  const submitDataToPlatform = () => {
    const submissionId = 'SUB-' + Date.now();
    const newSubmission: DataSubmission = {
      id: submissionId,
      testResults: [...simulatorState.testResults],
      submittedAt: new Date(),
      approvalStatus: {
        step: 'laudista'
      }
    };

    setSimulatorState((prev: SimulatorState) => ({
      ...prev,
      dataSubmission: newSubmission,
      currentScreen: 'approval'
    }));
  };

  const handleApprovalComplete = (updatedSubmission: DataSubmission) => {
    setSimulatorState((prev: SimulatorState) => ({
      ...prev,
      dataSubmission: updatedSubmission,
      currentScreen: updatedSubmission.approvalStatus.step === 'completed' ? 'report' : 'approval'
    }));
  };

  const renderCurrentScreen = () => {
    switch (simulatorState.currentScreen) {
      case 'home':
        return <HomeScreen onStart={() => navigateToScreen('menu')} />;
      case 'menu':
        return (
          <MenuScreen
            completedTests={simulatorState.completedTests}
            onSelectTest={(testId) => navigateToScreen(testId as any)}
            onGenerateReport={() => navigateToScreen('report')}
            onSubmitData={submitDataToPlatform}
          />
        );
      case 'microhmeter':
        return (
          <MicrohmeterScreen
            onComplete={(data) => completeTest('microhmeter', data)}
            onBack={() => navigateToScreen('menu')}
          />
        );
      case 'megohmmeter':
        return (
          <MegohmmeterScreen
            onComplete={(data) => completeTest('megohmmeter', data)}
            onBack={() => navigateToScreen('menu')}
          />
        );
      case 'schering':
        return (
          <ScheringBridgeScreen
            onComplete={(data) => completeTest('schering', data)}
            onBack={() => navigateToScreen('menu')}
          />
        );
      case 'partial-discharge':
        return (
          <PartialDischargeScreen
            onComplete={(data) => completeTest('partial-discharge', data)}
            onBack={() => navigateToScreen('menu')}
          />
        );
      case 'approval':
        return simulatorState.dataSubmission ? (
          <ApprovalScreen
            submission={simulatorState.dataSubmission}
            onApprovalComplete={handleApprovalComplete}
            onBack={() => navigateToScreen('menu')}
          />
        ) : (
          <HomeScreen onStart={() => navigateToScreen('menu')} />
        );
      case 'report':
        return (
          <ReportScreen
            testResults={simulatorState.testResults}
            onNewSimulation={() => setSimulatorState({
              currentScreen: 'home',
              completedTests: [],
              testResults: []
            })}
          />
        );
      default:
        return <HomeScreen onStart={() => navigateToScreen('menu')} />;
    }
  };

  return (
    <div className="App">
      {renderCurrentScreen()}
    </div>
  );
}

export default App;