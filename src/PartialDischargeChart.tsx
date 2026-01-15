import React, { useEffect, useRef } from 'react';

interface PartialDischargeChartProps {
  discharges: Array<{ phase: number; magnitude: number; count: number }>;
  width?: number;
  height?: number;
}

const PartialDischargeChart: React.FC<PartialDischargeChartProps> = ({ 
  discharges, 
  width = 600, 
  height = 400 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up margins
    const margin = { top: 30, right: 50, bottom: 50, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Draw background
    ctx.fillStyle = '#000';
    ctx.fillRect(margin.left, margin.top, chartWidth, chartHeight);

    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines (pC)
    for (let i = 0; i <= 10; i++) {
      const y = margin.top + (chartHeight / 10) * i;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines (Phase degrees)
    for (let i = 0; i <= 8; i++) {
      const x = margin.left + (chartWidth / 8) * i;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
    }

    // Draw sine wave reference
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 360; i++) {
      const x = margin.left + (chartWidth / 360) * i;
      const sineValue = Math.sin((i * Math.PI) / 180);
      const y = margin.top + chartHeight / 2 - (sineValue * chartHeight / 4);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw discharge points
    discharges.forEach(discharge => {
      const x = margin.left + (chartWidth / 360) * discharge.phase;
      const y = margin.top + chartHeight - (discharge.magnitude / 18000) * chartHeight;
      
      // Color based on magnitude (green to red)
      const intensity = Math.min(discharge.magnitude / 10000, 1);
      const red = Math.floor(intensity * 255);
      const green = Math.floor((1 - intensity) * 255);
      
      ctx.fillStyle = `rgb(${red}, ${green}, 0)`;
      
      // Size based on count
      const size = Math.max(1, Math.min(discharge.count / 10, 5));
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw axes
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    // Title
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Padrão de Descarga Parcial', width / 2, 20);

    // Y-axis label
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '12px Arial';
    ctx.fillText('pC', 0, 0);
    ctx.restore();

    // X-axis label
    ctx.font = '12px Arial';
    ctx.fillText('Phase deg.', width / 2, height - 10);

    // Y-axis values
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
      const value = (18000 / 10) * (10 - i);
      const y = margin.top + (chartHeight / 10) * i;
      ctx.fillText(value.toString(), margin.left - 5, y + 3);
    }

    // X-axis values
    ctx.textAlign = 'center';
    for (let i = 0; i <= 8; i++) {
      const value = (360 / 8) * i;
      const x = margin.left + (chartWidth / 8) * i;
      ctx.fillText(value.toString(), x, height - 30);
    }

    // Color scale legend
    const legendX = width - 40;
    const legendY = margin.top;
    const legendHeight = chartHeight;
    
    // Draw color gradient
    for (let i = 0; i < legendHeight; i++) {
      const intensity = i / legendHeight;
      const red = Math.floor(intensity * 255);
      const green = Math.floor((1 - intensity) * 255);
      
      ctx.fillStyle = `rgb(${red}, ${green}, 0)`;
      ctx.fillRect(legendX, legendY + i, 10, 1);
    }

    // Legend labels
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('208', legendX + 15, legendY + 10);
    ctx.fillText('0', legendX + 15, legendY + legendHeight);

  }, [discharges, width, height]);

  return (
    <div style={{ 
      background: '#000', 
      padding: '10px', 
      borderRadius: '8px',
      margin: '10px 0'
    }}>
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        style={{ display: 'block' }}
      />
    </div>
  );
};

export default PartialDischargeChart;

