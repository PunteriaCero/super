#!/usr/bin/env node

/**
 * Obtener carrito online real de Carrefour usando sesión de navegador
 * 
 * INSTRUCCIONES:
 * 1. Abre DevTools en tu navegador (F12)
 * 2. Ve a Application > Cookies > carrefour.com.ar
 * 3. Busca cookies importantes (session, auth, etc)
 * 4. Copia las cookies principales y pásalas aquí
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
    log.section('🛒 CONSULTAR CARRITO ONLINE REAL DE CARREFOUR');

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    // Intenta con diferentes endpoints y métodos
    const endpoints = [
      {
        name: 'Endpoint 1: /checkout/cart (GET)',
        method: 'GET',
        url: 'https://www.carrefour.com.ar/checkout/cart',
        headers: {
          'Accept': 'application/json, text/html',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        },
      },
      {
        name: 'Endpoint 2: /api/checkout/cart (GET)',
        method: 'GET',
        url: 'https://www.carrefour.com.ar/api/checkout/cart',
        headers: {
          'Accept': 'application/json',
        },
      },
      {
        name: 'Endpoint 3: /api/v1/cart (GET)',
        method: 'GET',
        url: 'https://www.carrefour.com.ar/api/v1/cart',
        headers: {
          'Accept': 'application/json',
        },
      },
    ];

    let found = false;

    for (const endpoint of endpoints) {
      log.info(`Probando: ${endpoint.name}`);

      try {
        const client = axios.create({
          timeout: 15000,
          httpsAgent: httpsAgent,
          validateStatus: () => true,
          headers: {
            ...endpoint.headers,
            'Accept-Language': 'es-AR,es;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
          },
        });

        const response = await client.request({
          method: endpoint.method,
          url: endpoint.url,
        });

        log.info(`  Status: ${response.status}`);

        if (response.status === 200) {
          log.success(`Conectado a: ${endpoint.url}\n`);

          // Intentar parsear como JSON
          try {
            const data = typeof response.data === 'string' 
              ? JSON.parse(response.data) 
              : response.data;

            if (data.items && data.items.length > 0) {
              log.section('📦 PRODUCTOS EN EL CARRITO ONLINE');

              console.log(
                `${'#'.padEnd(3)} ${'Producto'.padEnd(50)} ${'Cant'.padEnd(6)} ${'Precio'.padEnd(12)} ${'Total'}`
              );
              console.log('─'.repeat(110));

              let subtotal = 0;

              data.items.forEach((item, idx) => {
                const nombre = (item.name || item.productName || 'Producto')
                  .substring(0, 45)
                  .padEnd(50);
                const cantidad = String(item.quantity || 1).padEnd(6);
                const precio = `$${((item.price || item.unitPrice) || 0).toFixed(2)}`.padEnd(12);
                const itemTotal = ((item.price || item.unitPrice) || 0) * (item.quantity || 1);
                subtotal += itemTotal;

                console.log(
                  `${String(idx + 1).padEnd(3)} ${nombre} ${cantidad} ${precio} $${itemTotal.toFixed(2)}`
                );
              });

              console.log('─'.repeat(110));
              const tax = subtotal * 0.21;
              const total = subtotal + tax;

              console.log(
                `\n${colors.bright}Subtotal${' '.repeat(58)}$${subtotal.toFixed(2)}${colors.reset}`
              );
              console.log(
                `IVA (21%)${' '.repeat(57)}$${tax.toFixed(2)}`
              );
              console.log(
                `${colors.bright}${colors.green}TOTAL${' '.repeat(62)}$${total.toFixed(2)}${colors.reset}\n`
              );

              found = true;
              break;
            }
          } catch (parseErr) {
            // No es JSON, probablemente HTML
            log.warn('  Respuesta no es JSON (HTML)\n');
          }
        }
      } catch (err) {
        log.warn(`  Error: ${err.message}\n`);
      }
    }

    if (!found) {
      log.section('⚠️  CARRITO REQUIERE SESIÓN AUTENTICADA');

      console.log(`
${colors.yellow}PROBLEMA TÉCNICO:${colors.reset}

El carrito de Carrefour está protegido. Sin tu sesión de navegador,
no podemos acceder a los datos.

${colors.green}SOLUCIONES DISPONIBLES:${colors.reset}

${colors.cyan}1️⃣  VERIFICAR PRODUCTOS AGREGADOS (RECOMENDADO)${colors.reset}

Si usaste nuestro CLI para agregar productos:

  ${colors.cyan}node check-cart-persistence.js${colors.reset}

Esto mostrará los 3 productos guardados localmente.

---

${colors.cyan}2️⃣  VER CARRITO EN NAVEGADOR${colors.reset}

Abre en tu navegador:

  ${colors.cyan}https://www.carrefour.com.ar/checkout/cart${colors.reset}

Verás los 3 productos que agregaste en tu sesión.

---

${colors.cyan}3️⃣  USAR COOKIES DEL NAVEGADOR (AVANZADO)${colors.reset}

Para que yo pueda consultar el carrito:

a) Abre DevTools en tu navegador (F12)
b) Ve a: Application > Cookies > carrefour.com.ar
c) Busca cookies como: session, sessionId, auth, token, etc.
d) Cópiame la cookie principal en formato:
   
   NOMBRE_COOKIE=valor_cookie

e) Yo usaré esa cookie para consultar tu carrito real

${colors.yellow}⚠️  NOTA DE SEGURIDAD:${colors.reset}
No compartas nunca tus cookies en mensajes públicos.
Las cookies expiran y se regeneran automáticamente.
      `);
    }

  } catch (error) {
    log.error(`Error: ${error.message}`);
  }
})();

