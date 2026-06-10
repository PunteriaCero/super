#!/usr/bin/env node

/**
 * Grocery Tracking CLI
 * Interfaz para procesar tickets y obtener recomendaciones
 */

const fs = require('fs');
const path = require('path');
const processor = require('./processor');

const commands = {
  /**
   * Procesa una imagen de ticket
   */
  'process-ticket': async (imagePath) => {
    if (!imagePath) {
      console.error('❌ Debes especificar la ruta de la imagen');
      console.error('Uso: /process-ticket-image /ruta/a/ticket.jpg');
      return;
    }

    if (!fs.existsSync(imagePath)) {
      console.error(`❌ Archivo no encontrado: ${imagePath}`);
      return;
    }

    await processor.processTicketImage(imagePath);
  },

  /**
   * Sugiere qué comprar
   */
  'suggest-shopping': () => {
    processor.suggestNextShopping();
  },

  /**
   * Muestra análisis de patrones
   */
  'analyze': () => {
    processor.analyzePatterns();
  },

  /**
   * Muestra historial de compras
   */
  'history': (days = 30) => {
    const handler = require('../../handler');
    const history = handler.loadHistory();

    console.log('\n' + '='.repeat(50));
    console.log('HISTORIAL DE COMPRAS');
    console.log('='.repeat(50) + '\n');

    if (history.purchases.length === 0) {
      console.log('No hay compras registradas.');
      return;
    }

    const recentPurchases = history.purchases.slice(-10);

    recentPurchases.forEach((purchase, idx) => {
      console.log(`${idx + 1}. ${purchase.store} - ${purchase.date}`);
      console.log(`   Items: ${purchase.items.length}`);
      console.log(`   Total: $${purchase.total.toFixed(2)}`);
      console.log('');
    });
  },

  /**
   * Muestra resumen general
   */
  'summary': () => {
    const handler = require('../../handler');
    const history = handler.loadHistory();
    handler.showSummary(history);
  },

  /**
   * Limpia la base de datos (cuidado!)
   */
  'reset': () => {
    console.warn('⚠️  Esto eliminará TODO el historial de compras.');
    console.log('Para confirmar, ejecuta: /reset-confirm');
  },

  'reset-confirm': () => {
    const handler = require('../../handler');
    const newHistory = {
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

    handler.saveHistory(newHistory);
    console.log('✅ Base de datos reiniciada');
  },

  /**
   * Muestra ayuda
   */
  'help': () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║       SISTEMA DE SEGUIMIENTO DE COMPRAS - COMANDOS         ║
╚════════════════════════════════════════════════════════════╝

📷 PROCESAMIENTO DE TICKETS:
  /process-ticket-image <archivo>
    → Procesa una foto de ticket (JPG, PNG)
    → Extrae productos, cantidades y precios
    → Guarda en la base de datos

💡 ANÁLISIS Y RECOMENDACIONES:
  /suggest-shopping
    → Sugiere qué productos comprar
    → Basado en patrones de compra
    
  /analyze-purchases
    → Muestra análisis detallado de patrones
    → Frecuencia y cantidad de cada producto

📊 INFORMACIÓN:
  /view-purchase-history
    → Muestra últimas compras registradas
    
  /summary
    → Resumen general del sistema

🔧 MANTENIMIENTO:
  /reset
    → Advertencia antes de limpiar datos
    
  /reset-confirm
    → Confirma y limpia TODO el historial

❓ AYUDA:
  /help
    → Muestra este mensaje

═════════════════════════════════════════════════════════════

EJEMPLOS:
  1. Procesar un ticket:
     /process-ticket-image ./tickets/ticket_20240605.jpg

  2. Ver recomendaciones:
     /suggest-shopping

  3. Analizar patrones:
     /analyze-purchases

═════════════════════════════════════════════════════════════
    `);
  }
};

// Mapea comandos a funciones
const commandMap = {
  '/process-ticket-image': 'process-ticket',
  '/process-ticket': 'process-ticket',
  '/suggest-shopping': 'suggest-shopping',
  '/suggest-next-shopping': 'suggest-shopping',
  '/analyze-purchases': 'analyze',
  '/analyze': 'analyze',
  '/view-purchase-history': 'history',
  '/history': 'history',
  '/summary': 'summary',
  '/reset': 'reset',
  '/reset-confirm': 'reset-confirm',
  '/help': 'help'
};

/**
 * Ejecuta un comando
 */
async function executeCommand(input) {
  // Parsea el comando y argumentos
  const parts = input.trim().split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  const commandKey = commandMap[command];

  if (!commandKey || !commands[commandKey]) {
    console.error(`❌ Comando desconocido: ${command}`);
    console.log('Ejecuta /help para ver comandos disponibles');
    return;
  }

  const handler = commands[commandKey];
  
  if (args.length > 0) {
    await handler(args[0], args[1]);
  } else {
    await handler();
  }
}

// Exporta
module.exports = {
  executeCommand,
  commands,
  commandMap
};

// CLI
if (require.main === module) {
  const input = process.argv.slice(2).join(' ');
  
  if (!input) {
    commands.help();
  } else {
    executeCommand(input).catch(error => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
  }
}
