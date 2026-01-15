import React, { useState, useEffect, useRef } from 'react';
import { PartialDischargeState } from './types';
import EnvironmentalData from './EnvironmentalData';
import TabComponent from './TabComponent';
import { PD_MEASUREMENT_IMAGE } from './pdImageBase64';

interface PartialDischargeScreenProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

// Tipos de padrões de defeito PD
type DefectPattern = 'normal' | 'corona' | 'surface' | 'void' | 'floating';

// Função para gerar padrão PRPD baseado no tipo de defeito - BASEADO NA IMAGEM REAL
const generatePRPDPattern = (defectType: DefectPattern, currentVoltage: number, maxVoltage: number): { phase: number; magnitude: number; count: number }[] => {
  const points: { phase: number; magnitude: number; count: number }[] = [];
  const voltageFactor = currentVoltage / maxVoltage; // 0 a 1
  const intensityFactor = Math.pow(voltageFactor, 1.5); // Descarga aumenta exponencialmente com tensão
  
  // Base magnitude que escala com tensão (até ~12 nC na tensão máxima)
  const baseMaxMag = 2 + intensityFactor * 10; // 2 a 12 nC

  switch (defectType) {
    case 'corona':
      // CORONA (needle-plane): Concentrado no semi-ciclo POSITIVO (45-135°)
      // Formato de "montanha" com pico em torno de 90°
      // Apenas positivo, quase nada no negativo
      const coronaPulses = Math.floor(20 + 40 * intensityFactor);
      for (let i = 0; i < coronaPulses; i++) {
        // Distribuição gaussiana centrada em 90°
        const centerPhase = 90;
        const spread = 35;
        const phase = centerPhase + (Math.random() - 0.5) * 2 * spread + (Math.random() - 0.5) * 20;
        const phaseNorm = Math.max(30, Math.min(150, phase)); // Limitar a 30-150°
        
        // Magnitude maior no centro (90°), menor nas bordas
        const distFromCenter = Math.abs(phaseNorm - 90) / 60;
        const magnitude = baseMaxMag * (1 - distFromCenter * 0.7) * (0.3 + Math.random() * 0.7);
        
        points.push({ phase: phaseNorm, magnitude, count: Math.floor(Math.random() * 5) + 1 });
      }
      break;

    case 'surface':
      // SURFACE DISCHARGES: Dois picos - maior no POSITIVO (45-135°), menor no NEGATIVO (225-315°)
      // Assimétrico - positivo tem ~70% da atividade
      const surfacePulsesPos = Math.floor(25 + 35 * intensityFactor);
      const surfacePulsesNeg = Math.floor(10 + 15 * intensityFactor);
      
      // Semi-ciclo positivo (pico em ~90°)
      for (let i = 0; i < surfacePulsesPos; i++) {
        const phase = 90 + (Math.random() - 0.5) * 80; // 50-130°
        const distFromCenter = Math.abs(phase - 90) / 50;
        const magnitude = baseMaxMag * (1 - distFromCenter * 0.5) * (0.4 + Math.random() * 0.6);
        points.push({ phase, magnitude, count: Math.floor(Math.random() * 4) + 1 });
      }
      
      // Semi-ciclo negativo (pico em ~270°) - MENOR intensidade
      for (let i = 0; i < surfacePulsesNeg; i++) {
        const phase = 270 + (Math.random() - 0.5) * 60; // 240-300°
        const distFromCenter = Math.abs(phase - 270) / 40;
        const magnitude = -(baseMaxMag * 0.5 * (1 - distFromCenter * 0.5) * (0.3 + Math.random() * 0.7));
        points.push({ phase, magnitude, count: Math.floor(Math.random() * 3) + 1 });
      }
      break;

    case 'void':
      // INTERNAL VOIDS: Padrão SIMÉTRICO "rabbit ears" / "butterfly"
      // Dois picos IGUAIS: positivo em 45-90° e negativo em 225-270°
      // Formato triangular subindo do cruzamento do zero
      const voidPulses = Math.floor(18 + 30 * intensityFactor);
      
      // Primeiro pico - POSITIVO em 20-100° (pico em ~60°)
      for (let i = 0; i < voidPulses; i++) {
        const phase = 60 + (Math.random() - 0.5) * 60; // 30-90°
        const distFromCenter = Math.abs(phase - 60) / 40;
        const magnitude = baseMaxMag * (1 - distFromCenter * 0.6) * (0.4 + Math.random() * 0.6);
        points.push({ phase, magnitude, count: Math.floor(Math.random() * 5) + 2 });
      }
      
      // Segundo pico - NEGATIVO em 200-280° (pico em ~240°) - SIMÉTRICO
      for (let i = 0; i < voidPulses; i++) {
        const phase = 240 + (Math.random() - 0.5) * 60; // 210-270°
        const distFromCenter = Math.abs(phase - 240) / 40;
        const magnitude = -(baseMaxMag * (1 - distFromCenter * 0.6) * (0.4 + Math.random() * 0.6));
        points.push({ phase, magnitude, count: Math.floor(Math.random() * 5) + 2 });
      }
      break;

    case 'floating':
      // SLOT DISCHARGES / FLOATING: Pico grande concentrado no POSITIVO
      // Similar ao corona mas mais largo e intenso
      const floatPulses = Math.floor(30 + 50 * intensityFactor);
      for (let i = 0; i < floatPulses; i++) {
        const phase = 90 + (Math.random() - 0.5) * 100; // 40-140°
        const distFromCenter = Math.abs(phase - 90) / 60;
        const magnitude = baseMaxMag * 1.2 * (1 - distFromCenter * 0.4) * (0.5 + Math.random() * 0.5);
        points.push({ phase, magnitude, count: Math.floor(Math.random() * 6) + 2 });
      }
      // Alguns pulsos no negativo (menor)
      for (let i = 0; i < floatPulses / 3; i++) {
        const phase = 270 + (Math.random() - 0.5) * 60;
        const magnitude = -(baseMaxMag * 0.4 * (0.3 + Math.random() * 0.7));
        points.push({ phase, magnitude, count: Math.floor(Math.random() * 3) + 1 });
      }
      break;

    case 'normal':
    default:
      // BOAS CONDIÇÕES: Apenas ruído de fundo baixo, distribuído
      for (let i = 0; i < 10; i++) {
        const phase = Math.random() * 360;
        const magnitude = (Math.random() > 0.5 ? 1 : -1) * (0.1 + Math.random() * 0.4);
        points.push({ phase, magnitude, count: 1 });
      }
      break;
  }

  return points;
};

// Descrições dos tipos de defeito
const defectDescriptions: Record<DefectPattern, { name: string; description: string; color: string }> = {
  normal: { name: 'Boas Condições', description: 'Isolação em excelente estado', color: '#00ff00' },
  corona: { name: 'Corona', description: 'Descarga em superfície exposta ao ar (pulsos negativos em 270°)', color: '#ff6600' },
  surface: { name: 'Superficial', description: 'PD ao longo de superfícies (assimétrico, maior no positivo)', color: '#ffaa00' },
  void: { name: 'Vazios Internos', description: 'Cavidades na isolação (simétrico "rabbit ears")', color: '#ff0000' },
  floating: { name: 'Eletrodo Flutuante', description: 'Conexão solta (pulsos aleatórios altos)', color: '#ff00ff' }
};

// Componente de gráfico Q(pC) x V(kV) x Tempo - Dual Axis como na imagem de referência
const ChargeVoltageChart: React.FC<{
  data: { voltage: number; charge: number; time?: number }[];
  title: string;
  width: number;
  height: number;
  maxVoltage: number;
}> = ({ data, title, width, height, maxVoltage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Formatar tempo em mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const margin = { top: 35, right: 50, bottom: 40, left: 55 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Background branco como na imagem
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Área do gráfico cinza claro
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(margin.left, margin.top, chartWidth, chartHeight);

    // Grid horizontal
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    }

    // Grid vertical
    for (let i = 0; i <= 6; i++) {
      const x = margin.left + (chartWidth / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
    }

    // Legenda no topo
    const legendY = 12;
    
    // Q (pC) - vermelho
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(width / 2 - 80, legendY - 6, 12, 12);
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Q (pC)', width / 2 - 65, legendY + 4);
    
    // V (kV) - verde
    ctx.fillStyle = '#00aa00';
    ctx.fillRect(width / 2 + 20, legendY - 6, 12, 12);
    ctx.fillStyle = '#333';
    ctx.fillText('V (kV)', width / 2 + 35, legendY + 4);

    if (data.length === 0) {
      ctx.fillStyle = '#999';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Aguardando dados...', width / 2, height / 2);
    } else {
      // Calcular escalas
      const maxCharge = Math.max(...data.map(d => d.charge), 0.5) * 1000; // Converter nC para pC
      const maxChargeRounded = Math.ceil(maxCharge / 500) * 500; // Arredondar para múltiplo de 500
      const maxV = maxVoltage / 1000;
      const maxTime = data.length; // Cada ponto = 1 segundo

      // Desenhar linha de Carga (vermelha)
      ctx.strokeStyle = '#cc0000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      data.forEach((point, i) => {
        const x = margin.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
        const chargePC = point.charge * 1000; // nC para pC
        const y = margin.top + chartHeight - (chargePC / maxChargeRounded) * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Desenhar linha de Tensão (verde)
      ctx.strokeStyle = '#00aa00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach((point, i) => {
        const x = margin.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
        const y = margin.top + chartHeight - ((point.voltage / 1000) / maxV) * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Eixo Y esquerdo - Q (pC)
      ctx.fillStyle = '#cc0000';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(15, margin.top + chartHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Q (pC)', 0, 0);
      ctx.restore();

      // Labels Y esquerdo
      ctx.fillStyle = '#333';
      ctx.font = '9px Arial';
      ctx.textAlign = 'right';
      const chargeSteps = 5;
      for (let i = 0; i <= chargeSteps; i++) {
        const val = maxChargeRounded * (chargeSteps - i) / chargeSteps;
        const y = margin.top + (chartHeight / chargeSteps) * i;
        ctx.fillText(val.toLocaleString(), margin.left - 5, y + 3);
      }

      // Eixo Y direito - V (kV)
      ctx.fillStyle = '#00aa00';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(width - 10, margin.top + chartHeight / 2);
      ctx.rotate(Math.PI / 2);
      ctx.fillText('V (kV)', 0, 0);
      ctx.restore();

      // Labels Y direito
      ctx.fillStyle = '#333';
      ctx.font = '9px Arial';
      ctx.textAlign = 'left';
      const voltSteps = 5;
      for (let i = 0; i <= voltSteps; i++) {
        const val = maxV * (voltSteps - i) / voltSteps;
        const y = margin.top + (chartHeight / voltSteps) * i;
        ctx.fillText(val.toFixed(0), margin.left + chartWidth + 5, y + 3);
      }

      // Labels X (Tempo)
      ctx.fillStyle = '#333';
      ctx.font = '9px Arial';
      ctx.textAlign = 'center';
      const timeSteps = 6;
      for (let i = 0; i <= timeSteps; i++) {
        const timeVal = Math.floor((maxTime / timeSteps) * i);
        const x = margin.left + (chartWidth / timeSteps) * i;
        ctx.fillText(formatTime(timeVal), x, margin.top + chartHeight + 15);
      }

      // Label do eixo X
      ctx.font = 'bold 10px Arial';
      ctx.fillText('Time (mm:ss)', margin.left + chartWidth / 2, height - 5);
    }

    // Eixos
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top);
    ctx.stroke();

    // Título
    ctx.fillStyle = '#333';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 25);

  }, [data, title, width, height, maxVoltage]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block', borderRadius: '4px', border: '1px solid #ccc' }} />;
};

// Componente PRPD Chart - Layout igual à imagem (pC esquerda, Pulsos direita)
const PRPDChartImproved: React.FC<{
  data: { phase: number; magnitude: number; count?: number }[];
  title: string;
  width: number;
  height: number;
  defectType: string;
}> = ({ data, title, width, height, defectType }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const margin = { top: 25, right: 55, bottom: 40, left: 55 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Background branco/cinza claro como na imagem
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(margin.left, margin.top, chartWidth, chartHeight);

    // Escala pC (0 a 18000)
    const maxPC = 18000;
    const pcSteps = [0, 2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000, 18000];

    // Grid horizontal (pC)
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.5;
    pcSteps.forEach(pc => {
      const y = margin.top + chartHeight - (pc / maxPC) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    });

    // Grid vertical (ângulos)
    for (let deg = 0; deg <= 360; deg += 45) {
      const x = margin.left + (chartWidth / 360) * deg;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
    }

    // Onda senoidal de referência (tensão) - linha cinza
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const sineAmplitude = chartHeight * 0.45;
    const sineCenter = margin.top + chartHeight / 2;
    for (let deg = 0; deg <= 360; deg += 2) {
      const x = margin.left + (chartWidth / 360) * deg;
      const sineValue = Math.sin((deg * Math.PI) / 180);
      const y = sineCenter - sineValue * sineAmplitude;
      if (deg === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Agrupar dados por célula para contagem de pulsos
    const cellMap = new Map<string, { phase: number; pc: number; count: number }>();
    
    data.forEach(point => {
      const cellX = Math.floor(point.phase / 3) * 3;
      const pcValue = Math.abs(point.magnitude) * 1000; // nC para pC
      const cellY = Math.floor(pcValue / 200) * 200;
      const key = `${cellX},${cellY}`;
      
      if (cellMap.has(key)) {
        const existing = cellMap.get(key)!;
        existing.count += (point.count || 1);
      } else {
        cellMap.set(key, {
          phase: point.phase,
          pc: pcValue,
          count: point.count || 1
        });
      }
    });

    // Encontrar contagem máxima para escala de cores
    let maxCount = 1;
    cellMap.forEach(cell => {
      if (cell.count > maxCount) maxCount = cell.count;
    });
    maxCount = Math.max(maxCount, 208); // Máximo como na imagem

    // Função de cor baseada na contagem (verde -> amarelo -> laranja -> vermelho)
    const getCountColor = (count: number): string => {
      const ratio = Math.min(count / maxCount, 1);
      
      if (ratio < 0.15) {
        // Verde escuro -> verde claro
        return `rgb(0, ${Math.floor(100 + ratio * 6.67 * 155)}, 0)`;
      } else if (ratio < 0.35) {
        // Verde -> verde-amarelo
        const t = (ratio - 0.15) / 0.2;
        return `rgb(${Math.floor(t * 180)}, 255, 0)`;
      } else if (ratio < 0.55) {
        // Amarelo
        const t = (ratio - 0.35) / 0.2;
        return `rgb(${Math.floor(180 + t * 75)}, ${Math.floor(255 - t * 50)}, 0)`;
      } else if (ratio < 0.75) {
        // Laranja
        const t = (ratio - 0.55) / 0.2;
        return `rgb(255, ${Math.floor(205 - t * 100)}, 0)`;
      } else {
        // Vermelho
        const t = (ratio - 0.75) / 0.25;
        return `rgb(255, ${Math.floor(105 - t * 105)}, 0)`;
      }
    };

    // Desenhar pontos de dados
    const scale = chartHeight / maxPC;
    
    cellMap.forEach(point => {
      const x = margin.left + (chartWidth / 360) * point.phase;
      const y = margin.top + chartHeight - point.pc * scale;
      
      const color = getCountColor(point.count);
      ctx.fillStyle = color;
      
      const size = Math.max(2, Math.min(4, 2 + point.count * 0.05));
      ctx.fillRect(x - size/2, y - size/2, size, size);
    });

    // Eixo esquerdo (frame)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top);
    ctx.lineTo(margin.left, margin.top);
    ctx.stroke();

    // Labels eixo Y esquerdo (pC)
    ctx.fillStyle = '#333';
    ctx.font = '9px Arial';
    ctx.textAlign = 'right';
    pcSteps.forEach(pc => {
      const y = margin.top + chartHeight - (pc / maxPC) * chartHeight;
      ctx.fillText(pc.toString(), margin.left - 5, y + 3);
    });

    // Label "pC" no eixo Y esquerdo
    ctx.save();
    ctx.translate(15, margin.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText('pC', 0, 0);
    ctx.restore();

    // Labels eixo X (Phase deg.)
    ctx.textAlign = 'center';
    ctx.font = '9px Arial';
    [0, 45, 90, 135, 180, 225, 270, 315, 360].forEach(deg => {
      const x = margin.left + (chartWidth / 360) * deg;
      ctx.fillText(deg.toString(), x, margin.top + chartHeight + 15);
    });

    // Label "Phase deg." no eixo X
    ctx.font = 'bold 10px Arial';
    ctx.fillText('Phase deg.', margin.left + chartWidth / 2, height - 5);

    // === ESCALA DE CORES À DIREITA (Contagem de Pulsos) ===
    const colorBarWidth = 18;
    const colorBarHeight = chartHeight;
    const colorBarX = margin.left + chartWidth + 8;
    const colorBarY = margin.top;

    // Desenhar gradiente de cores (de baixo para cima: verde -> amarelo -> vermelho)
    for (let i = 0; i < colorBarHeight; i++) {
      const ratio = 1 - i / colorBarHeight;
      const count = ratio * maxCount;
      ctx.fillStyle = getCountColor(count);
      ctx.fillRect(colorBarX, colorBarY + i, colorBarWidth, 1);
    }

    // Borda da escala de cores
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(colorBarX, colorBarY, colorBarWidth, colorBarHeight);

    // Labels da escala de cores (pulsos)
    ctx.fillStyle = '#333';
    ctx.font = '9px Arial';
    ctx.textAlign = 'left';
    
    // Valores da escala como na imagem (208, 150, 100, 50, 0)
    const pulseLabels = [
      { val: maxCount, pos: 0 },
      { val: Math.round(maxCount * 0.75), pos: 0.25 },
      { val: Math.round(maxCount * 0.5), pos: 0.5 },
      { val: Math.round(maxCount * 0.25), pos: 0.75 },
      { val: 0, pos: 1 }
    ];
    
    pulseLabels.forEach(label => {
      const y = colorBarY + label.pos * colorBarHeight;
      ctx.fillText(label.val.toString(), colorBarX + colorBarWidth + 3, y + 4);
    });

    // Título
    ctx.fillStyle = '#333';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, margin.left + chartWidth / 2, 15);

  }, [data, title, width, height, defectType]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block', borderRadius: '4px', backgroundColor: '#fff', border: '1px solid #ccc' }} />;
};

const PartialDischargeScreen: React.FC<PartialDischargeScreenProps> = ({ onComplete, onBack }) => {
  // Configurações do teste
  const [targetVoltage, setTargetVoltage] = useState(8000); // Tensão alvo em V (8 kV)
  const [startVoltage] = useState(1500); // Tensão inicial 1.5 kV
  const [voltageStep] = useState(500); // Passo de 0.5 kV
  const [holdTime] = useState(5); // Tempo de espera em segundos (simulando 5 min)

  const [state, setState] = useState<PartialDischargeState>({
    appliedVoltage: 1500,
    isRunning: false,
    dischargeLevel: 0,
    pulseCount: 0,
    time: 0,
    measurements: []
  });

  const [prpdData, setPRPDData] = useState<{ phase: number; magnitude: number; count?: number }[]>([]);
  const [defectType, setDefectType] = useState<DefectPattern>('void');
  const [phase, setPhase] = useState<'ramping' | 'holding' | 'finished'>('ramping');
  const [holdCounter, setHoldCounter] = useState(0);

  // Histórico para gráfico Carga x Tensão (ACUMULA, não apaga)
  const [chargeVoltageHistory, setChargeVoltageHistory] = useState<{ voltage: number; charge: number }[]>([]);

  const [pdParams, setPdParams] = useState({
    Qm: 0, Qs: 0, Qavg: 0, frequency: 0, noiseLevel: 0.3,
    PDIV: 0, PDEV: 0, severity: 'Baixo' as 'Baixo' | 'Médio' | 'Alto' | 'Crítico'
  });

  // Selecionar tipo de defeito aleatório
  const selectRandomDefect = () => {
    const defects: DefectPattern[] = ['normal', 'corona', 'surface', 'void', 'floating'];
    setDefectType(defects[Math.floor(Math.random() * defects.length)]);
  };

  useEffect(() => {
    let interval: any;

    if (state.isRunning) {
      interval = setInterval(() => {
        setState(prev => {
          const newTime = prev.time + 1;
          let newVoltage = prev.appliedVoltage;
          let newPhase = phase;
          let newHoldCounter = holdCounter;

          // Lógica de incremento de tensão
          if (phase === 'ramping') {
            if (prev.appliedVoltage < targetVoltage) {
              newVoltage = Math.min(prev.appliedVoltage + voltageStep, targetVoltage);
            } else {
              newPhase = 'holding';
              setPhase('holding');
              newHoldCounter = 0;
            }
          } else if (phase === 'holding') {
            newHoldCounter = holdCounter + 1;
            setHoldCounter(newHoldCounter);
            if (newHoldCounter >= holdTime) {
              newPhase = 'finished';
              setPhase('finished');
            }
          }

          // Gerar pontos PRPD - descarga AUMENTA com tensão
          const newPoints = generatePRPDPattern(defectType, newVoltage, targetVoltage);

          // Calcular métricas
          const allMagnitudes = [...prpdData.slice(-150), ...newPoints].map(p => Math.abs(p.magnitude));
          const maxQm = allMagnitudes.length > 0 ? Math.max(...allMagnitudes) : 0;
          const avgQ = allMagnitudes.length > 0 ? allMagnitudes.reduce((a, b) => a + b, 0) / allMagnitudes.length : 0;
          const sumQs = allMagnitudes.reduce((a, b) => a + b, 0) / 1000;
          const freq = newPoints.reduce((a, b) => a + (b.count || 1), 0);

          let severity: 'Baixo' | 'Médio' | 'Alto' | 'Crítico' = 'Baixo';
          if (maxQm > 10) severity = 'Crítico';
          else if (maxQm > 6) severity = 'Alto';
          else if (maxQm > 3) severity = 'Médio';

          setPdParams({
            Qm: maxQm,
            Qs: sumQs,
            Qavg: avgQ,
            frequency: freq,
            noiseLevel: 0.2 + Math.random() * 0.3,
            PDIV: newVoltage * 0.6 / 1000,
            PDEV: newVoltage * 0.4 / 1000,
            severity
          });

          // Atualizar PRPD (limitar pontos)
          setPRPDData(prevData => {
            const combined = [...prevData, ...newPoints];
            return combined.length > 300 ? combined.slice(-300) : combined;
          });

          // Histórico para gráfico Carga x Tensão (ACUMULA - não limita)
          setChargeVoltageHistory(prev => [...prev, { voltage: newVoltage, charge: maxQm }]);

          return {
            ...prev,
            appliedVoltage: newVoltage,
            time: newTime,
            dischargeLevel: maxQm,
            pulseCount: freq,
            measurements: [...prev.measurements, {
              voltage: newVoltage,
              dischargeLevel: maxQm,
              pulseCount: freq,
              time: newTime,
              dischargePattern: newPoints
            }]
          };
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [state.isRunning, defectType, prpdData, phase, holdCounter, targetVoltage, voltageStep, holdTime]);

  const handleStart = () => {
    selectRandomDefect();
    setPRPDData([]);
    setChargeVoltageHistory([]);
    setPhase('ramping');
    setHoldCounter(0);
    setState(prev => ({
      ...prev,
      appliedVoltage: startVoltage,
      isRunning: true,
      measurements: [],
      time: 0
    }));
  };

  const handleStop = () => setState(prev => ({ ...prev, isRunning: false }));

  const handleComplete = () => {
    onComplete({
      type: 'Descarga Parcial',
      appliedVoltage: state.appliedVoltage,
      maxPD: pdParams.Qm,
      avgPulseCount: pdParams.frequency,
      defectType,
      measurements: state.measurements,
      pdParams
    });
  };

  const getSeverityColor = (s: string) => {
    switch (s) {
      case 'Baixo': return '#00ff00';
      case 'Médio': return '#ffff00';
      case 'Alto': return '#ff8800';
      case 'Crítico': return '#ff0000';
      default: return '#00ff00';
    }
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'ramping': return `Subindo tensão... ${(state.appliedVoltage/1000).toFixed(1)} / ${(targetVoltage/1000).toFixed(1)} kV`;
      case 'holding': return `Mantendo ${(targetVoltage/1000).toFixed(1)} kV (${holdCounter}/${holdTime}s)`;
      case 'finished': return 'Teste concluído';
      default: return '';
    }
  };

  const defectInfo = defectDescriptions[defectType];

  return (
    <div style={{ padding: '10px', maxWidth: '1400px', margin: '0 auto', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
      {/* Header compacto */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', borderBottom: '1px solid #222', paddingBottom: '8px' }}>
        <img src={PD_MEASUREMENT_IMAGE} alt="PD" style={{ height: '50px', borderRadius: '4px', border: '1px solid #222' }} />
        <div style={{ flex: 1 }}>
          <h2 style={{ color: '#00ff00', margin: 0, fontSize: '14px' }}>Sistema de Medição de Descarga Parcial (PD)</h2>
          <p style={{ color: '#555', margin: 0, fontSize: '10px' }}>DDX Tettex - IEC 60270</p>
        </div>
        {state.isRunning && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1a0000', padding: '5px 10px', borderRadius: '4px', border: '1px solid #330000' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff0000', animation: 'blink 0.8s infinite' }} />
            <span style={{ color: '#ff4444', fontSize: '10px', fontWeight: 'bold' }}>GRAVANDO</span>
          </div>
        )}
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#00ff00', fontSize: '18px', fontFamily: 'monospace' }}>{state.time}s</div>
          <div style={{ color: '#444', fontSize: '9px' }}>TEMPO</div>
        </div>
      </div>

      <EnvironmentalData />

      <TabComponent
        tabs={[
          {
            label: 'Medição',
            icon: '📊',
            content: (
              <div style={{ backgroundColor: '#050505', padding: '10px', borderRadius: '4px' }}>
                {/* Status do teste */}
                {state.isRunning && (
                  <div style={{ 
                    marginBottom: '10px', 
                    padding: '6px 12px', 
                    backgroundColor: '#111',
                    borderRadius: '4px',
                    border: `1px solid ${phase === 'finished' ? '#00ff00' : '#ffaa00'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: phase === 'finished' ? '#00ff00' : '#ffaa00', fontSize: '11px' }}>
                      {getPhaseText()}
                    </span>
                    <span style={{ color: defectInfo.color, fontSize: '10px' }}>
                      Padrão: {defectInfo.name}
                    </span>
                  </div>
                )}

                {/* Layout principal */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '10px' }}>
                  
                  {/* Coluna esquerda: Gráficos */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    
                    {/* PRPD Chart */}
                    <div style={{ backgroundColor: '#000', borderRadius: '4px', padding: '8px', border: '1px solid #1a1a1a' }}>
                      <PRPDChartImproved
                        data={prpdData}
                        title={`PRPD - ${defectInfo.name}`}
                        width={560}
                        height={280}
                        defectType={defectType}
                      />
                    </div>

                    {/* Gráfico Q(pC) x V(kV) x Tempo */}
                    <div style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '8px', border: '1px solid #ccc' }}>
                      <ChargeVoltageChart
                        data={chargeVoltageHistory}
                        title="Fase C"
                        width={560}
                        height={220}
                        maxVoltage={targetVoltage}
                      />
                    </div>

                    {/* Info do padrão detectado */}
                    {state.time > 0 && (
                      <div style={{ 
                        padding: '8px', 
                        backgroundColor: '#0a0a0a',
                        borderRadius: '4px',
                        borderLeft: `3px solid ${defectInfo.color}`,
                        border: '1px solid #1a1a1a'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ color: defectInfo.color, fontSize: '10px', fontWeight: 'bold' }}>
                              PADRÃO: {defectInfo.name.toUpperCase()}
                            </div>
                            <div style={{ color: '#666', fontSize: '9px', marginTop: '2px' }}>
                              {defectInfo.description}
                            </div>
                          </div>
                          <div style={{ 
                            padding: '4px 8px', 
                            backgroundColor: getSeverityColor(pdParams.severity) + '20',
                            border: `1px solid ${getSeverityColor(pdParams.severity)}`,
                            borderRadius: '3px'
                          }}>
                            <span style={{ color: getSeverityColor(pdParams.severity), fontSize: '10px', fontWeight: 'bold' }}>
                              {pdParams.severity.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Coluna direita: Displays e controles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    
                    {/* Displays digitais 2x2 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div style={{ backgroundColor: '#111', padding: '8px', borderRadius: '4px', border: '1px solid #222' }}>
                        <div style={{ color: '#555', fontSize: '8px', textTransform: 'uppercase' }}>Qm (Máx)</div>
                        <div style={{ color: getSeverityColor(pdParams.severity), fontSize: '22px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {pdParams.Qm.toFixed(1)}
                        </div>
                        <div style={{ color: '#333', fontSize: '8px' }}>nC</div>
                      </div>
                      <div style={{ backgroundColor: '#111', padding: '8px', borderRadius: '4px', border: '1px solid #222' }}>
                        <div style={{ color: '#555', fontSize: '8px', textTransform: 'uppercase' }}>Qavg</div>
                        <div style={{ color: '#00ff00', fontSize: '22px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {pdParams.Qavg.toFixed(1)}
                        </div>
                        <div style={{ color: '#333', fontSize: '8px' }}>nC</div>
                      </div>
                      <div style={{ backgroundColor: '#111', padding: '8px', borderRadius: '4px', border: '1px solid #222' }}>
                        <div style={{ color: '#555', fontSize: '8px', textTransform: 'uppercase' }}>Tensão</div>
                        <div style={{ color: '#ff6600', fontSize: '22px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {(state.appliedVoltage / 1000).toFixed(1)}
                        </div>
                        <div style={{ color: '#333', fontSize: '8px' }}>kV</div>
                      </div>
                      <div style={{ backgroundColor: '#111', padding: '8px', borderRadius: '4px', border: '1px solid #222' }}>
                        <div style={{ color: '#555', fontSize: '8px', textTransform: 'uppercase' }}>Freq</div>
                        <div style={{ color: '#ffaa00', fontSize: '22px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {pdParams.frequency.toFixed(0)}
                        </div>
                        <div style={{ color: '#333', fontSize: '8px' }}>p/s</div>
                      </div>
                    </div>

                    {/* Barra de progresso de tensão */}
                    <div style={{ backgroundColor: '#111', padding: '8px', borderRadius: '4px', border: '1px solid #222' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#555', fontSize: '8px' }}>PROGRESSO TENSÃO</span>
                        <span style={{ color: '#ff6600', fontSize: '9px' }}>{((state.appliedVoltage / targetVoltage) * 100).toFixed(0)}%</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#222', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${(state.appliedVoltage / targetVoltage) * 100}%`, 
                          height: '100%', 
                          backgroundColor: '#ff6600',
                          transition: 'width 0.3s'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                        <span style={{ color: '#444', fontSize: '8px' }}>1.5 kV</span>
                        <span style={{ color: '#444', fontSize: '8px' }}>{(targetVoltage/1000).toFixed(0)} kV</span>
                      </div>
                    </div>

                    {/* Severidade */}
                    <div style={{ backgroundColor: '#111', padding: '6px', borderRadius: '4px', border: `1px solid ${getSeverityColor(pdParams.severity)}40` }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {['Baixo', 'Médio', 'Alto', 'Crítico'].map(level => (
                          <div
                            key={level}
                            style={{
                              flex: 1,
                              padding: '4px',
                              borderRadius: '2px',
                              backgroundColor: pdParams.severity === level ? getSeverityColor(level) : '#1a1a1a',
                              color: pdParams.severity === level ? '#000' : '#444',
                              fontSize: '8px',
                              fontWeight: 'bold',
                              textAlign: 'center'
                            }}
                          >
                            {level}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Configuração */}
                    <div style={{ backgroundColor: '#111', padding: '8px', borderRadius: '4px', border: '1px solid #222' }}>
                      <div style={{ color: '#555', fontSize: '8px', marginBottom: '4px' }}>TENSÃO ALVO</div>
                      <input 
                        type="range" 
                        min="3000" 
                        max="15000" 
                        step="500"
                        value={targetVoltage}
                        onChange={(e) => setTargetVoltage(parseInt(e.target.value))}
                        disabled={state.isRunning}
                        style={{ width: '100%', accentColor: '#ff6600', height: '4px' }}
                      />
                      <div style={{ color: '#ff6600', fontSize: '11px', textAlign: 'center' }}>
                        {(targetVoltage/1000).toFixed(1)} kV
                      </div>
                    </div>

                    {/* Botões */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={handleStart}
                        disabled={state.isRunning}
                        style={{
                          flex: 1,
                          padding: '8px',
                          backgroundColor: state.isRunning ? '#1a1a1a' : '#004400',
                          color: '#fff',
                          border: '1px solid #006600',
                          borderRadius: '3px',
                          cursor: state.isRunning ? 'not-allowed' : 'pointer',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}
                      >
                        ▶ INICIAR
                      </button>
                      <button 
                        onClick={handleStop}
                        disabled={!state.isRunning}
                        style={{
                          flex: 1,
                          padding: '8px',
                          backgroundColor: !state.isRunning ? '#1a1a1a' : '#440000',
                          color: '#fff',
                          border: '1px solid #660000',
                          borderRadius: '3px',
                          cursor: !state.isRunning ? 'not-allowed' : 'pointer',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}
                      >
                        ⏹ PARAR
                      </button>
                    </div>

                    <button 
                      onClick={handleComplete}
                      disabled={state.measurements.length === 0}
                      style={{
                        padding: '8px',
                        backgroundColor: state.measurements.length === 0 ? '#1a1a1a' : '#003366',
                        color: '#fff',
                        border: '1px solid #004488',
                        borderRadius: '3px',
                        cursor: state.measurements.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}
                    >
                      ✓ CONCLUIR TESTE
                    </button>

                    {/* Legenda de padrões compacta */}
                    <div style={{ backgroundColor: '#0a0a0a', padding: '6px', borderRadius: '4px', border: '1px solid #1a1a1a' }}>
                      <div style={{ color: '#444', fontSize: '7px', marginBottom: '4px' }}>PADRÕES PRPD</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
                        {Object.entries(defectDescriptions).map(([key, info]) => (
                          <div 
                            key={key}
                            style={{
                              padding: '3px 5px',
                              backgroundColor: defectType === key ? '#111' : 'transparent',
                              borderRadius: '2px',
                              borderLeft: `2px solid ${defectType === key ? info.color : '#222'}`
                            }}
                          >
                            <span style={{ color: info.color, fontSize: '7px' }}>{info.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            label: 'Explicação',
            icon: '📖',
            content: (
              <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '6px', color: '#333', fontSize: '12px' }}>
                <h3 style={{ color: '#4CAF50', marginTop: 0, fontSize: '14px' }}>Teste de Descarga Parcial (PD) - IEC 60270</h3>

                <h4 style={{ color: '#2196F3', fontSize: '12px' }}>Padrões PRPD Característicos</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                      <th style={{ padding: '6px', textAlign: 'left' }}>Tipo</th>
                      <th style={{ padding: '6px', textAlign: 'left' }}>Característica PRPD</th>
                      <th style={{ padding: '6px', textAlign: 'left' }}>Localização de Fase</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: '#e8f5e9' }}>
                      <td style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Normal</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Ruído baixo distribuído</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Aleatório, &lt;1 nC</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px', borderBottom: '1px solid #ddd', color: '#ff6600', fontWeight: 'bold' }}>Corona</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>APENAS pulsos negativos</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>250-290° (pico negativo)</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fff3e0' }}>
                      <td style={{ padding: '6px', borderBottom: '1px solid #ddd', color: '#ffaa00', fontWeight: 'bold' }}>Superficial</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Assimétrico, maior positivo</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>10-170° (maior) / 190-350°</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px', borderBottom: '1px solid #ddd', color: '#ff0000', fontWeight: 'bold' }}>Vazios</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>SIMÉTRICO "rabbit ears"</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>20-80° e 200-260°</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fce4ec' }}>
                      <td style={{ padding: '6px', color: '#ff00ff', fontWeight: 'bold' }}>Flutuante</td>
                      <td style={{ padding: '6px' }}>Pulsos aleatórios muito altos</td>
                      <td style={{ padding: '6px' }}>Qualquer fase, alta mag.</td>
                    </tr>
                  </tbody>
                </table>

                <h4 style={{ color: '#2196F3', marginTop: '15px', fontSize: '12px' }}>Procedimento do Teste</h4>
                <ol style={{ lineHeight: '1.6', paddingLeft: '20px' }}>
                  <li>Tensão inicial: <strong>1.5 kV</strong></li>
                  <li>Incremento: <strong>0.5 kV</strong> por segundo</li>
                  <li>Tensão alvo: <strong>8 kV</strong> (configurável)</li>
                  <li>Tempo de espera na tensão máxima: <strong>5 segundos</strong></li>
                  <li>Descargas aumentam com a tensão aplicada</li>
                </ol>
              </div>
            )
          }
        ]}
      />

      <div style={{ marginTop: '10px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            backgroundColor: '#222',
            color: '#888',
            border: '1px solid #333',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '10px'
          }}
        >
          ← Voltar
        </button>
      </div>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

export default PartialDischargeScreen;
