import React, { useState } from 'react';
import './SignalAnalysis.css';

interface SignalAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignalAnalysis: React.FC<SignalAnalysisProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('Un');
  const [rightTab, setRightTab] = useState('SPECTRUM');

  if (!isOpen) return null;

  return (
    <div className="signal-analysis-modal">
      <div className="signal-analysis-window">
        {/* Header - Windows Style */}
        <div className="window-header">
          <div className="window-title-bar">
            <div className="window-icon-container">
              <svg width="16" height="16" viewBox="0 0 16 16" className="window-icon">
                <rect width="16" height="16" fill="#f0e130" rx="2" />
                <path d="M4 4 L12 12 M4 12 L12 4" stroke="#000" strokeWidth="2" />
              </svg>
            </div>
            <span className="window-title-text">Signal Analysis</span>
          </div>
          <div className="window-controls">
            <button className="win-control-btn help">?</button>
            <button className="win-control-btn close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="main-layout">
          <div className="content-area">
            <div className="charts-and-info">
              <div className="charts-column">
                {/* AMPLITUDE SPECTRUM */}
                <div className="chart-container">
                  <div className="chart-label amplitude">Amplitude Spectrum</div>
                  <div className="svg-wrapper">
                    <svg viewBox="0 0 500 180">
                      <rect width="100%" height="100%" fill="black" />
                      {/* Grid Lines */}
                      {[0, 20, 40, 60, 80, 100].map(val => (
                        <React.Fragment key={val}>
                          <line x1="45" y1={150 - (val * 1.2)} x2="480" y2={150 - (val * 1.2)} 
                                stroke="#444" strokeDasharray="2,2" />
                          <text x="40" y={150 - (val * 1.2) + 4} fill="#bbb" fontSize="10" textAnchor="end">{val}</text>
                        </React.Fragment>
                      ))}
                      {[100, 200, 300, 400, 500, 600, 700].map(val => (
                        <React.Fragment key={val}>
                          <line x1={45 + (val * 0.6)} y1="30" x2={45 + (val * 0.6)} y2="150" 
                                stroke="#444" strokeDasharray="2,2" />
                          <text x={45 + (val * 0.6)} y="165" fill="#bbb" fontSize="10" textAnchor="middle">{val}</text>
                        </React.Fragment>
                      ))}
                      
                      {/* Axes */}
                      <line x1="45" y1="30" x2="45" y2="150" stroke="#bbb" strokeWidth="1" />
                      <line x1="45" y1="150" x2="480" y2="150" stroke="#bbb" strokeWidth="1" />
                      
                      {/* Bars */}
                      <rect x="55" y="30" width="18" height="120" fill="#ff6b6b" />
                      <text x="64" y="25" fill="#bbb" fontSize="10" textAnchor="middle">100</text>
                      
                      {[100, 200, 300, 400, 500, 600, 700].map(val => (
                        <text key={val} x={45 + (val * 0.6)} y="145" fill="#bbb" fontSize="10" textAnchor="middle">0</text>
                      ))}

                      <text x="12" y="90" fill="#00ff00" fontSize="11" transform="rotate(-90, 12, 90)" textAnchor="middle">% of the 1st Harmonic</text>
                      <text x="260" y="178" fill="#00ff00" fontSize="11" textAnchor="middle">Frequency</text>
                    </svg>
                  </div>
                </div>

                {/* PHASE SPECTRUM */}
                <div className="chart-container">
                  <div className="chart-label phase">Phase Spectrum</div>
                  <div className="svg-wrapper">
                    <svg viewBox="0 0 500 180">
                      <rect width="100%" height="100%" fill="black" />
                      {/* Grid Lines */}
                      {[-150, -100, -50, 0, 50, 100, 150, 200].map(val => (
                        <React.Fragment key={val}>
                          <line x1="45" y1={100 - (val * 0.4)} x2="480" y2={100 - (val * 0.4)} 
                                stroke="#444" strokeDasharray="2,2" strokeWidth="0.5" />
                          <text x="40" y={100 - (val * 0.4) + 4} fill="#bbb" fontSize="10" textAnchor="end">{val}</text>
                        </React.Fragment>
                      ))}
                      {[100, 200, 300, 400, 500, 600, 700].map(val => (
                        <React.Fragment key={val}>
                          <line x1={45 + (val * 0.6)} y1="20" x2={45 + (val * 0.6)} y2="180" 
                                stroke="#444" strokeDasharray="2,2" strokeWidth="0.5" />
                        </React.Fragment>
                      ))}

                      {/* Horizontal Zero Line */}
                      <line x1="45" y1="100" x2="480" y2="100" stroke="#bbb" strokeWidth="1" />
                      <line x1="45" y1="20" x2="45" y2="180" stroke="#bbb" strokeWidth="1" />

                      {/* Bars */}
                      <rect x="235" y="82" width="12" height="18" fill="#8d8dff" />
                      <text x="241" y="78" fill="#bbb" fontSize="9" textAnchor="middle">45.202</text>
                      
                      <rect x="297" y="48" width="12" height="52" fill="#8d8dff" />
                      <text x="303" y="44" fill="#bbb" fontSize="9" textAnchor="middle">129.786</text>

                      <rect x="421" y="83" width="12" height="17" fill="#8d8dff" />
                      <text x="427" y="79" fill="#bbb" fontSize="9" textAnchor="middle">42.477</text>

                      <rect x="52" y="100" width="12" height="25" fill="#8d8dff" />
                      <text x="58" y="136" fill="#bbb" fontSize="9" textAnchor="middle">-65.369</text>

                      <rect x="104" y="100" width="12" height="56" fill="#8d8dff" />
                      <text x="110" y="168" fill="#bbb" fontSize="9" textAnchor="middle">-139.882</text>

                      <rect x="166" y="100" width="12" height="20" fill="#8d8dff" />
                      <text x="172" y="132" fill="#bbb" fontSize="9" textAnchor="middle">-49.798</text>

                      <rect x="359" y="100" width="12" height="54" fill="#8d8dff" />
                      <text x="365" y="166" fill="#bbb" fontSize="9" textAnchor="middle">-136.316</text>

                      <rect x="390" y="100" width="12" height="12" fill="#8d8dff" />
                      <text x="396" y="124" fill="#bbb" fontSize="9" textAnchor="middle">-30.594</text>

                      <text x="12" y="100" fill="#00ff00" fontSize="11" transform="rotate(-90, 12, 100)" textAnchor="middle">Phase ° (-180°..180°)</text>
                      <text x="260" y="175" fill="#00ff00" fontSize="11" textAnchor="middle">Frequency</text>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="info-side-panel">
                <div className="info-window-box">
                  <div className="info-line">
                    <span className="info-tag">Distortion:</span>
                    <span className="info-data">0.000 %</span>
                  </div>
                  <div className="info-line">
                    <span className="info-tag">U rms:</span>
                    <span className="info-data">1.401 kV</span>
                  </div>
                  <div className="info-line">
                    <span className="info-tag">U rms(1st):</span>
                    <span className="info-data">1.401 kV</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="footer-controls">
              <div className="button-group">
                {['Un', 'I Ref (Cn)', 'I Test (Cx)', 'Noise'].map(tab => (
                  <button
                    key={tab}
                    className={`nav-button ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="right-sidebar">
            <button 
              className={`sidebar-nav-item ${rightTab === 'SPECTRUM' ? 'active' : ''}`}
              onClick={() => setRightTab('SPECTRUM')}
            >
              <div className="sidebar-header-icon">
                <svg width="20" height="10" viewBox="0 0 20 10">
                  <circle cx="6" cy="5" r="3" fill="none" stroke="#000" strokeWidth="1" />
                  <circle cx="6" cy="5" r="1" fill="#000" />
                  <circle cx="14" cy="5" r="3" fill="none" stroke="#000" strokeWidth="1" />
                  <circle cx="14" cy="5" r="1" fill="#000" />
                </svg>
              </div>
              <div className="icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M4 18h4V10H4v8zm6 0h4V6h-4v12zm6 0h4v-5h-4v5z" fill="#ff4d4d" />
                </svg>
              </div>
              <span className="item-label">SPECTRUM</span>
            </button>
            <button 
              className={`sidebar-nav-item ${rightTab === 'SCOPE' ? 'active' : ''}`}
              onClick={() => setRightTab('SCOPE')}
            >
              <div className="sidebar-header-icon">
                <svg width="20" height="10" viewBox="0 0 20 10">
                  <circle cx="6" cy="5" r="3" fill="none" stroke="#000" strokeWidth="1" />
                  <circle cx="6" cy="5" r="1" fill="#000" />
                  <circle cx="14" cy="5" r="3" fill="none" stroke="#000" strokeWidth="1" />
                  <circle cx="14" cy="5" r="1" fill="#000" />
                </svg>
              </div>
              <div className="icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M3 12q2-5 4-5t4 5 4 5 4-5" stroke="#ffeb3b" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <span className="item-label">SCOPE</span>
            </button>
            <button 
              className={`sidebar-nav-item ${rightTab === 'LOG' ? 'active' : ''}`}
              onClick={() => setRightTab('LOG')}
            >
              <div className="sidebar-header-icon">
                <svg width="20" height="10" viewBox="0 0 20 10">
                  <circle cx="6" cy="5" r="3" fill="none" stroke="#000" strokeWidth="1" />
                  <circle cx="6" cy="5" r="1" fill="#000" />
                  <circle cx="14" cy="5" r="3" fill="none" stroke="#000" strokeWidth="1" />
                  <circle cx="14" cy="5" r="1" fill="#000" />
                </svg>
              </div>
              <div className="icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <circle cx="6" cy="10" r="2" fill="#4caf50" />
                  <circle cx="12" cy="14" r="2" fill="#4caf50" />
                  <circle cx="18" cy="12" r="2" fill="#4caf50" />
                </svg>
              </div>
              <span className="item-label">LOG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

