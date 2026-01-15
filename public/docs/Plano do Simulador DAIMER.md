# Plano do Simulador DAIMER

## Visão Geral
O simulador DAIMER será uma aplicação web interativa que demonstra como os usuários coletam dados de ensaios elétricos através de diferentes equipamentos e enviam para a plataforma DAIMER.

## Estrutura do Simulador

### 1. Tela Inicial
- Logo da DAIMER
- Título: "Simulador de Ensaios Elétricos - Plataforma DAIMER"
- Botão "Iniciar Simulação"
- Informações sobre o equipamento sendo testado (Gerador Síncrono Brushless)

### 2. Menu Principal de Ensaios
- Lista dos ensaios disponíveis:
  - Resistência Ôhmica (Microhmímetro)
  - Resistência de Isolamento (Megôhmetro)
  - Tangente Delta (Ponte de Schering)
  - Descarga Parcial (Ponte de Schering)
- Progresso dos ensaios realizados
- Botão "Gerar Relatório Final"

### 3. Interface do Microhmímetro
**Funcionalidades:**
- Seleção da escala de corrente (1A, 10A, 100A)
- Display da corrente injetada
- Display da resistência medida
- Contador de tempo do ensaio
- Botão "Iniciar Medição"
- Botão "Parar Medição"
- Botão "Enviar para Plataforma DAIMER"

### 4. Interface do Megôhmetro
**Funcionalidades:**
- Seleção do modo de teste:
  - SV (Step Voltage)
  - DD (Descarga Dielétrica)
  - IP (Índice de Polarização)
- Seleção da tensão de teste (500V, 1000V, 2500V, 5000V, 10000V)
- Display da tensão aplicada
- Display da resistência medida
- Display da corrente medida
- Display da constante de tempo
- Display da capacitância CC
- Contador de tempo do ensaio
- Botão "Iniciar Teste"
- Botão "Parar Teste"
- Botão "Enviar para Plataforma DAIMER"

### 5. Interface da Ponte de Schering (Tangente Delta)
**Funcionalidades:**
- Display da tensão aplicada
- Display da tangente delta (%)
- Display da corrente AC
- Display da capacitância
- Display do percentual de harmônicos da corrente de fuga
- Gráfico em tempo real dos harmônicos
- Contador de tempo do ensaio
- Botão "Iniciar Medição"
- Botão "Parar Medição"
- Botão "Enviar para Plataforma DAIMER"

### 6. Interface de Descarga Parcial
**Funcionalidades:**
- Display da tensão aplicada
- Visualização da forma de onda senoidal com descargas
- Contador de pulsos de descarga
- Display do nível de descarga parcial (pC)
- Gráfico em tempo real das descargas
- Contador de tempo do ensaio
- Botão "Iniciar Teste"
- Botão "Parar Teste"
- Botão "Enviar para Plataforma DAIMER"

### 7. Tela de Relatório Final
- Exibição do relatório completo (PDF original)
- Resumo dos ensaios realizados
- Status de envio para a plataforma
- Botão "Nova Simulação"
- Botão "Baixar Relatório"

## Características Técnicas

### Design
- Interface moderna e profissional
- Cores baseadas na identidade visual da DAIMER
- Layout responsivo para desktop e tablet
- Animações suaves e transições
- Feedback visual para todas as interações

### Funcionalidades Interativas
- Simulação realística dos equipamentos
- Dados simulados baseados no relatório real
- Contadores de tempo funcionais
- Gráficos em tempo real
- Persistência de dados entre telas
- Validação de entrada de dados

### Tecnologias
- HTML5, CSS3, JavaScript
- Canvas para gráficos e visualizações
- LocalStorage para persistência de dados
- Animações CSS e JavaScript
- Design responsivo com CSS Grid/Flexbox

## Fluxo de Navegação
1. Tela Inicial → Menu Principal
2. Menu Principal → Interface do Equipamento
3. Interface do Equipamento → Confirmação de Envio
4. Confirmação de Envio → Menu Principal
5. Menu Principal (todos ensaios completos) → Relatório Final
6. Relatório Final → Tela Inicial (Nova Simulação)

## Dados Simulados
- Valores baseados no relatório real fornecido
- Variação aleatória controlada para realismo
- Progressão temporal dos valores
- Simulação de condições normais de operação

