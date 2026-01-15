import React, { useEffect, useRef } from 'react';

interface PRPDDataPoint {
  phase: number;
  magnitude: number;
  count?: number;
}

interface PRPDChartProps {
  data: PRPDDataPoint[];
  title: string;
  width?: number;
  height?: number;
  defectType?: string;
}

const PRPDChart: React.FC<PRPDChartProps> = ({
  data,
  title,
  width = 400,
  height = 220,
  defectType = 'normal'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up margins (compacto)
    const margin = { top: 20, right: 10, bottom: 25, left: 35 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const centerY = margin.top + chartHeight / 2;

    // Draw background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(margin.left, margin.top, chartWidth, chartHeight);

    // Draw grid lines
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = margin.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines (every 45 degrees)
    for (let deg = 0; deg <= 360; deg += 45) {
      const x = margin.left + (chartWidth / 360) * deg;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
    }

    // Draw sine wave reference
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let deg = 0; deg <= 360; deg += 2) {
      const x = margin.left + (chartWidth / 360) * deg;
      const sineValue = Math.sin((deg * Math.PI) / 180);
      const y = centerY - (sineValue * chartHeight * 0.25);
      if (deg === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw zero line
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(margin.left, centerY);
    ctx.lineTo(margin.left + chartWidth, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Find max magnitude
    const maxMag = data.length > 0 ? Math.max(...data.map(d => Math.abs(d.magnitude))) : 10;
    const scale = (chartHeight / 2) / (maxMag * 1.2);

    // Draw data points as scatter plot
    data.forEach((point) => {
      const x = margin.left + (chartWidth / 360) * point.phase;
      const magnitude = point.magnitude * scale;
      const y = centerY - magnitude;

      const size = Math.max(1.5, Math.min((point.count || 1) / 2, 3));
      const intensity = Math.min(Math.abs(point.magnitude) / maxMag, 1);
      
      let r, g, b;
      if (point.magnitude >= 0) {
        if (intensity < 0.5) {
          r = Math.floor(intensity * 2 * 255);
          g = 255;
          b = 0;
        } else {
          r = 255;
          g = Math.floor((1 - (intensity - 0.5) * 2) * 255);
          b = 0;
        }
      } else {
        r = 0;
        g = Math.floor(intensity * 180);
        b = 255;
      }

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw axes
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 11);

    // Y-axis label
    ctx.save();
    ctx.translate(8, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '7px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('pC', 0, 0);
    ctx.restore();

    // Y-axis values
    ctx.font = '7px Arial';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#555';
    ctx.fillText(maxMag.toFixed(0), margin.left - 2, margin.top + 4);
    ctx.fillText('0', margin.left - 2, centerY + 2);
    ctx.fillText((-maxMag).toFixed(0), margin.left - 2, margin.top + chartHeight);

    // X-axis labels
    ctx.textAlign = 'center';
    ctx.fillStyle = '#555';
    [0, 90, 180, 270, 360].forEach(deg => {
      const x = margin.left + (chartWidth / 360) * deg;
      ctx.fillText(deg + '°', x, height - 3);
    });

  }, [data, title, width, height, defectType]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block', borderRadius: '4px' }}
    />
  );
};

export default PRPDChart;
