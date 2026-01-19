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

// Typagem para os pontos de descarga
interface PDPoint {
  phase: number;
  magnitude: number;
  count?: number;
}

// --- NOVO COMPONENTE: ScopeChart (Ondas Senoidais com pulsos de descarga) ---
const ScopeChart: React.FC<{ 
  points: PDPoint[], 
  voltage: number,
  isCalibration?: boolean,
  isInjecting?: boolean,
  isCalibrated?: boolean,
  calibrationPulse?: number,
  ambientNoise?: number,
  autoScale?: boolean
}> = ({ points, voltage, isCalibration, isInjecting, isCalibrated, calibrationPulse = 100, ambientNoise = 0.2, autoScale = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Aumentar resolução para evitar pixelamento
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const margin = { top: 35, right: 30, bottom: 40, left: 65 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const centerY = margin.top + chartHeight / 2;

    // Escalonamento Automático
    let maxMag = 10; 
    if (autoScale && points.length > 0) {
      const actualMax = Math.max(...points.map(p => Math.abs(p.magnitude)));
      if (actualMax > 2) maxMag = actualMax * 1.5;
    }
    if (isCalibration) maxMag = Math.max(maxMag, calibrationPulse * 1.3);

    // Limpar fundo
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Área do gráfico (levemente mais clara)
    ctx.fillStyle = '#050505';
    ctx.fillRect(margin.left, margin.top, chartWidth, chartHeight);

    // Grid pontilhada fina
    ctx.strokeStyle = '#222';
    ctx.setLineDash([1, 3]);
    ctx.lineWidth = 0.5;

    // Grid Vertical (30 em 30 graus)
    for (let deg = 0; deg <= 360; deg += 30) {
      const x = margin.left + (deg / 360) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();

      if (deg % 60 === 0) {
        ctx.fillStyle = '#555';
        ctx.font = '9px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.setLineDash([]);
        ctx.fillText(deg.toString(), x, margin.top + chartHeight + 15);
        ctx.setLineDash([1, 3]);
      }
    }

    // Grid Horizontal Dinâmica
    const steps = 5;
    for (let i = -steps; i <= steps; i++) {
      const y = centerY - (i / steps) * (chartHeight / 2);
      ctx.beginPath();
      ctx.setLineDash([1, 3]);
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = '#666';
      ctx.textAlign = 'right';
      ctx.font = '9px monospace';
      const val = (i / steps * maxMag).toFixed(1);
      ctx.fillText(val, margin.left - 10, y + 3);
    }
    ctx.setLineDash([]);

    // Linha de centro sólida
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, centerY);
    ctx.lineTo(margin.left + chartWidth, centerY);
    ctx.stroke();

    // Bordas do gráfico
    ctx.strokeStyle = '#444';
    ctx.strokeRect(margin.left, margin.top, chartWidth, chartHeight);

    // Label Vertical Charge
    ctx.save();
    ctx.translate(18, centerY);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#adc112'; // Verde oliva amarelado
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('Charge [C]', 0, 0);
    ctx.restore();

    // Barra Superior
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, width, 30);
    ctx.fillStyle = '#3a86ff'; // Azul padrão 1.1
    ctx.fillRect(0, 0, 45, 30);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('1.1', 22, 20);
    
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ccc';
    ctx.font = '11px sans-serif';
    ctx.fillText('Pulse Diagram', width - 15, 20);

    // Ícones fictícios à direita (conforme imagem)
    ctx.strokeStyle = '#888';
    ctx.strokeRect(width - 120, 8, 14, 14);
    ctx.strokeRect(width - 100, 8, 14, 14);
    
    // Senoide
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= chartWidth; x++) {
      const ph = (x / chartWidth) * 360;
      const y = centerY - Math.sin(ph * Math.PI / 180) * (chartHeight * 0.42);
      if (x === 0) ctx.moveTo(margin.left + x, y);
      else ctx.lineTo(margin.left + x, y);
    }
    ctx.stroke();

    // Pulsos
    ctx.lineWidth = 1.2;
    if (isCalibration) {
      if (isInjecting || isCalibrated) {
        // No modo calibração, mostrar pulsos estáveis conforme o valor selecionado
        [60, 120, 180, 240, 300].forEach(ph => {
          const x = margin.left + (ph / 360) * chartWidth;
          // Escala baseada no maxMag para autoScale real
          const h = (calibrationPulse / maxMag) * (chartHeight / 2);
          ctx.strokeStyle = '#00ffff'; 
          ctx.beginPath();
          ctx.moveTo(x, centerY);
          ctx.lineTo(x, centerY - h - (Math.random() * 3));
          ctx.stroke();
        });
      }
    } else {
      // Grama/Ruído (Noise Floor) baseado no ambientNoise
      for (let i = 0; i < chartWidth; i += 1.3) {
        const noiseVal = ambientNoise + (Math.random() - 0.5) * (ambientNoise * 0.5);
        const h = (noiseVal / maxMag) * (chartHeight / 2);
        ctx.strokeStyle = '#d4ff0044';
        ctx.beginPath();
        ctx.moveTo(margin.left + i, centerY);
        ctx.lineTo(margin.left + i, centerY - h);
        ctx.stroke();
      }
      // Pulsos reais da medição
      points.forEach(p => {
        const x = margin.left + (p.phase / 360) * chartWidth;
        const h = (p.magnitude / maxMag) * (chartHeight / 2);
        ctx.strokeStyle = '#d4ff00';
        ctx.beginPath();
        ctx.moveTo(x, centerY);
        ctx.lineTo(x, centerY - h);
        ctx.stroke();
      });
    }

  }, [points, voltage, isCalibration, isInjecting, isCalibrated, calibrationPulse, ambientNoise, autoScale]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', backgroundColor: '#000', borderRadius: '4px', overflow: 'hidden', border: '1px solid #333' }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block'
        }} 
      />
    </div>
  );
};

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const margin = { top: 35, right: 65, bottom: 45, left: 65 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#050505';
    ctx.fillRect(margin.left, margin.top, chartWidth, chartHeight);

    // Grid pontilhada fina
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([1, 4]);

    for (let i = 0; i <= 5; i++) {
        const y = margin.top + (chartHeight / 5) * i;
        ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(margin.left + chartWidth, y); ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
        const x = margin.left + (chartWidth / 6) * i;
        ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, margin.top + chartHeight); ctx.stroke();
    }
    ctx.setLineDash([]);

    // Legenda Industrial
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff3300'; ctx.fillRect(width / 2 - 80, 10, 8, 8);
    ctx.fillStyle = '#aaa'; ctx.fillText('Q (pC)', width / 2 - 68, 18);
    ctx.fillStyle = '#00ffff'; ctx.fillRect(width / 2 + 10, 10, 8, 8);
    ctx.fillStyle = '#aaa'; ctx.fillText('V (kV)', width / 2 + 22, 18);

    if (data.length > 0) {
      const maxCharge = Math.max(...data.map(d => d.charge * 1000), 500);
      const maxChargeRounded = Math.ceil(maxCharge / 500) * 500;
      const maxV = maxVoltage / 1000;

      // Linha Q (pC)
      ctx.strokeStyle = '#ff3300';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      data.forEach((p, i) => {
        const x = margin.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
        const y = margin.top + chartHeight - ((p.charge * 1000) / maxChargeRounded) * chartHeight;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Linha V (kV)
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      data.forEach((p, i) => {
        const x = margin.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
        const y = margin.top + chartHeight - ((p.voltage / 1000) / maxV) * chartHeight;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Labels Lateral
      ctx.fillStyle = '#888';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const y = margin.top + (chartHeight / 5) * i;
        ctx.fillText(Math.round(maxChargeRounded * (5 - i) / 5).toString(), margin.left - 8, y + 3);
      }
      ctx.textAlign = 'left';
      for (let i = 0; i <= 5; i++) {
        const y = margin.top + (chartHeight / 5) * i;
        ctx.fillText((maxV * (5 - i) / 5).toFixed(1), margin.left + chartWidth + 8, y + 3);
      }
    }

    ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
    ctx.strokeRect(margin.left, margin.top, chartWidth, chartHeight);

  }, [data, title, width, height, maxVoltage]);

  return <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '4px', border: '1px solid #333', width: '100%', height: '100%' }} />;
};

// Componente PRPD Chart - Layout igual à imagem (pC esquerda, Pulsos direita)
const PRPDChartImproved: React.FC<{
  data: { phase: number; magnitude: number; count?: number }[];
  title: string;
  width: number;
  height: number;
  defectType: string;
  autoScale?: boolean;
}> = ({ data, title, width, height, defectType, autoScale = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Alta resolução
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    const margin = { top: 35, right: 65, bottom: 45, left: 65 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    ctx.fillStyle = '#050505';
    ctx.fillRect(margin.left, margin.top, chartWidth, chartHeight);

    // Escala pC Automática ou Fixa
    let maxPC = 18000;
    if (autoScale && data.length > 0) {
      const maxVal = Math.max(...data.map(d => Math.abs(d.magnitude) * 1000));
      if (maxVal > 100) maxPC = Math.ceil(maxVal * 1.5 / 1000) * 1000;
      else maxPC = 1000;
    }

    const stepsCount = 10;
    const pcSlice = maxPC / stepsCount;

    // Grid horizontal dinâmica
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= stepsCount; i++) {
      const pc = pcSlice * i;
      const y = margin.top + chartHeight - (pc / maxPC) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();

      ctx.fillStyle = '#666';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(pc).toString(), margin.left - 8, y + 3);
    }

    // Grid vertical
    for (let deg = 0; deg <= 360; deg += 45) {
      const x = margin.left + (chartWidth / 360) * deg;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();

      ctx.fillStyle = '#666';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(deg.toString(), x, margin.top + chartHeight + 15);
    }

    // Onda senoidal de referência
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const sineAmplitude = chartHeight * 0.42;
    const sineCenter = margin.top + chartHeight / 2;
    for (let deg = 0; deg <= 360; deg += 1) {
      const x = margin.left + (chartWidth / 360) * deg;
      const y = sineCenter - Math.sin((deg * Math.PI) / 180) * sineAmplitude;
      if (deg === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Desenhar pontos de dados (com agrupamento dinâmico)
    const cellMap = new Map<string, { phase: number; pc: number; count: number }>();
    const pcResolution = maxPC / 80; 

    data.forEach(point => {
      const cellX = Math.floor(point.phase / 2) * 2;
      const pcValue = Math.abs(point.magnitude) * 1000;
      const cellY = Math.floor(pcValue / pcResolution) * pcResolution;
      const key = `${cellX},${cellY}`;
      if (cellMap.has(key)) {
        cellMap.get(key)!.count += (point.count || 1);
      } else {
        cellMap.set(key, { phase: point.phase, pc: pcValue, count: point.count || 1 });
      }
    });

    let maxCount = 1;
    cellMap.forEach(cell => { if (cell.count > maxCount) maxCount = cell.count; });
    maxCount = Math.max(maxCount, 150);

    const getCountColor = (count: number): string => {
      const r = Math.min(count / maxCount, 1);
      if (r < 0.2) return `rgb(0, 255, 100)`;
      if (r < 0.4) return `rgb(100, 255, 0)`;
      if (r < 0.6) return `rgb(255, 255, 0)`;
      if (r < 0.8) return `rgb(255, 150, 0)`;
      return `rgb(255, 0, 0)`;
    };

    const scale = chartHeight / maxPC;
    cellMap.forEach(point => {
      const x = margin.left + (chartWidth / 360) * point.phase;
      const y = margin.top + chartHeight - point.pc * scale;
      ctx.fillStyle = getCountColor(point.count);
      const size = Math.max(2.5, 3);
      ctx.fillRect(x - size/2, y - size/2, size, size);
    });

    // Barra de cores industrial à direita
    const cbW = 12, cbH = chartHeight, cbX = margin.left + chartWidth + 8;
    for (let i = 0; i < cbH; i++) {
        const ratio = 1 - i / cbH;
        ctx.fillStyle = getCountColor(ratio * maxCount);
        ctx.fillRect(cbX, margin.top + i, cbW, 1);
    }
    ctx.strokeStyle = '#444';
    ctx.strokeRect(cbX, margin.top, cbW, cbH);
    [maxCount, Math.round(maxCount/2), 0].forEach((v, i) => {
        ctx.fillStyle = '#666';
        ctx.fillText(v.toString(), cbX + cbW + 5, margin.top + (i * cbH / 2) + 3);
    });

    // Título
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, margin.left + chartWidth / 2, 18);

  }, [data, title, width, height, defectType]);

  return <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '4px', border: '1px solid #333', width: '100%', height: '100%' }} />;
};

const PartialDischargeScreen: React.FC<PartialDischargeScreenProps> = ({ onComplete, onBack }) => {
  // Configurações do teste
  const [targetVoltage, setTargetVoltage] = useState(8000); // Tensão alvo em V (8 kV)
  const [startVoltage] = useState(1500); // Tensão inicial 1.5 kV
  const [voltageStep] = useState(500); // Passo de 0.5 kV
  const [holdTime] = useState(10); // Tempo de espera em segundos (10 segundos)

  // Calibração
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationPulse, setCalibrationPulse] = useState(100); // pC (padrão 100 como na imagem)
  const [calibrationFactor, setCalibrationFactor] = useState(1); // pC/mV
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [ambientNoise, setAmbientNoise] = useState(0.5); // pC
  const [autoScale, setAutoScale] = useState(true);
  const [lastCalibrationDate, setLastCalibrationDate] = useState('01/01/1970 01:00');
  const [calibrationState, setCalibrationState] = useState<'Valid' | 'Invalid'>('Invalid');

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
  const [phase, setPhase] = useState<'ramping' | 'holding' | 'ramping_down' | 'finished'>('ramping');
  const [holdCounter, setHoldCounter] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);

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
          let newHoldCounter = holdCounter;

          // Lógica de incremento de tensão
          if (phase === 'ramping') {
            if (prev.appliedVoltage < targetVoltage) {
              newVoltage = Math.min(prev.appliedVoltage + voltageStep, targetVoltage);
            } else {
              setPhase('holding');
              newHoldCounter = 0;
            }
          } else if (phase === 'holding') {
            newHoldCounter = holdCounter + 1;
            setHoldCounter(newHoldCounter);
            if (newHoldCounter >= holdTime) {
              setPhase('ramping_down');
            }
          } else if (phase === 'ramping_down') {
            if (prev.appliedVoltage > startVoltage) {
              newVoltage = Math.max(prev.appliedVoltage - voltageStep, startVoltage);
            } else {
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
  }, [state.isRunning, defectType, prpdData, phase, holdCounter, targetVoltage, voltageStep, holdTime, startVoltage]);

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

  const handleStop = () => {
    setState(prev => ({ ...prev, isRunning: false }));
    // Simular salvamento do arquivo
    const link = document.createElement('a');
    link.href = '/docs/PD6-TETTEX.zip';
    link.download = 'PD6-TETTEX.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('Arquivo PD6-TETTEX.zip salvo com sucesso!');
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => setIsPrinting(false), 300);
    // Simulação visual de print
    console.log('Capturando PRPD e Gráficos...');
  };

  const handleComplete = () => {
    onComplete({
      type: 'Descarga Parcial',
      appliedVoltage: state.appliedVoltage,
      maxPD: pdParams.Qm,
      finalDischargeLevel: pdParams.Qm,
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

  const handleCalibrate = () => {
    setIsCalibrating(true);
    setCalibrationStep(1);
    setTimeout(() => {
      setCalibrationStep(2);
      setTimeout(() => {
        setCalibrationStep(3);
        setIsCalibrated(true);
        setIsCalibrating(false);
        setIsInjecting(false); // Para a injeção após calibrar
        setCalibrationState('Valid');
        setLastCalibrationDate(new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
      }, 2000);
    }, 2000);
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'ramping': return `Subindo tensão... ${(state.appliedVoltage/1000).toFixed(1)} / ${(targetVoltage/1000).toFixed(1)} kV`;
      case 'holding': return `Mantendo ${(targetVoltage/1000).toFixed(1)} kV (${holdCounter}/${holdTime}s)`;
      case 'ramping_down': return `Descendo tensão... ${(state.appliedVoltage/1000).toFixed(1)} / ${(startVoltage/1000).toFixed(1)} kV`;
      case 'finished': return 'Teste concluído';
      default: return '';
    }
  };

  const defectInfo = defectDescriptions[defectType];

  return (
    <div style={{ 
      padding: '15px', 
      maxWidth: '1400px', 
      margin: '0 auto', 
      backgroundColor: isPrinting ? '#fff' : '#0a0a0a', 
      transition: 'background-color 0.1s ease',
      minHeight: '100vh', 
      fontFamily: 'Arial, sans-serif' 
    }}>
      {/* Header Industrial Compacto */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
        <img src={PD_MEASUREMENT_IMAGE} alt="PD" style={{ height: '50px', borderRadius: '4px', border: '1px solid #333' }} />
        <div style={{ flex: 1 }}>
          <h2 style={{ color: '#00ffcc', margin: 0, fontSize: '16px', letterSpacing: '1px' }}>PD ANALYZER & DIAGNOSTIC SYSTEM</h2>
          <div style={{ display: 'flex', gap: '15px', marginTop: '2px' }}>
            <span style={{ color: '#555', fontSize: '9px' }}>MODEL: TETTEX DDX 9101</span>
            <span style={{ color: '#555', fontSize: '9px' }}>|</span>
            <span style={{ color: '#555', fontSize: '9px' }}>STANDARD: IEC 60270</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <button
            onClick={onBack}
            style={{
              padding: '6px 12px',
              backgroundColor: '#111',
              color: '#888',
              border: '1px solid #222',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            ← VOLTAR
          </button>
        </div>
      </div>

      <TabComponent
        tabs={[
          {
            label: 'Explicação',
            icon: '📖',
            content: (
              <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '6px', color: '#333', overflowY: 'auto', maxHeight: '72vh' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #4CAF50', paddingBottom: '10px', marginBottom: '20px' }}>
                  <h3 style={{ color: '#4CAF50', margin: 0, fontSize: '20px' }}>Guia Técnico de Medição de DP (IEC 60270)</h3>
                  <span style={{ fontSize: '10px', color: '#888' }}>Ref: Haefely/Tettex Theory Manual</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  <div>
                    <h4 style={{ color: '#2196F3', fontSize: '15px' }}>1. O que é Descarga Parcial?</h4>
                    <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
                      A ocorrência de Descargas Parciais (DP) nos sistemas isolantes de alta tensão é um sintoma de fragilidade na suportabilidade dielétrica, cuja evolução pode acarretar graves consequências para o equipamento.
                    </p>
                    <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
                      Fisicamente, as DP se caracterizam por um processo de ionização em ambiente gasoso (vazios/cavidades) no interior dos isolantes, causado por um intenso campo elétrico que excede o gradiente máximo suportável pelo dielétrico local.
                    </p>
                    
                    <div style={{ backgroundColor: '#f0f7ff', padding: '12px', borderRadius: '4px', borderLeft: '4px solid #2196F3', fontSize: '11px', marginBottom: '15px' }}>
                      <strong>Importância do Ensaio:</strong>
                      <ul style={{ marginTop: '5px' }}>
                        <li>Diagnóstico prematuro de queda de suportabilidade.</li>
                        <li>Ensaio <strong>não destrutivo</strong> conforme IEC 60270.</li>
                        <li>Monitoramento da deterioração progressiva do material.</li>
                      </ul>
                    </div>

                    <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', fontSize: '11px' }}>
                      <strong>Classificação de Fontes:</strong>
                      <ul style={{ marginTop: '5px' }}>
                        <li><strong>Internas:</strong> Em vazios (voids) ou delaminações.</li>
                        <li><strong>Superficiais:</strong> No cruzamento de interfaces dielétricas.</li>
                        <li><strong>Corona:</strong> Em pontas e arestas afiadas no ar/gás.</li>
                        <li><strong>Partículas:</strong> Movimentação de impurezas metálicas.</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ color: '#2196F3', fontSize: '15px' }}>2. Modelo de Circuito Equivalente</h4>
                    <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
                      O comportamento físico é descrito pelo diagrama de Gemant (Fig 8.2). A relação entre a carga real (q<sub>i</sub>) e a carga aparente medida (q) é:
                    </p>
                    <div style={{ padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                      q = ΔV · C<sub>b</sub>
                    </div>
                    <p style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                      Onde <strong>q</strong> é a carga que, se injetada nos terminais do objeto, causaria a mesma variação de tensão que a descarga interna real.
                    </p>
                  </div>
                </div>

                <h4 style={{ color: '#2196F3', fontSize: '15px', marginTop: '25px' }}>3. Circuito de Medição e Quadripolo (Z<sub>m</sub>)</h4>
                <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
                  A Fig 8.3 detalha o arranjo de ensaio. A corrente de descarga <strong>i(t)</strong> é um pulso extremamente rápido (nanosegundos). Para capturar este sinal, utilizamos um quadripolo de medição (Z<sub>m</sub>) que atua como um filtro passa-faixa.
                </p>
                
                <div style={{ textAlign: 'center', margin: '15px 0' }}>
                  <img src="/images/measuring.png" alt="Circuito de Medição" style={{ maxWidth: '50%', height: 'auto', borderRadius: '4px', border: '1px solid #eee' }} />
                  <p style={{ fontSize: '10px', color: '#888', marginTop: '5px' }}>Figura 8.3: Circuito de Medição Padrão IEC 60270</p>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                  <div style={{ flex: 1, border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '5px' }}>Derivação Matemática (Eq 2.14):</div>
                    <p style={{ fontSize: '10px' }}>A tensão de medição V<sub>m</sub> no domínio da frequência é:</p>
                    <code style={{ fontSize: '12px', color: '#d32f2f' }}>V<sub>m</sub>(ω) = [q / (C<sub>a</sub> + C<sub>k</sub>)] · |Z<sub>m</sub>(ω)|</code>
                    <p style={{ fontSize: '10px', marginTop: '5px' }}>Onde C<sub>k</sub> é o capacitor de acoplamento e C<sub>a</sub> o objeto sob teste.</p>
                  </div>
                  <div style={{ flex: 1, border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '5px' }}>Análise Espectral (Fig 8.6):</div>
                    <p style={{ fontSize: '10px' }}>O pulso de DP possui um espectro largo. O detector integra a área sob o pulso para calcular a carga em pC (Quasi-integration).</p>
                  </div>
                </div>

                <h4 style={{ color: '#2196F3', fontSize: '15px', marginTop: '25px' }}>4. Reconhecimento de Padrão (PRPD)</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#2196F3', color: '#fff' }}>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>Defeito</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>Comportamento em Fase</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>Características Visuais</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}><strong>Corona</strong></td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>Picos de tensão negativa (270°)</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>Pulsos de magnitude constante e alta repetição.</td>
                    </tr>
                    <tr style={{ backgroundColor: '#f9f9f9' }}>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}><strong>Vazios</strong></td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>Cruzamentos por zero (0-90° / 180-270°)</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>Simetria entre semi-ciclos positivo e negativo.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}><strong>Superficial</strong></td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>Início no pico da tensão</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>Padrão assimétrico devido a diferentes polaridades.</td>
                    </tr>
                  </tbody>
                </table>

                <h4 style={{ color: '#2196F3', fontSize: '15px', marginTop: '25px' }}>5. Calibração e Sensibilidade</h4>
                <p style={{ fontSize: '12px', lineHeight: '1.6' }}>
                  De acordo com a seção 8.6, a sensibilidade é limitada pelo ruído ambiente (I<sub>noise</sub>) e pelo setup (C<sub>a</sub>/C<sub>k</sub>). A calibração (Fig 8.5) deve ser feita in-situ para considerar todas as capacitâncias parasitas.
                </p>

                <div style={{ textAlign: 'center', margin: '15px 0' }}>
                  <img src="/images/calibrating.jpg" alt="Circuito de Calibração" style={{ maxWidth: '40%', height: 'auto', borderRadius: '4px', border: '1px solid #eee' }} />
                  <p style={{ fontSize: '10px', color: '#888', marginTop: '5px' }}>Figura 8.5: Procedimento de Calibração com Injetor de Carga</p>
                </div>

                <div style={{ backgroundColor: '#fff9c4', padding: '15px', borderLeft: '5px solid #fbc02d', marginTop: '10px' }}>
                  <strong>Sensibilidade Teórica (q<sub>min</sub>):</strong>
                  <p style={{ fontSize: '11px', margin: '5px 0' }}>q<sub>min</sub> = V<sub>noise,rms</sub> · (C<sub>a</sub> + C<sub>k</sub>) · k<sub>base</sub></p>
                  <p style={{ fontSize: '10px', color: '#555' }}>Para capacitâncias altas do objeto (C<sub>a</sub> &gt; 10 nF), a sensibilidade diminui drasticamente.</p>
                </div>

                <div style={{ marginTop: '25px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
                  <h5 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>Resumo de Fatores de Configuração (Tab 8.1)</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center', fontSize: '10px' }}>
                    <div style={{ border: '1px solid #c8e6c9', padding: '5px' }}>
                      <strong>Setup Normal</strong>
                      <div style={{ fontSize: '12px', fontWeight: 'bold' }}>k = 0.01</div>
                    </div>
                    <div style={{ border: '1px solid #c8e6c9', padding: '5px' }}>
                      <strong>Setup de Filtro</strong>
                      <div style={{ fontSize: '12px', fontWeight: 'bold' }}>k = 0.05</div>
                    </div>
                    <div style={{ border: '1px solid #c8e6c9', padding: '5px' }}>
                      <strong>Digitalização</strong>
                      <div style={{ fontSize: '12px', fontWeight: 'bold' }}>k = 0.10</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '25px' }}>
                  <div>
                    <h4 style={{ color: '#2196F3', fontSize: '15px' }}>6. Tipos de Detectores (IEC 60270 § 4.3)</h4>
                    <p style={{ fontSize: '11px', lineHeight: '1.5' }}>
                      O manual Haefely divide os sistemas em:
                    </p>
                    <ul style={{ fontSize: '11px', paddingLeft: '20px' }}>
                      <li><strong>Banda Larga (Wide-band):</strong> Faixa de 30 kHz a 500 kHz. Captura a forma do pulso mas é mais sensível a ruído industrial.</li>
                      <li><strong>Banda Estreita (Narrow-band):</strong> Sintonizada em uma frequência central (f<sub>0</sub>) com largura de banda Δf. Ideal para evitar interferências de rádio.</li>
                    </ul>
                  </div>
                  <div>
                    <h4 style={{ color: '#2196F3', fontSize: '15px' }}>7. Parâmetros Estatísticos de DP</h4>
                    <p style={{ fontSize: '11px', lineHeight: '1.5' }}>
                      Além da magnitude pico (q<sub>max</sub>), avaliamos:
                    </p>
                    <ul style={{ fontSize: '11px', paddingLeft: '20px' }}>
                      <li><strong>Taxa de Repetição (n):</strong> Número de pulsos por segundo acima de um limiar.</li>
                      <li><strong>Carga Total (Q):</strong> Integral da carga em um ciclo.</li>
                      <li><strong>Dissipação de DP (P<sub>pd</sub>):</strong> P<sub>pd</sub> = Σ q<sub>i</sub> · V<sub>i</sub> · f.</li>
                    </ul>
                  </div>
                </div>

                <h4 style={{ color: '#2196F3', fontSize: '15px', marginTop: '25px' }}>8. Valores de Referência e Critérios de Avaliação</h4>
                <p style={{ fontSize: '12px', lineHeight: '1.6', marginBottom: '15px' }}>
                  Conforme os padrões industriais para equipamentos de alta tensão (ex: 13.8kV), os limites de carga aparente (pC) e tensão de início são cruciais para o diagnóstico.
                </p>

                <div style={{ overflowX: 'auto', marginBottom: '25px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Parâmetro</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd', backgroundColor: '#e8f5e9', color: '#2e7d32' }}>Ótimo</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd', backgroundColor: '#f1f8e9', color: '#558b2f' }}>Bom</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd', backgroundColor: '#fffde7', color: '#fbc02d' }}>Atenção</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd', backgroundColor: '#ffebee', color: '#c62828' }}>Ruim</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>DP (pC)</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>≤ 17.000</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>17.000 - 21.000</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>21.000 - 30.000</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>&gt; 30.000</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Tensão Início</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>≥ 3000 x FV</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>2500 - 3000 x FV</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>2000 - 2500 x FV</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>&lt; 2000 x FV</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ backgroundColor: '#f0f4f8', padding: '15px', borderRadius: '4px', marginBottom: '25px' }}>
                  <h5 style={{ margin: '0 0 10px 0', fontSize: '12px' }}>Tabela de Fator de Tensão (FV) por Tensão Nominal</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', fontSize: '11px', textAlign: 'center' }}>
                    <div style={{ border: '1px solid #d1d9e6', padding: '8px', borderRadius: '4px', backgroundColor: '#fff' }}>
                      <div style={{ fontWeight: 'bold', color: '#2196F3' }}>≥ 13800 V</div>
                      <div style={{ fontSize: '14px', marginTop: '5px' }}>FV = 2,42</div>
                    </div>
                    <div style={{ border: '1px solid #d1d9e6', padding: '8px', borderRadius: '4px', backgroundColor: '#fff' }}>
                      <div style={{ fontWeight: 'bold', color: '#2196F3' }}>11000 V</div>
                      <div style={{ fontSize: '14px', marginTop: '5px' }}>FV = 1,96</div>
                    </div>
                    <div style={{ border: '1px solid #d1d9e6', padding: '8px', borderRadius: '4px', backgroundColor: '#fff' }}>
                      <div style={{ fontWeight: 'bold', color: '#2196F3' }}>6600 V</div>
                      <div style={{ fontSize: '14px', marginTop: '5px' }}>FV = 1,21</div>
                    </div>
                    <div style={{ border: '1px solid #d1d9e6', padding: '8px', borderRadius: '4px', backgroundColor: '#fff' }}>
                      <div style={{ fontWeight: 'bold', color: '#2196F3' }}>4160 V</div>
                      <div style={{ fontSize: '14px', marginTop: '5px' }}>FV = 0,75</div>
                    </div>
                    <div style={{ border: '1px solid #d1d9e6', padding: '8px', borderRadius: '4px', backgroundColor: '#fff' }}>
                      <div style={{ fontWeight: 'bold', color: '#2196F3' }}>3300 V</div>
                      <div style={{ fontSize: '14px', marginTop: '5px' }}>FV = 0,6</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '10px', textAlign: 'center' }}>
                  <p style={{ fontSize: '10px', color: '#999' }}>
                    Q[IEC]: Picos de Descargas conforme norma IEC 60270 (pC) | INFORMAÇÃO CONFIDENCIAL – PROIBIDA SUA REPRODUÇÃO
                  </p>
                </div>
              </div>
            )
          },
          {
            label: 'Calibração',
            icon: '🎯',
            content: (
              <div style={{ backgroundColor: '#000', borderRadius: '4px', border: '1px solid #333', display: 'flex', height: '600px', overflow: 'hidden', fontFamily: 'Arial, sans-serif' }}>
                
                {/* ÁREA CENTRAL: GRÁFICO DE PULSOS (LADO ESQUERDO) */}
                <div style={{ flex: 4, position: 'relative', borderRight: '1px solid #222', padding: '10px' }}>
                  <ScopeChart 
                    points={[]} 
                    voltage={0} 
                    isCalibration={true} 
                    isInjecting={isInjecting}
                    isCalibrated={isCalibrated}
                    calibrationPulse={calibrationPulse}
                    ambientNoise={ambientNoise}
                    autoScale={autoScale}
                  />
                </div>

                {/* PAINEL DIREITO: METERS & CALIBRATION SETTINGS */}
                <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', backgroundColor: '#0a0a0a' }}>
                  
                  {/* BLOCO METERS (Topo Direita) */}
                  <div style={{ padding: '15px', borderBottom: '1px solid #222', flex: 1 }}>
                    <div style={{ backgroundColor: '#ff3366', color: '#fff', fontSize: '9px', padding: '2px 8px', display: 'inline-block', marginBottom: '10px' }}>1:1</div>
                    <div style={{ color: '#aaa', fontSize: '11px', textAlign: 'right', marginBottom: '20px' }}>Meters</div>
                    
                    <div style={{ textAlign: 'right', marginBottom: '25px' }}>
                      <div style={{ color: '#888', fontSize: '10px' }}>Charge [IEC]</div>
                      <div style={{ color: '#eee', fontSize: '32px', fontFamily: 'monospace' }}>{(isCalibrated || isInjecting) ? calibrationPulse.toFixed(1) : '0.0'} pC</div>
                    </div>

                    <div style={{ textAlign: 'right', marginBottom: '25px' }}>
                      <div style={{ color: '#888', fontSize: '10px' }}>Voltage [RMS]</div>
                      <div style={{ color: '#eee', fontSize: '32px', fontFamily: 'monospace' }}>0.025 V</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#888', fontSize: '10px' }}>Frequency [Voltage]</div>
                      <div style={{ color: '#eee', fontSize: '32px', fontFamily: 'monospace' }}>50.00 Hz</div>
                    </div>
                  </div>

                  {/* BLOCO CALIBRATION CONTROL (Base Direita) - REFEITO CONFORME IMAGEM */}
                  <div style={{ padding: '15px', color: '#ccc', fontSize: '11px' }}>
                    
                    <div style={{ marginBottom: '8px', color: '#aaa' }}>Noise & Scaling</div>
                    <div style={{ backgroundColor: '#2a2a2a', padding: '10px', marginBottom: '15px', border: '1px solid #333' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span>Ruído Ambiente</span>
                        <input 
                          type="range" min="0" max="10" step="0.1" 
                          value={ambientNoise}
                          onChange={(e) => setAmbientNoise(parseFloat(e.target.value))}
                          style={{ width: '80px' }}
                        />
                        <span style={{ color: '#d4ff00', width: '35px', textAlign: 'right' }}>{ambientNoise.toFixed(1)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Auto Scale</span>
                        <input 
                          type="checkbox" 
                          checked={autoScale}
                          onChange={(e) => setAutoScale(e.target.checked)}
                          style={{ accentColor: '#3a86ff' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '8px', color: '#aaa' }}>Detector Calibration</div>
                    
                    <div style={{ 
                      backgroundColor: '#383838', 
                      padding: '12px', 
                      borderRadius: '0px', 
                      border: '1px solid #4a4a4a',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      
                      {/* Grid de Inputs: Charge e Factor */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <div style={{ marginBottom: '4px', color: '#eee', fontSize: '10px' }}>Charge</div>
                          <select 
                            value={calibrationPulse}
                            onChange={(e) => setCalibrationPulse(parseInt(e.target.value))}
                            disabled={isCalibrating}
                            style={{ 
                              backgroundColor: '#1a1a1a', 
                              border: '1px solid #777', 
                              padding: '5px 4px', 
                              color: '#fff', 
                              fontSize: '12px',
                              width: '100%',
                              outline: 'none'
                            }}
                          >
                            <option value={10}>10 pC</option>
                            <option value={50}>50 pC</option>
                            <option value={100}>100 pC</option>
                            <option value={200}>200 pC</option>
                            <option value={500}>500 pC</option>
                          </select>
                        </div>
                        <div>
                          <div style={{ marginBottom: '4px', color: '#eee', fontSize: '10px' }}>Factor [pC/mV]</div>
                          <div style={{ 
                            backgroundColor: '#1a1a1a', 
                            border: '1px solid #777', 
                            padding: '4px', 
                            color: '#fff', 
                            fontSize: '12px'
                          }}>
                            <input 
                              type="number" 
                              value={calibrationFactor}
                              onChange={(e) => setCalibrationFactor(parseFloat(e.target.value) || 0)}
                              style={{ background: 'none', border: 'none', color: '#fff', width: '100%', outline: 'none', fontSize: '12px' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Botões Calibrate e Set */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button 
                          onClick={() => {
                            if (!isInjecting) setIsInjecting(true);
                            handleCalibrate();
                          }}
                          disabled={isCalibrating}
                          style={{ 
                            padding: '5px', 
                            backgroundColor: '#444', 
                            color: isCalibrating ? '#888' : '#eee', 
                            border: '1px solid #666', 
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          Calibrate
                        </button>
                        <button 
                          onClick={() => {
                            setCalibrationState('Valid');
                            setLastCalibrationDate(new Date().toLocaleString('pt-BR'));
                          }}
                          style={{ 
                            padding: '5px', 
                            backgroundColor: '#444', 
                            color: '#eee', 
                            border: '1px solid #666', 
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          Set
                        </button>
                      </div>

                      {/* Status Information */}
                      <div style={{ marginTop: '5px', fontSize: '10px', color: '#bbb', lineHeight: '1.4' }}>
                        <div>Last Calibration Date: <span style={{ color: '#eee' }}>{lastCalibrationDate}</span></div>
                        <div>Current State: <span style={{ color: calibrationState === 'Valid' ? '#00ffcc' : '#ff4444', fontWeight: 'bold' }}>{calibrationState}</span></div>
                      </div>

                      {isCalibrating && (
                         <div style={{ color: '#00ffff', fontSize: '9px', fontFamily: 'monospace', marginTop: '4px' }}>
                            {calibrationStep === 1 && '>> BUSCANDO PULSO...'}
                            {calibrationStep === 2 && '>> CALCULANDO FATOR...'}
                            {calibrationStep === 3 && '>> CALIBRAÇÃO OK'}
                         </div>
                      )}

                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            label: 'Medição',
            icon: '📊',
            content: (
              <div style={{ backgroundColor: '#050505', padding: '10px', borderRadius: '4px' }}>
                {!isCalibrated && (
                  <div style={{ backgroundColor: '#331100', color: '#ffaa00', padding: '8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #552200', marginBottom: '10px', textAlign: 'center' }}>
                    ⚠️ ATENÇÃO: O SISTEMA NÃO FOI CALIBRADO. OS VALORES DE pC PODEM ESTAR INCORRETOS.
                  </div>
                )}
                
                {/* DASHBOARD 2x2 GRID */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gridTemplateRows: 'repeat(2, 300px)', 
                  gap: '15px',
                  marginBottom: '10px'
                }}>
                  
                  {/* TOP LEFT: PRPD VIEW */}
                  <div style={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '4px', padding: '10px', position: 'relative' }}>
                    <div style={{ color: '#444', fontSize: '8px', position: 'absolute', top: '8px', right: '12px' }}>DISTR: {defectInfo.name.toUpperCase()}</div>
                    <PRPDChartImproved 
                      data={prpdData} 
                      title="PHASE RESOLVED PD (PRPD)" 
                      width={600} 
                      height={260} 
                      defectType={defectType} 
                      autoScale={autoScale}
                    />
                  </div>

                  {/* TOP RIGHT: WAVEFORM VIEW */}
                  <div style={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '4px', padding: '10px', position: 'relative' }}>
                    <ScopeChart 
                      points={prpdData} 
                      voltage={state.appliedVoltage} 
                      ambientNoise={ambientNoise}
                      autoScale={autoScale}
                    />
                  </div>

                  {/* BOTTOM LEFT: TRENDING VIEW */}
                  <div style={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '4px', padding: '10px' }}>
                    <ChargeVoltageChart data={chargeVoltageHistory} title="TRENDING (Q vs V over Time)" width={600} height={260} maxVoltage={targetVoltage} />
                  </div>

                  {/* BOTTOM RIGHT: METERS & CONTROLS */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {/* Metrics Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ backgroundColor: '#0a0a0a', padding: '12px', borderRadius: '4px', border: '1px solid #222', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ color: '#555', fontSize: '9px', textTransform: 'uppercase' }}>Peak Magnitude (Qm)</div>
                        <div style={{ color: getSeverityColor(pdParams.severity), fontSize: '32px', fontFamily: 'monospace', fontWeight: 'bold' }}>{pdParams.Qm.toFixed(2)}</div>
                        <div style={{ color: '#333', fontSize: '10px' }}>nC</div>
                      </div>
                      <div style={{ backgroundColor: '#0a0a0a', padding: '8px', borderRadius: '4px', border: '1px solid #222' }}>
                        <div style={{ color: '#444', fontSize: '8px' }}>VOLTAGE (RMS)</div>
                        <div style={{ color: '#ff6600', fontSize: '18px', fontFamily: 'monospace', fontWeight: 'bold' }}>{(state.appliedVoltage / 1000).toFixed(1)} kV</div>
                      </div>
                      <div style={{ backgroundColor: '#0a0a0a', padding: '8px', borderRadius: '4px', border: '1px solid #222' }}>
                        <div style={{ color: '#444', fontSize: '8px' }}>SEVERITY</div>
                        <div style={{ color: getSeverityColor(pdParams.severity), fontSize: '11px', fontWeight: 'bold' }}>{pdParams.severity.toUpperCase()}</div>
                      </div>
                    </div>

                    {/* Controls Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#0f0f0f', padding: '12px', borderRadius: '4px', border: '1px solid #1a1a1a' }}>
                      <div style={{ fontSize: '9px', color: '#555' }}>CONTROL CENTER</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444', fontSize: '8px', marginBottom: '3px' }}>
                          <span>TARGET VOLTAGE</span>
                          <span>{(targetVoltage/1000).toFixed(1)} kV</span>
                        </div>
                        <input type="range" min="3000" max="15000" step="500" value={targetVoltage} onChange={(e) => setTargetVoltage(parseInt(e.target.value))} disabled={state.isRunning} style={{ width: '100%', accentColor: '#ff6600' }} />
                      </div>
                      
                      <div style={{ padding: '5px', backgroundColor: '#000', borderRadius: '3px', border: '1px solid #222' }}>
                         <div style={{ color: '#00ff00', fontSize: '8px', fontFamily: 'monospace' }}>
                           {state.isRunning ? `> ${getPhaseText()}` : '> SYSTEM READY'}
                         </div>
                      </div>

                    {!state.isRunning ? (
                      <button onClick={handleStart} style={{ padding: '10px', backgroundColor: '#003311', color: '#00ff00', border: '1px solid #005522', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>START TEST</button>
                    ) : (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={handleStop} style={{ flex: 1, padding: '10px', backgroundColor: '#330000', color: '#ff3333', border: '1px solid #550000', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>STOP TEST</button>
                        <button onClick={handlePrint} style={{ flex: 1, padding: '10px', backgroundColor: '#332200', color: '#ffcc00', border: '1px solid #553300', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>PRINT</button>
                      </div>
                    )}
                      <button 
                        onClick={handleComplete} 
                        disabled={state.measurements.length === 0} 
                        style={{ 
                          padding: '10px 15px', 
                          backgroundColor: state.measurements.length === 0 ? '#111' : '#2e7d32', 
                          color: state.measurements.length === 0 ? '#333' : '#ffffff', 
                          border: '1px solid #004488', 
                          borderRadius: '4px', 
                          cursor: state.measurements.length === 0 ? 'not-allowed' : 'pointer', 
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                      >
                        CONCLUIR E ENVIAR
                      </button>
                    </div>
                  </div>
                </div>

                <EnvironmentalData />
              </div>
            )
          }
        ]}
      />

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.2; }
        }
        input[type=range] {
          -webkit-appearance: none;
          background: #111;
          height: 4px;
          border-radius: 2px;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 14px;
          width: 7px;
          background: #ff6600;
          cursor: pointer;
          border-radius: 1px;
        }
      `}</style>
    </div>
  );
};

export default PartialDischargeScreen;
