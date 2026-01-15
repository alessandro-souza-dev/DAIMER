// Valores extraídos do PDF D00001F.pdf para simulações realísticas

export const PDF_SIMULATION_VALUES = {
  // Microhmímetro - Resistência Ôhmica
  microhmeter: {
    resistance: 0.065164, // Ω - valor final do relatório
    current: 10, // A - escala usada
    voltage: 0.65164 // V - calculada como V = I × R
  },

  // Megôhmetro - Resistência de Isolamento
  megohmmeter: {
    resistance30min: 2430, // MΩ - resistência aos 30 minutos
    testVoltage: 5000, // V - tensão de teste
    capacitance: 69, // nF - capacitância CC
    timeConstant: 168 // segundos - constante de tempo
  },

  // Ponte de Schering - Tangente Delta
  scheringBridge: {
    tanDelta: 0.0045, // 0.45% - tangente delta
    testVoltage: 10000, // V - tensão de teste máxima
    capacitance: 2850, // pF - capacitância medida
    harmonics: 5.2 // % - percentual de harmônicos
  },

  // Descarga Parcial
  partialDischarge: {
    dischargeLevel: 45, // pC - nível de descarga
    testVoltage: 10000, // V - tensão de teste
    pulseCount: 1250 // pulsos - contagem de pulsos
  },

  // Equipamento
  equipment: {
    name: 'Gerador Síncrono Brushless',
    power: '1750 kW',
    voltage: '13200 V',
    manufacturer: 'WEG',
    frequency: '60 Hz'
  }
};