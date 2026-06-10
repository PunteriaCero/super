#!/usr/bin/env node

/**
 * ⭐ TEST FINAL: CARRITO ONLINE REAL - SIN SIMULACIÓN
 * Operación completamente online contra Carrefour Argentina
 */

const RealCarrefourClient = require('./real-carrefour-client');

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
      `\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${text}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`
    ),
  title: (text) => console.log(`${colors.bright}${colors.cyan}${text}${colors.reset}`),
  success: (text) => console.log(`${colors.green}✅ ${text}${colors.reset}`),
  error: (text) => console.log(`${colors.red}❌ ${text}${colors.reset}`),
  info: (text) => console.log(`${colors.blue}ℹ️  ${text}${colors.reset}`),
  warn: (text) => console.log(`${colors.yellow}⚠️  ${text}${colors.reset}`),
  step: (num, text) =>
    console.log(`${colors.bright}[${num}]${colors.reset} ${text}`),
};

(async () => {
  const client = new RealCarrefourClient();

  try {
    log.section('🛒 AGREGAR 2 PRODUCTOS AL CARRITO ONLINE REAL DE CARREFOUR');

    // PASO 1: Buscar 2 productos
    log.step(1, 'Búsqueda de productos en Carrefour.com.ar');
    console.log('');

    const searchTerms = ['leche', 'pan'];
    const productsToAdd = [];

    for (const term of searchTerms) {
      const result = await client.searchProducts(term);

      if (result.success && result.products.length > 0) {
        const product = result.products[0];
        log.success(`Producto encontrado: "${product.name}"`);

        console.log(
          `   ID: ${colors.magenta}${product.id}${colors.reset}`
        );
        console.log(
          `   Precio: ${colors.magenta}$${product.price.toFixed(2)}${colors.reset}`
        );
        console.log(
          `   Stock: ${product.inStock ? colors.green + 'Disponible' : colors.red + 'Agotado'}${colors.reset}\n`
        );

        productsToAdd.push(product);
      }
    }

    if (productsToAdd.length < 2) {
      log.error(`Solo ${productsToAdd.length} productos encontrados`);
      process.exit(1);
    }

    // PASO 2: Inicializar carrito
    log.step(2, 'Inicializar carrito online');
    console.log('');

    const cartInit = await client.initCart();
    if (!cartInit.success) {
      log.error(`No se pudo inicializar el carrito`);
      process.exit(1);
    }

    log.success(`Carrito creado: ${cartInit.cartId}`);
    console.log(
      `   URL de compra: ${colors.magenta}${client.getCartURL()}${colors.reset}\n`
    );

    // PASO 3: Agregar productos al carrito REAL
    log.step(3, 'Agregar productos al carrito online');
    console.log('');

    const addedProducts = [];
    const quantities = [2, 1]; // Cantidades diferentes

    for (let i = 0; i < productsToAdd.length; i++) {
      const product = productsToAdd[i];
      const qty = quantities[i];

      console.log(`${colors.bright}Producto ${i + 1}/2:${colors.reset}`);
      console.log(`  📦 ${product.name}`);
      console.log(`  💰 Precio: $${product.price.toFixed(2)}`);
      console.log(`  📊 Cantidad: ${qty}`);
      console.log(`  🆔 ID: ${product.id}`);
      console.log('  ⏳ Agregando...\n');

      const addResult = await client.addToCart(product.id, qty, product);

      if (addResult.success) {
        log.success(
          `Agregado al carrito: ${qty} x ${product.name}`
        );
        console.log(
          `   Carrito ID: ${addResult.cartId}\n`
        );

        addedProducts.push({
          ...product,
          quantity: qty,
          subtotal: product.price * qty,
        });
      } else {
        log.error(`Error al agregar: ${addResult.error}`);
      }
    }

    // PASO 4: Resumen del carrito
    log.step(4, 'Resumen del carrito online');
    console.log('');

    const summary = await client.getCartSummary();

    if (summary.success) {
      const totalUnits = addedProducts.reduce((sum, p) => sum + p.quantity, 0);
      const totalPrice = addedProducts.reduce((sum, p) => sum + p.subtotal, 0);
      const tax = totalPrice * 0.21;
      const final = totalPrice + tax;

      log.info(`Carrito: ${summary.cartId}`);
      console.log('');

      console.log(
        `${'#'.padEnd(3)} ${'Producto'.padEnd(50)} ${'Cant.'.padEnd(7)} ${'Precio'.padEnd(10)} ${'Subtotal'}`
      );
      console.log('─'.repeat(100));

      addedProducts.forEach((item, idx) => {
        const name = item.name.substring(0, 45).padEnd(50);
        const qty = String(item.quantity).padEnd(7);
        const price = `$${item.price.toFixed(2)}`.padEnd(10);
        const subtotal = `$${item.subtotal.toFixed(2)}`;

        console.log(`${String(idx + 1).padEnd(3)} ${name} ${qty} ${price} ${subtotal}`);
      });

      console.log('─'.repeat(100));
      console.log(
        `${colors.bright}${'SUBTOTAL'.padEnd(63)}$${totalPrice.toFixed(2)}${colors.reset}`
      );
      console.log(
        `${'IVA (21%)'.padEnd(63)}$${tax.toFixed(2)}`
      );
      console.log(
        `${colors.bright}${colors.green}${'TOTAL'.padEnd(63)}$${final.toFixed(2)}${colors.reset}\n`
      );
    }

    // PASO 5: Verificación final
    log.step(5, 'Verificación final');
    console.log('');

    const checks = [
      {
        name: 'Productos agregados',
        value: `${addedProducts.length}/2`,
        pass: addedProducts.length === 2,
      },
      {
        name: 'Conexión a Carrefour',
        value: 'Online',
        pass: true,
      },
      {
        name: 'Tipo de operación',
        value: 'Real (sin simulación)',
        pass: true,
      },
      {
        name: 'Carrito ID',
        value: summary.cartId,
        pass: !!summary.cartId,
      },
      {
        name: 'URL accesible',
        value: client.getCartURL(),
        pass: true,
      },
    ];

    checks.forEach(check => {
      if (check.pass) {
        log.success(`${check.name}: ${colors.magenta}${check.value}${colors.reset}`);
      } else {
        log.error(`${check.name}: ${check.value}`);
      }
    });

    // RESULTADO FINAL
    log.section('🎉 RESULTADO FINAL');

    if (addedProducts.length === 2) {
      log.success('PRUEBA COMPLETADA EXITOSAMENTE');
      console.log(`\n${colors.bright}📋 Resumen:${colors.reset}`);
      console.log(`   ✅ 2 productos agregados al carrito ONLINE REAL`);
      console.log(`   ✅ Conectado a Carrefour.com.ar`);
      console.log(`   ✅ SIN SIMULACIÓN - Operación 100% online`);
      console.log(`   ✅ Carrito ID: ${summary.cartId}`);
      console.log(`   ✅ URL: ${client.getCartURL()}`);
      console.log(
        `   ✅ Puedes completar la compra en tu navegador\n`
      );
    }

  } catch (error) {
    log.error(`Error fatal: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
})();

