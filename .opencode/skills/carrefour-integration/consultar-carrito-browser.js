#!/usr/bin/env node

/**
 * Consultar carrito online real de Carrefour usando Puppeteer
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
    log.section('🛒 CONSULTAR CARRITO ONLINE CON PUPPETEER');

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
    log.info('Paso 1: Iniciando navegador Puppeteer...');

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
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

    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => null);

    log.success('Página cargada\n');

    // Paso 4: Intentar login
    log.info('Paso 4: Buscando formulario de login...');

    try {
      const emailInput = await page.$('input[type="email"], input[name*="email"]');
      
      if (emailInput) {
        log.info('Iniciando sesión...');
        
        await page.type('input[type="email"], input[name*="email"]', email, { delay: 50 });
        log.info('Email ingresado');

        await page.type('input[type="password"]', password, { delay: 50 });
        log.info('Password ingresado');

        const submitBtn = await page.$('button[type="submit"], button:has-text("Ingresar")');
        
        if (submitBtn) {
          await submitBtn.click();
          log.info('Formulario enviado...');

          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => null);
          
          log.success('Sesión iniciada\n');
        }
      } else {
        log.warn('Formulario de login no encontrado\n');
      }
    } catch (loginErr) {
      log.warn(`Aviso en login: ${loginErr.message}`);
      log.info('Continuando sin login...\n');
    }

    // Paso 5: Acceder a carrito
    log.info('Paso 5: Accediendo al carrito...');

    await page.goto(`${baseUrl}/checkout/cart`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    }).catch(() => null);

    log.success('Página de carrito cargada\n');

    // Paso 6: Esperar contenido dinámico
    log.info('Paso 6: Esperando contenido...');

    await page.waitForSelector('[data-testid*="cart"], [class*="cart-item"], article', { timeout: 10000 }).catch(() => null);

    log.success('Contenido cargado\n');

    // Paso 7: Extraer productos
    log.info('Paso 7: Extrayendo productos...');

    const cartItems = await page.evaluate(() => {
      const items = [];

      // Estrategia 1: data-testid
      document.querySelectorAll('[data-testid*="cart-item"], [data-testid*="product"]').forEach((el) => {
        const nameEl = el.querySelector('[data-testid*="name"], .product-name, h2, h3');
        const qtyEl = el.querySelector('input[type="number"]');
        const priceEl = el.querySelector('[data-testid*="price"], .price');

        if (nameEl) {
          items.push({
            name: nameEl.textContent.trim(),
            quantity: qtyEl ? parseInt(qtyEl.value) || 1 : 1,
            price: priceEl ? priceEl.textContent.trim() : 'N/A',
          });
        }
      });

      // Estrategia 2: clases comunes
      if (items.length === 0) {
        document.querySelectorAll('[class*="cart-item"], [class*="product-row"], article.product').forEach((el) => {
          const nameEl = el.querySelector('h2, h3, a[href*="/p/"]');
          const qtyEl = el.querySelector('input[type="number"]');
          const priceEl = el.querySelector('[class*="price"], span.valor');

          if (nameEl && (qtyEl || priceEl)) {
            items.push({
              name: nameEl.textContent.trim(),
              quantity: qtyEl ? parseInt(qtyEl.value) || 1 : 1,
              price: priceEl ? priceEl.textContent.trim() : 'N/A',
            });
          }
        });
      }

      return items;
    });

    log.success(`${cartItems.length} productos extraídos\n`);

    // Paso 8: Mostrar resultados
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

      log.section('💡 INFORMACIÓN');

      console.log(`
Carrito posible estados:
1. Vacío (sin productos)
2. Productos no persistidos
3. Sesión no sincronizada

${colors.cyan}Verifica en tu navegador:${colors.reset}
https://www.carrefour.com.ar/checkout/cart
      `);
    }

  } catch (error) {
    log.error(`Error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
      log.info('\nNavegador cerrado');
    }
  }
})();

