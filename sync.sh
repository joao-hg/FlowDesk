#!/bin/bash

echo "🔄 Iniciando sincronização com Notion e GitHub..."

# Sincroniza com o Notion
node sync_notion.js

# Git Add & Commit (caso haja mudanças que a IA não comitou)
git add .
git commit -m "Auto-sync: atualização de progresso" || echo "Nenhuma nova mudança no Git local."

# Push para o GitHub
# Alterar branch principal para 'main' caso ainda esteja 'master'
git branch -M main
git pull origin main --rebase
git push -u origin main

echo "✅ Sincronização concluída!"
