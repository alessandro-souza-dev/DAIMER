import React from 'react';

interface HomeScreenProps {
  onStart: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStart }) => {
  return (
    <div className="screen" style={{
      backgroundImage: 'url(/cover_image.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      imageRendering: 'crisp-edges',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '40px 20px'
    }}>
      {/* TOPO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '20px', paddingBottom: '20px' }}>
        <img src="/daimer_logo.png" alt="DAIMER Logo" style={{ maxWidth: '200px', height: 'auto', mixBlendMode: 'darken' }} />
        
        <h1 className="title" style={{ flex: 1, textAlign: 'center', margin: 0 }}>Simulador de Ensaios Elétricos</h1>
        
        <img src="/data_logo.png" alt="DATA Logo" style={{ maxWidth: '150px', height: 'auto', mixBlendMode: 'lighten' }} />
      </div>

      {/* BAIXO */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <h2 className="subtitle">Plataforma DAIMER</h2>

        <button className="btn btn-primary" onClick={onStart}>
          Iniciar Simulação
        </button>

        <div style={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
          <p>Este simulador demonstra como os dados são coletados</p>
          <p>através dos equipamentos de teste e enviados para a plataforma DAIMER</p>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;