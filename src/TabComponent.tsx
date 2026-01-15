import React, { useState } from 'react';

interface TabProps {
  tabs: Array<{
    label: string;
    icon?: string;
    content: React.ReactNode;
  }>;
}

const TabComponent: React.FC<TabProps> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '20px'
    }}>
      {/* Tab Headers */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid rgba(76, 175, 80, 0.3)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
      }}>
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            style={{
              flex: 1,
              padding: '16px 20px',
              border: 'none',
              background: activeTab === index 
                ? 'rgba(76, 175, 80, 0.2)' 
                : 'transparent',
              color: activeTab === index ? '#4CAF50' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === index ? '600' : '400',
              borderBottom: activeTab === index ? '3px solid #4CAF50' : 'none',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== index) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== index) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {tab.icon && <span style={{ fontSize: '18px' }}>{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        padding: '24px',
        minHeight: '400px',
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: '1.6'
      }}>
        {tabs[activeTab].content}
      </div>
    </div>
  );
};

export default TabComponent;
