#!/usr/bin/env node

/**
 * Grocery Ticket Processor
 * Pipeline completo: OCR -> Parser -> Storage
 */

const fs = require('fs');
const path = require('path');
const ocrProcessor = require('./ocr-processor');
const ticketParser = require('./ticket-parser');

// Importa el handler de la raíz
const handler = require('../../handler');

/**
 * Procesa una imagen de ticket completa
 */
async function processTicketImage(imagePath) {
  console.log(`\n📷 Procesando ticket: ${imagePath}`);

  try {
    // Paso 1: OCR - Extrae texto de la imagen
    console.log('⏳ Ejecutando OCR...');
    const ocrResult = await ocrProcessor.extractTextFromImage(imagePath);
    
    if (!ocrResult.success) {
      throw new Error(`OCR falló: ${ocrResult.error}`);
    }

    console.log(`✅ OCR completado (método: ${ocrResult.method})`);
    console.log(`   Texto extraído: ${ocrResult.text.length} caracteres`);

    // Paso 2: Parser - Extrae productos y precios
    console.log('\n⏳ Parseando ticket...');
    const ticketData = ticketParser.parseTicket(ocrResult.text);
    
    if (!ticketData.success) {
      throw new Error(`Parser falló: ${ticketData.error}`);
    }

    console.log(`✅ Parsing completado`);
    console.log(`   Productos encontrados: ${ticketData.items.length}`);
    console.log(`   Total: $${ticketData.total}`);
    console.log(`   Tienda: ${ticketData.store}`);
    console.log(`   Fecha: ${ticketData.date}`);

    // Paso 3: Validación
    console.log('\n⏳ Validando datos...');
    const validation = ticketParser.validateParsing(ticketData);
    
    if (!validation.valid) {
      console.warn('⚠️  Problemas encontrados:');
      validation.issues.forEach(issue => console.warn(`   - ${issue}`));
    } else {
      console.log('✅ Validación completada');
    }

    // Paso 4: Guardar en BD
    console.log('\n⏳ Guardando en base de datos...');
    const history = handler.loadHistory();
    
    const purchase = handler.processTicket({
      source: 'ocr',
      store: ticketData.store,
      items: ticketData.items,
      total: ticketData.total,
      raw_text: ticketData.raw_text,
      date: ticketData.date
    });

    handler.addPurchase(history, purchase);
    handler.saveHistory(history);
    
    console.log(`✅ Compra guardada con ID: ${purchase.id}`);

    // Paso 5: Resumen
    console.log('\n' + '='.repeat(50));
    console.log('RESUMEN DEL PROCESAMIENTO');
    console.log('='.repeat(50));
    handler.showSummary(history);
    
    console.log('\n📝 PRODUCTOS DETECTADOS:');
    ticketData.items.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.name}`);
      console.log(`      • Cantidad: ${item.quantity} ${item.unit}`);
      console.log(`      • Precio: $${item.price || 'N/A'}`);
      console.log(`      • Categoría: ${item.category}`);
    });

    return {
      success: true,
      purchase_id: purchase.id,
      items_count: ticketData.items.length,
      total: ticketData.total,
      store: ticketData.store
    };

  } catch (error) {
    console.error(`\n❌ Error procesando ticket: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Muestra sugerencias de lo que falta comprar
 */
function suggestNextShopping() {
  console.log('\n' + '='.repeat(50));
  console.log('RECOMENDACIONES DE COMPRA');
  console.log('='.repeat(50) + '\n');

  const history = handler.loadHistory();
  const suggestions = handler.estimateMissingProducts(history);

  if (suggestions.length === 0) {
    console.log('No hay sugerencias aún. Registra más tickets para obtener recomendaciones.');
    return;
  }

  console.log(`Basado en tu historial de ${history.purchases.length} compras:\n`);
  
  suggestions.slice(0, 10).forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.product}`);
    console.log(`   • Última compra: hace ${item.last_purchase_days_ago} días`);
    console.log(`   • Frecuencia típica: cada ${item.typical_frequency_days} días`);
    console.log(`   • Cantidad a comprar: ${item.suggested_quantity}`);
    console.log(`   • Precio estimado: $${item.estimated_price?.toFixed(2) || 'N/A'}`);
    console.log('');
  });
}

/**
 * Muestra análisis de patrones
 */
function analyzePatterns() {
  const history = handler.loadHistory();

  console.log('\n' + '='.repeat(50));
  console.log('ANÁLISIS DE PATRONES');
  console.log('='.repeat(50) + '\n');

  if (Object.keys(history.product_patterns).length === 0) {
    console.log('No hay patrones aún. Registra al menos 2 tickets.');
    return;
  }

  const patterns = Object.values(history.product_patterns)
    .sort((a, b) => b.purchases.length - a.purchases.length)
    .slice(0, 15);

  console.log(`Productos más comprados (${patterns.length}):\n`);

  patterns.forEach((pattern, idx) => {
    console.log(`${idx + 1}. ${pattern.name}`);
    console.log(`   • Compras: ${pattern.purchases.length} veces`);
    console.log(`   • Cantidad promedio: ${pattern.avg_quantity}`);
    console.log(`   • Precio promedio: $${pattern.avg_price?.toFixed(2) || 'N/A'}`);
    console.log(`   • Frecuencia: cada ${pattern.frequency_days} días`);
    console.log('');
  });
}

// Exporta funciones
module.exports = {
  processTicketImage,
  suggestNextShopping,
  analyzePatterns
};

// CLI
if (require.main === module) {
  const command = process.argv[2];
  const arg = process.argv[3];

  if (command === 'process' && arg) {
    processTicketImage(arg).then(result => {
      if (!result.success) {
        process.exit(1);
      }
    });
  } else if (command === 'suggest') {
    suggestNextShopping();
  } else if (command === 'analyze') {
    analyzePatterns();
  } else {
    console.log(`
Uso:
  node processor.js process <imagen>   - Procesa un ticket
  node processor.js suggest             - Sugiere qué comprar
  node processor.js analyze             - Analiza patrones
    `);
  }
}
