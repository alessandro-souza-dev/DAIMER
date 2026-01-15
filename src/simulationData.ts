// Dados baseados no relatório D00001F.pdf - Valores extraídos para simulações realísticas

export const SIMULATION_DATA = {
  // Dados do equipamento
  equipment: {
    name: 'Gerador Síncrono Brushless',
    power: '1750 kW',
    voltage: '13200 V',
    manufacturer: 'WEG',
    model: 'RER',
    frequency: '60 Hz',
    insulationClass: 'B'
  },

  // Dados ambientais baseados no relatório
  environmental: {
    temperature: 25.5, // °C
    humidity: 45, // %
    atmosphericPressure: 1013.25 // hPa
  },

  // Microhmímetro - Resistência Ôhmica
  microhmeter: {
    baseResistance: 0.065164, // Ω
    resistanceVariation: 0.001, // Ω
    finalResistance: 0.065164, // Ω
    testCurrent: 10, // A
    testVoltage: 0.65164, // V (calculada como V = I × R)
    measurementTime: 30, // segundos
    resistanceUnit: 'Ω',
    currentUnit: 'A',
    voltageUnit: 'V'
  },

  // Megôhmetro - Resistência de Isolamento
  megohmmeter: {
    baseResistance: 2430, // MΩ (valor aos 30 minutos)
    resistanceVariation: 100, // MΩ
    finalResistance: 2430, // MΩ
    testVoltage: 5000, // V
    testCurrent: 0.002062, // mA (calculada como I = V/R)
    capacitanceCC: 69, // nF
    capacitanceVariation: 5, // nF
    timeConstant: 168, // segundos (calculado como R × C / 1000)
    measurementTime: 1800, // segundos (30 minutos)
    resistanceUnit: 'MΩ',
    voltageUnit: 'V',
    currentUnit: 'mA',
    capacitanceUnit: 'nF'
  },

  // Ponte de Schering - Tangente Delta
  scheringBridge: {
    baseTanDelta: 0.0045, // 0.45%
    tanDeltaVariation: 0.0002, // ±0.02%
    finalTanDelta: 0.0045, // 0.45%
    testVoltage: 10000, // V
    capacitance: 2850, // pF
    capacitanceVariation: 50, // pF
    harmonicsPercentage: 5.2, // %
    measurementTime: 120, // segundos
    tanDeltaUnit: '%',
    voltageUnit: 'V',
    capacitanceUnit: 'pF',
    harmonicsUnit: '%'
  },

  // Descarga Parcial
  partialDischarge: {
    baseDischargeLevel: 45, // pC
    dischargeLevelVariation: 10, // pC
    finalDischargeLevel: 45, // pC
    testVoltage: 10000, // V
    pulseCount: 1250, // pulsos
    pulseCountVariation: 100, // pulsos
    measurementTime: 120, // segundos
    dischargeUnit: 'pC',
    voltageUnit: 'V',
    pulseUnit: 'pulsos'
  },

  // Padrões de tensão para todos os testes
  voltageSteps: [
    500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
    5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000
  ],

  // Tempos de medição
  timing: {
    microhmeter: 30, // segundos
    megohmmeter: 1800, // segundos (30 minutos)
    schering: 120, // segundos
    partialDischarge: 120, // segundos
    updateInterval: 1000 // ms
  }
};

// Funções utilitárias para gerar variações realísticas
export const generateRealisticVariation = (baseValue: number, variation: number): number => {
  return baseValue + (Math.random() - 0.5) * 2 * variation;
};

export const generateLogarithmicGrowth = (baseValue: number, time: number, growthFactor: number = 200): number => {
  return baseValue + Math.log(time + 1) * growthFactor;
};

export const calculateTimeConstant = (resistance: number, capacitance: number): number => {
  return (resistance * capacitance) / 1000; // segundos
};

export const calculateVoltage = (current: number, resistance: number): number => {
  return current * resistance;
};

export const calculateCurrent = (voltage: number, resistance: number): number => {
  return voltage / resistance;
};