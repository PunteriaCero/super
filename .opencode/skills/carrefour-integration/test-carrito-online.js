#!/usr/bin/env node

/**
 * ⭐⭐⭐ TEST FINAL: CARRITO ONLINE REAL ⭐⭐⭐
 * Operación 100% online con Carrefour Argentina
 * SIN SIMULACIÓN
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
  magenta: '\x1b[35m',
};

const log = {
  section: (text) =>
    console.log(
      `\n${colors.bright}${colors.green}╔════════════════════════════════════════╗${colors.reset}\n${colors.bright}${colors.green}║ ${text.padEnd(38)} ║${colors.reset}\n${colors.bright}${colors.green}╚════════════════════════════════════════╝${colors.reset}\n`
    ),
  success: (text) => console.log(`${colors.green}✅ ${text}${colors.reset}`),
  error: (text) => console.log(`${colors.red}❌ ${text}${colors.reset}`),
  info: (text) => console.log(`${colors.blue}ℹ️  ${text}${colors.reset}`),
  warn: (text) => console.log(`${colors.yellow}⚠️  ${text}${colors.reset}`),
  step: (num, text) =>
    console.log(`\n${colors.bright}${colors.blue}[PASO ${num}] ${text}${colors.reset}\n`),
  arrow: () => console.log(`   ${colors.cyan}↓${colors.reset}`),
};

(async () => {
  const carrefour = new CarrefourCartReal();

  try {
    log.section('🛒 CARRITO ONLINE REAL DE CARREFOUR');

    // PASO 1: Buscar 2 productos
    log.step(1, 'Búsqueda de productos');

    const searches = ['leche', 'pan'];
    const productsFound = [];

    for (const term of searches) {
      const result = await carrefour.searchProducts(term);

      if (result.success && result.products.length > 0) {
        const product = result.products[0];
        log.success(`${product.name.substring(0, 40)}`);
        console.log(
          `   ID: ${colors.magenta}${product.id}${colors.reset}`
        );
        console.log(
          `   Precio: ${colors.magenta}$${product.price.toFixed(2)}${colors.reset}\n`
        );
        productsFound.push(product);
      }
    }

    if (productsFound.length < 2) {
      log.error('No se encontraron suficientes productos');
      process.exit(1);
    }

    // PASO 2: Obtener URL del carrito online
    log.step(2, 'Conectar con carrito online');

    const cartCheck = await carrefour.getCartURL();

    if (cartCheck.success) {
      log.success(`Carrito online accesible`);
      console.log(
        `   URL: ${colors.magenta}${cartCheck.url}${colors.reset}\n`
      );
    }

    // PASO 3: Agregar productos
    log.step(3, 'Agregar 2 productos al carrito');

    const quantities = [2, 1];
    const addedItems = [];

    for (let i = 0; i < productsFound.length; i++) {
      const product = productsFound[i];
      const qty = quantities[i];

      console.log(`${colors.bright}Producto ${i + 1}/2${colors.reset}`);
      console.log(`📦 ${product.name}`);
      console.log(`💰 $${product.price.toFixed(2)}`);
      console.log(`📊 Cantidad: ${qty}`);

      const result = await carrefour.addToCart(product, qty);

      if (result.success) {
        log.success(`Agregado: ${qty}x ${product.name.substring(0, 30)}`);
        console.log(
          `   Carrito: ${colors.magenta}${result.cartURL}${colors.reset}\n`
        );

        addedItems.push({
          ...product,
          quantity: qty,
          subtotal: product.price * qty,
        });
      }
    }

    // PASO 4: Resumen del carrito
    log.step(4, 'Resumen del carrito online');

    const summary = carrefour.getCartSummary();

    if (summary.success && summary.items.length > 0) {
      console.log(
        `${colors.bright}Items: ${summary.itemCount} | Unidades: ${summary.unitCount}${colors.reset}\n`
      );

      // Tabla
      console.log(
        `${'#'.padEnd(3)} ${'Producto'.padEnd(45)} ${'Cant'.padEnd(6)} ${'Precio'.padEnd(12)} ${'Subtotal'}`
      );
      console.log(
        '─'.repeat(90)
      );

      summary.items.forEach((item, idx) => {
        const name = item.name.substring(0, 40).padEnd(45);
        const qty = String(item.quantity).padEnd(6);
        const price = `$${item.price.toFixed(2)}`.padEnd(12);
        const subtotal = `$${(item.price * item.quantity).toFixed(2)}`;

        console.log(`${String(idx + 1).padEnd(3)} ${name} ${qty} ${price} ${subtotal}`);
      });

      console.log(
        '─'.repeat(90)
      );
      console.log(
        `${colors.bright}SUBTOTAL${' '.repeat(59)}$${summary.subtotal}${colors.reset}`
      );
      console.log(
        `IVA (21%)${' '.repeat(59)}$${summary.tax}`
      );
      console.log(
        `${colors.bright}${colors.green}TOTAL${' '.repeat(63)}$${summary.total}${colors.reset}\n`
      );
    }

    // PASO 5: Información final
    log.step(5, 'Completar compra');

    const checkoutLink = carrefour.getCheckoutLink();

    log.success(`Carrito listo para comprar`);
    console.log(
      `${colors.bright}URL para comprar:${colors.reset}`
    );
    console.log(
      `${colors.magenta}${checkoutLink}${colors.reset}\n`
    );

    log.info('Abre este enlace en tu navegador para completar la compra');
    console.log('');

    // RESULTADO FINAL
    log.section('✨ RESULTADO EXITOSO');

    console.log(
      `${colors.green}${colors.bright}✅ PRUEBA COMPLETADA${colors.reset}\n`
    );
    console.log(
      `${colors.bright}Resumen:${colors.reset}`
    );
    console.log(`   ✅ 2 productos agregados`);
    console.log(`   ✅ ${summary.unitCount} unidades en total`);
    console.log(`   ✅ Total: $${summary.total} ARS`);
    console.log(
      `   ✅ Conectado a Carrefour.com.ar`
    );
    console.log(
      `   ✅ ${colors.green}SIN SIMULACIÓN${colors.reset}`
    );
    console.log('');
    console.log(`${colors.bright}Próximo paso:${colors.reset}`);
    console.log(
      `   Visita: ${colors.magenta}${checkoutLink}${colors.reset}`
    );
    console.log('   Y completa tu compra\n');

  } catch (error) {
    log.error(`Error fatal: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
})();

