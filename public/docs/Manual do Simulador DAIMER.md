# Manual do Simulador DAIMER

## Visão Geral
O Simulador DAIMER é uma aplicação web interativa que demonstra como os dados de ensaios elétricos são coletados através de diferentes equipamentos e enviados para a plataforma DAIMER (Diagnose Avançada do Isolamento de Máquinas Elétricas Rotativas).

## Como Usar o Simulador

### 1. Tela Inicial
- Ao acessar o simulador, você verá a tela inicial com o logo da DAIMER
- Informações sobre o equipamento sendo testado (Gerador Síncrono Brushless)
- Clique em "Iniciar Simulação" para começar

### 2. Menu de Ensaios
O simulador oferece 4 tipos de ensaios:

#### a) Resistência Ôhmica (Microhmímetro)
- **Equipamento**: Microhmímetro
- **Função**: Medição da resistência ôhmica dos enrolamentos
- **Controles**:
  - Seleção da escala de corrente (1A, 10A, 100A)
  - Botões "Iniciar/Parar Medição"
- **Displays**: Corrente injetada, resistência medida, tensão
- **Contador de tempo**: Mostra duração do ensaio

#### b) Resistência de Isolamento (Megôhmetro)
- **Equipamento**: Megôhmetro
- **Função**: Medição da resistência de isolamento
- **Controles**:
  - Seleção do modo de teste (IP, DD, SV)
  - Seleção da tensão de teste (500V a 10000V)
  - Botões "Iniciar/Parar Teste"
- **Displays**: Tensão aplicada, resistência, corrente, constante de tempo, capacitância CC

**Modos de Medição Detalhados**

**1. Teste IR (Spot) e IR(t) (Temporizado)**
- O teste IR pontual ('Spot') ou temporizado é selecionado no botão rotativo de modo.
- O teste temporizado IR(t) encerra automaticamente o teste após um tempo predefinido (padrão de 1 minuto). Isso evita que o operador precise monitorar o display durante todo o teste e perca a leitura de 1 minuto.
- Ao final do teste, a Capacitância de isolamento (C) e a Constante de Tempo (TC) associada são calculadas e exibidas.

**2. Testes de Índice de Polarização (PI) e Absorção Dielétrica (DAR)**
- São medições da resistência ao longo do tempo expressas como uma razão.
- Assume-se que a temperatura não varia muito durante o teste, tornando o resultado independente da temperatura.
- **DAR (Dielectric Absorption Ratio)**: Razão entre a resistência em 60 segundos e 30 segundos.
  - `DAR = IR60s / IR30s`
  - *Condição:* < 1 (Ruim), 1 – 1.4 (Aceitável), 1.4 – 1.6 (Excelente).
- **PI (Polarization Index)**: Razão entre a resistência em 10 minutos e 1 minuto.
  - `PI = IR10min / IR1min`
  - *Condição:* < 1 (Ruim), 1 - 2 (Questionável), 2 - 4 (Aceitável), > 4 (Bom).

**3. Teste de Descarga Dielétrica (DD)**
- O teste DD (Dielectric Discharge) ou corrente de reabsorção opera durante a descarga do dielétrico sob teste.
- Permite avaliar envelhecimento, deterioração e vazios no isolamento, independentemente de contaminação superficial.
- O isolador é carregado por tempo suficiente para estabilização (padrão 30 minutos) e então descarregado.
- O instrumento mede a corrente de descarga 1 minuto após a remoção da tensão.
- `DD = I1min / (V x C)`
  - Onde I1min é a corrente de descarga em mA, V é a tensão de teste em Volts e C é a capacitância em Farads.
- *Resultados:*
  - > 7: Ruim
  - 4 - 7: Pobre
  - 2 - 4: Questionável
  - < 2: Bom
  - 0: Homogêneo

**4. Modo Step Voltage (SV)**
- O teste SV é um teste de sobretensão controlada aplicado a enrolamentos (estator/rotor em AC, armadura/campo em DC).
- Baseia-se no princípio de que um isolador ideal produzirá leituras idênticas em todas as tensões, enquanto um isolador sob estresse mostrará valores menores em tensões maiores.
- A tensão aumenta incrementalmente em um quinto da tensão final a cada minuto, durante 5 minutos.
- Leituras de resistência para os primeiros quatro 'degraus' são exibidas como '1m', '2m', '3m', '4m'. A leitura de 5 minutos é o valor principal.
- Recomendado realizar teste PI antes do SV para garantir adequação.


#### c) Tangente Delta (Ponte de Schering)
- **Equipamento**: Ponte de Schering
- **Função**: Medição do fator de dissipação e análise de harmônicos
- **Controles**: Botões "Iniciar/Parar Medição"
- **Displays**: Tensão aplicada, tangente delta, corrente AC, capacitância, harmônicos
- **Gráfico**: Espectro de harmônicos em tempo real

#### d) Descarga Parcial (Ponte de Schering)
- **Equipamento**: Ponte de Schering
- **Função**: Detecção e análise de descargas parciais
- **Controles**: Botões "Iniciar/Parar Teste"
- **Displays**: Tensão aplicada, nível de descarga, contagem de pulsos
- **Visualização**: Forma de onda senoidal com descargas em tempo real

### 3. Processo de Simulação

1. **Selecione um ensaio** no menu principal
2. **Configure os parâmetros** (quando aplicável)
3. **Inicie o teste** clicando no botão correspondente
4. **Observe as leituras** em tempo real nos displays
5. **Pare o teste** quando desejar
6. **Envie os dados** para a DAIMER7. **Retorne ao menu** para realizar outros ensaios

### 4. Relatório Final
- Após completar todos os 4 ensaios, o botão "Gerar Relatório Final" será habilitado
- O relatório mostra:
  - Resumo de todos os ensaios realizados
  - Status de envio para a DAIMER  - Visualização do relatório técnico completo (PDF)
  - Opção para download do relatório

### 5. Características dos Dados Simulados
- Os valores são baseados no relatório real fornecido
- Incluem variações realísticas para simular condições reais
- Progressão temporal dos valores durante os ensaios
- Simulação de condições normais de operação

## Funcionalidades Especiais

### Contadores de Tempo
- Todos os instrumentos possuem contadores de tempo funcionais
- Mostram a duração do ensaio em formato MM:SS

### Persistência de Dados
- Os dados inseridos são mantidos ao navegar entre telas
- Histórico de medições é preservado durante a sessão

### Interface Responsiva
- Funciona em desktop e tablet
- Design moderno e profissional
- Feedback visual para todas as interações

### Visualizações em Tempo Real
- Gráficos de harmônicos (Tangente Delta)
- Forma de onda com descargas (Descarga Parcial)
- Displays digitais realísticos

## Dados Técnicos do Equipamento Simulado

**Gerador Síncrono Brushless**
- Potência: 1750 kW
- Tensão: 13200 V
- Fabricante: WEG
- Modelo: RER
- Frequência: 60 Hz
- Classe de Isolamento: B

## Finalidade Educativa

Este simulador foi desenvolvido para:
- Demonstrar o processo de coleta de dados em ensaios elétricos
- Mostrar como os equipamentos funcionam na prática
- Ilustrar a integração com a DAIMER- Servir como ferramenta de treinamento e demonstração em feiras

## Suporte Técnico

Para dúvidas sobre o simulador ou a plataforma DAIMER, entre em contato com a equipe técnica responsável.

