import React, { useEffect, useRef, useMemo } from 'react';

interface DualAxisChartProps {
  data1: number[]; // PD magnitude (pC)
  data2: number[]; // Voltage (kV)
  labels: string[];
  title: string;
  yLabel1: string;
  yLabel2: string;
  width?: number;
  height?: number;
}

// Função para agregar dados em intervalos
const aggregateData = (data1: number[], data2: number[], labels: string[], maxPoints: number = 50) => {
  if (data1.length <= maxPoints) {
    return { data1, data2, labels };
  }

  const intervalSize = Math.ceil(data1.length / maxPoints);
  const aggregatedData1: number[] = [];
  const aggregatedData2: number[] = [];
  const aggregatedLabels: string[] = [];

  for (let i = 0; i < data1.length; i += intervalSize) {
    const interval1 = data1.slice(i, i + intervalSize);
    const interval2 = data2.slice(i, i + intervalSize);
    const avg1 = interval1.reduce((a, b) => a + b, 0) / interval1.length;
    const avg2 = interval2.reduce((a, b) => a + b, 0) / interval2.length;
    aggregatedData1.push(avg1);
    aggregatedData2.push(avg2);
    aggregatedLabels.push(labels[Math.floor(i + intervalSize / 2)] || labels[i]);
  }

  return { data1: aggregatedData1, data2: aggregatedData2, labels: aggregatedLabels };
};

const DualAxisChart: React.FC<DualAxisChartProps> = ({
  data1,
  data2,
  labels,
  title,
  yLabel1,
  yLabel2,
  width = 600,
  height = 300
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Agregar dados se necessário
  const { data1: displayData1, data2: displayData2, labels: displayLabels } = useMemo(
    () => aggregateData(data1, data2, labels, 50),
    [data1, data2, labels]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || displayData1.length === 0 || displayData2.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up margins
    const margin = { top: 30, right: 70, bottom: 50, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Find min and max para ambos eixos com padding
    const max1 = Math.max(...displayData1);
    const max2 = Math.max(...displayData2);
    const min1 = Math.min(...displayData1);
    const min2 = Math.min(...displayData2);
    
    const padding1 = (max1 - min1) * 0.1;
    const padding2 = (max2 - min2) * 0.1;
    
    const adjustedMin1 = Math.max(0, min1 - padding1);
    const adjustedMax1 = max1 + padding1;
    const adjustedMin2 = Math.max(0, min2 - padding2);
    const adjustedMax2 = max2 + padding2;
    
    const range1 = adjustedMax1 - adjustedMin1;
    const range2 = adjustedMax2 - adjustedMin2;

    // Draw background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(margin.left, margin.top, chartWidth, chartHeight);

    // Draw grid lines
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines - mostrar a cada 5 pontos
    const labelStep = Math.max(1, Math.floor(displayData1.length / 6));
    for (let i = 0; i < displayData1.length; i++) {
      if (i % labelStep === 0) {
        const x = margin.left + (chartWidth / (displayData1.length - 1 || 1)) * i;
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, margin.top + chartHeight);
        ctx.stroke();
      }
    }

    // Draw data1 (PD - red)
    ctx.strokeStyle = '#cc0000';
    ctx.fillStyle = '#cc0000';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    displayData1.forEach((value, index) => {
      const x = margin.left + (chartWidth / (displayData1.length - 1 || 1)) * index;
      const y = margin.top + chartHeight - ((value - adjustedMin1) / range1) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points for data1
    displayData1.forEach((value, index) => {
      const x = margin.left + (chartWidth / (displayData1.length - 1 || 1)) * index;
      const y = margin.top + chartHeight - ((value - adjustedMin1) / range1) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw data2 (Voltage - green)
    ctx.strokeStyle = '#00aa00';
    ctx.fillStyle = '#00aa00';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    displayData2.forEach((value, index) => {
      const x = margin.left + (chartWidth / (displayData2.length - 1 || 1)) * index;
      const y = margin.top + chartHeight - ((value - adjustedMin2) / range2) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points for data2
    displayData2.forEach((value, index) => {
      const x = margin.left + (chartWidth / (displayData2.length - 1 || 1)) * index;
      const y = margin.top + chartHeight - ((value - adjustedMin2) / range2) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    // Left Y-axis (for data1)
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.stroke();

    // Right Y-axis (for data2)
    ctx.beginPath();
    ctx.moveTo(margin.left + chartWidth, margin.top);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    // Title
    ctx.font = 'bold 14px Arial';
    ctx.fillText(title, width / 2, 20);

    // Left Y-axis label (red)
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '12px Arial';
    ctx.fillStyle = '#cc0000';
    ctx.fillText(yLabel1, 0, 0);
    ctx.restore();

    // Right Y-axis label (green)
    ctx.save();
    ctx.translate(width - 15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '12px Arial';
    ctx.fillStyle = '#00aa00';
    ctx.fillText(yLabel2, 0, 0);
    ctx.restore();

    // Left Y-axis values
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#cc0000';
    for (let i = 0; i <= 5; i++) {
      const value = adjustedMin1 + (range1 / 5) * (5 - i);
      const y = margin.top + (chartHeight / 5) * i;
      ctx.fillText(value.toFixed(1), margin.left - 5, y + 3);
    }

    // Right Y-axis values
    ctx.textAlign = 'left';
    ctx.fillStyle = '#00aa00';
    for (let i = 0; i <= 5; i++) {
      const value = adjustedMin2 + (range2 / 5) * (5 - i);
      const y = margin.top + (chartHeight / 5) * i;
      ctx.fillText(value.toFixed(1), margin.left + chartWidth + 5, y + 3);
    }

    // X-axis labels - mostrar a cada 5 pontos
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    displayLabels.forEach((label, index) => {
      if (index % labelStep === 0 || index === displayLabels.length - 1) {
        const x = margin.left + (chartWidth / (displayLabels.length - 1 || 1)) * index;
        ctx.font = '9px Arial';
        ctx.fillText(label, x, height - 10);
      }
    });

  }, [displayData1, displayData2, displayLabels, title, yLabel1, yLabel2, width, height]);

  return (
    <div style={{
      background: '#fff',
      padding: '10px',
      borderRadius: '8px',
      margin: '10px 0',
      border: '1px solid #ddd'
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

export default DualAxisChart;
