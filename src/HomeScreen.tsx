import React from 'react';

interface HomeScreenProps {
  onStart: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStart }) => {
  return (
    <div className="screen home-screen" style={{
      backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url(/cover_image.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
    }}>
      {/* TOPO */}
      <header className="home-header">
        <div className="logo-container">
          <img src="/daimer_logo.png" alt="DAIMER Logo" className="brand-logo" />
        </div>
        
        <h1 className="title main-title">Simulador de Ensaios Elétricos</h1>
        
        <div className="logo-container">
          <img src="/data_logo.png" alt="DATA Logo" className="brand-logo secondary-logo" />
        </div>
      </header>

      {/* CENTRO / BAIXO */}
      <main className="home-content">
        <div className="technical-panel">
          <h2 className="subtitle">Plataforma DAIMER</h2>
          
          <div className="info-grid">
            <p>Este simulador demonstra a automação na coleta de dados</p>
            <p>e integração em tempo real de equipamentos de teste.</p>
          </div>

          <button className="btn btn-primary start-btn" onClick={onStart}>
            Iniciar Simulação
            <span className="btn-icon">→</span>
          </button>
        </div>
        
        <footer className="home-footer">
          <p>Módulo de Treinamento Técnico para Engenheiros e Especialistas</p>
        </footer>
      </main>
    </div>
  );
};

export default HomeScreen;