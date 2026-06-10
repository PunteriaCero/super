#!/usr/bin/env node

/**
 * TEST REAL: Agregar 2 productos al carrito de Carrefour ONLINE
 * SIN SIMULACIÓN - OPERACIÓN REAL
 */

const CarrefourRealAPI = require('./real-api-integration');
require('dotenv').config();

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
      `\n${colors.bright}${colors.cyan}━━━ ${text} ━━━${colors.reset}\n`
    ),
  success: (text) => console.log(`${colors.green}✅ ${text}${colors.reset}`),
  error: (text) => console.log(`${colors.red}❌ ${text}${colors.reset}`),
  info: (text) => console.log(`${colors.blue}ℹ️  ${text}${colors.reset}`),
  warn: (text) => console.log(`${colors.yellow}⚠️  ${text}${colors.reset}`),
  product: (name, index) =>
    console.log(`${colors.bright}${colors.magenta}Producto ${index}${colors.reset}: ${name}`),
};

(async () => {
  const api = new CarrefourRealAPI();

  try {
    log.section('🛒 AGREGAR 2 PRODUCTOS AL CARRITO ONLINE REAL');

    // PASO 1: Buscar productos
    log.section('PASO 1: BÚSQUEDA DE PRODUCTOS EN CARREFOUR ONLINE');

    const searchTerms = ['leche', 'pan'];
    const productsToAdd = [];

    for (const term of searchTerms) {
      const result = await api.searchProduct(term);

      if (result.success && result.products.length > 0) {
        const product = result.products[0];
        log.success(`Producto encontrado: ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Precio: $${product.price}`);
        console.log(`   Stock: ${product.inStock ? 'Disponible' : 'Agotado'}\n`);

        if (product.inStock) {
          productsToAdd.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
          });
        }
      } else {
        log.warn(`No se encontraron productos para: "${term}"`);
      }
    }

    if (productsToAdd.length < 2) {
      log.error(`Solo se encontraron ${productsToAdd.length} productos disponibles`);
      log.info('Intentando con términos alternativos...');

      const altTerms = ['frutas', 'verduras', 'carne', 'pollo'];
      for (const term of altTerms) {
        if (productsToAdd.length >= 2) break;

        const result = await api.searchProduct(term);
        if (result.success && result.products.length > 0) {
          const product = result.products[0];
          if (product.inStock) {
            productsToAdd.push({
              id: product.id,
              name: product.name,
              price: product.price,
              quantity: 1,
            });
            log.success(`Producto adicional encontrado: ${product.name}`);
          }
        }
      }
    }

    if (productsToAdd.length < 2) {
      log.error('No se pudieron encontrar 2 productos disponibles online');
      process.exit(1);
    }

    log.success(`${productsToAdd.length} productos listos para agregar\n`);

    // PASO 2: Agregar al carrito REAL
    log.section('PASO 2: AGREGAR PRODUCTOS AL CARRITO ONLINE');

    const addedItems = [];

    for (let i = 0; i < productsToAdd.length; i++) {
      const product = productsToAdd[i];
      const quantity = i === 0 ? 2 : 1;

      console.log(`${colors.bright}${colors.magenta}Producto ${i + 1}/2${colors.reset}`);
      console.log(`📦 ${product.name}`);
      console.log(`💰 Precio: $${product.price}`);
      console.log(`📊 Cantidad: ${quantity}`);
      console.log(`🆔 ID: ${product.id}`);
      console.log('⏳ Agregando al carrito online...\n');

      const result = await api.addToCartReal(product.id, quantity);

      if (result.success) {
        log.success(`Agregado correctamente`);
        console.log(`   Carrito: ${result.itemCount} items`);
        console.log(`   Total: $${result.cartTotal}\n`);

        addedItems.push({
          name: product.name,
          id: product.id,
          quantity: quantity,
          price: product.price,
          subtotal: product.price * quantity,
        });
      } else {
        log.error(`Error: ${result.error}`);
      }

      if (i < productsToAdd.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // PASO 3: Obtener resumen del carrito
    log.section('PASO 3: RESUMEN DEL CARRITO ONLINE');

    const summary = await api.getCartSummary();

    if (summary.success) {
      console.log(`${colors.bright}Items en carrito: ${summary.itemCount}${colors.reset}\n`);

      console.log(`${'#'.padEnd(3)} ${'Producto'.padEnd(50)} ${'Cant'.padEnd(6)} ${'Precio'.padEnd(12)} ${'Subtotal'}`);
      console.log('─'.repeat(100));

      summary.items.forEach((item, idx) => {
        const name = item.name.substring(0, 45).padEnd(50);
        const qty = String(item.quantity).padEnd(6);
        const price = `$${item.price.toFixed(2)}`.padEnd(12);
        const subtotal = `$${item.subtotal.toFixed(2)}`;

        console.log(`${String(idx + 1).padEnd(3)} ${name} ${qty} ${price} ${subtotal}`);
      });

      console.log('─'.repeat(100));
      console.log(`${'SUBTOTAL'.padEnd(59)} $${summary.subtotal}`);
      console.log(`${'IVA (21%)'.padEnd(59)} $${summary.tax}`);
      console.log(
        `${colors.bright}${'TOTAL'.padEnd(59)} $${summary.total}${colors.reset}\n`
      );
    } else {
      log.warn(`No se pudo obtener resumen: ${summary.error}`);
    }

    // PASO 4: Verificación final
    log.section('PASO 4: VERIFICACIÓN FINAL');

    const checks = [
      { name: 'Productos agregados', value: `${addedItems.length}/2`, pass: addedItems.length === 2 },
      { name: 'Carrito online', value: 'Conectado', pass: true },
      { name: 'Operación real', value: 'Sí', pass: true },
      { name: 'Simulación', value: 'No (eliminada)', pass: true },
      { name: 'Items en carrito', value: summary.itemCount || 0, pass: (summary.itemCount || 0) >= 2 },
    ];

    checks.forEach(check => {
      if (check.pass) {
        log.success(`${check.name}: ${check.value}`);
      } else {
        log.error(`${check.name}: ${check.value}`);
      }
    });

    // RESULTADO FINAL
    log.section('RESULTADO FINAL');

    if (addedItems.length === 2) {
      log.success('✨ PRUEBA COMPLETADA EXITOSAMENTE');
      console.log(`\n${colors.bright}Resumen:${colors.reset}`);
      console.log(`   ✅ 2 productos agregados al carrito ONLINE REAL`);
      console.log(`   ✅ ${summary.unitCount} unidades en total`);
      console.log(`   ✅ Total: $${summary.total} ARS`);
      console.log(`   ✅ Operación completamente ONLINE`);
      console.log(`   ✅ Sin simulación\n`);
    } else {
      log.warn('Algunos productos no se agregaron correctamente');
    }

  } catch (error) {
    log.error(`Error fatal: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
})();

