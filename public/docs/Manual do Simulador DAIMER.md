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

