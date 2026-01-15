export interface TestResult {
  id: string;
  name: string;
  completed: boolean;
  data: any;
  timestamp: Date;
}

export interface EquipmentState {
  isRunning: boolean;
  time: number;
}

export interface MicrohmeterState extends EquipmentState {
  currentScale: string;
  injectedCurrent: number;
  resistance: number;
  voltage: number;
  measurements: Array<{
    resistance: number;
    current: number;
    voltage: number;
    time: number;
  }>;
}

export interface MegohmmeterState extends EquipmentState {
  testMode: string;
  testVoltage: number;
  appliedVoltage: number;
  resistance: number;
  current: number;
  timeConstant: number;
  capacitanceCC: number;
  measurements: Array<{
    mode: string;
    voltage: number;
    resistance: number;
    current: number;
    timeConstant: number;
    capacitanceCC: number;
    time: number;
  }>;
}

export interface ScheringBridgeState extends EquipmentState {
  appliedVoltage: number;
  tanDelta: number;
  currentAC: number;
  capacitance: number;
  harmonics: number[];
  measurements: Array<{
    voltage: number;
    tanDelta: number;
    currentAC: number;
    capacitance: number;
    harmonics: number[];
    time: number;
  }>;
}

export interface PartialDischargeState extends EquipmentState {
  appliedVoltage: number;
  dischargeLevel: number;
  pulseCount: number;
  measurements: Array<{
    voltage: number;
    dischargeLevel: number;
    pulseCount: number;
    time: number;
    dischargePattern: Array<{ phase: number; magnitude: number; count: number }>;
  }>;
}

export interface SimulatorState {
  currentScreen: 'home' | 'menu' | 'microhmeter' | 'megohmmeter' | 'schering' | 'partial-discharge' | 'report';
  completedTests: string[];
  testResults: TestResult[];
}

