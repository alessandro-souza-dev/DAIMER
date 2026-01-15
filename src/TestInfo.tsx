import React, { useState } from 'react';

interface TestInfoProps {
  objective: string;
  necessity: string[];
}

const TestInfo: React.FC<TestInfoProps> = ({ objective, necessity }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(76, 175, 80, 0.15) 100%)',
      border: '2px solid rgba(76, 175, 80, 0.4)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    }} onClick={() => setIsExpanded(!isExpanded)}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isExpanded ? '15px' : '0'
      }}>
        <h2 style={{
          color: '#4CAF50',
          margin: '0',
          fontSize: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          ℹ️ Informações do Ensaio
        </h2>
        <span style={{
          fontSize: '20px',
          color: '#4CAF50'
        }}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {isExpanded && (
        <>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderLeft: '4px solid #2196F3',
            padding: '15px',
            marginBottom: '15px',
            borderRadius: '4px'
          }}>
            <h3 style={{ color: '#2196F3', marginTop: 0, marginBottom: '8px' }}>🎯 Objetivo</h3>
            <p style={{ margin: 0, lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.9)' }}>
              {objective}
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderLeft: '4px solid #FF9800',
            padding: '15px',
            borderRadius: '4px'
          }}>
            <h3 style={{ color: '#455A64', marginTop: 0, marginBottom: '10px' }}>⚡ Necessidade</h3>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px',
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              {necessity.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default TestInfo;
