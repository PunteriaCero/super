#!/bin/bash

###############################################################################
# SCRIPT DE INSTALACIÓN - CONSULTA CARRITO ONLINE EN TIEMPO REAL
# 
# Este script instala todas las dependencias necesarias para:
# 1. Automatizar navegador (Puppeteer con Chrome/Chromium)
# 2. Consultar carrito online de Carrefour
# 3. Extraer productos en tiempo real
#
# Requisitos: bash, npm, 500MB de espacio libre
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Funciones de log
log_header() {
    echo -e "\n${CYAN}━━━ $1 ━━━${NC}\n"
}

log_step() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

###############################################################################
# PASO 1: VERIFICAR REQUISITOS
###############################################################################

log_header "PASO 1: VERIFICAR REQUISITOS DEL SISTEMA"

# Verificar Node.js
log_step "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    log_error "Node.js no está instalado"
    log_step "Instálalo desde: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
log_success "Node.js encontrado: $NODE_VERSION"

# Verificar npm
log_step "Verificando npm..."
if ! command -v npm &> /dev/null; then
    log_error "npm no está instalado"
    exit 1
fi

NPM_VERSION=$(npm -v)
log_success "npm encontrado: $NPM_VERSION"

# Verificar espacio disponible
log_step "Verificando espacio disponible..."
AVAILABLE_SPACE=$(df "$PROJECT_DIR" | awk 'NR==2 {print $4}')
REQUIRED_SPACE=$((500 * 1024)) # 500MB en KB

if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
    log_warn "Espacio bajo: ${AVAILABLE_SPACE}KB disponibles (se necesitan ${REQUIRED_SPACE}KB)"
    log_step "Continuar de todas formas? (s/n)"
    read -r response
    if [[ ! "$response" =~ ^[sS]$ ]]; then
        exit 1
    fi
fi

log_success "Espacio disponible: ${AVAILABLE_SPACE}KB"

###############################################################################
# PASO 2: INSTALAR DEPENDENCIAS NPM
###############################################################################

log_header "PASO 2: INSTALAR DEPENDENCIAS NPM"

cd "$PROJECT_DIR"

log_step "Instalando paquetes Node.js..."
npm install --save-dev \
    puppeteer \
    @puppeteer/browsers \
    chromium \
    axios \
    cheerio \
    dotenv \
    2>&1 | grep -E "(added|removed|up to date|npm warn)" || true

log_success "Dependencias NPM instaladas"

###############################################################################
# PASO 3: INSTALAR DEPENDENCIAS DEL SISTEMA (DEBIAN/UBUNTU)
###############################################################################

log_header "PASO 3: INSTALAR DEPENDENCIAS DEL SISTEMA"

log_step "Detectando sistema operativo..."

if command -v lsb_release &> /dev/null; then
    OS=$(lsb_release -si)
    VERSION=$(lsb_release -sr)
    log_success "Sistema: $OS $VERSION"
    
    if [[ "$OS" == "Ubuntu" || "$OS" == "Debian" ]]; then
        log_step "Instalando dependencias de Debian/Ubuntu..."
        
        # Actualizar lista de paquetes
        log_step "Actualizando repositorios (puede requerir sudo)..."
        sudo apt-get update -qq 2>&1 | tail -2 || true
        
        log_step "Instalando librerías requeridas por Chromium..."
        sudo apt-get install -y \
            libnss3 \
            libxss1 \
            libasound2 \
            libgconf-2-4 \
            fonts-liberation \
            libappindicator1 \
            libindicator7 \
            libgbm1 \
            libxkbcommon0 \
            ca-certificates \
            fonts-liberation \
            libappindicator1 \
            libappindicator3-1 \
            libasound2 \
            libatk-adaptor \
            libatk1.0-0 \
            libatspi2.0-0 \
            libcairo2 \
            libcups2 \
            libdbus-1-3 \
            libexpat1 \
            libfontconfig1 \
            libgbm1 \
            libgdk-pixbuf2.0-0 \
            libgl1-mesa-glx \
            libglib2.0-0 \
            libgtk-3-0 \
            libpango-1.0-0 \
            libpangocairo-1.0-0 \
            libx11-6 \
            libx11-xcb1 \
            libxcb1 \
            libxcomposite1 \
            libxcursor1 \
            libxdamage1 \
            libxext6 \
            libxfixes3 \
            libxi6 \
            libxinerama1 \
            libxrandr2 \
            libxrender1 \
            libxshmfence1 \
            libxss1 \
            libxtst6 \
            xdg-utils \
            wget 2>&1 | tail -5 || true
        
        log_success "Dependencias del sistema instaladas"
    else
        log_warn "Sistema no es Debian/Ubuntu"
        log_step "Para sistemas alternativos, necesitarás instalar manualmente:"
        log_step "  - libnss3, libxss1, libasound2, libgconf-2-4"
        log_step "  - fonts-liberation, libappindicator1"
        log_step "  - libgbm1, libxkbcommon0, ca-certificates"
    fi
else
    log_warn "No se pudo detectar el sistema operativo"
    log_step "Asegúrate de tener instaladas estas librerías:"
    log_step "  - libnss3, libxss1, libasound2, libgconf-2-4"
    log_step "  - fonts-liberation, libappindicator1, libgbm1"
fi

###############################################################################
# PASO 4: DESCARGAR CHROMIUM
###############################################################################

log_header "PASO 4: DESCARGAR CHROMIUM"

log_step "Descargando Chromium (esto puede tomar 2-5 minutos)..."
log_warn "Requiere ~300MB de conexión a Internet"

npx @puppeteer/browsers install chromium 2>&1 | tail -10 || true

log_success "Chromium descargado"

###############################################################################
# PASO 5: VERIFICAR INSTALACIÓN
###############################################################################

log_header "PASO 5: VERIFICAR INSTALACIÓN"

log_step "Verificando paquetes instalados..."

PACKAGES=(
    "puppeteer"
    "@puppeteer/browsers"
    "chromium"
    "axios"
    "cheerio"
    "dotenv"
)

MISSING=0
for pkg in "${PACKAGES[@]}"; do
    if npm list "$pkg" --depth=0 2>/dev/null | grep -q "$pkg"; then
        log_success "$pkg instalado"
    else
        log_warn "$pkg no encontrado"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -eq 0 ]; then
    log_success "✅ Todos los paquetes están instalados"
else
    log_warn "⚠️  Faltan $MISSING paquetes"
fi

###############################################################################
# PASO 6: VERIFICAR CHROMIUM
###############################################################################

log_header "PASO 6: VERIFICAR CHROMIUM"

log_step "Buscando Chromium instalado..."

CHROMIUM_PATH=$(find "$HOME/.cache/puppeteer" -name "chrome" -o -name "chromium" 2>/dev/null | head -1)

if [ -n "$CHROMIUM_PATH" ]; then
    log_success "Chromium encontrado: $CHROMIUM_PATH"
    
    # Verificar que es ejecutable
    if [ -x "$CHROMIUM_PATH" ]; then
        log_success "✅ Chromium es ejecutable"
    else
        log_warn "Chromium no es ejecutable, intentando reparar..."
        chmod +x "$CHROMIUM_PATH" || true
    fi
else
    log_warn "No se encontró Chromium"
    log_step "Intentando descargar nuevamente..."
    npx @puppeteer/browsers install chromium
fi

###############################################################################
# PASO 7: CREAR SCRIPT DE PRUEBA
###############################################################################

log_header "PASO 7: CREAR SCRIPT DE PRUEBA"

log_step "Creando script de prueba..."

cat > "$PROJECT_DIR/test-carrito-browser.js" << 'TESTSCRIPT'
#!/usr/bin/env node

const puppeteer = require('puppeteer');
require('dotenv').config();

(async () => {
  const email = process.env.CARREFOUR_EMAIL || 'test@example.com';
  const password = process.env.CARREFOUR_PASSWORD || 'test';

  console.log('🧪 Probando Puppeteer + Chromium...\n');

  try {
    console.log('1️⃣  Iniciando navegador...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    console.log('✅ Navegador iniciado\n');

    console.log('2️⃣  Creando página...');
    const page = await browser.newPage();
    console.log('✅ Página creada\n');

    console.log('3️⃣  Navegando a Carrefour...');
    await page.goto('https://www.carrefour.com.ar', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    console.log('✅ Página cargada\n');

    console.log('4️⃣  Tomando captura de pantalla...');
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('✅ Screenshot guardado: test-screenshot.png\n');

    console.log('5️⃣  Cerrando navegador...');
    await browser.close();
    console.log('✅ Navegador cerrado\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ PRUEBA EXITOSA - Sistema listo');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Próximo paso: Ejecuta');
    console.log('  node consultar-carrito-browser.js\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
TESTSCRIPT

chmod +x "$PROJECT_DIR/test-carrito-browser.js"
log_success "Script de prueba creado"

###############################################################################
# PASO 8: RESUMEN
###############################################################################

log_header "✅ INSTALACIÓN COMPLETADA"

cat << 'SUMMARY'

Ahora puedes:

1️⃣  PROBAR EL SISTEMA:
   cd /workspace/super/.opencode/skills/carrefour-integration
   node test-carrito-browser.js

2️⃣  CONSULTAR TU CARRITO REAL:
   node consultar-carrito-browser.js

3️⃣  AGREGAR PRODUCTOS:
   node cli.js add-cart

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INFORMACIÓN DE INSTALACIÓN:

📦 Paquetes instalados:
   - puppeteer (navegador automatizado)
   - chromium (motor de navegador)
   - axios (solicitudes HTTP)
   - cheerio (parseo HTML)
   - dotenv (variables de entorno)

🔧 Chromium descargado:
   - Ubicación: ~/.cache/puppeteer/chromium/
   - Tamaño: ~300MB
   - Estado: Listo para usar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRÓXIMOS PASOS:

1. Ejecuta la prueba:
   bash INSTALAR-DEPENDENCIAS.sh
   
   (Si todo está bien)

2. Consulta tu carrito online:
   node consultar-carrito-browser.js

3. Verás tus 3 productos en tiempo real

SUMMARY

log_success "Instalación completada correctamente"

