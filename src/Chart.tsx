import React, { useEffect, useRef, useMemo } from 'react';

interface ChartProps {
  data: number[];
  labels: string[];
  title: string;
  yAxisLabel: string;
  color?: string;
  type?: 'line' | 'bar';
  width?: number;
  height?: number;
}

// Função para agregar dados em intervalos
const aggregateData = (data: number[], labels: string[], maxPoints: number = 50) => {
  if (data.length <= maxPoints) {
    return { data, labels };
  }

  const intervalSize = Math.ceil(data.length / maxPoints);
  const aggregatedData: number[] = [];
  const aggregatedLabels: string[] = [];

  for (let i = 0; i < data.length; i += intervalSize) {
    const interval = data.slice(i, i + intervalSize);
    const average = interval.reduce((a, b) => a + b, 0) / interval.length;
    aggregatedData.push(average);
    aggregatedLabels.push(labels[Math.floor(i + intervalSize / 2)] || labels[i]);
  }

  return { data: aggregatedData, labels: aggregatedLabels };
};

const Chart: React.FC<ChartProps> = ({ 
  data, 
  labels, 
  title, 
  yAxisLabel, 
  color = '#00ff00',
  type = 'line',
  width = 400,
  height = 200
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Agregar dados se necessário
  const { data: displayData, labels: displayLabels } = useMemo(
    () => aggregateData(data, labels, 50),
    [data, labels]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Não desenhar se não houver dados
    if (displayData.length === 0) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#999';
      ctx.textAlign = 'center';
      ctx.font = '14px Arial';
      ctx.fillText('Sem dados para exibir', width / 2, height / 2);
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up margins
    const margin = { top: 30, right: 30, bottom: 50, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Find min and max values com padding
    const maxValue = Math.max(...displayData);
    const minValue = Math.min(...displayData);
    let valueRange = maxValue - minValue || 1;
    
    // Adicionar 10% de padding
    const padding = valueRange * 0.1;
    const adjustedMax = maxValue + padding;
    const adjustedMin = Math.max(0, minValue - padding);
    valueRange = adjustedMax - adjustedMin;

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

    // Vertical grid lines
    for (let i = 0; i <= displayData.length; i++) {
      const x = margin.left + (chartWidth / displayData.length) * i;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
    }

    // Draw data
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    if (type === 'line') {
      ctx.beginPath();
      displayData.forEach((value, index) => {
        const x = margin.left + (chartWidth / (displayData.length - 1 || 1)) * index;
        const y = margin.top + chartHeight - ((value - adjustedMin) / valueRange) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw points
      displayData.forEach((value, index) => {
        const x = margin.left + (chartWidth / (displayData.length - 1 || 1)) * index;
        const y = margin.top + chartHeight - ((value - adjustedMin) / valueRange) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    } else if (type === 'bar') {
      const barWidth = chartWidth / displayData.length * 0.8;
      displayData.forEach((value, index) => {
        const x = margin.left + (chartWidth / displayData.length) * index + (chartWidth / displayData.length - barWidth) / 2;
        const barHeight = ((value - adjustedMin) / valueRange) * chartHeight;
        const y = margin.top + chartHeight - barHeight;
        
        ctx.fillRect(x, y, barWidth, barHeight);
      });
    }

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
    ctx.fillText(yAxisLabel, 0, 0);
    ctx.restore();

    // Y-axis values
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = adjustedMin + (valueRange / 5) * (5 - i);
      const y = margin.top + (chartHeight / 5) * i;
      ctx.fillText(value.toFixed(1), margin.left - 5, y + 3);
    }

    // X-axis labels - mostrar a cada 5 pontos para não ficar apertado
    ctx.textAlign = 'center';
    const labelStep = Math.max(1, Math.floor(displayLabels.length / 6));
    displayLabels.forEach((label, index) => {
      if (index % labelStep === 0 || index === displayLabels.length - 1) {
        const x = margin.left + (chartWidth / (displayLabels.length - 1 || 1)) * index;
        ctx.font = '9px Arial';
        ctx.fillText(label, x, height - 10);
      }
    });

  }, [displayData, displayLabels, title, yAxisLabel, color, type, width, height]);

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

export default Chart;

