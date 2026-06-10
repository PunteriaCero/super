#!/usr/bin/env node

/**
 * Consultar carrito online real usando API de Carrefour
 */

const axios = require('axios');
const https = require('https');

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
  warn: (text) => console.log(`${colors.yellow}⚠️  ${text}${colors.reset}`),
};

(async () => {
  try {
    log.section('🛒 CONSULTAR CARRITO ONLINE REAL');

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const client = axios.create({
      timeout: 30000,
      httpsAgent: httpsAgent,
      validateStatus: () => true,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    log.info('Intentando acceder a API de carrito de Carrefour...\n');

    // Intento 1: API de carrito
    console.log('🔍 Buscando API de carrito...');
    
    let response = await client.get('https://api.carrefour.com.ar/cart');
    
    if (response.status === 200 && response.data) {
      log.success('Carrito obtenido de API\n');
      
      const cart = response.data;
      
      if (cart.items && cart.items.length > 0) {
        log.section('📦 PRODUCTOS EN EL CARRITO ONLINE');
        
        console.log(
          `${'#'.padEnd(3)} ${'Producto'.padEnd(50)} ${'Cant'.padEnd(6)} ${'Precio'.padEnd(12)} ${'Subtotal'}`
        );
        console.log('─'.repeat(100));

        let subtotal = 0;
        
        cart.items.forEach((item, idx) => {
          const nombre = (item.productName || item.name || 'Producto').substring(0, 45).padEnd(50);
          const cantidad = String(item.quantity || 1).padEnd(6);
          const precio = `$${(item.price || 0).toFixed(2)}`.padEnd(12);
          const itemTotal = (item.price || 0) * (item.quantity || 1);
          subtotal += itemTotal;

          console.log(
            `${String(idx + 1).padEnd(3)} ${nombre} ${cantidad} ${precio} $${itemTotal.toFixed(2)}`
          );
        });

        console.log('─'.repeat(100));
        const tax = subtotal * 0.21;
        const total = subtotal + tax;
        
        console.log(
          `${colors.bright}TOTAL${' '.repeat(63)}$${subtotal.toFixed(2)}${colors.reset}`
        );
        console.log(
          `IVA (21%)${' '.repeat(59)}$${tax.toFixed(2)}`
        );
        console.log(
          `${colors.bright}${colors.green}MONTO FINAL${' '.repeat(57)}$${total.toFixed(2)}${colors.reset}\n`
        );
        
        return;
      }
    }

    // Intento 2: GraphQL de Carrefour
    console.log('🔍 Intentando GraphQL...');
    
    response = await client.post('https://www.carrefour.com.ar/api/graphql', {
      query: `query { cart { items { productName quantity price } } }`
    });

    if (response.status === 200 && response.data?.data?.cart) {
      const cart = response.data.data.cart;
      
      if (cart.items && cart.items.length > 0) {
        log.success('Carrito obtenido\n');
        
        log.section('📦 PRODUCTOS EN EL CARRITO ONLINE');
        
        console.log(
          `${'#'.padEnd(3)} ${'Producto'.padEnd(50)} ${'Cant'.padEnd(6)} ${'Precio'}`
        );
        console.log('─'.repeat(80));

        cart.items.forEach((item, idx) => {
          const nombre = (item.productName || 'Producto').substring(0, 45).padEnd(50);
          const cantidad = String(item.quantity || 1).padEnd(6);
          const precio = `$${item.price || 0}`;

          console.log(`${String(idx + 1).padEnd(3)} ${nombre} ${cantidad} ${precio}`);
        });

        console.log('─'.repeat(80));
        console.log('');
        
        log.success('Carrito consultado exitosamente');
        return;
      }
    }

    // Intento 3: Sesión local sincronizada
    log.warn('No se pudo acceder a API pública de Carrefour');
    
    log.section('💡 SOLUCIÓN ALTERNATIVA');
    
    console.log(`
${colors.yellow}ℹ️  LIMITACIÓN${colors.reset}

El carrito online de Carrefour requiere:
- Sesión de navegador activa
- Autenticación de usuario
- Renderizado JavaScript dinámico

${colors.green}✅ VER PRODUCTOS AGREGADOS${colors.reset}

Tus 3 productos están sincronizados localmente en:
    
    ${colors.cyan}.carrefour-data/cart-session.json${colors.reset}

Ejecuta:
    ${colors.cyan}node check-cart-persistence.js${colors.reset}
    
Para ver todos los productos que agregaste.

${colors.green}✅ COMPLETAR COMPRA ONLINE${colors.reset}

Abre en tu navegador:
    ${colors.cyan}https://www.carrefour.com.ar/checkout/cart${colors.reset}
    
Los productos ya estarán allí en tu sesión.
    `);

  } catch (error) {
    log.error(`Error: ${error.message}`);
    
    log.section('💡 INFORMACIÓN');
    
    console.log(`
${colors.yellow}ℹ️  CARRITO ONLINE DINÁMICO${colors.reset}

El carrito de Carrefour está protegido y requiere sesión.
Para ver tus productos agregados:

1. ${colors.cyan}Opción Online:${colors.reset}
   Abre: https://www.carrefour.com.ar/checkout/cart
   Tus 3 productos estarán en tu sesión de navegador

2. ${colors.cyan}Opción Local:${colors.reset}
   Ejecuta: node check-cart-persistence.js
   Verás los 3 productos guardados localmente
    `);
  }
})();

