@echo off
REM Cria a estrutura de pastas e arquivos vazios conforme solicitado

REM Pasta principal src e suas subpastas
mkdir src\components\DetalhesEstrategia
mkdir src\components\ui

mkdir src\strategies\abertura-conta
mkdir src\strategies\credito
mkdir src\strategies\seguro

mkdir src\services
mkdir src\utils

REM Cria arquivos vazios nos respectivos diretórios
type nul > src\components\DetalhesEstrategia\index.tsx

type nul > src\strategies\abertura-conta\AberturaContaStrategy.tsx
type nul > src\strategies\abertura-conta\useAberturaConta.ts

type nul > src\strategies\credito\CreditoStrategy.tsx
type nul > src\strategies\credito\useCredito.ts

type nul > src\strategies\seguro\SeguroStrategy.tsx
type nul > src\strategies\seguro\useSeguro.ts

type nul > src\services\apiService.ts
type nul > src\utils\formatDate.ts

echo Estrutura de pastas criada com sucesso.
pause
