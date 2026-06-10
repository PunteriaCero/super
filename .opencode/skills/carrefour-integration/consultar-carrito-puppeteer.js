#!/usr/bin/env node

/**
 * Consultar carrito online real de Carrefour usando Puppeteer
 * Automatiza el navegador para acceder a datos dinámicos
 */

const puppeteer = require('puppeteer');
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
  let browser = null;

  try {
    log.section('🔐 CONSULTAR CARRITO ONLINE CON PUPPETEER');

    const email = process.env.CARREFOUR_EMAIL;
    const password = process.env.CARREFOUR_PASSWORD;
    const baseUrl = process.env.CARREFOUR_BASE_URL || 'https://www.carrefour.com.ar';

    if (!email || !password) {
      log.error('Credenciales no encontradas en .env');
      process.exit(1);
    }

    log.info(`Email: ${email.substring(0, 5)}***@${email.split('@')[1]}`);
    log.info(`Base URL: ${baseUrl}\n`);

    // Paso 1: Iniciar navegador
    log.info('Paso 1: Iniciando navegador...');

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-resources',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

    log.success('Navegador iniciado\n');

    // Paso 2: Crear página
    log.info('Paso 2: Creando página...');

    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 720 });

    log.success('Página creada\n');

    // Paso 3: Acceder a sitio
    log.info('Paso 3: Accediendo a Carrefour...');

    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    log.success('Página cargada\n');

    // Paso 4: Buscar y rellenar formulario de login
    log.info('Paso 4: Iniciando sesión...');

    // Esperar a que el formulario de login esté visible
    try {
      await page.waitForSelector('input[type="email"], input[name*="email"], input[placeholder*="email"]', {
        timeout: 10000,
      });

      // Buscar campos de email y password
      const emailInputs = await page.$$('input[type="email"], input[name*="email"], input[id*="email"]');

      if (emailInputs.length === 0) {
        log.warn('Campo de email no encontrado, buscando alternativas...');

        // Intentar click en elemento de login
        const loginLinks = await page.$$('a:contains("Log in"), a:contains("Ingresar"), button:contains("Ingresar")');

        if (loginLinks.length > 0) {
          await loginLinks[0].click();
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        }
      }

      // Rellenar email
      await page.type('input[type="email"], input[name*="email"]', email, { delay: 50 });

      log.info('Email ingresado');

      // Rellenar password
      await page.type('input[type="password"], input[name*="password"]', password, { delay: 50 });

      log.info('Password ingresado');

      // Buscar y hacer click en botón de login
      await page.click('button[type="submit"], button:contains("Ingresar"), button:contains("Login")');

      log.info('Enviando formulario...');

      // Esperar a que la sesión se inicie
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

      log.success('Sesión iniciada\n');
    } catch (loginErr) {
      log.warn(`Error en login: ${loginErr.message}`);
      log.info('Continuando sin login...\n');
    }

    // Paso 5: Acceder a carrito
    log.info('Paso 5: Accediendo a carrito...');

    await page.goto(`${baseUrl}/checkout/cart`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    log.success('Página de carrito cargada\n');

    // Paso 6: Extraer productos
    log.info('Paso 6: Extrayendo productos...');

    const cartItems = await page.evaluate(() => {
      const items = [];

      // Selector 1: Elementos específicos de carrito
      const cartRows = document.querySelectorAll(
        '[data-testid*="cart"], [class*="cart-item"], [class*="product-row"], article'
      );

      cartRows.forEach((row) => {
        const nameEl = row.querySelector('[data-testid*="name"], .product-name, h2, h3, a[href*="/p/"]');
        const qtyEl = row.querySelector('input[type="number"], [data-testid*="quantity"]');
        const priceEl = row.querySelector('[data-testid*="price"], .price, [class*="precio"], span[class*="valor"]');

        if (nameEl && (qtyEl || priceEl)) {
          items.push({
            name: nameEl.textContent.trim(),
            quantity: qtyEl ? parseInt(qtyEl.value) || 1 : 1,
            price: priceEl ? priceEl.textContent.trim() : 'N/A',
          });
        }
      });

      return items;
    });

    log.success(`${cartItems.length} productos extraídos\n`);

    // Paso 7: Mostrar resultados
    if (cartItems.length > 0) {
      log.section('📦 CONTENIDO DEL CARRITO ONLINE REAL');

      log.success(`${cartItems.length} productos en tu carrito\n`);

      console.log(
        `${'#'.padEnd(3)} ${'Producto'.padEnd(50)} ${'Cant'.padEnd(6)} ${'Precio'.padEnd(12)} ${'Total'}`
      );
      console.log('─'.repeat(110));

      let subtotal = 0;

      cartItems.forEach((item, idx) => {
        const nombre = (item.name || 'Producto').substring(0, 45).padEnd(50);
        const cantidad = String(item.quantity || 1).padEnd(6);

        // Extraer precio numérico
        let precioNum = 0;
        if (typeof item.price === 'string') {
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

      log.success('✅ Carrito consultado exitosamente');
    } else {
      log.warn('No se encontraron productos en el carrito');

      // Captura de pantalla para debugging
      const screenshot = path.join(__dirname, 'carrito-screenshot.png');
      await page.screenshot({ path: screenshot, fullPage: true });

      log.info(`Screenshot guardado: ${screenshot}`);

      log.section('💡 INFORMACIÓN');

      console.log(`
El carrito podría estar:
1. Vacío (sin productos agregados)
2. Los productos no se guardaron correctamente
3. La sesión no se sincronizó

${colors.cyan}Verifica en tu navegador:${colors.reset}
https://www.carrefour.com.ar/checkout/cart
      `);
    }

  } catch (error) {
    log.error(`Error: ${error.message}`);
    console.error(error);
  } finally {
    if (browser) {
      await browser.close();
      log.info('\nNavegador cerrado');
    }
  }
})();

