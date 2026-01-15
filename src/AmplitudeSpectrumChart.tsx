import React, { useEffect, useRef, useMemo } from 'react';

interface AmplitudeSpectrumChartProps {
  harmonics: { frequency: number; amplitude: number }[];
  title: string;
  width?: number;
  height?: number;
}

// Função para agregar dados em intervalos
const aggregateHarmonics = (harmonics: { frequency: number; amplitude: number }[], maxPoints: number = 30) => {
  if (harmonics.length <= maxPoints) {
    return harmonics;
  }

  const intervalSize = Math.ceil(harmonics.length / maxPoints);
  const aggregated: { frequency: number; amplitude: number }[] = [];

  for (let i = 0; i < harmonics.length; i += intervalSize) {
    const interval = harmonics.slice(i, i + intervalSize);
    const avgFreq = interval.reduce((a, b) => a + b.frequency, 0) / interval.length;
    const avgAmplitude = interval.reduce((a, b) => a + b.amplitude, 0) / interval.length;
    aggregated.push({ frequency: avgFreq, amplitude: avgAmplitude });
  }

  return aggregated;
};

const AmplitudeSpectrumChart: React.FC<AmplitudeSpectrumChartProps> = ({
  harmonics,
  title,
  width = 500,
  height = 300
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const displayHarmonics = useMemo(
    () => aggregateHarmonics(harmonics, 30),
    [harmonics]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || displayHarmonics.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up margins
    const margin = { top: 30, right: 30, bottom: 60, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Find max amplitude com padding
    const maxAmplitude = Math.max(...displayHarmonics.map(h => h.amplitude));
    const padding = maxAmplitude * 0.1;
    const adjustedMax = maxAmplitude + padding;

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
    for (let i = 0; i <= harmonics.length; i++) {
      const x = margin.left + (chartWidth / harmonics.length) * i;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
    }

    // Draw bars com largura melhor
    const barWidth = chartWidth / displayHarmonics.length * 0.7;
    displayHarmonics.forEach((harmonic, index) => {
      const x = margin.left + (chartWidth / displayHarmonics.length) * index + (chartWidth / displayHarmonics.length - barWidth) / 2;
      const barHeight = (harmonic.amplitude / adjustedMax) * chartHeight;
      const y = margin.top + chartHeight - barHeight;

      ctx.fillStyle = '#ff0000';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw border
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);
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
    ctx.fillText('% of Harmonic', 0, 0);
    ctx.restore();

    // Y-axis values
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = (adjustedMax / 5) * (5 - i);
      const y = margin.top + (chartHeight / 5) * i;
      ctx.fillText(value.toFixed(1), margin.left - 5, y + 3);
    }

    // X-axis labels - mostrar cada harmônico
    ctx.textAlign = 'center';
    displayHarmonics.forEach((harmonic, index) => {
      const x = margin.left + (chartWidth / displayHarmonics.length) * index + (chartWidth / displayHarmonics.length) / 2;
      ctx.font = '9px Arial';
      ctx.fillText(
        `${harmonic.frequency.toFixed(0)} Hz`,
        x,
        height - 20
      );
    });

    // X-axis label
    ctx.font = '12px Arial';
    ctx.fillText('Frequency', width / 2, height - 5);

  }, [displayHarmonics, title, width, height]);

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

export default AmplitudeSpectrumChart;
