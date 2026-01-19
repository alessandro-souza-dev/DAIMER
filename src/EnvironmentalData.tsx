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
    <div className="environmental-panel">
      {showTitle && <h4 className="environmental-title">Condições Ambientais</h4>}
      
      <div className="environmental-grid">
        <div className="environmental-item">
          <div className="environmental-label">Temp. Ambiente</div>
          <div className="environmental-value">
            {environmentalData.ambientTemperature} <span className="env-unit">°C</span>
          </div>
        </div>
        
        <div className="environmental-item">
          <div className="environmental-label">Temp. Equipamento</div>
          <div className="environmental-value">
            {environmentalData.equipmentTemperature} <span className="env-unit">°C</span>
          </div>
        </div>
        
        <div className="environmental-item">
          <div className="environmental-label">Umidade Relativa</div>
          <div className="environmental-value">
            {environmentalData.relativeHumidity} <span className="env-unit">%</span>
          </div>
        </div>
        
        <div className="environmental-item">
          <div className="environmental-label">Ponto de Orvalho</div>
          <div className="environmental-value">
            {environmentalData.dewPoint} <span className="env-unit">°C</span>
          </div>
        </div>
        
        <div className="environmental-item">
          <div className="environmental-label">Umidade Absoluta</div>
          <div className="environmental-value">
            {environmentalData.absoluteHumidity} <span className="env-unit">g/m³</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalData;
