#!/usr/bin/env node

/**
 * CLI para la integración con Carrefour
 * Maneja autenticación, sincronización y gestión del carrito
 */

const path = require('path');
const fs = require('fs').promises;
const CarrefourAuth = require('./auth');
const CarrefourHistory = require('./history');
const CarrefourCart = require('./cart');
const CarrefourAnalyzerBridge = require('./carrefour-analyzer-bridge');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '.env') });

const STORAGE_DIR = path.join(__dirname, '.carrefour-data');
const COOKIES_FILE = path.join(STORAGE_DIR, 'cookies.json');
const HISTORY_FILE = path.join(STORAGE_DIR, 'history.json');

/**
 * Crea directorio de almacenamiento
 */
async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

/**
 * Comando: Configurar credenciales de Carrefour
 */
async function setupCarrefour() {
  console.log('\n🔧 Configurando credenciales de Carrefour Argentina...\n');

  try {
    const auth = new CarrefourAuth();
    const result = await auth.authenticate();

    // Guardar cookies
    await ensureStorageDir();
    await auth.saveCookies(COOKIES_FILE);

    console.log('\n✅ Configuración completada exitosamente');
    console.log('   Las credenciales han sido autenticadas y guardadas localmente');

    return result;
  } catch (error) {
    console.error('\n❌ Error en configuración:', error.message);
    process.exit(1);
  }
}

/**
 * Comando: Sincronizar historial de Carrefour
 */
async function syncCarrefour() {
  console.log('\n📥 Sincronizando historial de compras de Carrefour...\n');

  try {
    // Verificar que tenemos cookies
    await ensureStorageDir();
    const cookiesData = await fs.readFile(COOKIES_FILE, 'utf8');
    const cookies = JSON.parse(cookiesData);

    // Obtener historial
    const history = new CarrefourHistory(cookies);
    const orders = await history.fetchPurchaseHistory();

    // Guardar historial
    await fs.writeFile(
      HISTORY_FILE,
      JSON.stringify(orders, null, 2)
    );

    // Extraer productos únicos
    const uniqueProducts = history.getUniqueProducts(orders);

    console.log('\n✅ Sincronización completada');
    console.log(`   ${orders.length} órdenes sincronizadas`);
    console.log(`   ${uniqueProducts.length} productos únicos identificados`);

    return {
      orders,
      uniqueProducts,
    };

  } catch (error) {
    if (error.message.includes('ENOENT')) {
      console.error('❌ Error: Primero configura Carrefour con /setup-carrefour');
    } else {
      console.error('❌ Error en sincronización:', error.message);
    }
    process.exit(1);
  }
}

/**
 * Comando: Ver historial sincronizado
 */
async function viewCarrefourHistory() {
  console.log('\n📋 Historial de compras de Carrefour\n');

  try {
    const historyData = await fs.readFile(HISTORY_FILE, 'utf8');
    const orders = JSON.parse(historyData);

    if (orders.length === 0) {
      console.log('No hay órdenes sincronizadas. Ejecuta /sync-carrefour primero');
      return;
    }

    // Mostrar resumen
    console.log(`Total de órdenes: ${orders.length}`);
    console.log('─'.repeat(60));

    orders.slice(0, 10).forEach((order, index) => {
      console.log(`\n${index + 1}. Orden ${order.id}`);
      console.log(`   Fecha: ${order.date}`);
      console.log(`   Total: ${order.total}`);
      console.log(`   Productos: ${order.itemCount || 0}`);

      if (order.products && order.products.length > 0) {
        order.products.slice(0, 3).forEach((product) => {
          console.log(`   - ${product.name} (x${product.quantity})`);
        });
        if (order.products.length > 3) {
          console.log(`   ... y ${order.products.length - 3} más`);
        }
      }
    });

    if (orders.length > 10) {
      console.log(`\n... y ${orders.length - 10} órdenes más`);
    }

  } catch (error) {
    if (error.message.includes('ENOENT')) {
      console.log('No hay historial sincronizado. Ejecuta /sync-carrefour primero');
    } else {
      console.error('Error:', error.message);
    }
  }
}

/**
 * Comando: Obtener sugerencias y agregar al carrito
 */
async function addSuggestionsToCart(suggestedProducts) {
  console.log('\n🛒 Agregando sugerencias al carrito de Carrefour...\n');

  try {
    const cookiesData = await fs.readFile(COOKIES_FILE, 'utf8');
    const cookies = JSON.parse(cookiesData);

    const cart = new CarrefourCart(cookies);

    // Mostrar carrito actual
    console.log('📦 Carrito actual:');
    const currentCart = await cart.getCartContents();
    if (currentCart && currentCart.items) {
      console.log(`   ${currentCart.items.length} artículos`);
    }

    console.log('\n➕ Agregando sugerencias...');
    const results = await cart.addSuggestedProducts(suggestedProducts);

    // Mostrar resultados
    console.log('\n✅ Resultados:');
    const successful = results.filter((r) => r.success);
    console.log(`   ${successful.length}/${results.length} productos agregados`);

    results.forEach((result) => {
      if (result.success) {
        console.log(`   ✓ ${result.name} (${result.quantity}x)`);
      } else {
        console.log(`   ✗ ${result.name} - ${result.reason}`);
      }
    });

    await cart.close();

    return results;

  } catch (error) {
    console.error('❌ Error agregando sugerencias:', error.message);
    process.exit(1);
  }
}

/**
 * Comando: Ver estado de última sincronización
 */
async function lastSyncStatus() {
  try {
    const stats = await fs.stat(HISTORY_FILE);
    const lastSync = new Date(stats.mtime).toLocaleString('es-AR');
    console.log(`\n✅ Última sincronización: ${lastSync}\n`);
  } catch {
    console.log('\n⚠️  No hay sincronización previa\n');
  }
}

/**
 * Comando: Integrar datos de Carrefour con el analizador de compras
 */
async function integrateWithAnalyzer() {
  console.log('\n🔗 Integrando Carrefour con el analizador de compras...\n');

  try {
    const bridge = new CarrefourAnalyzerBridge();
    bridge.syncAndSuggest();
    console.log('\n✅ Integración completada exitosamente');
  } catch (error) {
    console.error('\n❌ Error en integración:', error.message);
    process.exit(1);
  }
}

/**
 * Punto de entrada principal
 */
async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'setup':
        await setupCarrefour();
        break;

      case 'sync':
        await syncCarrefour();
        break;

      case 'integrate':
        await integrateWithAnalyzer();
        break;

      case 'history':
        await viewCarrefourHistory();
        break;

      case 'status':
        await lastSyncStatus();
        break;

      case 'add-cart':
        // Ejemplo: pasar productos sugeridos
        const suggestions = JSON.parse(process.argv[3] || '[]');
        await addSuggestionsToCart(suggestions);
        break;

      default:
        console.log(`
Carrefour Integration CLI

Comandos disponibles:
  setup      - Configurar credenciales de Carrefour
  sync       - Sincronizar historial de compras
  integrate  - Integrar datos con el analizador de compras
  history    - Ver historial sincronizado
  status     - Ver última sincronización
  add-cart   - Agregar productos sugeridos al carrito

Ejemplo:
  node cli.js setup
  node cli.js sync
  node cli.js integrate
        `);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  CarrefourAuth,
  CarrefourHistory,
  CarrefourCart,
  CarrefourAnalyzerBridge,
  setupCarrefour,
  syncCarrefour,
  integrateWithAnalyzer,
  viewCarrefourHistory,
  addSuggestionsToCart,
  lastSyncStatus,
};
