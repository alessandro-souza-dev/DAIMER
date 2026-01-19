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
  power: string;
  frequency: string;
}

export const MidasMeterDisplay: React.FC = () => {
  const [voltage, setVoltage] = useState(15.015);
  const [frequency, setFrequency] = useState(50.69);
  const [cp, setCp] = useState(13.391);
  const [df, setDf] = useState(0.649);
  const [ix, setIx] = useState(64.03);
  const [rp, setRp] = useState(36.139);
  const [pf, setPf] = useState(0.649);
  const [setVoltageValue, setSetVoltageValue] = useState(15);
  const [riseSpeed, setRiseSpeed] = useState(1);
  const [setFrequencyValue, setSetFrequencyValue] = useState(50);
  const [connection, setConnection] = useState('UST B');
  const [isRunning, setIsRunning] = useState(false);
  const [showSignalAnalysis, setShowSignalAnalysis] = useState(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([
    {
      id: '1',
      startTime: '17.12.2015 14:15:27',
      description: 'Side',
      connection: 'UST A',
      label: 'X',
      urms: '5.000 kV',
      df: '0.00648',
      cp: '13.391 nF',
      power: '691.1 mW',
      frequency: '50.68 Hz'
    },
    {
      id: '2',
      startTime: '17.12.2015 14:15:52',
      description: 'Side',
      connection: 'UST B',
      label: 'X',
      urms: '5.000 kV',
      df: '0.00648',
      cp: '13.391 nF',
      power: '686.1 mW',
      frequency: '50.31 Hz'
    },
    {
      id: '3',
      startTime: '17.12.2015 14:16:09',
      description: 'Side',
      connection: 'UST A',
      label: 'X',
      urms: '15.000 kV',
      df: '0.00648',
      cp: '13.391 nF',
      power: '6.220 W',
      frequency: '50.68 Hz'
    },
    {
      id: '4',
      startTime: '17.12.2015 14:16:21',
      description: 'Side',
      connection: 'UST B',
      label: 'X',
      urms: '15.000 kV',
      df: '0.00648',
      cp: '13.391 nF',
      power: '6.221 W',
      frequency: '50.69 Hz'
    }
  ]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setVoltage(prev => {
        const newVal = prev + (Math.random() - 0.5) * 0.1;
        return Math.max(0, Math.min(setVoltageValue, newVal));
      });

      setCp(prev => prev + (Math.random() - 0.5) * 0.01);
      setDf(prev => Math.max(0, prev + (Math.random() - 0.5) * 0.001));
      setFrequency(() => setFrequencyValue + (Math.random() - 0.5) * 0.5);
      setIx(prev => prev + (Math.random() - 0.5) * 0.5);
      setRp(prev => prev + (Math.random() - 0.5) * 0.1);
      setPf(prev => Math.max(0, prev + (Math.random() - 0.5) * 0.001));
    }, 500);

    return () => clearInterval(interval);
  }, [isRunning, setVoltageValue, setFrequencyValue]);

  const addMeasurement = () => {
    const newMeasurement: Measurement = {
      id: Date.now().toString(),
      startTime: new Date().toLocaleString('pt-BR'),
      description: 'Side',
      connection: connection,
      label: 'X',
      urms: `${voltage.toFixed(3)} kV`,
      df: df.toFixed(5),
      cp: `${cp.toFixed(3)} nF`,
      power: voltage > 10 ? `${(voltage * ix / 1000).toFixed(3)} W` : `${(voltage * ix).toFixed(1)} mW`,
      frequency: `${frequency.toFixed(2)} Hz`
    };
    setMeasurements(prev => [newMeasurement, ...prev]);
  };

  const clearMeasurements = () => {
    setMeasurements([]);
  };

  const toggleHighVoltage = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className="midas-container">
      {/* DISPLAY HEADER */}
      <div className="display-header">
        <div className="display-title">
          <span className="red-bar"></span>
          <h2>Midas 2881 -Simulated- C1 -|Data |Midas 2881(modified)</h2>
          <span className="red-bar"></span>
        </div>

        {/* LCD DISPLAY */}
        <div className="lcd-display">
          <div className="lcd-row top">
            <div className="lcd-cell">
              <span className="label">U rms</span>
              <span className="value">{voltage.toFixed(3)} kV</span>
            </div>
            <div className="lcd-cell">
              <span className="label">Cp (Zx=Cp||Rp) ▼</span>
              <span className="value">{cp.toFixed(3)} nF</span>
            </div>
            <div className="lcd-cell">
              <span className="label">DF % (tan δ) ▼</span>
              <span className="value">{df.toFixed(3)} %</span>
            </div>
            <div className="lcd-cell">
              <span className="label">Frequency ▼</span>
              <span className="value">{frequency.toFixed(2)} Hz</span>
            </div>
            <div className="lcd-wave">
              <svg viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="M0,15 Q25,5 50,15 T100,15" stroke="#00ff00" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>

          <div className="lcd-row bottom">
            <div className="lcd-cell">
              <span className="label">Ix rms ▼</span>
              <span className="value">{ix.toFixed(2)} mA</span>
            </div>
            <div className="lcd-cell">
              <span className="label">Rp (Zx=Cp||Rp) ▼</span>
              <span className="value">{rp.toFixed(3)} MΩ</span>
            </div>
            <div className="lcd-cell">
              <span className="label">PF % (cos φ) ▼</span>
              <span className="value">{pf.toFixed(3)} %</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLS SECTION */}
      <div className="controls-section">
        <div className="control-group">
          <label>Set Voltage</label>
          <div className="control-input">
            <span>Max</span>
            <input 
              type="number" 
              value={setVoltageValue} 
              onChange={(e) => setSetVoltageValue(parseFloat(e.target.value))}
              max={50}
            />
            <span>kV</span>
          </div>
        </div>

        <div className="control-group center">
          <div className="voltage-display">{setVoltageValue} kV</div>
        </div>

        <div className="control-group">
          <label>Rise Speed</label>
          <div className="control-input">
            <input 
              type="number" 
              value={riseSpeed}
              onChange={(e) => setRiseSpeed(parseFloat(e.target.value))}
            />
            <span>kV/s</span>
          </div>
        </div>

        <div className="control-group">
          <label>Set Frequency</label>
          <div className="control-input">
            <input 
              type="number"
              value={setFrequencyValue}
              onChange={(e) => setSetFrequencyValue(parseFloat(e.target.value))}
            />
            <span>Hz</span>
          </div>
        </div>

        <div className="control-group">
          <label>Set Connection</label>
          <select value={connection} onChange={(e) => setConnection(e.target.value)}>
            <option>UST A</option>
            <option>UST B</option>
            <option>UST C</option>
          </select>
        </div>

        <div className="buttons-group">
          <button className="btn-primary" onClick={addMeasurement}>Record</button>
          <button className="btn-primary">Description</button>
          <button className="btn-primary">Tools</button>
        </div>
      </div>

      {/* INFO LINE */}
      <div className="info-line">
        <span>Cn(n)t = 123.450 pF, Temp. Correction: = 1</span>
      </div>

      {/* MEASUREMENTS TABLE */}
      <div className="measurements-table">
        <div className="measurements-table-header">
          <h4>MEASUREMENTS</h4>
          <button className="btn-clear-data" onClick={clearMeasurements}>
            Clear Data
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Start Time</th>
              <th>Descr.</th>
              <th>Conn.</th>
              <th>Label</th>
              <th>Urms</th>
              <th>DF(ianô)@20°C</th>
              <th>Cp(Zx=Cp||Rp)</th>
              <th>Real Power P</th>
              <th>Frequency</th>
              <th>Note</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {measurements.map((m, idx) => (
              <tr key={m.id} className={idx % 2 === 0 ? 'even' : 'odd'}>
                <td>{m.startTime}</td>
                <td>{m.description}</td>
                <td>{m.connection}</td>
                <td>{m.label}</td>
                <td>{m.urms}</td>
                <td>{m.df}</td>
                <td>{m.cp}</td>
                <td>{m.power}</td>
                <td>{m.frequency}</td>
                <td></td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="bottom-controls">
        <button 
          className={`btn-control ${isRunning ? 'active' : ''}`}
          onClick={toggleHighVoltage}
        >
          <span className="icon">▶</span> High Voltage {isRunning ? 'ON' : 'OFF'}
        </button>
        <button 
          className="btn-control stop"
          onClick={toggleHighVoltage}
        >
          <span className="icon">⊘</span> High Voltage OFF
        </button>
        <button className="btn-control" onClick={() => setShowSignalAnalysis(true)}>
          <span className="icon">⚙</span> Signal Analysis
        </button>
        <SignalAnalysis isOpen={showSignalAnalysis} onClose={() => setShowSignalAnalysis(false)} />
        <button className="btn-control">
          <span className="icon">☐</span> Extd Noise Reduction
        </button>
        <input type="text" placeholder="Search..." className="search-input" />
        <button className="btn-control file">
          <span className="icon">📁</span> File Manager
        </button>
      </div>
    </div>
  );
};
