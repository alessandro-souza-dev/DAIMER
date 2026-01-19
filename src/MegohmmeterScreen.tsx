import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MegohmmeterState } from './types';
import EnvironmentalData from './EnvironmentalData';
import DualAxisChart from './DualAxisChart';
import TestInfo from './TestInfo';
import TabComponent from './TabComponent';

interface MegohmmeterScreenProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

// Componente de Knob Rotativo Interativo
interface KnobProps {
  value: number | string;
  options: { value: number | string; label: string; angle: number }[];
  onChange: (value: number | string) => void;
  size?: number;
  disabled?: boolean;
  label?: string;
}

const RotaryKnob: React.FC<KnobProps> = ({ value, options, onChange, size = 80, disabled = false, label }) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const currentOption = options.find(o => o.value === value) || options[0];
  const currentAngle = currentOption?.angle || 0;

  const getAngleFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!knobRef.current) return 0;
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    return Math.atan2(y, x) * (180 / Math.PI) + 90;
  }, []);

  const findClosestOption = useCallback((angle: number) => {
    let normalizedAngle = angle % 360;
    if (normalizedAngle < 0) normalizedAngle += 360;
    
    let closest = options[0];
    let minDiff = Math.abs(normalizedAngle - options[0].angle);
    
    options.forEach(opt => {
      const diff = Math.abs(normalizedAngle - opt.angle);
      if (diff < minDiff) {
        minDiff = diff;
        closest = opt;
      }
    });
    
    return closest;
  }, [options]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    
    // Get angle from click
    if (!knobRef.current) return;
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    const angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    
    const closest = findClosestOption(angle);
    if (closest.value !== value) {
      onChange(closest.value);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || disabled) return;
      const angle = getAngleFromEvent(e);
      const closest = findClosestOption(angle);
      if (closest.value !== value) {
        onChange(closest.value);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, disabled, getAngleFromEvent, findClosestOption, value, onChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
      {label && <div style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{label}</div>}
      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #3a3a3a, #1a1a1a)',
          boxShadow: isDragging 
            ? '0 0 15px rgba(255,215,0,0.5), inset 0 2px 5px rgba(0,0,0,0.5)'
            : '0 4px 8px rgba(0,0,0,0.5), inset 0 2px 5px rgba(0,0,0,0.3)',
          cursor: disabled ? 'not-allowed' : 'grab',
          position: 'relative',
          border: '3px solid #555',
          transition: 'box-shadow 0.2s',
          opacity: disabled ? 0.6 : 1
        }}
      >
        {/* Indicador do knob */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '4px',
            height: size / 2 - 8,
            background: 'linear-gradient(to bottom, #ffd700, #ff8c00)',
            borderRadius: '2px',
            transformOrigin: 'bottom center',
            transform: `translate(-50%, -100%) rotate(${currentAngle}deg)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            boxShadow: '0 0 5px rgba(255,215,0,0.5)'
          }}
        />
        {/* Centro do knob */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: size / 4,
            height: size / 4,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #555, #333)',
            border: '2px solid #666'
          }}
        />
      </div>
      <div style={{ 
        color: '#ffd700', 
        fontSize: '11px', 
        fontWeight: 'bold',
        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        background: 'rgba(0,0,0,0.6)',
        padding: '2px 8px',
        borderRadius: '4px'
      }}>
        {currentOption?.label || value}
      </div>
    </div>
  );
};

const MegohmmeterScreen: React.FC<MegohmmeterScreenProps> = ({ onComplete, onBack }) => {
  const IP_DURATION = 600;
  const DD_CHARGE_DURATION = 1800; // 30 minutos de carga
  const DD_DISCHARGE_DURATION = 60; // 1 minuto de descarga
  const SV_STEP_DURATION = 60;
  const SV_STEPS_COUNT = 5;

  const getTimeStep = (mode: string, time?: number) => {
    if (mode === 'DD') {
      // Durante a fase de descarga (após 30 min), usar timeStep menor para mais pontos
      if (time !== undefined && time >= DD_CHARGE_DURATION) {
        return 1; // 1 segundo durante descarga para curva suave
      }
      return 5; // 5 segundos durante carga
    }
    if (mode === 'SV') return 5;
    if (mode === 'IP') return 2; // Mais pontos para gráfico IP mais suave
    return 30;
  };

  const getMaxTime = (mode: string) => {
    if (mode === 'IP') return IP_DURATION;
    if (mode === 'DD') return DD_CHARGE_DURATION + DD_DISCHARGE_DURATION;
    return SV_STEP_DURATION * SV_STEPS_COUNT;
  };

  const getSvSteps = (voltage: number) =>
    Array.from({ length: SV_STEPS_COUNT }, (_, index) => Math.round(((index + 1) / SV_STEPS_COUNT) * voltage));

  const [state, setState] = useState<MegohmmeterState>({
    testMode: 'IP',
    testVoltage: 500,
    isRunning: false,
    appliedVoltage: 0,
    resistance: 0,
    current: 0,
    timeConstant: 0,
    capacitanceCC: 0,
    absorptionIndex: undefined,
    polarizationIndex: undefined,
    ddIndex: undefined,
    r30s: undefined,
    r60s: undefined,
    r600s: undefined,
    sv1m: undefined,
    sv2m: undefined,
    sv3m: undefined,
    sv4m: undefined,
    time: 0,
    measurements: []
  });

  const [chartData, setChartData] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartCurrentData, setChartCurrentData] = useState<number[]>([]);
  const [ddChargeCurrent, setDdChargeCurrent] = useState<number[]>([]);
  const [ddDischargeCurrent, setDdDischargeCurrent] = useState<number[]>([]);
  const [svChartData, setSvChartData] = useState<number[]>([]);
  const [svChartCurrentData, setSvChartCurrentData] = useState<number[]>([]);
  const [svChartLabels, setSvChartLabels] = useState<string[]>([]);

  useEffect(() => {
    // Quando teste SV termina e temos dados do gráfico, criar medições
    if (!state.isRunning && state.testMode === 'SV' && svChartData.length > 0) {
      // Verificar se já há medições SV para evitar duplicatas
      const alreadyHasSvMeasurements = state.measurements.some(m => m.mode === 'SV');
      
      if (!alreadyHasSvMeasurements) {
        const newMeasurements: any[] = [];
        for (let i = 0; i < Math.min(svChartData.length, 5); i++) {
          const measurement: any = {
            mode: 'SV',
            voltage: parseInt(svChartLabels[i]),
            resistance: svChartData[i],
            current: svChartCurrentData[i],
            timeConstant: (svChartData[i] * 69) / 1000,
            capacitanceCC: 69,
            absorptionIndex: undefined,
            polarizationIndex: undefined,
            time: state.time,
            sv1m: state.sv1m,
            sv2m: state.sv2m,
            sv3m: state.sv3m,
            sv4m: state.sv4m
          };
          newMeasurements.push(measurement);
        }
        
        setState(prev => ({
          ...prev,
          measurements: [...prev.measurements, ...newMeasurements]
        }));
      }
    }
  }, [state.isRunning, state.testMode, svChartData.length]);

  useEffect(() => {
    let interval: any;

    if (state.isRunning) {
      interval = setInterval(() => {
        setState(prev => {
          const timeStep = getTimeStep(prev.testMode, prev.time);
          const maxTime = getMaxTime(prev.testMode);
          const newTime = Math.min(prev.time + timeStep, maxTime);

          let appliedVoltage = prev.testVoltage;
          let resistance = prev.resistance;
          let current = prev.current;
          let capacitanceCC = prev.capacitanceCC;
          let timeConstant = prev.timeConstant;
          let r30s = prev.r30s;
          let r60s = prev.r60s;
          let r600s = prev.r600s;
          let sv1m = prev.sv1m;
          let sv2m = prev.sv2m;
          let sv3m = prev.sv3m;
          let sv4m = prev.sv4m;
          let r15s = (prev as any).r15s;
          let r180s = (prev as any).r180s;

          if (prev.testMode === 'SV') {
            const steps = getSvSteps(prev.testVoltage);
            const stepIndex = Math.min(Math.floor(newTime / SV_STEP_DURATION), steps.length - 1);

            appliedVoltage = steps[stepIndex];
            
            // Simulação baseada no cenário
            if (prev.svScenario === 'great') {
                // Ótimo: Resistência aumenta com a tensão
                // Base 1200 + aumento de ~10% a cada step
                resistance = 1200 * (1 + (stepIndex * 0.1)) + Math.random() * 15;
            } else if (prev.svScenario === 'good') {
                // Bom: Resistência se mantém estável ou leve aumento
                resistance = 1200 + stepIndex * 15 + Math.random() * 15;
            } else if (prev.svScenario === 'warning') {
                // Atenção: Queda de até 35% em algum step
                // Vamos simular uma queda progressiva que atinge ~20-30% no último step
                const dropFactor = stepIndex * 0.07; // 4 * 0.07 = 28% de queda no final
                resistance = 1200 * (1 - dropFactor) + Math.random() * 10;
            } else if (prev.svScenario === 'dangerous') {
                // Perigoso: Queda acima de 35%
                // Queda brusca a partir do 3º step ou progressiva forte
                const dropFactor = stepIndex * 0.15; // 4 * 0.15 = 60% queda no final
                resistance = 1200 * (1 - dropFactor) + Math.random() * 10;
            } else {
                 // Fallback sem cenário
                 resistance = 1200 + stepIndex * 120 + Math.random() * 15;
            }

            // Garante que não fique negativo ou zero (casos extremos random)
            resistance = Math.max(10, resistance);

            current = appliedVoltage / resistance;
            capacitanceCC = 69 + (Math.random() - 0.5) * 3;
            timeConstant = (resistance * capacitanceCC) / 1000;

            // Coletar dados APENAS ao final de cada step (mudança de tensão)
            // Os pontos devem ser coletados em 1m, 2m, 3m, 4m, 5m
            if (newTime > 0 && newTime % 60 === 0) {
              // Pegamos os valores anteriores (do final do minuto) para registrar
              // O step que acabou de terminar corresponde ao índice: (newTime/60) - 1
              const recordedStepIndex = (newTime / 60) - 1;
              const recordedVoltage = steps[recordedStepIndex];
              
              setSvChartData(prevData => [...prevData, prev.resistance]);
              setSvChartCurrentData(prevData => [...prevData, prev.current]);
              setSvChartLabels(prevLabels => [...prevLabels, `${recordedVoltage}`]);
            }
            
            // Adicionar label só quando entra em um novo step (Removido - agora labels são adicionados com os dados)

            // Capturar leituras de fim de step (1m, 2m, 3m, 4m)
            // Usamos prev.resistance pois representa o valor ao final do step anterior
            if (prev.time < 60 && newTime >= 60) sv1m = prev.resistance;
            if (prev.time < 120 && newTime >= 120) sv2m = prev.resistance;
            if (prev.time < 180 && newTime >= 180) sv3m = prev.resistance;
            if (prev.time < 240 && newTime >= 240) sv4m = prev.resistance;

          } else if (prev.testMode === 'DD') {
            const chargePhase = newTime <= DD_CHARGE_DURATION;
            const chargeTime = Math.min(newTime, DD_CHARGE_DURATION);
            const dischargeTime = Math.max(0, newTime - DD_CHARGE_DURATION);

            appliedVoltage = chargePhase ? prev.testVoltage : 0;

            const baseResistance = 900 + Math.log(chargeTime / 60 + 1) * 900;
            resistance = baseResistance + (Math.random() - 0.5) * 10;

            let chargeCurrent = 0;
            let dischargeCurrent = 0;
            
            // Corrente máxima inicial de carga (para referência do pico de descarga)
            const maxChargeCurrent = 7.0;
            // Corrente final de carga (estabilizada)
            const finalChargeCurrent = 0.3;

            if (chargePhase) {
              // Curva de carga com joelho mais acentuado (decaimento exponencial mais rápido no início)
              // Usando constante de tempo menor (60s) para decaimento mais rápido
              chargeCurrent = (maxChargeCurrent - finalChargeCurrent) * Math.exp(-chargeTime / 60) + finalChargeCurrent;
              dischargeCurrent = 0;
              current = chargeCurrent;
              // Coletar pontos de carga (plota até 30 min)
              setDdChargeCurrent(prevData => [...prevData, chargeCurrent]);
              setDdDischargeCurrent(prevData => [...prevData, 0]);
              setChartLabels(prevLabels => [...prevLabels, formatTime(newTime)]);
              
              // Se este é o último ponto da fase de carga (exatamente 30 min), 
              // adiciona também o ponto inicial da descarga para continuidade visual
              if (newTime === DD_CHARGE_DURATION) {
                // Adiciona ponto de transição: carga termina e descarga começa no mesmo valor
                setDdChargeCurrent(prevData => [...prevData, 0]);
                setDdDischargeCurrent(prevData => [...prevData, -finalChargeCurrent]);
                setChartLabels(prevLabels => [...prevLabels, formatTime(newTime)]);
              }
            } else if (dischargeTime <= DD_DISCHARGE_DURATION) {
              // Fase de descarga: começa em 30 min
              // Valor inicial da descarga = valor final da carga (negativo)
              // Pico de descarga = ~1.3x a corrente máxima de carga (negativo)
              const peakDischargeCurrent = -(maxChargeCurrent * 1.3);
              // A descarga começa no valor final da carga (negativo) e vai até o pico rapidamente
              // Depois decai de volta tentando ir a zero com curva suave (joelho)
              const peakTime = 3; // tempo para atingir o pico (3 segundos) - descida rápida
              const decayTime = 25; // constante de tempo maior para retorno suave
              
              if (dischargeTime <= peakTime) {
                // Descida rápida do valor inicial até o pico (exponencial rápido)
                const t = dischargeTime / peakTime;
                // Usar curva exponencial para descida mais natural
                const expFactor = 1 - Math.exp(-3 * t); // Curva exponencial rápida
                dischargeCurrent = -finalChargeCurrent + (peakDischargeCurrent + finalChargeCurrent) * expFactor;
              } else {
                // Retorno suave do pico tentando ir a zero (joelho exponencial)
                const timeAfterPeak = dischargeTime - peakTime;
                dischargeCurrent = peakDischargeCurrent * Math.exp(-timeAfterPeak / decayTime);
              }
              
              chargeCurrent = 0;
              current = Math.abs(dischargeCurrent);
              // Carga fica em 0 após 30 min, descarga começa a ser plotada
              setDdChargeCurrent(prevData => [...prevData, 0]);
              setDdDischargeCurrent(prevData => [...prevData, dischargeCurrent]);
              setChartLabels(prevLabels => [...prevLabels, formatTime(newTime)]);
            }

            capacitanceCC = 69 + (Math.random() - 0.5) * 3;
            timeConstant = (resistance * capacitanceCC) / 1000;
            
            // Calcular DD em 31 min (1860 segundos) - 1 minuto após remoção da tensão
            // DD = I1min / (V × C)
            // I1min = corrente de descarga em mA, 1 minuto após remoção da tensão
            // V = tensão de teste em Volts
            // C = capacitância em Farads
            const DD_CALC_TIME = 1860; // 31 minutos em segundos (30 min carga + 1 min descarga)
            if (newTime >= DD_CALC_TIME && !prev.ddIndex) {
              // Converter unidades:
              // current está em μA -> converter para mA: dividir por 1000
              // capacitanceCC está em nF -> converter para F: dividir por 10^9
              // testVoltage está em V (já correto)
              const currentMA = current / 1000; // μA para mA
              const capacitanceF = capacitanceCC / 1e9; // nF para F
              const ddValue = currentMA / (prev.testVoltage * capacitanceF);
              return {
                ...prev,
                time: newTime,
                appliedVoltage,
                resistance,
                current,
                capacitanceCC,
                timeConstant,
                ddIndex: ddValue
              };
            }
          } else {
            const tMin = newTime / 60;
            
            // Simulação baseada no cenário IP
            let targetPI = 3.0;
            let k = 0.5; // inclinação da curva log

            if (prev.ipScenario === 'poor') {
                 // PI < 1
                 // Resistência plana ou caindo
                 targetPI = 0.9;
                 k = Math.log10(targetPI); // negativo ou zero
            } else if (prev.ipScenario === 'questionable') {
                 // 1 <= PI <= 2
                 targetPI = 1.5;
                 k = Math.log10(targetPI); 
            } else if (prev.ipScenario === 'acceptable') {
                 // 2 <= PI <= 4
                 targetPI = 3.0; // Padrão
                 k = Math.log10(targetPI);
            } else if (prev.ipScenario === 'good') {
                 // PI > 4
                 targetPI = 6.0;
                 k = Math.log10(targetPI);
            }

            // R(t) = R1min * t^k (com t em minutos)
            const r1minBase = 800 + Math.random() * 50; 
            const safeTMin = Math.max(tMin, 1/60); // 1s min
            
            resistance = r1minBase * Math.pow(safeTMin, k) + (Math.random() - 0.5) * 5;

            current = prev.testVoltage / resistance;
            capacitanceCC = 69 + (Math.random() - 0.5) * 3;
            timeConstant = (resistance * capacitanceCC) / 1000;
            
            if (!r15s && newTime >= 15) r15s = resistance;
            if (!r30s && newTime >= 30) r30s = resistance;
            if (!r60s && newTime >= 60) r60s = resistance;
            if (!r180s && newTime >= 180) r180s = resistance;
            if (!r600s && newTime >= 600) r600s = resistance;

            setChartData(prevData => [...prevData, resistance]);
            setChartCurrentData(prevData => [...prevData, current]);
            setChartLabels(prevLabels => [...prevLabels, formatTime(newTime)]);
          }

          // DA = R3min / R30s
          const daIndex = r180s && r30s ? r180s / r30s : (prev as any).daIndex;
          // DAR = R60s / R30s (Dielectric Absorption Ratio)
          const darIndex = r60s && r30s ? r60s / r30s : (prev as any).darIndex;
          // IA = R1min / R30s
          const absorptionIndex = r60s && r30s ? r60s / r30s : prev.absorptionIndex;
          // IP = R10min / R1min
          const polarizationIndex = r60s && r600s ? r600s / r60s : prev.polarizationIndex;

          const newState = {
            ...prev,
            time: newTime,
            appliedVoltage,
            resistance,
            current,
            timeConstant,
            capacitanceCC,
            r15s,
            r30s,
            r60s,
            r180s,
            r600s,
            sv1m,
            sv2m,
            sv3m,
            sv4m,
            absorptionIndex,
            polarizationIndex,
            daIndex,
            darIndex: darIndex
          };

          if (newTime >= maxTime) {
            let newMeasurements = [...prev.measurements];

            if (newState.testMode === 'SV') {
              // Para SV, as medições serão criadas em um useEffect que monitora svChartData
              // Por enquanto, não fazer nada aqui - as medições são criadas no useEffect
            } else {
              let measurement: any = {
                mode: newState.testMode,
                voltage: newState.testVoltage,
                resistance: newState.resistance,
                current: newState.current,
                timeConstant: newState.timeConstant,
                capacitanceCC: newState.capacitanceCC,
                absorptionIndex: newState.absorptionIndex,
                polarizationIndex: newState.polarizationIndex,
                time: newState.time
              };

              if (newState.testMode === 'IP') {
                measurement.r15s = newState.r15s;
                measurement.r30s = newState.r30s;
                measurement.r60s = newState.r60s;
                measurement.r180s = newState.r180s;
                measurement.r600s = newState.r600s;
                measurement.daIndex = newState.daIndex;
                measurement.darIndex = (newState as any).darIndex;
              }
              if (newState.testMode === 'DD') {
                measurement.ddIndex = newState.ddIndex;
              }

              newMeasurements.push(measurement);
            }

            return {
              ...newState,
              isRunning: false,
              measurements: newMeasurements
            };
          }

          return newState;
        });
      }, 67);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isRunning, state.testVoltage, state.testMode]);

  const startTest = () => {
    setChartData([]);
    setChartLabels([]);
    setChartCurrentData([]);
    setDdChargeCurrent([]);
    setDdDischargeCurrent([]);
    setSvChartData([]);
    setSvChartCurrentData([]);
    setSvChartLabels([]);

    // Sortear cenário para SV
    const svScenarios: ('great' | 'good' | 'warning' | 'dangerous')[] = ['great', 'good', 'warning', 'dangerous'];
    const randomSvScenario = svScenarios[Math.floor(Math.random() * svScenarios.length)];
    
    // Sortear cenário para IP
    const ipScenarios: ('poor' | 'questionable' | 'acceptable' | 'good')[] = ['poor', 'questionable', 'acceptable', 'good'];
    const randomIpScenario = ipScenarios[Math.floor(Math.random() * ipScenarios.length)];

    setState(prev => ({
      ...prev,
      isRunning: true,
      time: 0,
      appliedVoltage: 0,
      resistance: 0,
      current: 0,
      timeConstant: 0,
      capacitanceCC: 0,
      absorptionIndex: undefined,
      polarizationIndex: undefined,
      ddIndex: undefined,
      r15s: undefined,
      r30s: undefined,
      r60s: undefined,
      r180s: undefined,
      r600s: undefined,
      daIndex: undefined,
      svScenario: randomSvScenario,
      ipScenario: randomIpScenario
    }));
  };

  const stopTest = () => {
    setState(prev => {
      const measurement = {
        mode: prev.testMode,
        voltage: prev.testVoltage,
        resistance: prev.resistance,
        current: prev.current,
        timeConstant: prev.timeConstant,
        capacitanceCC: prev.capacitanceCC,
        absorptionIndex: prev.absorptionIndex,
        polarizationIndex: prev.polarizationIndex,
        time: prev.time
      };

      return {
        ...prev,
        isRunning: false,
        measurements: [...prev.measurements, measurement]
      };
    });
  };

  const sendToPlatform = () => {
    const data = {
      type: 'megohmmeter',
      measurements: state.measurements,
      testMode: state.testMode,
      testVoltage: state.testVoltage,
      finalResistance: state.resistance,
      finalCurrent: state.current,
      timeConstant: state.timeConstant,
      capacitanceCC: state.capacitanceCC,
      absorptionIndex: state.absorptionIndex,
      polarizationIndex: state.polarizationIndex,
      totalTime: state.time
    };

    onComplete(data);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSvDiagnosis = (scenario: string | undefined): { label: string, color: string, reason: string } => {
    if (!scenario) return { label: '---', color: '#666', reason: '' };
    switch(scenario) {
      case 'great': return { 
          label: 'ÓTIMO', 
          color: '#81C784',
          reason: 'Resistência de isolamento aumentou com o aumento da tensão, indicando boas condições do isolante e efeito de polarização.'
      };
      case 'good': return { 
          label: 'BOM', 
          color: '#4CAF50',
          reason: 'Resistência de isolamento manteve-se estável com o aumento da tensão.'
      };
      case 'warning': return { 
          label: 'ATENÇÃO', 
          color: '#ffc107',
          reason: 'Identificada queda de resistência de isolamento de até 35% durante os degraus de tensão.'
      };
      case 'dangerous': return { 
          label: 'PERIGOSO', 
          color: '#ff6b6b',
          reason: 'Identificada queda de resistência superior a 35%, indicando provável contaminação severa, umidade ou defeitos na isolação.'
      };
      default: return { label: '---', color: '#666', reason: '' };
    }
  };

  const getIpDiagnosis = (ia: number | undefined, pi: number | undefined, dar: number | undefined): { label: string, color: string, reason: string } => {
    if (pi === undefined || ia === undefined) return { label: '---', color: '#666', reason: '' };
    
    // Avaliação de DAR (Dielectric Absorption Ratio = R60s / R30s)
    let darStatus = '';
    if (dar !== undefined) {
      if (dar < 1) {
        darStatus = 'DAR Ruim (<1)';
      } else if (dar <= 1.4) {
        darStatus = 'DAR Aceitável (1-1.4)';
      } else {
        darStatus = 'DAR Excelente (1.4-1.6)';
      }
    }
    
    // Tabela de referência: IA x PI
    if (ia > 1.6 && pi > 4.0) {
      return {
        label: 'ÓTIMO',
        color: '#81C784',
        reason: `IA: ${ia.toFixed(2)} (>1.6) | PI: ${pi.toFixed(2)} (>4.0) ${dar ? `| ${darStatus}` : ''} - Excelente estado de isolamento.`
      };
    }
    if (ia >= 1.4 && ia <= 1.6 && pi >= 3.0 && pi <= 4.0) {
      return {
        label: 'MUITO BOM',
        color: '#66BB6A',
        reason: `IA: ${ia.toFixed(2)} (1.4-1.6) | PI: ${pi.toFixed(2)} (3.0-4.0) ${dar ? `| ${darStatus}` : ''} - Muito bom estado de isolamento.`
      };
    }
    if (ia >= 1.25 && ia < 1.4 && pi >= 2.0 && pi < 3.0) {
      return {
        label: 'BOM',
        color: '#4CAF50',
        reason: `IA: ${ia.toFixed(2)} (1.25-1.4) | PI: ${pi.toFixed(2)} (2.0-3.0) ${dar ? `| ${darStatus}` : ''} - Bom estado de isolamento.`
      };
    }
    if (ia >= 1.1 && ia < 1.25 && pi >= 1.5 && pi < 2.0) {
      return {
        label: 'REGULAR',
        color: '#ffc107',
        reason: `IA: ${ia.toFixed(2)} (1.1-1.25) | PI: ${pi.toFixed(2)} (1.5-2.0) ${dar ? `| ${darStatus}` : ''} - Isolamento regular, monitorar.`
      };
    }
    if (ia < 1.1 && pi < 1.5) {
      return {
        label: 'PERIGOSO',
        color: '#ff6b6b',
        reason: `IA: ${ia.toFixed(2)} (<1.1) | PI: ${pi.toFixed(2)} (<1.5) ${dar ? `| ${darStatus}` : ''} - Isolamento perigoso, ação urgente recomendada.`
      };
    }
    if (pi <= 1) {
      return {
        label: 'RUIM',
        color: '#d32f2f',
        reason: `PI: ${pi.toFixed(2)} (≤1.0) ${dar ? `| ${darStatus}` : ''} - Isolamento deficiente, substituição necessária.`
      };
    }
    
    return {
      label: 'QUESTIONÁVEL',
      color: '#ff9800',
      reason: `IA: ${ia.toFixed(2)} | PI: ${pi.toFixed(2)} ${dar ? `| ${darStatus}` : ''} - Isolamento questionável, ação recomendada.`
    };
  };

  return (
    <div className="screen">
      <div className="equipment-panel">
        <div className="equipment-header">
          <h1 className="equipment-title">Megôhmetro</h1>
          <p>Medição de Resistência de Isolamento</p>
          <div className="equipment-image">
            <img src="/megohmetro_mit.png" alt="Megôhmetro MIT515" style={{maxWidth: '300px', height: 'auto', margin: '20px 0', borderRadius: '8px'}} />
            <p style={{fontSize: '0.9rem', opacity: 0.8}}>Megger MIT515 - Testador de Isolamento Digital</p>
          </div>
        </div>

        <EnvironmentalData />

        <TestInfo 
          objective="Medição da resistência de isolamento entre os enrolamentos, entre fases e entre enrolamento e terra para avaliação do estado de degradação do isolamento através de diferentes modos de teste (SV, DD, IP)."
          necessity={[
            "Avaliar o estado de degradação do isolamento através de modos específicos: SV (Step Voltage), DD (Descarga Dielétrica) e IP (Índice de Polarização)",
            "Detectar presença de umidade, contaminação ou envelhecimento do material isolante",
            "Medir constante de tempo (Resistência × Capacitância) para identificar contaminação",
            "Aplicar diferentes níveis de tensão CC (500V a 10000V) para análise progressiva",
            "Acompanhamento temporal das medições para identificar tendências de deterioração"
          ]}
        />

        <TabComponent 
          tabs={[
            {
              label: 'Medição',
              icon: '📊',
              content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Painel do Megger com imagem de fundo */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '700px',
                    margin: '0 auto',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                  }}>
                    {/* Imagem do Megger como fundo */}
                    <img 
                      src="/Tela Megger.png" 
                      alt="Megger MIT515" 
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block'
                      }}
                    />
                    
                    {/* Overlay com controles */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '15px',
                      pointerEvents: 'none'
                    }}>
                      
                      {/* Display Digital no topo */}
                      <div style={{
                        position: 'absolute',
                        top: '36%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(0,20,0,0)',
                        border: '3px solid #333',
                        borderRadius: '8px',
                        padding: '2px 12px',
                        minWidth: '202px',
                        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8)'
                      }}>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: '1px',
                          fontFamily: "'Courier New', monospace"
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#444444', fontSize: '8px', opacity: 0.7, margin: '1px 0' }}>RESISTÊNCIA</div>
                            <div style={{ color: '#444444', fontSize: '18px', fontWeight: 'bold', textShadow: 'none', margin: '0' }}>
                              {state.resistance.toFixed(0)} <span style={{fontSize: '10px'}}>MΩ</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#444444', fontSize: '8px', opacity: 0.7, margin: '1px 0' }}>TENSÃO</div>
                            <div style={{ color: '#444444', fontSize: '18px', fontWeight: 'bold', textShadow: 'none', margin: '0' }}>
                              {state.appliedVoltage.toFixed(0)} <span style={{fontSize: '10px'}}>V</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#444444', fontSize: '8px', opacity: 0.7, margin: '1px 0' }}>CORRENTE</div>
                            <div style={{ color: '#444444', fontSize: '14px', fontWeight: 'bold', textShadow: 'none', margin: '0' }}>
                              {state.current.toFixed(3)} <span style={{fontSize: '9px'}}>μA</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#444444', fontSize: '8px', opacity: 0.7, margin: '1px 0' }}>TEMPO</div>
                            <div style={{ color: '#444444', fontSize: '14px', fontWeight: 'bold', textShadow: 'none', margin: '0' }}>
                              {formatTime(state.time)}
                            </div>
                          </div>
                        </div>
                        {state.testMode === 'IP' && (
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr 1fr', 
                            gap: '1px',
                            marginTop: '1px',
                            paddingTop: '1px',
                            borderTop: '1px solid #44444433'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>DA</div>
                              <div style={{ color: '#666666', fontSize: '10px', fontWeight: 'bold', margin: '0' }}>
                                {/* DA = R3min/R30s */}
                                {(state as any).daIndex ? (state as any).daIndex.toFixed(2) : '--'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>IA</div>
                              <div style={{ color: '#666666', fontSize: '10px', fontWeight: 'bold', margin: '0' }}>
                                {state.absorptionIndex ? state.absorptionIndex.toFixed(2) : '--'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>PI</div>
                              <div style={{ color: '#666666', fontSize: '10px', fontWeight: 'bold', margin: '0' }}>
                                {state.polarizationIndex ? state.polarizationIndex.toFixed(2) : '--'}
                              </div>
                            </div>
                          </div>
                        )}
                        {state.testMode === 'DD' && (
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr 1fr', 
                            gap: '1px',
                            marginTop: '1px',
                            paddingTop: '1px',
                            borderTop: '1px solid #44444433'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>CAP CC</div>
                              <div style={{ color: '#666666', fontSize: '10px', fontWeight: 'bold', margin: '0' }}>
                                {state.capacitanceCC ? state.capacitanceCC.toFixed(1) : '--'} <span style={{fontSize: '7px'}}>nF</span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>DD</div>
                              <div style={{ color: '#666666', fontSize: '10px', fontWeight: 'bold', margin: '0' }}>
                                {state.ddIndex ? state.ddIndex.toFixed(2) : '--'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>COND.</div>
                              <div style={{ 
                                fontSize: '9px', 
                                fontWeight: 'bold', 
                                margin: '0',
                                color: state.ddIndex !== undefined ? (
                                  state.ddIndex > 7 ? '#cc0000' : 
                                  state.ddIndex > 4 ? '#ff6600' : 
                                  state.ddIndex > 2 ? '#ffaa00' : 
                                  '#00aa00'
                                ) : '#666666'
                              }}>
                                {state.ddIndex !== undefined ? (
                                  state.ddIndex > 7 ? 'RUIM' : 
                                  state.ddIndex > 4 ? 'QUEST.' : 
                                  state.ddIndex > 2 ? 'BOM' : 
                                  'ÓTIMO'
                                ) : '--'}
                              </div>
                            </div>
                          </div>
                        )}
                        {state.testMode === 'SV' && (
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr 1fr 1fr', 
                            gap: '1px',
                            marginTop: '1px',
                            paddingTop: '1px',
                            borderTop: '1px solid #44444433'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>1m</div>
                              <div style={{ color: '#666666', fontSize: '9px', fontWeight: 'bold', margin: '0' }}>
                                {state.sv1m ? state.sv1m.toFixed(0) : '--'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>2m</div>
                              <div style={{ color: '#666666', fontSize: '9px', fontWeight: 'bold', margin: '0' }}>
                                {state.sv2m ? state.sv2m.toFixed(0) : '--'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>3m</div>
                              <div style={{ color: '#666666', fontSize: '9px', fontWeight: 'bold', margin: '0' }}>
                                {state.sv3m ? state.sv3m.toFixed(0) : '--'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#666666', fontSize: '8px', margin: '1px 0' }}>4m</div>
                              <div style={{ color: '#666666', fontSize: '9px', fontWeight: 'bold', margin: '0' }}>
                                {state.sv4m ? state.sv4m.toFixed(0) : '--'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Knobs na parte inferior */}
                      <div style={{
                        position: 'absolute',
                        bottom: '16.5%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '100%',
                        height: '100px',
                        pointerEvents: 'auto'
                      }}>
                        {/* Knob de Modo de Teste */}
                        <div style={{ 
                          position: 'absolute',
                          left: '27%',
                          bottom: 0,
                          transform: 'translateX(-50%) translateX(-17px)',
                          marginBottom: '1%',
                          pointerEvents: 'auto'
                        }}>
                          <RotaryKnob
                            
                            value={state.testMode}
                            options={[
                              { value: 'IP', label: 'IP', angle: 0 },
                              { value: 'DD', label: 'DD', angle: 30 },
                              { value: 'SV', label: 'SV', angle: 60 }
                            ]}
                            onChange={(v) => setState(prev => ({ ...prev, testMode: v as string }))}
                            size={70}
                          />
                        </div>

                        {/* Knob de Tensão */}
                        <div style={{ 
                          position: 'absolute',
                          left: '49.75%',
                          bottom: 0,
                          transform: 'translateX(-50%)',
                          marginBottom: '1%',
                          pointerEvents: 'auto'
                        }}>
                          <RotaryKnob
                            
                            value={state.testVoltage}
                            options={[
                              { value: 250, label: '250V', angle: 20},
                              { value: 500, label: '500V', angle: 45},
                              { value: 1000, label: '1kV', angle: 68 },                   
                              { value: 2500, label: '2.5kV', angle: 90 },                           
                              { value: 5000, label: '5kV', angle: 105 },
                           
                            ]}
                            onChange={(v) => setState(prev => ({ ...prev, testVoltage: v as number }))}
                            size={70}
                          />
                        </div>

                        {/* Botão de Teste (START/STOP) */}
                        <div 
                          onClick={state.isRunning ? stopTest : startTest}
                          style={{
                            position: 'absolute',
                            right: '26%',
                            bottom: '68%',
                            transform: 'translateX(50%) translateX(7px)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: state.isRunning 
                              ? 'linear-gradient(145deg, #ff6666, #cc0000)'
                              : 'linear-gradient(145deg, #ff6666, #cc0000)',
                            border: '4px solid #333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: state.isRunning
                              ? '0 0 20px rgba(255,0,0,0.5), inset 0 -3px 10px rgba(0,0,0,0.3)'
                              : '0 0 20px rgba(255,0,0,0.5), inset 0 -3px 10px rgba(0,0,0,0.3)',
                            transition: 'all 0.2s',
                            flexDirection: 'column',
                            pointerEvents: 'auto'
                          }}
                        >
                          <span style={{ 
                            color: '#fff', 
                            fontWeight: 'bold', 
                            fontSize: '9px',
                            textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                          }}>
                            {state.isRunning ? 'STOP' : 'TEST'}
                          </span>
                          <span style={{ fontSize: '16px' }}>
                            {state.isRunning ? '⏹' : '▶'}
                          </span>
                        </div>
                      </div>

                      {/* Cabos do Megôhmetro */}
                      <svg style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 10
                      }}>
                        {/* Cabo Vermelho - Fase do Motor (2% esquerda) */}
                        <path
                          d="M 241 140 Q 186 125 136 165 Q 86 205 66 265 L 46 305"
                          fill="none"
                          stroke="#cc0000"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        {/* Conector vermelho - início */}
                        <circle cx="244" cy="140" r="10" fill="#cc0000" stroke="#990000" strokeWidth="2" />
                        {/* Conector vermelho - fim */}
                        <circle cx="49" cy="305" r="10" fill="#cc0000" stroke="#990000" strokeWidth="2" />
                        <text x="31" y="330" fill="#cc0000" fontSize="10" fontWeight="bold">FASE</text>
                        
                        {/* Cabo Preto - Ground (2% cima, 1% direita) */}
                        <path
                          d="M 452 135 Q 510 125 560 160 Q 600 200 620 270 L 635 310"
                          fill="none"
                          stroke="#333333"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        {/* Conector preto - início */}
                        <circle cx="452" cy="139" r="10" fill="#333333" stroke="#111111" strokeWidth="2" />
                        {/* Conector preto - fim */}
                        <circle cx="635" cy="314" r="10" fill="#333333" stroke="#111111" strokeWidth="2" />
                        <text x="620" y="365" fill="#cccccc" fontSize="12" fontWeight="bold">GND</text>
                        
                        {/* Símbolo de Ground */}
                        <g transform="translate(635, 380)">
                          <line x1="-12" y1="0" x2="12" y2="0" stroke="#cccccc" strokeWidth="2.5" />
                          <line x1="-8" y1="5" x2="8" y2="5" stroke="#cccccc" strokeWidth="2.5" />
                          <line x1="-4" y1="10" x2="4" y2="10" stroke="#cccccc" strokeWidth="2.5" />
                        </g>
                        
                        {/* Cabo Vermelho com animação */}
                        <path
                          d="M 241 140 Q 186 125 136 165 Q 86 205 66 265 L 46 305"
                          fill="none"
                          stroke="#cc0000"
                          strokeWidth="6"
                          strokeLinecap="round"
                          style={{
                            animation: state.isRunning ? 'cablePulse 0.3s ease-in-out infinite' : 'none',
                            filter: state.isRunning ? 'drop-shadow(0 0 8px #ff0000)' : 'none'
                          }}
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Gráficos */}
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {state.testMode === 'SV' && svChartData.length > 0 && (
                      <DualAxisChart
                        data1={svChartData}
                        data2={svChartCurrentData}
                        labels={svChartLabels}
                        title="Step Voltage DC - Fase S"
                        yLabel1="RI (MΩ)"
                        yLabel2="Corrente (μA)"
                        xLabel="Tensão (V)"
                        width={600}
                        height={300}
                        color1="#1f77b4"
                        color2="#cc0000"
                        numericXAxis={true}
                      />
                    )}
                    
                    {/* Diagnóstico SV - Exibir apenas após o teste finalizar e se houver dados */}
                    {state.testMode === 'SV' && !state.isRunning && svChartData.length > 0 && (
                      <div style={{
                        marginTop: '15px',
                        padding: '15px',
                        background: 'rgba(0,0,0,0.6)',
                        borderRadius: '8px',
                        border: '1px solid #444',
                        maxWidth: '600px',
                        textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                           <span style={{ color: '#ccc', fontSize: '14px' }}>Diagnóstico Automático:</span>
                           <span style={{ 
                             color: getSvDiagnosis(state.svScenario).color,
                             fontWeight: 'bold', 
                             fontSize: '16px',
                             textTransform: 'uppercase',
                             border: `1px solid ${getSvDiagnosis(state.svScenario).color}`,
                             padding: '2px 8px',
                             borderRadius: '4px',
                             backgroundColor: `${getSvDiagnosis(state.svScenario).color}20`
                           }}>
                             {getSvDiagnosis(state.svScenario).label}
                           </span>
                        </div>
                        <div style={{ color: '#ddd', fontSize: '13px', fontStyle: 'italic', lineHeight: '1.4' }}>
                           {getSvDiagnosis(state.svScenario).reason}
                        </div>
                      </div>
                    )}

                    {state.testMode === 'DD' && (ddChargeCurrent.length > 0 || ddDischargeCurrent.length > 0) && (
                      <DualAxisChart
                        data1={ddChargeCurrent}
                        data2={ddDischargeCurrent}
                        labels={chartLabels}
                        title="Polarização e Despolarização"
                        yLabel1="Corrente Carga (μA)"
                        yLabel2="Corrente Descarga (μA)"
                        width={500}
                        height={250}
                        singleAxis={true}
                        singleAxisLabel="Corrente (μA)"
                      />
                    )}

                    {state.testMode === 'IP' && chartData.length > 0 && (
                      <DualAxisChart
                        data1={chartData}
                        data2={chartCurrentData}
                        labels={chartLabels}
                        title="Índice de Polarização"
                        yLabel1="Resistência (MΩ)"
                        yLabel2="Corrente (μA)"
                        width={500}
                        height={250}
                      />
                    )}
                  </div>

                  {/* Tabela de Medições */}
                  {state.measurements.length > 0 && (
                    <div style={{ 
                      background: 'rgba(0,0,0,0.3)', 
                      borderRadius: '8px', 
                      padding: '15px',
                      border: '1px solid rgba(255,215,0,0.3)'
                    }}>
                      <h3 style={{ color: '#ffd700', marginTop: 0 }}>📋 Medições Realizadas</h3>
                      {/* SV: Step Voltage - mostra 5 steps */}
                      {state.measurements.some(m => m.mode === 'SV') && (
                        <div style={{ marginBottom: '20px', background: '#2196F320', border: '2px solid #2196F3', borderRadius: '6px', padding: '12px' }}>
                          <h4 style={{ color: '#2196F3', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>⚡ Step Voltage (SV)</h4>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#2196F315', borderBottom: '2px solid #2196F3' }}>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#2196F3' }}>Step</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#2196F3' }}>Tensão (V)</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#2196F3' }}>Resistência (MΩ)</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#2196F3' }}>Corrente (μA)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {state.measurements.filter(m => m.mode === 'SV').slice(0, 5).map((m, i) => (
                                <tr key={i} style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                  <td style={{ padding: '8px', color: '#2196F3' }}>{i + 1}</td>
                                  <td style={{ padding: '8px', color: '#ffd700' }}>{m.voltage} V</td>
                                  <td style={{ padding: '8px', color: '#00ff00', fontWeight: 'bold' }}>{m.resistance.toFixed(0)}</td>
                                  <td style={{ padding: '8px', color: '#ff7f50' }}>{m.current.toFixed(4)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {/* Diagnóstico visual SV */}
                          {(() => {
                            const svScenario = state.svScenario;
                            const diag = getSvDiagnosis(svScenario);
                            return (
                              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#ccc', fontSize: '14px' }}>Diagnóstico:</span>
                                <span style={{ 
                                  color: diag.color,
                                  fontWeight: 'bold', 
                                  fontSize: '16px',
                                  textTransform: 'uppercase',
                                  border: `1px solid ${diag.color}`,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: `${diag.color}20`
                                }}>{diag.label}</span>
                                <span style={{ color: '#aaa', fontSize: '13px', fontStyle: 'italic' }}>{diag.reason}</span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      {/* IP: Índice de Polarização - mostra PI, IA, DA, resistências em tempos */}
                      {state.measurements.some(m => m.mode === 'IP') && (
                        <div style={{ marginBottom: '20px', background: '#4CAF5020', border: '2px solid #4CAF50', borderRadius: '6px', padding: '12px' }}>
                          <h4 style={{ color: '#4CAF50', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>📈 Índice de Polarização (IP)</h4>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#4CAF5015', borderBottom: '2px solid #4CAF50' }}>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#4CAF50' }}>Teste</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#4CAF50' }}>Tensão (V)</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#4CAF50' }}>R15s</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#4CAF50' }}>R30s</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#4CAF50' }}>R60s</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#4CAF50' }}>R180s</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#4CAF50' }}>R600s</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#FFD700' }}>IA</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#81C784' }}>PI</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#4CAF50' }}>DA</th>
                              </tr>
                            </thead>
                            <tbody>
                              {state.measurements.filter(m => m.mode === 'IP').map((m, i) => (
                                <tr key={i} style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                  <td style={{ padding: '8px', color: '#4CAF50' }}>{i + 1}</td>
                                  <td style={{ padding: '8px', color: '#ffd700' }}>{m.voltage} V</td>
                                  <td style={{ padding: '8px' }}>{(m as any).r15s ? (m as any).r15s.toFixed(0) : '-'}</td>
                                  <td style={{ padding: '8px' }}>{(m as any).r30s ? (m as any).r30s.toFixed(0) : '-'}</td>
                                  <td style={{ padding: '8px' }}>{(m as any).r60s ? (m as any).r60s.toFixed(0) : '-'}</td>
                                  <td style={{ padding: '8px' }}>{(m as any).r180s ? (m as any).r180s.toFixed(0) : '-'}</td>
                                  <td style={{ padding: '8px' }}>{(m as any).r600s ? (m as any).r600s.toFixed(0) : '-'}</td>
                                  <td style={{ padding: '8px', color: '#FFD700' }}>{m.absorptionIndex ? m.absorptionIndex.toFixed(2) : '-'}</td>
                                  <td style={{ padding: '8px', color: '#81C784' }}>{m.polarizationIndex ? m.polarizationIndex.toFixed(2) : '-'}</td>
                                  <td style={{ padding: '8px', color: '#4CAF50' }}>{(m as any).daIndex ? (m as any).daIndex.toFixed(2) : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {/* Diagnóstico visual IP */}
                          {state.measurements.filter(m => m.mode === 'IP').length > 0 && (() => {
                            const ipMeasurement = state.measurements.filter(m => m.mode === 'IP')[0];
                            const ia = ipMeasurement.absorptionIndex;
                            const pi = ipMeasurement.polarizationIndex;
                            const dar = (ipMeasurement as any).darIndex;
                            const diag = getIpDiagnosis(ia, pi, dar);
                            return (
                              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#ccc', fontSize: '14px' }}>Diagnóstico:</span>
                                <span style={{ 
                                  color: diag.color,
                                  fontWeight: 'bold', 
                                  fontSize: '16px',
                                  textTransform: 'uppercase',
                                  border: `1px solid ${diag.color}`,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: `${diag.color}20`
                                }}>{diag.label}</span>
                                <span style={{ color: '#aaa', fontSize: '13px', fontStyle: 'italic' }}>{diag.reason}</span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      {/* DD: Descarga Dielétrica - mostra DD, corrente de descarga, capacitância, etc */}
                      {state.measurements.some(m => m.mode === 'DD') && (
                        <div style={{ marginBottom: '20px', background: '#FF980020', border: '2px solid #FF9800', borderRadius: '6px', padding: '12px' }}>
                          <h4 style={{ color: '#FF9800', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>🔄 Descarga Dielétrica (DD)</h4>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#FF980015', borderBottom: '2px solid #FF9800' }}>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#FF9800' }}>Teste</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#FF9800' }}>Tensão (V)</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#FF9800' }}>Resistência (MΩ)</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#FF9800' }}>Corrente (μA)</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#FF9800' }}>τ (s)</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#FF9800' }}>C (nF)</th>
                                <th style={{ padding: '8px', textAlign: 'left', color: '#FF9800' }}>DD</th>
                              </tr>
                            </thead>
                            <tbody>
                              {state.measurements.filter(m => m.mode === 'DD').map((m, i) => (
                                <tr key={i} style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                  <td style={{ padding: '8px', color: '#FF9800' }}>{i + 1}</td>
                                  <td style={{ padding: '8px', color: '#ffd700' }}>{m.voltage} V</td>
                                  <td style={{ padding: '8px', color: '#00ff00', fontWeight: 'bold' }}>{m.resistance.toFixed(0)}</td>
                                  <td style={{ padding: '8px', color: '#ff7f50' }}>{m.current.toFixed(4)}</td>
                                  <td style={{ padding: '8px', color: '#87CEEB' }}>{m.timeConstant.toFixed(1)}</td>
                                  <td style={{ padding: '8px', color: '#DDA0DD' }}>{m.capacitanceCC.toFixed(1)}</td>
                                  <td style={{ padding: '8px', color: '#FF9800' }}>{(m as any).ddIndex ? (m as any).ddIndex.toFixed(2) : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botões de Ação */}
                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    <button className="btn btn-secondary" onClick={onBack}>
                      ← Voltar ao Menu
                    </button>
                    {state.measurements.length > 0 && (
                      <button className="btn btn-success" style={{ fontWeight: 'bold' }} onClick={sendToPlatform}>
                        ✓ CONCLUIR E ENVIAR
                      </button>
                    )}
                  </div>
                </div>
              )
            },
            {
              label: 'Resistência de Isolamento',
              icon: '⚡',
              content: (
                <div>
                  <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Resistência de Isolamento e Índice de Polarização</h3>
                  
                  <p>
                    Este ensaio é feito com tensões contínuas, com amplitude que depende da magnitude da tensão nominal 
                    da máquina a ser ensaiada. O megôhmetro é o instrumento típico para a realização deste ensaio. Os megôhmetros 
                    possuem escalas de 500 a 15.000V e os fatores de temperatura ambiente e a umidade relativa do ar influenciam 
                    fortemente as medições. Por isso, é muito importante sempre referenciar estes dois fatores ambientais com a medição.
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Tabela de Seleção de Tensão CC (IEEE43)</h4>
                  <p style={{ fontSize: '13px', marginBottom: '10px' }}>Selecione a tensão de teste de acordo com a tensão nominal da máquina:</p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(76, 175, 80, 0.2)' }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Tensão Nominal (VCA)</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Tensão de Teste CC (VCC)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>≤ 1000</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>500</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>1000 – 2500</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>500 - 1000</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>2501 – 5000</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>1000 - 2500</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>5001 – 12000</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>2500 - 5000</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>&gt;12000</td><td style={{ padding: '8px' }}>5000 - 10000</td></tr>
                    </tbody>
                  </table>

                  <h4 style={{ color: '#FF9800' }}>Componentes da Corrente de Isolamento</h4>
                  <p>
                    A resistência de isolamento é definida como a tensão CC de teste dividida pela corrente total que flui através da isolação. 
                    A corrente total tem componentes que variam com o tempo:
                  </p>
                  <ul style={{ lineHeight: '1.8' }}>
                    <li><strong>Corrente Capacitiva (I capacitive):</strong> Flui durante os primeiros microsegundos/milissegundos até que a isolação se carregue completamente. Decai exponencialmente a zero.</li>
                    <li><strong>Corrente de Absorção de Polarização (I absorption):</strong> Causada pelo deslocamento de cargas dentro do material dielétrico. Decai lentamente ao longo de minutos. É o principal indicador de qualidade da isolação.</li>
                    <li><strong>Corrente de Condutância (I conductance):</strong> Flui continuamente e permanece relativamente constante. Representa a condutividade do material isolante. Aumenta com contaminação ou envelhecimento.</li>
                    <li><strong>Corrente de Fuga (I leakage):</strong> Corrente pequena e constante relacionada ao vazamento através do material. Em isolação seca, é negligenciável.</li>
                  </ul>

                  <div style={{ textAlign: 'center', margin: '20px 0' }}>
                    <h4 style={{ color: '#FF9800', marginTop: '0px', marginBottom: '10px' }}>Decomposição da Corrente de Isolamento</h4>
                    <img src="/images/Measuraments.png" alt="Gráficos de Corrente de Isolamento" style={{ maxWidth: '100%', height: 'auto', marginBottom: '15px' }} />
                    <div style={{ background: 'rgba(255, 152, 0, 0.1)', border: '1px solid #FF9800', borderRadius: '5px', padding: '12px', textAlign: 'left', display: 'inline-block', maxWidth: '100%' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#FFF' }}>
                        <strong>Componentes de Corrente:</strong>
                      </p>
                      <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '12px', color: '#DDD', lineHeight: '1.8' }}>
                        <li><strong style={{ color: '#000' }}>I total (preto):</strong> Soma de todos os componentes de corrente, reduz exponencialmente</li>
                        <li><strong style={{ color: '#A0826D' }}>I capacitive (marrom):</strong> Corrente capacitiva, decai muito rapidamente em microsegundos</li>
                        <li><strong style={{ color: '#FF6B6B' }}>I absorption (vermelho):</strong> Corrente de absorção dielétrica, decai lentamente em minutos</li>
                        <li><strong style={{ color: '#2196F3' }}>I leakage (azul):</strong> Corrente de fuga, permanece relativamente constante</li>
                        <li><strong style={{ color: '#81C784' }}>I conductance (verde):</strong> Corrente de condutância, linha horizontal representando fluxo contínuo</li>
                      </ul>
                      <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#AAA', fontStyle: 'italic' }}>
                        <strong>Esquerda:</strong> Isolação em bom estado (absorção decai rapidamente) | 
                        <strong style={{ marginLeft: '10px' }}>Direita:</strong> Isolação deteriorada (absorção persiste mais tempo)<br/>
                        Eixo Y: Corrente relativa (escala logarítmica 1-100) | Eixo X: Tempo de teste (minutos)
                      </p>
                    </div>
                  </div>

                  <h4 style={{ color: '#FF9800' }}>Modos de Teste de Resistência de Isolamento</h4>
                  
                  <h5 style={{ color: '#FF9800', marginTop: '15px' }}>1. Teste de IR Instantâneo ('Spot' IR Test)</h5>
                  <p>
                    O teste de resistência de isolamento instantâneo (Spot) é selecionado no comutador rotativo de modo de teste. 
                    A tensão desejada é selecionada através da faixa de tensão pré-configurada no comutador rotativo central ou 
                    da faixa de tensão definida pelo usuário (VL). Todas as faixas pré-configuradas são ajustáveis usando os botões 
                    de seta para cima e para baixo antes e durante o teste, mas isso deve ser limitado aos primeiros 10 segundos. 
                    Pressione e segure TESTE para iniciar o teste. Ao término do teste, a capacitância de isolação (C) e a 
                    Constante de Tempo (TC) associada a ela são calculadas e exibidas.
                  </p>

                  <h5 style={{ color: '#FF9800', marginTop: '15px' }}>2. Teste de IR Temporizador (Timed IR Test)</h5>
                  <p>
                    Um teste de IR temporizador IR(t) terminará automaticamente um teste de isolação após um tempo predefinido. 
                    O temporizador padrão é definido para 1 minuto e é ajustável através da função de configurações. 
                    Isso economiza tempo e evita que o usuário precise ficar observando o display durante o teste inteiro.
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Índices de Qualidade da Isolação</h4>

                  <h5 style={{ color: '#FF9800', marginTop: '15px' }}>Valores de Referência - Resistência de Isolamento (RI)</h5>
                  <p style={{ fontSize: '13px', marginBottom: '10px' }}>Critérios de avaliação baseados no valor da resistência de isolamento medida:</p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(76, 175, 80, 0.2)' }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Até 1,1 kV (MΩ)</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Acima de 1,1 kV (MΩ)</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Julgamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>&lt; 5</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>&lt; 100</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ff6b6b', backgroundColor: 'rgba(255, 107, 107, 0.2)' }}>Perigoso</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>&gt; 5 &lt; 100</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>&gt; 100 &lt; 500</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ffc107', backgroundColor: 'rgba(255, 193, 7, 0.2)' }}>Regular</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>&gt; 100 &lt; 500</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>&gt; 500 &lt; 1000</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.2)' }}>Bom</td></tr>
                      <tr><td style={{ padding: '8px' }}>&gt; 500</td><td style={{ padding: '8px' }}>&gt; 1000</td><td style={{ padding: '8px', color: '#81C784', backgroundColor: 'rgba(129, 199, 132, 0.2)' }}>Excelente</td></tr>
                    </tbody>
                  </table>

                  <h5 style={{ color: '#FF9800', marginTop: '15px' }}>Absorção Dielétrica (DA)</h5>
                  <p>
                    <strong>Fórmula:</strong> DA = R₁₈₀ₛ / R₃₀ₛ<br/>
                    Onde R₁₈₀ₛ é a resistência medida em 180 segundos e R₃₀ₛ é a resistência medida em 30 segundos.
                  </p>
                  <p style={{ fontSize: '13px', marginBottom: '15px' }}>
                    DA mede a relação de absorção dielétrica do material, indicando como a isolação se comporta durante o carregamento. 
                    Valores mais altos indicam melhor qualidade e menor contaminação da isolação.
                  </p>

                  <h5 style={{ color: '#FF9800', marginTop: '15px' }}>Índice de Absorção (IA)</h5>
                  <p>
                    <strong>Fórmula:</strong> IA = IR₆₀ₛ / IR₃₀ₛ
                  </p>
                  <p>
                    IA é uma medida rápida da absorção dielétrica que pode indicar contaminação. O pressuposto é que a temperatura 
                    da isolação não varia muito durante o teste, tornando o resultado independente da temperatura. 
                    Os testes devem ser realizados a 40 °C ou abaixo.
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(255, 152, 0, 0.2)' }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #FF9800' }}>Condição da Isolação</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #FF9800' }}>Valor IA</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Pobre</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ff6b6b' }}>&lt; 1.0</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Aceitável</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ffc107' }}>1.0 - 1.4</td></tr>
                      <tr><td style={{ padding: '8px' }}>Excelente</td><td style={{ padding: '8px', color: '#4CAF50' }}>1.4 - 1.6</td></tr>
                    </tbody>
                  </table>

                  <h5 style={{ color: '#FF9800', marginTop: '15px' }}>Índice de Polarização (PI)</h5>
                  <p>
                    <strong>Fórmula (IEEE 43-2000):</strong> PI = IR₁₀min / IR₁min
                  </p>
                  <p>
                    <strong>Nota Importante:</strong> Se IR₁min &gt; 5000 MΩ, o PI pode não ser uma indicação confiável da condição 
                    da isolação e não é recomendado pela norma IEEE 43.
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(76, 175, 80, 0.2)' }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Condição da Isolação</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Valor PI</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Pobre</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ff6b6b' }}>&lt; 1.0</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Questionável</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ff9800' }}>1.0 - 2.0</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Aceitável</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#4CAF50' }}>2.0 - 4.0</td></tr>
                      <tr><td style={{ padding: '8px' }}>Bom</td><td style={{ padding: '8px', color: '#81C784' }}>&gt; 4.0</td></tr>
                    </tbody>
                  </table>

                  <h5 style={{ color: '#FF9800', marginTop: '15px' }}>Valores de Referência - Índice de Polarização (IP) por Classe Térmica</h5>
                  <p style={{ fontSize: '13px', marginBottom: '10px' }}>Segundo as normas IEC 60085, valores mínimos recomendados:</p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(76, 175, 80, 0.2)' }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Classe Térmica</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>IP Mínimo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>A</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>1.5</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>B</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>2.0</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>F</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>2.0</td></tr>
                      <tr><td style={{ padding: '8px' }}>H</td><td style={{ padding: '8px' }}>2.0</td></tr>
                    </tbody>
                  </table>
                </div>
              )
            },
            {
              label: 'Set Voltage DC',
              icon: '📈',
              content: (
                <div>
                  <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Teste de Sobretensão em Degraus (Step Voltage - SV)</h3>
                  
                  <p>
                    O teste SV é um teste de sobretensão controlado que pode ser aplicado aos enrolamentos de estator e rotor 
                    em motores síncronos e assincronos AC, e aos enrolamentos de armadura e campo em motores DC. É aconselhável 
                    realizar um teste PI antes de um teste SV para determinar se a isolação é adequada para teste de sobretensão. 
                    Se um teste PI foi realizado, o enrolamento deve ser completamente descarregado antes do teste SV.
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Princípio de Funcionamento</h4>
                  <p>
                    O teste SV é baseado no princípio de que um isolador ideal produzirá leituras idênticas em todas as tensões, 
                    enquanto um isolador que está sendo sobretensionado mostrará valores de isolação mais baixos em tensões mais altas.
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Descrição Técnica do Teste</h4>
                  <p>
                    Esta técnica consiste em aplicar uma tensão CC em cinco passos obedecendo ao limite da IEEE43-2013, onde são 
                    registrados automaticamente no instrumento os parâmetros de tensão, corrente e resistência de isolamento. Um isolante 
                    em boas condições, quando a tensão aplicada é aumentada, a corrente de fuga também aumenta e a resistência de 
                    isolamento se mantém ou até aumenta devido ao efeito capacitivo (constante de tempo). Porém, se houver contaminação 
                    e/ou defeitos (trincas ou cavidades na isolação), a resistência de isolamento diminui abruptamente com o aumento da 
                    tensão aplicada, isto ocorre devido à contaminação e/ou à ionização nestes defeitos.
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Procedimento do Teste</h4>
                  <p>
                    Durante o teste, a tensão aplicada aumenta incrementalmente em um quinto da tensão final do teste a cada minuto 
                    durante 5 minutos, realizando medições sucessivas. A tensão é aumentada em 5 degraus iguais.
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Configuração do Teste</h4>
                  <p>
                    A duração padrão do teste SV é de 5 minutos e pode ser ajustada se desejado. O temporizador de degraus será 
                    sempre definido como tempo total de teste dividido por cinco. Um tempo de degrau muito curto pode resultar em 
                    leituras incorretas, e um tempo de degrau muito longo pode sobrecarregar um motor. É recomendado usar o padrão 
                    de 5 minutos na maioria dos casos.
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Critérios de Avaliação</h4>
                  <p style={{ fontSize: '13px', marginBottom: '10px' }}>Comportamento da resistência de isolamento com o aumento da tensão:</p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(76, 175, 80, 0.2)' }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Comportamento da Resistência de Isolamento</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Julgamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Resistência de isolamento aumenta com o aumento da tensão</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#81C784', backgroundColor: 'rgba(129, 199, 132, 0.2)' }}>Ótimo</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Resistência de isolamento se mantém com o aumento da tensão</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.2)' }}>Bom</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Resistência de isolamento com queda de até 35% em qualquer step de tensão</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ffc107', backgroundColor: 'rgba(255, 193, 7, 0.2)' }}>Atenção</td></tr>
                      <tr><td style={{ padding: '8px' }}>Resistência de isolamento com queda acima de 35% em qualquer step de tensão</td><td style={{ padding: '8px', color: '#ff6b6b', backgroundColor: 'rgba(255, 107, 107, 0.2)' }}>Perigoso</td></tr>
                    </tbody>
                  </table>
                </div>
              )
            },
            {
              label: 'Descarga Dielétrica',
              icon: '🔌',
              content: (
                <div>
                  <h3 style={{ color: '#4CAF50', marginTop: 0 }}>Descarga Dielétrica (DD)</h3>
                  
                  <p>
                    O teste de Descarga Dielétrica (DD) é um teste diagnóstico de isolação que permite avaliar envelhecimento, 
                    deterioração e vazios na isolação. Originalmente desenvolvido pela EDF (empresa de energia da França), 
                    opera durante a descarga do dielétrico sob teste. O resultado depende da característica de descarga, 
                    testando a condição interna do isolamento, amplamente independente de contaminação superficial.
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Princípio de Funcionamento</h4>
                  <p>
                    O isolador deve ser carregado por um tempo suficiente para ficar estável, ou seja, o carregamento e a 
                    polarização estão completos e o único componente de corrente restante é a corrente de fuga devido à isolação. 
                    Durante a descarga:
                  </p>
                  <ul style={{ lineHeight: '1.8' }}>
                    <li><strong>Componente Capacitivo:</strong> Decai de um valor alto com uma constante de tempo relativamente curta de alguns segundos.</li>
                    <li><strong>Componente de Absorção:</strong> Decai de um valor menor com uma constante de tempo muito mais longa, podendo durar vários minutos.</li>
                  </ul>

                  <h4 style={{ color: '#FF9800' }}>Configuração do Teste</h4>
                  <p>
                    O temporizador padrão do teste DD é 30 minutos de carregamento, que geralmente é tempo suficiente para 
                    absorção completa ocorrer no material de isolação. A tensão padrão do teste é 500 V, portanto o comutador 
                    rotativo primário deve estar configurado em 500 V ou superior. O tempo de descarga é fixo em 1 minuto.
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Fórmula de Cálculo</h4>
                  <p style={{ background: 'rgba(76, 175, 80, 0.1)', padding: '10px', borderRadius: '5px', border: '1px solid #4CAF50' }}>
                    <strong>DD = I₁min / (V × C)</strong>
                  </p>
                  <p>
                    Onde:<br/>
                    <strong>I₁min</strong> = Corrente de descarga em mA um minuto após remoção da tensão de teste<br/>
                    <strong>V</strong> = Tensão de teste em Volts<br/>
                    <strong>C</strong> = Capacitância em Farads
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Detecção de Defeitos</h4>
                  <p>
                    Resultados de DD podem identificar correntes de descarga excessivas que surgem quando uma camada em isolação 
                    em multicamadas está danificada ou contaminada, condição que será perdida tanto em testes IR quanto PI. 
                    A corrente de descarga será maior, para um valor dado de tensão e capacitância, se uma camada interna estiver 
                    danificada. A constante de tempo dessa camada individual desempalhará as outras camadas, resultando em um 
                    valor de corrente mais alto do que para isolação que é "boa" nesse aspecto.
                  </p>

                  <h4 style={{ color: '#FF9800' }}>Interpretação de Valores</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(76, 175, 80, 0.2)' }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Valor DD</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #4CAF50' }}>Condição da Isolação</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>0</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#81C784' }}>Homogênea</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>&lt; 2</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#4CAF50' }}>Boa (Multi-camada)</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>2 - 4</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ffc107' }}>Questionável</td></tr>
                      <tr><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>4 - 7</td><td style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ff9800' }}>Pobre</td></tr>
                      <tr><td style={{ padding: '8px' }}>&gt; 7</td><td style={{ padding: '8px', color: '#ff6b6b' }}>Ruim</td></tr>
                    </tbody>
                  </table>

                  <p>
                    Um valor DD baixo indica que a corrente de reabsorção decai rapidamente e a constante de tempo é similar em todas as camadas. 
                    Um valor alto indica que a reabsorção exibe tempos de relaxamento longos, que podem indicar problemas internos na isolação.
                  </p>
                </div>
              )
            }
          ]}
        />
      </div>
    </div>
  );
};

export default MegohmmeterScreen;
