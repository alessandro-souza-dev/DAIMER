import React, { useEffect, useRef, useMemo } from 'react';

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
}

// Função para agregar dados PRPD em intervalos
const aggregatePRPD = (data: PRPDDataPoint[], maxPoints: number = 30) => {
  if (data.length <= maxPoints) {
    return data;
  }

  const intervalSize = Math.ceil(data.length / maxPoints);
  const aggregated: PRPDDataPoint[] = [];

  for (let i = 0; i < data.length; i += intervalSize) {
    const interval = data.slice(i, i + intervalSize);
    const avgPhase = interval.reduce((a, b) => a + b.phase, 0) / interval.length;
    const avgMagnitude = interval.reduce((a, b) => a + b.magnitude, 0) / interval.length;
    const totalCount = interval.reduce((a, b) => a + (b.count || 1), 0);
    aggregated.push({ phase: avgPhase, magnitude: avgMagnitude, count: totalCount });
  }

  return aggregated;
};

const PRPDChart: React.FC<PRPDChartProps> = ({
  data,
  title,
  width = 500,
  height = 400
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const displayData = useMemo(
    () => aggregatePRPD(data, 30),
    [data]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || displayData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limitar aos últimos 60 pontos
    const maxDataPoints = 60;
    const displayData = data.length > maxDataPoints ? data.slice(-maxDataPoints) : data;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up margins
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Find max magnitude com padding
    const maxMagnitude = Math.max(...displayData.map(d => d.magnitude));
    const padding = maxMagnitude * 0.1;
    const adjustedMax = maxMagnitude + padding;

    // Draw background
    ctx.fillStyle = '#000';
    ctx.fillRect(margin.left, margin.top, chartWidth, chartHeight);

    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines (every 30 degrees)
    for (let deg = 0; deg <= 360; deg += 30) {
      const x = margin.left + (chartWidth / 360) * deg;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
    }

    // Draw data points com largura proporcional à magnitude
    displayData.forEach((point) => {
      const x = margin.left + (chartWidth / 360) * point.phase;
      const barHeight = (point.magnitude / adjustedMax) * chartHeight;
      const y = margin.top + chartHeight - barHeight;

      // Color baseado na magnitude (heat map)
      const normalizedMag = point.magnitude / adjustedMax;
      let color: string;
      if (normalizedMag < 0.33) {
        color = '#00ff00'; // Verde
      } else if (normalizedMag < 0.67) {
        color = '#ffff00'; // Amarelo
      } else {
        color = '#ff0000'; // Vermelho
      }

      ctx.fillStyle = color;
      ctx.fillRect(x - 3, y, 6, barHeight);
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
    ctx.fillText(title, width / 2, 20);

    // Y-axis label
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '12px Arial';
    ctx.fillText('pC (picocoulombs)', 0, 0);
    ctx.restore();

    // Y-axis values
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = (adjustedMax / 5) * (5 - i);
      const y = margin.top + (chartHeight / 5) * i;
      ctx.fillText(value.toFixed(1), margin.left - 5, y + 3);
    }

    // X-axis labels (every 45 degrees)
    ctx.textAlign = 'center';
    for (let deg = 0; deg <= 360; deg += 45) {
      const x = margin.left + (chartWidth / 360) * deg;
      ctx.font = '10px Arial';
      ctx.fillText(deg.toString(), x, height - 10);
    }

    // X-axis label
    ctx.font = '12px Arial';
    ctx.fillText('Phase (degrees)', width / 2, height - 5);

  }, [displayData, title, width, height]);

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

export default PRPDChart;
