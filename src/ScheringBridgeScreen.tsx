import React, { useState, useEffect } from 'react';
import './MidasMeterDisplay.css';
import { SignalAnalysis } from './SignalAnalysis';

interface Measurement {
  id: string;
  startTime: string;
  description: string;
  connection: string;
  label: string;
  urms: string;
  df: string;
  cp: string;
  ixRms: string;
  frequency: string;
  note: string;
  note2: string;
}

interface CapturedData {
  voltage: number;
  df: number;
  cp: number;
  ix: number;
  ixProjected: number;
  isRampUp: boolean;
  timestamp?: string;
}

interface ScheringBridgeScreenProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

const ScheringBridgeScreen: React.FC<ScheringBridgeScreenProps> = ({ onComplete, onBack }) => {
  const [voltage, setVoltage] = useState(0);
  const [frequency, setFrequency] = useState(0);
  const [cp, setCp] = useState(0);
  const [df, setDf] = useState(0);
  const [ix, setIx] = useState(0);
  const [rp, setRp] = useState(0);
  const [pf, setPf] = useState(0);
  const [setVoltageValue, setSetVoltageValue] = useState<string>('8.0');
  const [setFrequencyValue, setSetFrequencyValue] = useState<string>('60.0');
  const [maxVoltage, setMaxVoltage] = useState<string>('8.0');
  const [riseSpeed, setRiseSpeed] = useState<string>('0.3');
  const [connection, setConnection] = useState('GST A+B');
  const [isRunning, setIsRunning] = useState(false);
  const [isStabilized, setIsStabilized] = useState(false);
  const [showSignalAnalysis, setShowSignalAnalysis] = useState(false);
  const [viewMode, setViewMode] = useState<'TABLE' | 'CHARTS'>('TABLE');
  const [testStage, setTestStage] = useState<'IDLE' | 'RAMP_UP' | 'HOLD' | 'RAMP_DOWN' | 'COMPLETED'>('IDLE');
  const [holdTimer, setHoldTimer] = useState(0);
  const [capturedDataPoints, setCapturedDataPoints] = useState<CapturedData[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([
    {
      id: '1',
      startTime: '17.01.2026 10:15:27',
      description: 'Phase R',
      connection: 'GST A+B',
      label: 'X',
      urms: '1.500 kV',
      df: '0.822',
      cp: '650.000 nF',
      ixRms: '367.6 mA',
      frequency: '60.00 Hz',
      note: '',
      note2: ''
    }
  ]);

  const [inputCapacitance, setInputCapacitance] = useState<string>('');
  
  // Base Capacitance Logic: Use input if valid, else default to 650
  const parsedInputCap = parseFloat(inputCapacitance);
  const effectiveBaseCap = (!isNaN(parsedInputCap) && parsedInputCap > 0) ? parsedInputCap : 650;

  // EFEITO PARA METER DISPLAYS (IX, DF, RP, PF) CONFORME FÓRMULAS FÍSICAS (IEEE/IEC)
  useEffect(() => {
    if (!isRunning || !isStabilized || voltage < 0.1) {
      if (!isRunning) {
        setIx(0);
        setDf(0);
        setRp(0);
        setPf(0);
      }
      return;
    }

    const fVal = parseFloat(setFrequencyValue) || 60;
    
    // (1) Ix = Utest * 2 * PI * f * Cx (Fórmula da Imagem 3)
    const omega = 2 * Math.PI * fVal;
    const vVolts = voltage * 1000;
    const cFarads = effectiveBaseCap * 1e-9;
    const measuredIx_Amps = vVolts * omega * cFarads;
    const measuredIx_mA = measuredIx_Amps * 1000;
    
    // (2) Dissipation Factor (tan delta) - Simulado com base na tensão
    const baseDF = 0.822; // % inicial (Dissipation Factor tan delta)
    const measuredDF_percent = baseDF + (voltage * 0.035) + (Math.random() * 0.005);
    const tanDelta = measuredDF_percent / 100;
    
    // (3) Power Factor (PF) = tan_delta / sqrt(1 + tan_delta^2) (Fórmula da Imagem 1 e 2)
    const pf_decimal = tanDelta / Math.sqrt(1 + Math.pow(tanDelta, 2));
    const measuredPF_percent = pf_decimal * 100;
    
    // (4) Rp = 1 / (omega * C * tan_delta) -> Ohms (Fórmula da Imagem 1)
    const rp_ohms = 1 / (omega * cFarads * tanDelta);
    const measuredRp_MOhms = rp_ohms * 1e-6;
    
    setIx(measuredIx_mA + (Math.random() * 2)); 
    setDf(measuredDF_percent);
    setPf(measuredPF_percent);
    setRp(measuredRp_MOhms);

  }, [voltage, isRunning, isStabilized, setFrequencyValue, effectiveBaseCap]);

  // EFEITO PARA COMPLETAR O TESTE AUTOMATICAMENTE
  useEffect(() => {
    if (testStage === 'COMPLETED') {
      recordAllSteps(); // Gera a tabela automaticamente ao fim dos passos
      setIsRunning(false);
      setVoltage(0);
      setIsStabilized(false);
      // Removido: handleSave() automático (usuário clica em File Manager se quiser salvar)
    }
  }, [testStage]);

  useEffect(() => {
    // Parameters
    const initialDF = 0.822; // %
    const standardCap = effectiveBaseCap;

    if (!isRunning) {
      setVoltage(0);
      setFrequency(0);
      setCp(0);
      setDf(0);
      setIx(0);
      setRp(0);
      setPf(0);
      setIsStabilized(false);
      setTestStage('IDLE');
      return;
    }

    // Stabilized logic (initial delay)
    if (!isStabilized) {
      const stabilityTimer = setTimeout(() => {
        setIsStabilized(true);
        const vVal = parseFloat(setVoltageValue);
        if (vVal === 8 || vVal === 15) {
          const startV = 1.5;
          setVoltage(startV);
          setTestStage('RAMP_UP');
          
          // CAPTURA O PRIMEIRO PONTO (1.5kV)
          const omega = 2 * Math.PI * (parseFloat(setFrequencyValue) || 60);
          const projected = (startV * 1000 * omega * standardCap * 1e-9 * 1000);
          setCapturedDataPoints([{ 
            voltage: startV, 
            df: initialDF + (Math.random() * 0.01), 
            cp: standardCap + (Math.random() - 0.5) * 0.05,
            ix: projected + 10 + (Math.random() * 5), 
            ixProjected: projected,
            isRampUp: true,
            timestamp: new Date().toLocaleTimeString('pt-BR')
          }]);
        } else {
          setVoltage(vVal);
          setTestStage('IDLE');
        }
      }, 1500);
      return () => clearTimeout(stabilityTimer);
    }

    const interval = setInterval(() => {
      const vVal = parseFloat(setVoltageValue);
      const fVal = parseFloat(setFrequencyValue);
      const currentBaseCap = standardCap;

      // SEQUENCE MACHINE
      if (vVal === 8 || vVal === 15) {
        setVoltage(prev => {
          let next = prev;
          const RAMP_STEP = 0.5; // kV per step (mais pontos para gráficos suaves)

          if (testStage === 'RAMP_UP') {
            if (prev < vVal) {
              const rawNext = prev + RAMP_STEP;
              next = Math.round(Math.min(rawNext, vVal) * 10) / 10;
              
              if (next >= 1.45) {
                const omega = 2 * Math.PI * fVal;
                const projected = next * 1000 * omega * currentBaseCap * 1e-9 * 1000;
                const measured = projected + 10 + (Math.random() * 5);
                
                setCapturedDataPoints(curr => {
                  if (curr.some(p => Math.abs(p.voltage - next) < 0.1 && p.isRampUp)) return curr;
                  return [
                    ...curr, 
                    { 
                      voltage: next, 
                      df: initialDF + (next * 0.035) + (Math.random() * 0.005), 
                      cp: currentBaseCap + (Math.random() - 0.5) * 0.05,
                      ix: measured, 
                      ixProjected: projected,
                      isRampUp: true,
                      timestamp: new Date().toLocaleTimeString('pt-BR')
                    }
                  ];
                });
              }
            } else {
              setTestStage('HOLD');
              setHoldTimer(0);
            }
          } else if (testStage === 'HOLD') {
            setHoldTimer(h => {
              if (h >= 10) {
                setTestStage('RAMP_DOWN');
                return h;
              }
              return h + 0.4;
            });
          } else if (testStage === 'RAMP_DOWN') {
            if (prev > 1.55) {
              const rawNext = prev - RAMP_STEP;
              next = Math.round(Math.max(rawNext, 1.5) * 10) / 10;
              
              const omega = 2 * Math.PI * fVal;
              const projected = next * 1000 * omega * currentBaseCap * 1e-9 * 1000;
              const measured = projected + 8 + (Math.random() * 4);

              setCapturedDataPoints(curr => {
                if (curr.some(p => Math.abs(p.voltage - next) < 0.1 && !p.isRampUp)) return curr;
                return [
                  ...curr, 
                  { 
                    voltage: next, 
                    df: initialDF + (next * 0.038) + (Math.random() * 0.008), 
                    cp: currentBaseCap + (Math.random() - 0.5) * 0.04,
                    ix: measured, 
                    ixProjected: projected,
                    isRampUp: false,
                    timestamp: new Date().toLocaleTimeString('pt-BR')
                  }
                ];
              });
            } else {
              setTestStage('COMPLETED');
            }
          }
          return next;
        });
      } else {
        setVoltage(vVal);
        setTestStage('IDLE');
      }

      // Update Meter Displays (Moved frequency/etc outside state updater for consistency)
      const currentFreq = fVal + (Math.random() - 0.5) * 0.02;
      setFrequency(currentFreq);
      
      // RUÍDO PROPORCIONAL: 0.1% de flutuação em vez de 5nF fixos
      const currentCapacitance = currentBaseCap * (1 + (Math.random() - 0.5) * 0.001);
      setCp(currentCapacitance);
      
    }, 400);

    return () => {
      clearInterval(interval);
    };
  }, [isRunning, isStabilized, testStage, setVoltageValue, setFrequencyValue, effectiveBaseCap]);

  const addMeasurement = () => {
    if (voltage < 1.45) return; // Don't record below 1.5kV (with small margin)
    
    const newMeasurement: Measurement = {
      id: Date.now().toString(),
      startTime: new Date().toLocaleString('pt-BR'),
      description: 'Phase R',
      connection: connection,
      label: 'X',
      urms: `${voltage.toFixed(3)} kV`,
      df: df.toFixed(3),
      cp: `${cp.toFixed(3)} nF`,
      ixRms: `${ix.toFixed(1)} mA`,
      frequency: `${frequency.toFixed(2)} Hz`,
      note: 'Manual',
      note2: ''
    };
    setMeasurements(prev => [...prev, newMeasurement]);

    // Adiciona o ponto capturado para que apareça nos gráficos também
    setCapturedDataPoints(curr => [
      ...curr, 
      { 
        voltage: voltage, 
        df: df, 
        cp: cp, 
        ix: ix, 
        ixProjected: ix, // Valor manual
        isRampUp: true,
        timestamp: new Date().toLocaleTimeString('pt-BR')
      }
    ]);
  };

  const recordAllSteps = () => {
    const dateStr = new Date().toLocaleDateString('pt-BR');
    
    // FILTRAGEM: Remove duplicatas e garante apenas os passos limpos (ex: 1.5, 2.5, 3.5...)
    const seen = new Set();
    const uniquePoints = capturedDataPoints
      .filter(p => p.voltage > 1.45) // Garante nada abaixo de 1.5kV
      .filter(p => {
        // Usa arredondamento para evitar duplicatas por centésimos na chave
        const vKey = Math.round(p.voltage * 10) / 10;
        const key = `${vKey}-${p.isRampUp}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    const newBatch = uniquePoints.map((p, idx) => ({
      id: `${Date.now()}-${idx}`,
      startTime: `${dateStr} ${p.timestamp || '00:00:00'}`,
      description: 'Phase R',
      connection: connection,
      label: 'X',
      urms: `${p.voltage.toFixed(3)} kV`,
      df: p.df.toFixed(3),
      cp: `${p.cp.toFixed(3)} nF`,
      ixRms: `${p.ix.toFixed(1)} mA`,
      frequency: `${setFrequencyValue} Hz`,
      note: p.isRampUp ? 'Up' : 'Down',
      note2: ''
    }));
    setMeasurements(prev => [...newBatch, ...prev]);
    setTestStage('IDLE');
    setViewMode('TABLE');
  };

  const deleteMeasurement = (id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
  };

  const handleSave = () => {
    const confirmSave = window.confirm("Do you want to save the measurement report to C:\\Users\\alessandro.souza\\Documents\\DAIMER\\public\\docs\\TD6.xlsx?");
    if (confirmSave) {
      alert("Simulating export to XLSX...");
      setTimeout(() => {
        alert("Report successfully 'saved' to TD6.xlsx!");
      }, 800);
    }
  };

  const sendToPlatform = () => {
    onComplete({
      type: 'schering',
      measurements: measurements,
      finalTanDelta: df / 100,
      finalCapacitance: cp,
      voltage: voltage,
      frequency: frequency,
      connection: connection
    });
  };

  const handleStart = () => {
    setCapturedDataPoints([]);
    setIsRunning(true);
    setIsStabilized(false);
    setViewMode('CHARTS');
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsStabilized(false);
    setVoltage(0);
    setTestStage('IDLE');
  };

  return (
    <div className="midas-container">
      {/* WINDOW HEADER */}
      <div className="midas-window-header">
        <div className="midas-window-title">
          <span>MIDAS 2881 - C:\Program Files (x86)\Tettex\Midas 2881\Data\Default.m28</span>
        </div>
        <div className="midas-window-controls">
          <button className="win-btn">📷</button>
          <button className="win-btn">?</button>
          <button className="win-btn">_</button>
          <button className="win-btn">☐</button>
          <button className="win-btn close" onClick={onBack}>✕</button>
        </div>
      </div>

      <div className="midas-main-body">
        <div className="midas-left-content">
          {/* LCD DASHBOARD area */}
          <div className="display-header">
            <div className="lcd-display">
              <div className={`lcd-cell ${(!isRunning || !isStabilized) ? 'off' : ''}`}>
                <span className="label">U rms</span>
                <span className="value">{voltage.toFixed(isRunning ? 3 : 0)} kV</span>
              </div>
              <div className={`lcd-cell ${(!isRunning || !isStabilized) ? 'off' : ''}`}>
                <span className="label">Cp (Zx=Cp||Rp) <span className="arrow-down">▼</span></span>
                <span className="value">{isRunning && isStabilized ? cp.toFixed(3) : '0'} nF</span>
              </div>
              <div className={`lcd-cell ${(!isRunning || !isStabilized) ? 'off' : ''}`}>
                <span className="label">DF % (tan δ) <span className="arrow-down">▼</span></span>
                <span className="value">{isRunning && isStabilized ? df.toFixed(3) : '0'} %</span>
              </div>
              <div className={`lcd-cell ${(!isRunning || !isStabilized) ? 'off' : ''}`}>
                <span className="label">Frequency <span className="arrow-down">▼</span></span>
                <span className="value">{isRunning && isStabilized ? frequency.toFixed(2) : '0'} Hz</span>
              </div>
              
              <div className={`lcd-cell ${(!isRunning || !isStabilized) ? 'off' : ''}`}>
                <span className="label">Ix rms <span className="arrow-down">▼</span></span>
                <span className="value">{isRunning && isStabilized ? ix.toFixed(2) : '0'} mA</span>
              </div>
              <div className={`lcd-cell ${(!isRunning || !isStabilized) ? 'off' : ''}`}>
                <span className="label">Rp (Zx=Cp||Rp) <span className="arrow-down">▼</span></span>
                <span className="value">{isRunning && isStabilized ? rp.toFixed(3) : '0'} MΩ</span>
              </div>
              <div className={`lcd-cell ${(!isRunning || !isStabilized) ? 'off' : ''}`}>
                <span className="label">PF % (cos φ) <span className="arrow-down">▼</span></span>
                <span className="value">{isRunning && isStabilized ? pf.toFixed(3) : '0'} %</span>
              </div>
              <div className={`lcd-wave ${(!isRunning || !isStabilized) ? 'off' : ''}`}>
                <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                  <line x1="0" y1="20" x2="100" y2="20" stroke="#fdd835" strokeWidth="0.5" />
                  <path d="M0,20 C10,2 40,2 50,20 C60,38 90,38 100,20" stroke={isRunning && isStabilized ? "#00ff00" : "#004400"} strokeWidth="2" fill="none" />
                </svg>
              </div>
              
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', alignItems: 'center', borderTop: '1.5px solid #666', background: '#333', padding: '5px' }}>
                <span style={{ color: '#00ff00', fontSize: '13px', fontWeight: 'bold' }}>
                  {testStage === 'IDLE' ? (isRunning ? 'MANUAL ON' : 'READY') : `AUTO: ${testStage}`}
                  {testStage === 'HOLD' ? ` (${holdTimer}s remaining)` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* CONTROLS AREA - EXACT IMAGE REPLICATION (V3) */}
          <div style={{ 
            padding: '12px 25px', 
            background: '#ffffff', 
            borderTop: '1px solid #7a7a7a',
            fontFamily: 'Arial, sans-serif',
            color: '#000'
          }}>
            <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
              
              {/* Column 1: Set Voltage */}
              <div style={{ display: 'flex', flexDirection: 'column', width: '230px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Set Voltage</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px' }}>Max.</span>
                    <input 
                      type="text" 
                      value={maxVoltage} 
                      onChange={(e) => setMaxVoltage(e.target.value)} 
                      style={{ width: '48px', height: '20px', border: '1px solid #999', textAlign: 'center', fontSize: '12px' }}
                    />
                    <span style={{ fontSize: '12px' }}>kV</span>
                  </div>
                </div>
                
                <div style={{ 
                  background: '#ffffff', 
                  border: '1px solid #7a7a7a', 
                  height: '46px', 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  alignItems: 'center', 
                  padding: '0 12px',
                  boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.1)'
                }}>
                  <input 
                    type="text" 
                    value={setVoltageValue} 
                    onChange={(e) => setSetVoltageValue(e.target.value)}
                    style={{ border: 'none', background: 'transparent', textAlign: 'right', fontSize: '28px', fontWeight: 'bold', width: '80%', color: '#000', outline: 'none' }}
                  />
                  <span style={{ fontSize: '18px', fontWeight: 'bold', marginLeft: '8px' }}>kV</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Rise Speed</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                    <input 
                      type="text" 
                      value={riseSpeed} 
                      onChange={(e) => setRiseSpeed(e.target.value)} 
                      style={{ width: '55px', height: '22px', border: '1px solid #999', textAlign: 'center', fontSize: '12px' }}
                    />
                    <span style={{ fontSize: '12px' }}>kV/s</span>
                  </div>
                </div>
              </div>

              {/* Column 2: Set Frequency */}
              <div style={{ display: 'flex', flexDirection: 'column', width: '210px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Set <span style={{ textDecoration: 'underline' }}>F</span>requency</span>
                <div style={{ 
                  background: '#ffffff', 
                  border: '1px solid #7a7a7a', 
                  height: '46px', 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  alignItems: 'center', 
                  padding: '0 12px',
                  marginTop: '22px',
                  boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.1)'
                }}>
                  <input 
                    type="text" 
                    value={setFrequencyValue} 
                    onChange={(e) => setSetFrequencyValue(e.target.value)}
                    style={{ border: 'none', background: 'transparent', textAlign: 'right', fontSize: '28px', fontWeight: 'bold', width: '80%', color: '#000', outline: 'none' }}
                  />
                  <span style={{ fontSize: '18px', fontWeight: 'bold', marginLeft: '8px' }}>Hz</span>
                </div>
              </div>

              {/* Column 3: Set Capacitance */}
              <div style={{ display: 'flex', flexDirection: 'column', width: '190px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Set Capacitance</span>
                <div style={{ 
                  background: '#ffffff', 
                  border: '1px solid #7a7a7a', 
                  height: '46px', 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  alignItems: 'center', 
                  padding: '0 12px',
                  marginTop: '22px',
                  boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.1)'
                }}>
                  <input 
                    type="text" 
                    placeholder="650"
                    value={inputCapacitance} 
                    onChange={(e) => setInputCapacitance(e.target.value)}
                    style={{ border: 'none', background: 'transparent', textAlign: 'right', fontSize: '28px', fontWeight: 'bold', width: '70%', color: '#000', outline: 'none' }}
                  />
                  <span style={{ fontSize: '18px', fontWeight: 'bold', marginLeft: '8px' }}>nF</span>
                </div>
              </div>

              {/* Column 4: Set Connection */}
              <div style={{ display: 'flex', flexDirection: 'column', width: '280px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Set <span style={{ textDecoration: 'underline' }}>C</span>onnection</span>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '22px' }}>
                  <select 
                    value={connection} 
                    onChange={(e) => setConnection(e.target.value)}
                    style={{ 
                      flex: 1, 
                      height: '42px', 
                      background: 'linear-gradient(to bottom, #ffffff, #e6e6e6)', 
                      border: '1px solid #7a7a7a', 
                      borderRadius: '4px',
                      fontSize: '18px', 
                      fontWeight: 'bold', 
                      padding: '0 8px',
                      color: '#000'
                    }}
                  >
                    <option>UST B</option>
                    <option>GST A+B</option>
                    <option>UST A</option>
                  </select>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '80px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 'bold' }}>INPUT A <div className="circle-v-icon">V</div></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 'bold' }}>INPUT B <div className="circle-v-icon">⤿</div></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 'bold' }}>HVGND <div className="circle-v-icon">V</div></div>
                  </div>
                </div>
              </div>

              {/* Column 5: Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto', paddingTop: '35px' }}>
                <button className="midas-btn-classic" onClick={addMeasurement}>
                  <img src="https://img.icons8.com/color/24/000000/add--v1.png" style={{ width: '16px', marginRight: '8px' }} alt="" />
                  Record
                </button>
                <button className="midas-btn-classic">
                  <img src="https://img.icons8.com/color/24/000000/speech-bubble.png" style={{ width: '16px', marginRight: '8px' }} alt="" />
                  Description
                </button>
                <button className="midas-btn-classic">
                  <img src="https://img.icons8.com/color/24/000000/wrench.png" style={{ width: '16px', marginRight: '8px' }} alt="" />
                  Tools
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '4px 25px', fontSize: '12px', color: '#000', fontWeight: 'bold', background: '#fff', borderTop: '0.5px solid #eee' }}>
            Cn(int)= 125.120 pF, Temp. Corr.= 1
          </div>

          <div className="measurements-container">
            <div className="measurements-label-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>MEASUREMENTS</span>
              <div className="view-toggle-btns">
                <button 
                  className={`toggle-view-btn ${viewMode === 'TABLE' ? 'active' : ''}`}
                  onClick={() => setViewMode('TABLE')}
                >
                  Table
                </button>
                <button 
                  className={`toggle-view-btn ${viewMode === 'CHARTS' ? 'active' : ''}`}
                  onClick={() => setViewMode('CHARTS')}
                >
                  Charts
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              {viewMode === 'TABLE' ? (
                <table className="measurements-table">
                  <thead>
                    <tr>
                      <th style={{ width: '150px' }}>Start Time</th>
                      <th style={{ width: '80px' }}>Descr.</th>
                      <th style={{ width: '80px' }}>Conn.</th>
                      <th style={{ width: '60px' }}>Label</th>
                      <th style={{ width: '100px' }}>Urms</th>
                      <th style={{ width: '100px' }}>DF(tanδ)%</th>
                      <th style={{ width: '100px' }}>Cp</th>
                      <th style={{ width: '90px' }}>Ix rms</th>
                      <th style={{ width: '80px' }}>Freq.</th>
                      <th style={{ width: 'auto' }}>Note</th>
                      <th style={{ width: 'auto' }}>Note</th>
                      <th className="delete-col" style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map((m, idx) => (
                      <tr key={m.id} className={idx === measurements.length - 1 ? "selected" : ""}>
                        <td style={{ width: '150px' }}>{m.startTime}</td>
                        <td style={{ width: '80px' }}>{m.description}</td>
                        <td style={{ width: '80px' }}>{m.connection}</td>
                        <td style={{ width: '60px' }}>{m.label}</td>
                        <td className="val-green" style={{ width: '100px' }}>{m.urms}</td>
                        <td className="val-green" style={{ width: '100px' }}>{m.df}</td>
                        <td className="val-green" style={{ width: '100px' }}>{m.cp}</td>
                        <td className="val-green" style={{ width: '90px' }}>{m.ixRms}</td>
                        <td className="val-green" style={{ width: '80px' }}>{m.frequency}</td>
                        <td style={{ width: 'auto' }}>{m.note}</td>
                        <td style={{ width: 'auto' }}>{m.note2}</td>
                        <td className="delete-cell" style={{ width: '40px' }}>
                          <button 
                            className="delete-row-btn" 
                            onClick={() => deleteMeasurement(m.id)}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="sequence-charts-view">
                  {(() => {
                    const targetV = parseFloat(setVoltageValue) || 15;
                    // EIXOS AUTOMÁTICOS: Calcula escala com base no valor de setpoint
                    const maxV_Volts = targetV * 1000;
                    const scaleX = 420 / maxV_Volts; 
                    
                    const xLabels = [];
                    for(let i=1; i<=5; i++) {
                      xLabels.push(Math.round((maxV_Volts / 5) * i));
                    }

                    // Escala automática para Corrente (Y)
                    const fVal = parseFloat(setFrequencyValue) || 60;
                    const estimatedMaxIx = (maxV_Volts * 2 * Math.PI * fVal * effectiveBaseCap * 1e-9) * 1000;
                    const maxIxLabel = Math.ceil(estimatedMaxIx * 1.2 / 100) * 100; // 20% de margem
                    const scaleY_Ix = 170 / (maxIxLabel || 1);
                    const yLabelsIx = [0, Math.round(maxIxLabel/4), Math.round(maxIxLabel/2), Math.round(maxIxLabel*3/4), maxIxLabel];

                    // Escala automática para Capacitância (Y)
                    const cpMargin = effectiveBaseCap * 0.1; // 10% de margem
                    const scaleY_Cp = 85 / (cpMargin || 1); // 170 pixels totais, centralizado
                    const yLabelsCp = [
                      effectiveBaseCap - cpMargin,
                      effectiveBaseCap - cpMargin/2,
                      effectiveBaseCap,
                      effectiveBaseCap + cpMargin/2,
                      effectiveBaseCap + cpMargin
                    ];

                    // Escala automática para Tan Delta (Y)
                    const maxDF = Math.max(...capturedDataPoints.map(p => p.df), 1.2);
                    const maxDFLabel = Math.ceil(maxDF * 1.1 * 10) / 10; // 10% margem, arredondado
                    const scaleY_DF = 170 / (maxDFLabel || 1);
                    const yLabelsDF = [0, maxDFLabel/4, maxDFLabel/2, maxDFLabel*3/4, maxDFLabel];

                    return (
                      <>
                        {testStage === 'COMPLETED' && (
                          <div className="completion-overlay">
                            <div className="completion-card">
                              <h3>Test Sequence Completed</h3>
                              <p>All data points from 1.5 kV to {targetV.toFixed(1)} kV have been captured.</p>
                              <button className="record-all-btn" onClick={recordAllSteps}>
                                RECORD ALL RESULTS
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div className="chart-row">
                          <div className="chart-item-container">
                            <div className="chart-title-header">Característica da TD - Fase R x (S + T + Massa)</div>
                            <div className="chart-legend">
                              <span className="legend-box red"></span> TD (Tensão de Subida)
                              <span className="legend-box gray"></span> TD (Tensão de Descida)
                            </div>
                            <div className="chart-svg-box">
                              <svg viewBox="0 0 500 300" width="100%" height="280">
                                {/* Grid and Axes for TD% Chart */}
                                <line x1="50" y1="200" x2="470" y2="200" stroke="#ccc" strokeWidth="1" />
                                <line x1="50" y1="30" x2="50" y2="200" stroke="#ccc" strokeWidth="1" />
                                
                                {/* Y-axis labels */}
                                {yLabelsDF.map(y => (
                                  <text key={y} x="45" y={200 - (y * scaleY_DF)} fontSize="10" textAnchor="end" fill="#000">{y.toFixed(2)}</text>
                                ))}
                                
                                {/* X-axis labels */}
                                {xLabels.map(x => (
                                  <text key={x} x={50 + (x * scaleX)} y="220" fontSize="10" textAnchor="middle" fill="#000">{x}</text>
                                ))}

                                <text x="15" y="115" transform="rotate(-90, 15, 115)" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#000">TD(%)</text>
                                <text x="260" y="260" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#000">Tensão Aplicada (V)</text>

                                {/* Data points for Ramp Up (Red line) */}
                                <polyline
                                  fill="none"
                                  stroke="red"
                                  strokeWidth="2"
                                  points={capturedDataPoints.filter(p => p.isRampUp && p.voltage > 1.45).map(p => `${50 + (p.voltage * 1000 * scaleX)},${200 - (p.df * scaleY_DF)}`).join(' ')}
                                />
                                {capturedDataPoints.filter(p => p.voltage > 1.45).map((p, i) => (
                                  <circle key={i} cx={50 + (p.voltage * 1000 * scaleX)} cy={200 - (p.df * scaleY_DF)} r="2.5" fill={p.isRampUp ? "red" : "#666"} />
                                ))}

                                {/* Data points for Ramp Down (Gray line) - includes peak point for continuity */}
                                <polyline
                                  fill="none"
                                  stroke="#666"
                                  strokeWidth="2"
                                  strokeDasharray="3,2"
                                  points={capturedDataPoints.filter(p => (!p.isRampUp || p.voltage >= (targetV - 0.1)) && p.voltage > 1.45).map(p => `${50 + (p.voltage * 1000 * scaleX)},${200 - (p.df * scaleY_DF)}`).join(' ')}
                                />
                              </svg>
                            </div>
                            <div className="chart-metrics">
                          <div className="metric-box">Tang δ = <span className="val-plate">{(df).toFixed(3)} %</span></div>
                          <div className="metric-box">Tang δ (Zero) = <span className="val-plate">0.800 %</span></div>
                          <div className="metric-box">ΔTang δ = <span className="val-plate">{(df - 0.800).toFixed(3)} %</span></div>
                          <div className="metric-box">ΔTang δ / Kv = <span className="val-plate">{((df - 0.800) / (voltage || 1)).toFixed(3)} %</span></div>
                        </div>
                          </div>

                    <div className="chart-item-container">
                      <div className="chart-title-header">Step Voltage AC - Fase R x (S + T + Massa)</div>
                      <div className="chart-legend">
                        <span className="legend-box gray" style={{ border: '1px dashed #666', background: '#ccc' }}></span> Corrente de fuga projetada (mA)
                        <span className="legend-box red"></span> Corrente de fuga medida (mA)
                      </div>
                      <div className="chart-svg-box">
                        <svg viewBox="0 0 500 300" width="100%" height="280">
                          {/* Grid and Axes for Current Chart */}
                          <line x1="50" y1="200" x2="470" y2="200" stroke="#ccc" strokeWidth="1" />
                          <line x1="50" y1="30" x2="50" y2="200" stroke="#ccc" strokeWidth="1" />

                          {yLabelsIx.map(y => (
                            <text key={y} x="45" y={200 - (y * scaleY_Ix)} fontSize="10" textAnchor="end" fill="#000">{y}</text>
                          ))}
                          {xLabels.map(x => (
                            <text key={x} x={50 + (x * scaleX)} y="220" fontSize="10" textAnchor="middle" fill="#000">{x}</text>
                          ))}

                          <text x="15" y="115" transform="rotate(-90, 15, 115)" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#000">Corrente de Fuga (mA)</text>
                          <text x="260" y="260" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#000">Tensão Aplicada (V)</text>

                          {/* Projected Current (Grey dotted line) */}
                          <polyline
                            fill="none"
                            stroke="#999"
                            strokeWidth="1.5"
                            strokeDasharray="4,2"
                            points={capturedDataPoints.filter(p => p.voltage > 1.45).map(p => `${50 + (p.voltage * 1000 * scaleX)},${200 - (p.ixProjected * scaleY_Ix)}`).join(' ')}
                          />

                          {/* Data points for Current (Measured - Red line for UP) */}
                          <polyline
                            fill="none"
                            stroke="red"
                            strokeWidth="2"
                            points={capturedDataPoints.filter(p => p.isRampUp && p.voltage > 1.45).map(p => `${50 + (p.voltage * 1000 * scaleX)},${200 - (p.ix * scaleY_Ix)}`).join(' ')}
                          />
                          
                          {/* Data points for Current (Measured - Gray dashed for DOWN) */}
                          <polyline
                            fill="none"
                            stroke="#666"
                            strokeWidth="2"
                            strokeDasharray="3,2"
                            points={capturedDataPoints.filter(p => (!p.isRampUp || p.voltage >= (targetV - 0.1)) && p.voltage > 1.45).map(p => `${50 + (p.voltage * 1000 * scaleX)},${200 - (p.ix * scaleY_Ix)}`).join(' ')}
                          />

                          {capturedDataPoints.filter(p => p.voltage > 1.45).map((p, i) => (
                            <circle key={i} cx={50 + (p.voltage * 1000 * scaleX)} cy={200 - (p.ix * scaleY_Ix)} r="2" fill={p.isRampUp ? "red" : "#666"} />
                          ))}
                        </svg>
                      </div>
                      <div className="chart-metrics">
                        <div className="metric-box">ΔI = <span className="val-plate">0,15 %</span></div>
                        <div className="metric-box">Pi1/Vn = <span className="val-plate">0,57</span></div>
                      </div>
                    </div>

                    <div className="chart-item-container">
                      <div className="chart-title-header">Capacitância (Cp) - Fase R x (S + T + Massa)</div>
                      <div className="chart-legend">
                        <span className="legend-box red"></span> Capacitância Subida
                        <span className="legend-box gray"></span> Capacitância Descida
                      </div>
                      <div className="chart-svg-box">
                        <svg viewBox="0 0 500 300" width="100%" height="280">
                          {/* Grid and Axes for Capacitance Chart */}
                          <line x1="50" y1="200" x2="470" y2="200" stroke="#ccc" strokeWidth="1" />
                          <line x1="50" y1="30" x2="50" y2="200" stroke="#ccc" strokeWidth="1" />

                          {yLabelsCp.map(y => (
                            <text key={y} x="45" y={150 - (y - effectiveBaseCap) * scaleY_Cp} fontSize="10" textAnchor="end" fill="#000">{y.toFixed(effectiveBaseCap < 10 ? 3 : 1)}</text>
                          ))}
                          {xLabels.map(x => (
                            <text key={x} x={50 + (x * scaleX)} y="220" fontSize="10" textAnchor="middle" fill="#000">{x}</text>
                          ))}

                          <text x="15" y="115" transform="rotate(-90, 15, 115)" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#000">Capacitância (nF)</text>
                          <text x="260" y="260" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#000">Tensão Aplicada (V)</text>

                          {/* Data points for Ramp Up (Red line) */}
                          <polyline
                            fill="none"
                            stroke="red"
                            strokeWidth="2"
                            points={capturedDataPoints.filter(p => p.isRampUp && p.voltage > 1.45).map(p => `${50 + (p.voltage * 1000 * scaleX)},${150 - (p.cp - effectiveBaseCap) * scaleY_Cp}`).join(' ')}
                          />
                          {capturedDataPoints.filter(p => p.voltage > 1.45).map((p, i) => (
                            <circle key={i} cx={50 + (p.voltage * 1000 * scaleX)} cy={150 - (p.cp - effectiveBaseCap) * scaleY_Cp} r="2.5" fill={p.isRampUp ? "red" : "#666"} />
                          ))}

                          {/* Data points for Ramp Down (Gray line) - includes peak point for continuity */}
                          <polyline
                            fill="none"
                            stroke="#666"
                            strokeWidth="2"
                            strokeDasharray="3,2"
                            points={capturedDataPoints.filter(p => (!p.isRampUp || p.voltage >= (targetV - 0.1)) && p.voltage > 1.45).map(p => `${50 + (p.voltage * 1000 * scaleX)},${150 - (p.cp - effectiveBaseCap) * scaleY_Cp}`).join(' ')}
                          />
                        </svg>
                      </div>
                      <div className="chart-metrics">
                        <div className="metric-box">Cp (atual) = <span className="val-plate">{cp.toFixed(3)} nF</span></div>
                        <div className="metric-box">Cp (nominal) = <span className="val-plate">{effectiveBaseCap.toFixed(3)} nF</span></div>
                        <div className="metric-box">ΔCp = <span className="val-plate">{(cp - effectiveBaseCap).toFixed(3)} nF</span></div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  </div>

  {/* RIGHT SIDEBAR */}
        <div className="midas-right-sidebar">
          <div className="sidebar-tab">
            <div className="sidebar-tab-icon">🛠</div>
            <span className="sidebar-tab-label">Setup</span>
          </div>
          <div className="sidebar-tab active">
            <div className="sidebar-tab-icon">📋</div>
            <span className="sidebar-tab-label">Manual</span>
          </div>
          <div className="sidebar-tab">
            <div className="sidebar-tab-icon">⚙</div>
            <span className="sidebar-tab-label">Sequence</span>
          </div>
          <div className="sidebar-tab" onClick={() => setShowSignalAnalysis(true)} style={{ cursor: 'pointer' }}>
            <div className="sidebar-tab-icon">📊</div>
            <span className="sidebar-tab-label">Analysis</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="midas-footer">
        <button 
          className="footer-btn" 
          onClick={handleStart}
        >
          <span className="icon" style={{color: '#0066cc'}}>▶</span> High Voltage ON
        </button>
        <button 
          className="footer-btn" 
          onClick={handleStop}
        >
          <span className="icon" style={{color: '#cc0000'}}>■</span> High Voltage OFF
        </button>
        <button className="footer-btn" onClick={() => setShowSignalAnalysis(true)}>
          <span className="icon" style={{color: '#2b5797'}}>👁️</span> Signal Analysis
        </button>
        <button className="footer-btn">
          <span className="icon">⚙</span> Analysis Options...
        </button>
        <div style={{ flex: 1 }}></div>
        <button 
          className="footer-btn success" 
          onClick={sendToPlatform}
          disabled={measurements.length === 0 && capturedDataPoints.length === 0}
        >
          <span className="icon" style={{color: 'white'}}>✓</span> CONCLUIR E ENVIAR
        </button>
        <button className="footer-btn file-mgr" onClick={handleSave}>
          <span className="icon">📁</span> File Manager
        </button>
      </div>

      <SignalAnalysis isOpen={showSignalAnalysis} onClose={() => setShowSignalAnalysis(false)} />
    </div>
  );
};

export default ScheringBridgeScreen;
