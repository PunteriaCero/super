#!/bin/bash

# Setup script para el Sistema de Seguimiento de Compras

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Configurando Sistema de Seguimiento de Compras            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verifica Node.js
echo "✓ Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi
echo "✓ Node.js: $(node --version)"

# Crea directorios
echo ""
echo "✓ Creando estructura de directorios..."
mkdir -p /workspace/super/data
mkdir -p /workspace/super/tickets
mkdir -p /workspace/super/.opencode/skills

# Verifica OCR
echo ""
echo "✓ Verificando OCR..."

if command -v tesseract &> /dev/null; then
    echo "✓ Tesseract instalado: $(tesseract --version | head -1)"
    OCR_METHOD="tesseract"
else
    echo "⚠️  Tesseract no instalado (recomendado)"
    echo "   Instalación en Ubuntu/Debian:"
    echo "   $ sudo apt-get install tesseract-ocr tesseract-ocr-spa"
    echo ""
    echo "   Instalación en macOS:"
    echo "   $ brew install tesseract"
    echo ""
    echo "   El sistema usará Google Vision API como fallback si está disponible"
    OCR_METHOD="vision-api"
fi

# Verifica Google Cloud (opcional)
echo ""
echo "✓ Verificando Google Cloud SDK (opcional)..."
if command -v gcloud &> /dev/null; then
    echo "✓ Google Cloud SDK instalado"
else
    echo "ℹ️  Google Cloud SDK no instalado (necesario para Vision API)"
fi

# Crea archivo de configuración del setup
cat > /workspace/super/.setup.json << 'EOF'
{
  "setup_date": "2024-06-05",
  "ocr_method": "OCRMETHODPLACEHOLDER",
  "status": "ready",
  "features": {
    "ocr": true,
    "parser": true,
    "pattern_detection": true,
    "carrefour_integration": false
  },
  "dependencies": {
    "required": ["node"],
    "optional": ["tesseract", "gcloud"]
  }
}
EOF

# Reemplaza el placeholder
sed -i "s/OCRMETHODPLACEHOLDER/$OCR_METHOD/g" /workspace/super/.setup.json

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Setup Completado ✅                                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Próximos pasos:"
echo "  1. Carga la SKILL: skill load grocery-ocr"
echo "  2. Procesa un ticket: /process-ticket-image ./tickets/ticket.jpg"
echo "  3. Obtén recomendaciones: /suggest-shopping"
echo ""
echo "Documentación:"
echo "  • README.md - Documentación completa"
echo "  • QUICK_START.md - Guía rápida"
echo ""
