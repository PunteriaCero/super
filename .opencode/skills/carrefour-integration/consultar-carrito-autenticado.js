#!/usr/bin/env node

/**
 * Consultar carrito online real de Carrefour con autenticación
 * Usa credenciales del .env para login y accede al carrito
 */

const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
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
};

(async () => {
  try {
    log.section('🔐 AUTENTICACIÓN EN CARREFOUR');

    const email = process.env.CARREFOUR_EMAIL;
    const password = process.env.CARREFOUR_PASSWORD;
    const baseUrl = process.env.CARREFOUR_BASE_URL || 'https://www.carrefour.com.ar';

    if (!email || !password) {
      log.error('Credenciales no encontradas en .env');
      process.exit(1);
    }

    log.info(`Email: ${email.substring(0, 5)}***@${email.split('@')[1]}`);
    log.info(`Base URL: ${baseUrl}\n`);

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    const cookieJar = {};

    const client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      httpsAgent: httpsAgent,
      validateStatus: () => true,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    // Paso 1: Obtener página de login
    log.info('Paso 1: Obteniendo página de login...');

    let response = await client.get('/');

    if (response.headers['set-cookie']) {
      response.headers['set-cookie'].forEach((cookie) => {
        const [name] = cookie.split('=');
        const value = cookie.split('=')[1].split(';')[0];
        cookieJar[name] = value;
      });
      log.success(`Cookies iniciales capturadas: ${Object.keys(cookieJar).length}`);
    }

    // Paso 2: Buscar endpoint de login
    log.info('\nPaso 2: Buscando endpoint de login...');

    const loginEndpoints = [
      '/login',
      '/api/login',
      '/api/v1/login',
      '/auth/login',
      '/usuario/login',
    ];

    let loginUrl = null;

    for (const endpoint of loginEndpoints) {
      response = await client.head(endpoint);
      if (response.status === 200 || response.status === 405) {
        loginUrl = endpoint;
        log.success(`Encontrado: ${endpoint}`);
        break;
      }
    }

    if (!loginUrl) {
      loginUrl = '/login';
      log.warn(`Usando endpoint por defecto: ${loginUrl}`);
    }

    // Paso 3: Intentar autenticación
    log.info(`\nPaso 3: Autenticando con email: ${email.substring(0, 5)}***`);

    const loginPayloads = [
      {
        email: email,
        password: password,
      },
      {
        username: email,
        password: password,
      },
      {
        user: email,
        pass: password,
      },
    ];

    let authenticated = false;

    for (const payload of loginPayloads) {
      try {
        response = await client.post(loginUrl, payload, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        if (response.status === 200 || response.status === 302 || response.status === 303) {
          if (response.headers['set-cookie']) {
            response.headers['set-cookie'].forEach((cookie) => {
              const [name] = cookie.split('=');
              const value = cookie.split('=')[1].split(';')[0];
              cookieJar[name] = value;
            });
          }

          authenticated = true;
          log.success(`Autenticación exitosa (Status ${response.status})`);
          break;
        }
      } catch (err) {
        // Continuar con siguiente payload
      }
    }

    if (!authenticated) {
      log.warn('Autenticación directa fallida, intentando carrito sin autenticación...\n');
    }

    // Paso 4: Construir header de cookies
    log.info('\nPaso 4: Accediendo a carrito...');

    const cookieHeader = Object.entries(cookieJar)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');

    if (cookieHeader) {
      client.defaults.headers.Cookie = cookieHeader;
    }

    // Paso 5: Consultar carrito
    const cartEndpoints = [
      '/checkout/cart',
      '/api/cart',
      '/api/v1/cart',
      '/cart',
      '/usuario/carrito',
    ];

    let cartData = null;

    for (const endpoint of cartEndpoints) {
      response = await client.get(endpoint);

      if (response.status === 200) {
        log.success(`Carrito accesible en: ${endpoint}`);

        // Intentar parsear JSON
        if (
          response.headers['content-type'] &&
          response.headers['content-type'].includes('application/json')
        ) {
          try {
            cartData = JSON.parse(response.data);
            if (cartData.items || cartData.products) {
              break;
            }
          } catch (e) {
            // Continuar
          }
        }

        // Intentar parsear HTML
        if (typeof response.data === 'string') {
          const $ = cheerio.load(response.data);

          const items = [];

          // Buscar productos en el carrito
          $('[data-testid*="cart"], [class*="cart-item"], article.product-item').each(
            (idx, elem) => {
              const nombre = $(elem)
                .find('[data-testid*="name"], .product-name, h2, h3')
                .first()
                .text()
                .trim();

              const cantidad = $(elem)
                .find('input[type="number"], [data-testid*="quantity"]')
                .val() || '1';

              const precio = $(elem)
                .find('[data-testid*="price"], .price, .valor')
                .first()
                .text()
                .trim();

              if (nombre) {
                items.push({
                  name: nombre,
                  quantity: parseInt(cantidad) || 1,
                  price: precio,
                });
              }
            }
          );

          if (items.length > 0) {
            cartData = { items: items };
            break;
          }
        }
      }
    }

    // Paso 6: Mostrar resultados
    if (cartData && cartData.items && cartData.items.length > 0) {
      log.section('📦 CONTENIDO DEL CARRITO ONLINE REAL');

      log.success(`${cartData.items.length} productos encontrados\n`);

      console.log(
        `${'#'.padEnd(3)} ${'Producto'.padEnd(50)} ${'Cant'.padEnd(6)} ${'Precio'.padEnd(12)} ${'Total'}`
      );
      console.log('─'.repeat(110));

      let subtotal = 0;

      cartData.items.forEach((item, idx) => {
        const nombre = (item.name || item.productName || 'Producto')
          .substring(0, 45)
          .padEnd(50);
        const cantidad = String(item.quantity || 1).padEnd(6);

        // Extraer precio numérico
        let precioNum = 0;
        if (typeof item.price === 'number') {
          precioNum = item.price;
        } else if (typeof item.price === 'string') {
          const match = item.price.match(/[\d.,]+/);
          if (match) {
            precioNum = parseFloat(match[0].replace(/\./g, '').replace(',', '.')) || 0;
          }
        }

        const precio = `$${precioNum.toFixed(2)}`.padEnd(12);
        const itemTotal = precioNum * (item.quantity || 1);
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
      console.log(`IVA (21%)${' '.repeat(57)}$${tax.toFixed(2)}`);
      console.log(
        `${colors.bright}${colors.green}TOTAL A PAGAR${' '.repeat(51)}$${total.toFixed(2)}${colors.reset}\n`
      );

      log.success('Carrito consultado exitosamente');
    } else {
      log.warn('No se encontraron productos en el carrito');

      log.section('💡 POSIBLES CAUSAS');

      console.log(`
1. ${colors.yellow}Carrito vacío:${colors.reset}
   El carrito online está vacío en este momento.

2. ${colors.yellow}Datos no disponibles públicamente:${colors.reset}
   Carrefour no expone los datos del carrito a través de
   solicitudes HTTP simples (requiere navegador con JS).

3. ${colors.yellow}Sesión no sincronizada:${colors.reset}
   Los 3 productos que agregaste podrían estar guardados
   en tu navegador pero no sincronizados con nuestro sistema.

${colors.green}ALTERNATIVAS:${colors.reset}

${colors.cyan}Opción 1: Ver productos guardados localmente${colors.reset}
  node check-cart-persistence.js

${colors.cyan}Opción 2: Usar Puppeteer para automatización${colors.reset}
  (Requiere instalar: npm install puppeteer)
      `);
    }

  } catch (error) {
    log.error(`Error: ${error.message}`);
    console.error(error);
  }
})();

