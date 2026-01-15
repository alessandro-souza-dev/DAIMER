import React from 'react';

interface EnvironmentalDataProps {
  showTitle?: boolean;
}

const EnvironmentalData: React.FC<EnvironmentalDataProps> = ({ showTitle = true }) => {
  // Dados baseados no relatório
  const environmentalData = {
    ambientTemperature: 20, // °C
    equipmentTemperature: 34, // °C
    relativeHumidity: 75, // %
    dewPoint: 15.43, // °C
    absoluteHumidity: 12.99 // g/m³
  };

  return (
    <div style={{ 
      background: 'rgba(255, 255, 255, 0.1)', 
      backdropFilter: 'blur(10px)',
      borderRadius: '8px',
      padding: '15px',
      margin: '15px 0',
      color: 'white'
    }}>
      {showTitle && <h4 style={{ marginBottom: '15px', textAlign: 'center' }}>Condições Ambientais</h4>}
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px',
        fontSize: '0.9rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Temp. Ambiente</div>
          <div style={{ 
            background: '#000', 
            color: '#00ff00', 
            padding: '5px 10px', 
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>
            {environmentalData.ambientTemperature} °C
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Temp. Equipamento</div>
          <div style={{ 
            background: '#000', 
            color: '#00ff00', 
            padding: '5px 10px', 
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>
            {environmentalData.equipmentTemperature} °C
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Umidade Relativa</div>
          <div style={{ 
            background: '#000', 
            color: '#00ff00', 
            padding: '5px 10px', 
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>
            {environmentalData.relativeHumidity} %
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Ponto de Orvalho</div>
          <div style={{ 
            background: '#000', 
            color: '#00ff00', 
            padding: '5px 10px', 
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>
            {environmentalData.dewPoint} °C
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Umidade Absoluta</div>
          <div style={{ 
            background: '#000', 
            color: '#00ff00', 
            padding: '5px 10px', 
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>
            {environmentalData.absoluteHumidity} g/m³
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalData;

