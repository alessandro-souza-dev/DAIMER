import React, { useEffect, useRef, useMemo } from 'react';

interface DualAxisChartProps {
  data1: number[]; // PD magnitude (pC)
  data2: number[]; // Voltage (kV)
  labels: string[];
  title: string;
  yLabel1: string;
  yLabel2: string;
  xLabel?: string; // Título opcional para eixo X
  width?: number;
  height?: number;
  singleAxis?: boolean; // Se true, usa um único eixo Y para ambas as séries (para gráfico DD)
  singleAxisLabel?: string; // Label do eixo Y único
  color1?: string; // Cor para série 1
  color2?: string; // Cor para série 2
  numericXAxis?: boolean; // Se true, trata labels como valores numéricos para o eixo X
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
    // Para labels, se todos do intervalo forem iguais, usa ele. Se não, usa o do meio.
    const allSame = interval1.length > 0 && labels.slice(i, i + intervalSize).every(l => l === labels[i]);
    aggregatedLabels.push(allSame ? labels[i] : labels[Math.floor(i + intervalSize / 2)] || labels[i]);
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
  xLabel,
  width = 600,
  height = 300,
  singleAxis = false,
  singleAxisLabel = 'Corrente (μA)',
  color1 = '#1f77b4',
  color2 = '#cc0000',
  numericXAxis = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Agregar dados se necessário
  // Para SV (numericXAxis), não agregamos para manter precisão dos pontos
  const { data1: displayData1, data2: displayData2, labels: displayLabels } = useMemo(
    () => numericXAxis ? { data1, data2, labels } : aggregateData(data1, data2, labels, 50),
    [data1, data2, labels, numericXAxis]
  );
  
  const { xValues, xMin, xMax, xRange } = useMemo(() => {
    if (numericXAxis) {
        const vals = displayLabels.map(l => {
             // Remove unidades (V, kV, etc) se houver para parsear
             const num = parseFloat(l.replace(/[^0-9.-]/g, ''));
             return isNaN(num) ? 0 : num;
        });
        const min = 0; // Sempre começar do 0 para SV
        const max = Math.max(...vals, 5000) * 1.1; // Margem
        return { xValues: vals, xMin: min, xMax: max, xRange: max - min };
    }
    return { xValues: [], xMin: 0, xMax: 0, xRange: 0 };
  }, [displayLabels, numericXAxis]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || displayData1.length === 0 || displayData2.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up margins
    const margin = { top: 30, right: singleAxis ? 30 : 70, bottom: 50, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Find min and max para ambos eixos com padding
    const max1 = Math.max(...displayData1);
    const min1 = Math.min(...displayData1);
    
    // Para data2 (descarga), considera apenas valores não-zero para cálculo de escala
    const nonZeroData2 = displayData2.filter(v => v !== 0);
    const max2 = nonZeroData2.length > 0 ? Math.max(...nonZeroData2) : 0;
    const min2 = nonZeroData2.length > 0 ? Math.min(...nonZeroData2) : 0;
    
    let adjustedMin1: number, adjustedMax1: number, adjustedMin2: number, adjustedMax2: number;
    let range1: number, range2: number;
    
    if (singleAxis) {
      // Eixo único: calcula min/max combinando ambas as séries
      // IMPORTANTE: O zero deve estar CRAVADO no gráfico
      const allValues = [...displayData1, ...nonZeroData2];
      const globalMin = Math.min(...allValues, 0);
      const globalMax = Math.max(...allValues, 0);
      
      // Adiciona padding apenas para fora (não move o zero)
      const paddingUp = Math.abs(globalMax) * 0.1;
      const paddingDown = Math.abs(globalMin) * 0.1;
      
      // Arredonda para valores "bonitos" mantendo o zero cravado
      const absMax = Math.abs(globalMax) + paddingUp;
      const absMin = Math.abs(globalMin) + paddingDown;
      
      // Arredonda para o próximo inteiro
      adjustedMax1 = Math.ceil(absMax);
      adjustedMin1 = -Math.ceil(absMin);
      
      // Se não tem valores negativos, min é 0
      if (globalMin >= 0) {
        adjustedMin1 = -0.5; // Pequena margem abaixo do zero
      }
      // Se não tem valores positivos, max é 0
      if (globalMax <= 0) {
        adjustedMax1 = 0.5; // Pequena margem acima do zero
      }
      
      adjustedMin2 = adjustedMin1;
      adjustedMax2 = adjustedMax1;
      range1 = adjustedMax1 - adjustedMin1;
      range2 = range1;
    } else {
      const padding1 = (max1 - min1) * 0.1;
      const padding2 = nonZeroData2.length > 0 ? (max2 - min2) * 0.1 : 1;
      
      adjustedMin1 = min1 - padding1;
      adjustedMax1 = max1 + padding1;
      adjustedMin2 = min2 - padding2;
      adjustedMax2 = max2 + padding2;
      
      range1 = adjustedMax1 - adjustedMin1;
      range2 = adjustedMax2 - adjustedMin2;
    }

    // Draw background
    ctx.fillStyle = '#fff';
    ctx.fillRect(margin.left, margin.top, chartWidth, chartHeight);

    // Draw grid lines
    ctx.strokeStyle = '#e0e0e0';
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
    let labelStep = 1;
    if (numericXAxis) {
      const xGridStep = 1000;
      for (let v = xMin; v <= xMax; v += xGridStep) {
         const x = margin.left + ((v - xMin) / xRange) * chartWidth;
         ctx.beginPath();
         // Começa a desenhar do topo do gráfico até em baixo
         ctx.moveTo(x, margin.top);
         ctx.lineTo(x, margin.top + chartHeight);
         ctx.stroke();
      }
    } else {
      labelStep = Math.max(1, Math.floor(displayData1.length / 6));
      for (let i = 0; i < displayData1.length; i++) {
        if (i % labelStep === 0) {
          const x = margin.left + (chartWidth / (displayData1.length - 1 || 1)) * i;
          ctx.beginPath();
          ctx.moveTo(x, margin.top);
          ctx.lineTo(x, margin.top + chartHeight);
          ctx.stroke();
        }
      }
    }

    // Desenha linha do zero em destaque quando singleAxis
    if (singleAxis && adjustedMin1 < 0 && adjustedMax1 > 0) {
      const zeroY = margin.top + chartHeight - ((0 - adjustedMin1) / range1) * chartHeight;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(margin.left, zeroY);
      ctx.lineTo(margin.left + chartWidth, zeroY);
      ctx.stroke();
    }

    // --- SÉRIES DE DADOS E PONTOS ---

    const getX = (index: number) => {
        if (numericXAxis) {
           const val = xValues[index];
           // Previne divisão por zero se range for 0
           const safeRange = xRange || 1;
           return margin.left + ((val - xMin) / safeRange) * chartWidth;
        }
        return margin.left + (chartWidth / (displayData1.length - 1 || 1)) * index;
    };

    const getY1 = (val: number) => margin.top + chartHeight - ((val - adjustedMin1) / range1) * chartHeight;
    const getY2 = (val: number) => margin.top + chartHeight - ((val - adjustedMin2) / range2) * chartHeight;

    // Draw data1 (Série 1 - Esquerda)
    ctx.strokeStyle = color1;
    ctx.fillStyle = color1;
    ctx.lineWidth = 2.5;

    let lastNonZeroIndex1 = displayData1.length - 1;
    if (singleAxis) {
      for (let i = displayData1.length - 1; i >= 0; i--) {
        if (displayData1[i] !== 0) {
          lastNonZeroIndex1 = i;
          break;
        }
      }
    }

    ctx.beginPath();
    let pathStarted1 = false;
    displayData1.forEach((value, index) => {
      if (singleAxis && index > lastNonZeroIndex1) return;
      const x = getX(index);
      const y = getY1(value);
      if (!pathStarted1) {
        ctx.moveTo(x, y);
        pathStarted1 = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    if (pathStarted1) ctx.stroke();

    // Data 1 Points
    if (numericXAxis || xLabel) {
      displayData1.forEach((value, index) => {
        if (singleAxis && index > lastNonZeroIndex1) return;
        const x = getX(index);
        const y = getY1(value);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke(); 
      });
    }

    // Draw data2 (Série 2 - Direita)
    ctx.strokeStyle = color2;
    ctx.fillStyle = color2;
    ctx.lineWidth = 2.5;

    const firstNonZeroIndex = displayData2.findIndex(v => v !== 0);
    
    ctx.beginPath();
    let pathStarted2 = false;
    displayData2.forEach((value, index) => {
      if (firstNonZeroIndex === -1 || index < firstNonZeroIndex) return;
      
      const x = getX(index);
      const y = getY2(value);

      if (!pathStarted2) {
        ctx.moveTo(x, y);
        pathStarted2 = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    if (pathStarted2) ctx.stroke();
    
    // Data 2 Points
    if (numericXAxis || xLabel) {
      displayData2.forEach((value, index) => {
        if (firstNonZeroIndex === -1 || index < firstNonZeroIndex) return;
        const x = getX(index);
        const y = getY2(value);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1; // Axes thinner line

    // Left Y-axis (for data1)
    // Para gráfico estilo SV, o eixo deve ser apenas os ticks ou uma linha fina? Na imagem parece ter linha.
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.stroke();

    // Right Y-axis (for data2) - só desenha se não for singleAxis
    if (!singleAxis) {
      ctx.beginPath();
      ctx.moveTo(margin.left + chartWidth, margin.top);
      ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
      ctx.stroke();
    }

    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();

    // Draw labels and title
    // Title
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(title, width / 2, 20);

    // Legenda Centralizada (Topo) - Estilo da imagem
    const legendY = 40;
    const center = width / 2;
    
    if (numericXAxis || xLabel) {
      // Box 1 (Left)
      ctx.fillStyle = color1;
      ctx.fillRect(center - 80, legendY - 8, 15, 10);
      ctx.fillStyle = '#666'; 
      ctx.textAlign = 'left';
      ctx.font = '12px Arial';
      ctx.fillText(yLabel1, center - 60, legendY);

      // Box 2 (Right)
      if (!singleAxis) {
        ctx.fillStyle = color2;
        ctx.fillRect(center + 20, legendY - 8, 15, 10);
        ctx.fillStyle = '#666';
        ctx.fillText(yLabel2, center + 40, legendY);
      }
    } else if (singleAxis) {
       // Legenda para gráfico DD/SingleAxis (mantém layout antigo ou ajusta?)
       // Vamos usar layout centralizado também para consistência se couber
       const legendStartX = margin.left + 20;
       ctx.fillStyle = color1; // Usar cor passada (pode ser azul padrão)
       ctx.fillRect(legendStartX, 28 - 8, 20, 10);
       ctx.fillStyle = '#000';
       ctx.textAlign = 'left';
       ctx.fillText('Corrente Carga', legendStartX + 25, 28);
       
       const legend2X = legendStartX + 150;
       ctx.fillStyle = color2;
       ctx.fillRect(legend2X, 28 - 8, 20, 10);
       ctx.fillStyle = '#000';
       ctx.fillText('Corrente Descarga', legend2X + 25, 28);
    } else {
       // Legenda antiga para IP (lateral)
       // ... (código antigo de labels sobre os eixos)
       ctx.save();
       ctx.translate(15, height / 2);
       ctx.rotate(-Math.PI / 2);
       ctx.textAlign = 'center';
       ctx.fillStyle = color1;
       ctx.fillText(yLabel1, 0, 0);
       ctx.restore();

       ctx.save();
       ctx.translate(width - 15, height / 2);
       ctx.rotate(Math.PI / 2); // Rotacionado
       ctx.textAlign = 'center';
       ctx.fillStyle = color2;
       ctx.fillText(yLabel2, 0, 0);
       ctx.restore();
    }

    // Eixo Y Esquerdo Labels
    ctx.textAlign = 'right';
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    for (let i = 0; i <= 5; i++) {
        const val = adjustedMin1 + (range1 / 5) * i;
        const y = getY1(val);
        ctx.fillText(val.toFixed(0), margin.left - 10, y + 4);
    }

    // Eixo Y Direito Labels
    if (!singleAxis) {
       ctx.textAlign = 'left';
       ctx.fillStyle = '#666';
       for (let i = 0; i <= 5; i++) {
           const val = adjustedMin2 + (range2 / 5) * i;
           const y = getY2(val);
           ctx.fillText(val.toFixed(0), margin.left + chartWidth + 10, y + 4);
       }
       // Título do Eixo Direito (rotacionado 90 graus na vertical, leitura de baixo pra cima)
       if (numericXAxis || xLabel) {
           ctx.save();
           ctx.translate(width - 15, height / 2);
           ctx.rotate(-Math.PI / 2); // Leitura de baixo para cima
           ctx.textAlign = 'center';
           ctx.fillStyle = '#666';
           ctx.font = '12px Arial';
           ctx.fillText(yLabel2, 0, 0);
           ctx.restore();
           
           // Título do Eixo Esquerdo
           ctx.save();
           ctx.translate(15, height / 2);
           ctx.rotate(-Math.PI / 2);
           ctx.textAlign = 'center';
           ctx.fillStyle = '#666';
           ctx.font = '12px Arial';
           ctx.fillText(yLabel1, 0, 0);
           ctx.restore();
       }
    }

    // Eixo X Labels
    ctx.textAlign = 'center';
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';

    if (numericXAxis) {
        const xGridStep = 1000;
        for (let v = xMin; v <= xMax; v += xGridStep) {
             const x = margin.left + ((v - xMin) / (xRange || 1)) * chartWidth;
             ctx.fillText(v.toLocaleString('en-US'), x, height - 30);
        }
    } else {
        // Labels existentes (categoria)
        let lastLabel = '';
        displayLabels.forEach((label, index) => {
           const shouldDraw = (index % labelStep === 0 || index === displayLabels.length - 1);
           if (shouldDraw) {
             const x = getX(index);
             ctx.fillText(label, x, height - 30); // Subido
           }
        });
    }
    
    // Título do Eixo X
    if (xLabel) {
       ctx.textAlign = 'center';
       ctx.fillStyle = '#666';
       ctx.font = '12px Arial';
       ctx.fillText(xLabel, margin.left + chartWidth / 2, height - 10);
    }

  }, [displayData1, displayData2, displayLabels, title, yLabel1, yLabel2, width, height, singleAxis, singleAxisLabel, numericXAxis, color1, color2, xLabel]);

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
