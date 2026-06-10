#!/usr/bin/env node

/**
 * Verificar persistencia del carrito online
 */

const CarrefourCartReal = require('./carrefour-cart-real');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = {
  section: (text) =>
    console.log(
      `\n${colors.bright}${colors.cyan}━━━ ${text} ━━━${colors.reset}\n`
    ),
  success: (text) => console.log(`${colors.green}✅ ${text}${colors.reset}`),
  error: (text) => console.log(`${colors.red}❌ ${text}${colors.reset}`),
  info: (text) => console.log(`${colors.blue}ℹ️  ${text}${colors.reset}`),
};

(async () => {
  try {
    log.section('🔍 VERIFICAR PERSISTENCIA DEL CARRITO ONLINE');

    const carrefour = new CarrefourCartReal();

    // Paso 1: Obtener carrito actual
    log.info('Conectando a carrito online de Carrefour...\n');

    const cartURL = await carrefour.getCartURL();

    if (cartURL.success) {
      log.success(`Carrito accesible en: ${cartURL.url}\n`);
    }

    // Paso 2: Obtener resumen actual
    log.section('📦 CONTENIDO DEL CARRITO');

    const summary = carrefour.getCartSummary();

    if (summary.success && summary.items.length > 0) {
      log.success(`Carrito contiene ${summary.items.length} productos\n`);

      console.log(
        `${'#'.padEnd(3)} ${'Producto'.padEnd(50)} ${'Cant'.padEnd(6)} ${'Precio'.padEnd(12)} ${'Subtotal'}`
      );
      console.log('─'.repeat(100));

      summary.items.forEach((item, idx) => {
        const name = item.name.substring(0, 45).padEnd(50);
        const qty = String(item.quantity).padEnd(6);
        const price = `$${item.price.toFixed(2)}`.padEnd(12);
        const subtotal = `$${(item.price * item.quantity).toFixed(2)}`;

        console.log(`${String(idx + 1).padEnd(3)} ${name} ${qty} ${price} ${subtotal}`);
      });

      console.log('─'.repeat(100));
      console.log(
        `${colors.bright}SUBTOTAL${' '.repeat(59)}$${summary.subtotal}${colors.reset}`
      );
      console.log(
        `IVA (21%)${' '.repeat(59)}$${summary.tax}`
      );
      console.log(
        `${colors.bright}${colors.green}TOTAL${' '.repeat(63)}$${summary.total}${colors.reset}\n`
      );

      // Paso 3: Información de sesión
      log.section('📋 INFORMACIÓN DE SESIÓN');

      log.info(`Creado: ${summary.createdAt}`);
      log.info(`Items: ${summary.itemCount}`);
      log.info(`Unidades: ${summary.unitCount}`);
      log.info(`URL: ${summary.cartURL}\n`);

      // Paso 4: Próximo paso
      log.section('🔗 PRÓXIMO PASO');

      log.success('Carrito persiste online');
      console.log(`\n${colors.bright}Para completar tu compra:${colors.reset}`);
      console.log(`1. Abre: ${colors.cyan}${summary.cartURL}${colors.reset}`);
      console.log(`2. Verifica los productos`);
      console.log(`3. Completa el pago\n`);

    } else {
      log.error('El carrito está vacío');
      log.info('\nPara agregar productos, ejecuta:\n  node test-carrito-online.js\n');
    }

  } catch (error) {
    log.error(`Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
})();

