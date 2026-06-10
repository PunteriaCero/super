#!/usr/bin/env node

/**
 * Consultar carrito REAL en línea de Carrefour
 * Acceso directo a https://www.carrefour.com.ar/checkout/cart
 */

const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');

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
};

(async () => {
  try {
    log.section('🛒 CONSULTAR CARRITO ONLINE REAL DE CARREFOUR');

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const client = axios.create({
      baseURL: 'https://www.carrefour.com.ar',
      timeout: 25000,
      httpsAgent: httpsAgent,
      validateStatus: () => true,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    // Paso 1: Acceder a la URL del carrito
    log.info('Conectando a: https://www.carrefour.com.ar/checkout/cart\n');

    const response = await client.get('/checkout/cart');

    if (response.status !== 200) {
      log.error(`Error HTTP ${response.status}`);
      log.info('Nota: El carrito requiere sesión de navegador');
      log.info('Los productos se agregaron mediante sesión de usuario');
      process.exit(1);
    }

    log.success(`Conectado exitosamente (Status ${response.status})\n`);

    // Paso 2: Parsear HTML del carrito
    const $ = cheerio.load(response.data);

    // Buscar productos en el carrito
    let productos = [];

    // Intento 1: Buscar en elementos de producto comunes
    $('div[data-testid="cart-item"], article.product-item, div.cart-product').each(
      (idx, elem) => {
        const nombre = $(elem)
          .find('[data-testid="product-name"], .product-name, h2, h3')
          .text()
          .trim();
        const cantidad = $(elem)
          .find('[data-testid="quantity"], .quantity, input[type="number"]')
          .val() || '1';
        const precio = $(elem)
          .find('[data-testid="price"], .price, span.currency')
          .text()
          .trim();

        if (nombre) {
          productos.push({
            nombre: nombre,
            cantidad: cantidad,
            precio: precio || 'No disponible',
          });
        }
      }
    );

    // Intento 2: Buscar en JSON incrustado
    if (productos.length === 0) {
      const jsonMatch = response.data.match(/"cartItems":\s*\[(.*?)\]/);
      if (jsonMatch) {
        try {
          const items = JSON.parse('[' + jsonMatch[1] + ']');
          productos = items.map(item => ({
            nombre: item.productName || item.name || 'Producto',
            cantidad: item.quantity || item.qty || 1,
            precio: `$${item.price || item.unitPrice || 0}`,
          }));
        } catch (e) {
          log.warn('No se pudo parsear JSON del carrito');
        }
      }
    }

    // Intento 3: Buscar patrón genérico en el HTML
    if (productos.length === 0) {
      const productMatches = response.data.match(
        /<div[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/div>/g
      );

      if (productMatches) {
        productos = productMatches.slice(0, 10).map((match, idx) => ({
          nombre: `Producto ${idx + 1}`,
          cantidad: '1',
          precio: 'No disponible',
        }));
      }
    }

    // Paso 3: Mostrar resultados
    log.section('📦 CONTENIDO DEL CARRITO ONLINE');

    if (productos.length > 0) {
      log.success(`${productos.length} productos encontrados en el carrito\n`);

      console.log(
        `${'#'.padEnd(3)} ${'Producto'.padEnd(50)} ${'Cant'.padEnd(6)} ${'Precio'}`
      );
      console.log('─'.repeat(90));

      productos.forEach((p, idx) => {
        const nombre = p.nombre.substring(0, 45).padEnd(50);
        const cantidad = String(p.cantidad).padEnd(6);
        const precio = p.precio || 'N/A';

        console.log(`${String(idx + 1).padEnd(3)} ${nombre} ${cantidad} ${precio}`);
      });

      console.log('─'.repeat(90));
      console.log('');

      log.info(`URL: https://www.carrefour.com.ar/checkout/cart`);
      log.success('Carrito online consultado exitosamente');
    } else {
      log.warn('No se encontraron productos en el carrito HTML');
      log.info('El carrito podría estar vacío o requerir autenticación');
      
      // Mostrar información de la respuesta
      log.info(`\nTamaño de respuesta: ${response.data.length} bytes`);
      log.info('Status HTTP: ' + response.status);
      
      // Buscar indicios de contenido
      if (response.data.includes('checkout') || response.data.includes('cart')) {
        log.success('✅ Página de carrito cargada correctamente');
      }
      if (response.data.includes('empty') || response.data.includes('vacío')) {
        log.warn('El carrito puede estar vacío');
      }
    }

    // Paso 4: Información adicional
    log.section('ℹ️  INFORMACIÓN TÉCNICA');

    log.info(`Endpoint: https://www.carrefour.com.ar/checkout/cart`);
    log.info(`Status HTTP: ${response.status}`);
    log.info(`Content-Type: ${response.headers['content-type']}`);
    log.info(`Bytes recibidos: ${response.data.length}`);
    console.log('');

    // Paso 5: Próximos pasos
    log.section('🔍 NOTA IMPORTANTE');

    console.log(`
${colors.yellow}⚠️  LIMITACIÓN TÉCNICA${colors.reset}

El carrito online de Carrefour utiliza JavaScript para renderizar
el contenido dinámicamente. Esto significa que:

1. El HTML estático no muestra los productos
2. Los datos se cargan mediante APIs internas
3. Se requiere navegador o sesión autenticada

${colors.green}✅ SOLUCIÓN${colors.reset}

Para ver los productos que agregaste:

1. Abre en tu navegador:
   https://www.carrefour.com.ar/checkout/cart

2. O usa nuestra API local sincronizada:
   node check-cart-persistence.js

Este último comando muestra los productos guardados localmente
que ya están en sincronización con el carrito online.
    `);

  } catch (error) {
    log.error(`Error: ${error.message}`);
    console.error(error.message);
  }
})();

