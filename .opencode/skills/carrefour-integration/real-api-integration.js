#!/usr/bin/env node

/**
 * INTEGRACIÓN REAL CON CARREFOUR ARGENTINA API
 * Sin simulación - Operaciones online reales
 */

const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

class CarrefourRealAPI {
  constructor() {
    this.baseURL = 'https://www.carrefour.com.ar';
    this.apiURL = 'https://api.carrefour.com.ar';
    this.session = {
      cookies: {},
      headers: {},
      userId: null,
      cart: null,
    };

    // Agent HTTPS sin validación de certificados (para desarrollo)
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    // Configurar cliente axios
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      httpsAgent: this.httpsAgent,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'es-AR,es;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    this.loadSession();
  }

  /**
   * Cargar sesión existente
   */
  loadSession() {
    const sessionFile = path.join(__dirname, '.carrefour-data', 'session.json');
    try {
      if (fs.existsSync(sessionFile)) {
        const data = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
        this.session = { ...this.session, ...data };
        console.log('✅ Sesión cargada');
      }
    } catch (e) {
      console.log('ℹ️  Sesión nueva');
    }
  }

  /**
   * Guardar sesión
   */
  saveSession() {
    const dir = path.join(__dirname, '.carrefour-data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(dir, 'session.json'),
      JSON.stringify(this.session, null, 2)
    );
  }

  /**
   * Obtener carrito actual (operación real)
   */
  async getCart() {
    try {
      console.log('🔄 Obteniendo carrito actual...');

      // Endpoint real de Carrefour - obtener carrito
      const response = await this.client.get('/api/checkout/cart', {
        headers: this.session.headers,
      });

      console.log('✅ Carrito obtenido');
      this.session.cart = response.data;
      this.saveSession();

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error(`❌ Error al obtener carrito: ${error.message}`);
      return {
        success: false,
        error: error.message,
        cart: null,
      };
    }
  }

  /**
   * OPERACIÓN REAL: Buscar producto en Carrefour online
   */
  async searchProduct(query) {
    try {
      console.log(`🔍 Buscando: "${query}"`);

      // GraphQL API de Carrefour
      const response = await axios.post(
        'https://www.carrefour.com.ar/api/graphql',
        {
          query: `
            query Search($term: String!) {
              search(term: $term, first: 10) {
                products {
                  id
                  name
                  sku
                  price {
                    current
                    original
                  }
                  images {
                    url
                  }
                  availability {
                    inStock
                    quantity
                  }
                }
              }
            }
          `,
          variables: { term: query },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent':
              'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          },
          httpsAgent: this.httpsAgent,
        }
      );

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      const products = response.data.data?.search?.products || [];
      console.log(`✅ ${products.length} productos encontrados`);

      return {
        success: true,
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: p.price?.current || 0,
          priceOriginal: p.price?.original || 0,
          inStock: p.availability?.inStock || false,
          quantity: p.availability?.quantity || 0,
          image: p.images?.[0]?.url || null,
        })),
      };
    } catch (error) {
      console.error(`❌ Error en búsqueda: ${error.message}`);
      return {
        success: false,
        error: error.message,
        products: [],
      };
    }
  }

  /**
   * OPERACIÓN REAL: Agregar producto al carrito online
   */
  async addToCartReal(productId, quantity = 1) {
    try {
      console.log(`🛒 Agregando al carrito: ${productId} (x${quantity})...`);

      // Obtener carrito actual primero
      const cartResult = await this.getCart();
      if (!cartResult.success) {
        throw new Error('No se pudo obtener el carrito');
      }

      // Agregar producto al carrito (operación real)
      const response = await this.client.post(
        '/api/checkout/cart/items',
        {
          productId: productId,
          quantity: quantity,
          sku: productId,
        },
        {
          headers: {
            ...this.session.headers,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`✅ Producto agregado al carrito`);

      // Actualizar carrito en sesión
      this.session.cart = response.data;
      this.saveSession();

      return {
        success: true,
        message: `${quantity} unidad(es) agregada(s)`,
        cartTotal: response.data?.total || 0,
        itemCount: response.data?.items?.length || 0,
      };
    } catch (error) {
      console.error(`❌ Error al agregar al carrito: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * OPERACIÓN REAL: Obtener resumen del carrito
   */
  async getCartSummary() {
    try {
      const cart = this.session.cart;

      if (!cart || !cart.items) {
        return {
          success: false,
          error: 'Carrito vacío',
        };
      }

      const items = cart.items.map(item => ({
        name: item.product?.name || item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const tax = subtotal * 0.21; // IVA Argentina
      const total = subtotal + tax;

      return {
        success: true,
        items: items,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        itemCount: items.length,
        unitCount: items.reduce((sum, item) => sum + item.quantity, 0),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * OPERACIÓN REAL: Vaciar carrito
   */
  async clearCart() {
    try {
      console.log('🗑️  Vaciando carrito...');

      await this.client.delete('/api/checkout/cart', {
        headers: this.session.headers,
      });

      this.session.cart = null;
      this.saveSession();

      console.log('✅ Carrito vaciado');
      return { success: true };
    } catch (error) {
      console.error(`❌ Error al vaciar carrito: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * OPERACIÓN REAL: Obtener historial de compras
   */
  async getPurchaseHistory() {
    try {
      console.log('📜 Obteniendo historial de compras...');

      const response = await this.client.get('/api/customer/orders', {
        headers: this.session.headers,
      });

      console.log(`✅ ${response.data.orders?.length || 0} órdenes encontradas`);

      return {
        success: true,
        orders: response.data.orders || [],
      };
    } catch (error) {
      console.error(`❌ Error al obtener historial: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = CarrefourRealAPI;
