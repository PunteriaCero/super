#!/bin/bash

# Script de instalación para Carrefour Integration SKILL
# Uso: bash install.sh

set -e

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SKILL_DIR/.env"
ENV_EXAMPLE="$SKILL_DIR/.env.example"

echo "🚀 Instalando Carrefour Integration SKILL..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "$ENV_EXAMPLE" ]; then
    echo "❌ Error: No se encontró .env.example"
    echo "Asegúrate de ejecutar este script desde la carpeta de carrefour-integration"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    echo "Instala Node.js >= 14.0.0 y vuelve a intentar"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION encontrado"
echo ""

# Crear archivo .env si no existe
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creando archivo .env..."
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo "✅ Archivo .env creado"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "   Edita $ENV_FILE con tus credenciales de Carrefour"
    echo "   nano .env"
    echo ""
else
    echo "✅ Archivo .env ya existe"
    echo ""
fi

# Instalar dependencias
if [ ! -d "$SKILL_DIR/node_modules" ]; then
    echo "📦 Instalando dependencias npm..."
    cd "$SKILL_DIR"
    npm install
    echo "✅ Dependencias instaladas"
    echo ""
else
    echo "✅ Dependencias ya instaladas"
    echo ""
fi

# Crear directorio de almacenamiento
echo "📂 Creando directorio de almacenamiento..."
mkdir -p "$SKILL_DIR/.carrefour-data"
echo "✅ Directorio creado"
echo ""

# Resumen
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Instalación completada"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1️⃣  Edita tu archivo .env con credenciales:"
echo "   nano $ENV_FILE"
echo ""
echo "2️⃣  Autentica con Carrefour:"
echo "   cd $SKILL_DIR"
echo "   node cli.js setup"
echo ""
echo "3️⃣  Sincroniza tu historial de compras:"
echo "   node cli.js sync"
echo ""
echo "4️⃣  Ve tu historial:"
echo "   node cli.js history"
echo ""
echo "📖 Para más información, lee SKILL.md o README.md"
echo ""
