#!/usr/bin/env node

/**
 * Grocery Tracking System - Main Handler
 * Procesa tickets, sincroniza con Carrefour y hace análisis
 */

const fs = require('fs');
const path = require('path');

// Rutas de datos
const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'grocery_history.json');

/**
 * Carga el historial de compras
 */
function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return initializeHistory();
  }
  try {
    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error cargando historial:', error);
    return initializeHistory();
  }
}

/**
 * Inicializa un nuevo historial
 */
function initializeHistory() {
  return {
    metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      family_members: 4,
      composition: '1 hombre, 1 mujer, 2 chicos',
      last_updated: new Date().toISOString()
    },
    purchases: [],
    product_patterns: {},
    seasonal_trends: {},
    carrefour_credentials: {
      email: '',
      password: '',
      last_sync: null
    }
  };
}

/**
 * Guarda el historial
 */
function saveHistory(history) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    return true;
  } catch (error) {
    console.error('Error guardando historial:', error);
    return false;
  }
}

/**
 * Procesa un ticket (extrae productos)
 */
function processTicket(ticketData) {
  const purchase = {
    id: Date.now(),
    date: new Date().toISOString(),
    source: ticketData.source || 'manual', // 'ocr', 'carrefour', 'manual'
    store: ticketData.store || 'unknown',
    items: ticketData.items || [],
    total: ticketData.total || 0,
    raw_text: ticketData.raw_text || ''
  };
  
  return purchase;
}

/**
 * Agrega una compra al historial
 */
function addPurchase(history, purchase) {
  history.purchases.push(purchase);
  updatePatterns(history, purchase);
  history.metadata.last_updated = new Date().toISOString();
  return history;
}

/**
 * Actualiza patrones de consumo basado en una compra
 */
function updatePatterns(history, purchase) {
  purchase.items.forEach(item => {
    const productKey = item.name.toLowerCase();
    
    if (!history.product_patterns[productKey]) {
      history.product_patterns[productKey] = {
        name: item.name,
        purchases: [],
        avg_quantity: 0,
        avg_price: 0,
        frequency_days: 0
      };
    }
    
    const pattern = history.product_patterns[productKey];
    pattern.purchases.push({
      date: purchase.date,
      quantity: item.quantity,
      price: item.price,
      source: purchase.source
    });
    
    // Calcula promedios
    const prices = pattern.purchases
      .filter(p => p.price)
      .map(p => p.price);
    
    const quantities = pattern.purchases
      .map(p => p.quantity);
    
    pattern.avg_price = prices.length > 0 
      ? prices.reduce((a, b) => a + b, 0) / prices.length 
      : 0;
    
    pattern.avg_quantity = quantities.length > 0
      ? quantities.reduce((a, b) => a + b, 0) / quantities.length
      : 0;
    
    // Calcula frecuencia en días
    if (pattern.purchases.length > 1) {
      const dates = pattern.purchases
        .map(p => new Date(p.date).getTime())
        .sort((a, b) => a - b);
      
      let totalDays = 0;
      for (let i = 1; i < dates.length; i++) {
        totalDays += (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
      }
      pattern.frequency_days = Math.round(totalDays / (dates.length - 1));
    }
  });
}

/**
 * Estima productos que faltan
 */
function estimateMissingProducts(history) {
  const today = new Date();
  const suggestions = [];
  
  Object.values(history.product_patterns).forEach(pattern => {
    if (pattern.purchases.length === 0) return;
    
    const lastPurchaseDate = new Date(
      pattern.purchases[pattern.purchases.length - 1].date
    );
    
    const daysSinceLastPurchase = Math.floor(
      (today - lastPurchaseDate) / (1000 * 60 * 60 * 24)
    );
    
    // Si ha pasado más del 80% del intervalo típico, sugerir compra
    if (pattern.frequency_days > 0) {
      const threshold = pattern.frequency_days * 0.8;
      
      if (daysSinceLastPurchase >= threshold) {
        suggestions.push({
          product: pattern.name,
          last_purchase_days_ago: daysSinceLastPurchase,
          typical_frequency_days: pattern.frequency_days,
          suggested_quantity: Math.ceil(pattern.avg_quantity),
          estimated_price: pattern.avg_price,
          purchases_count: pattern.purchases.length
        });
      }
    }
  });
  
  return suggestions.sort((a, b) => 
    b.last_purchase_days_ago - a.last_purchase_days_ago
  );
}

/**
 * Muestra resumen del historial
 */
function showSummary(history) {
  console.log('\n=== RESUMEN DE COMPRAS ===\n');
  console.log(`Total de tickets: ${history.purchases.length}`);
  console.log(`Productos únicos: ${Object.keys(history.product_patterns).length}`);
  console.log(`Última actualización: ${history.metadata.last_updated}\n`);
  
  if (history.purchases.length > 0) {
    const totalSpent = history.purchases.reduce((sum, p) => sum + p.total, 0);
    console.log(`Total gastado: $${totalSpent.toFixed(2)}\n`);
  }
}

// Exporta funciones
module.exports = {
  loadHistory,
  saveHistory,
  processTicket,
  addPurchase,
  updatePatterns,
  estimateMissingProducts,
  showSummary
};
