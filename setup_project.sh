#!/bin/bash

echo "🚀 Iniciando a configuração do ambiente FlowDesk..."

# 1. Configurar Frontend (Next.js)
if [ ! -d "frontend" ]; then
  echo "📦 Criando Frontend em Next.js..."
  # Usando 'yes' ou rodando de forma interativa, mas npx permite flags pra não ser interativo
  npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
else
  echo "✅ Pasta frontend já existe, ignorando..."
fi

# 2. Configurar Backend (Node.js REST API)
if [ ! -d "backend" ]; then
  echo "⚙️ Criando Backend em Node.js..."
  mkdir backend && cd backend
  npm init -y
  
  # Instala dependências principais
  npm install express cors dotenv @prisma/client
  
  # Instala dependências de desenvolvimento
  npm install -D typescript ts-node prisma @types/node @types/express @types/cors
  
  # Inicializa TypeScript
  npx tsc --init
  
  # Inicializa Prisma (PostgreSQL)
  npx prisma init
  
  cd ..
else
  echo "✅ Pasta backend já existe, ignorando..."
fi

echo "🎉 Projeto base gerado com sucesso!"
echo "➡️  Não se esqueça de rodar './sync.sh' de tempos em tempos para salvar seu progresso no Github e no Notion."
