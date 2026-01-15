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
  absorptionIndex?: number;
  polarizationIndex?: number;
  r30s?: number;
  r60s?: number;
  r600s?: number;
  measurements: Array<{
    mode: string;
    voltage: number;
    resistance: number;
    current: number;
    timeConstant: number;
    capacitanceCC: number;
    absorptionIndex?: number;
    polarizationIndex?: number;
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

export interface ApprovalStatus {
  step: 'laudista' | 'aprovador' | 'completed';
  laudistaApproval?: {
    approved: boolean;
    timestamp?: Date;
    reviewer?: string;
    comments?: string;
  };
  aprovadorApproval?: {
    approved: boolean;
    timestamp?: Date;
    reviewer?: string;
    comments?: string;
  };
}

export interface DataSubmission {
  id: string;
  testResults: TestResult[];
  submittedAt: Date;
  approvalStatus: ApprovalStatus;
  reportGenerated?: boolean;
  reportUrl?: string;
}

export interface SimulatorState {
  currentScreen: 'home' | 'menu' | 'microhmeter' | 'megohmmeter' | 'schering' | 'partial-discharge' | 'report' | 'approval';
  completedTests: string[];
  testResults: TestResult[];
  dataSubmission?: DataSubmission;
  demoMode?: boolean;
}

