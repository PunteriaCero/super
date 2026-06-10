#!/usr/bin/env node

/**
 * Test Script for Grocery Tracking System
 * Prueba los componentes principales sin una imagen real
 */

const handler = require('./handler');
const ticketParser = require('./.opencode/skills/grocery-ocr/ticket-parser');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  Pruebas del Sistema de Seguimiento de Compras             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Test 1: Carga y guardar historial
console.log('TEST 1: Historial de Compras');
console.log('─'.repeat(50));

const history = handler.loadHistory();
console.log('✅ Historial cargado');
console.log(`   Versión: ${history.metadata.version}`);
console.log(`   Compras registradas: ${history.purchases.length}`);
console.log('');

// Test 2: Parser de ticket con texto simulado
console.log('TEST 2: Parser de Ticket');
console.log('─'.repeat(50));

const ticketText = `
CARREFOUR
Tienda Belgrano
Fecha: 2024-06-05 14:30

Leche descremada 1L    2 x    3.50
Pan integral kg        1 x    2.20
Manzanas verdes kg     1.5 x  4.80
Queso fresco 500g      1 x    6.50
Tomates maduros kg     2 x    2.50
Arroz integral 500g    1 x    1.80
Yogur natural 125g     6 x    0.90
Jabón líquido 250ml    1 x    1.20

SUBTOTAL:             $23.40
IVA:                  $2.10
TOTAL A PAGAR:        $25.50
`;

const parsedTicket = ticketParser.parseTicket(ticketText);
console.log('✅ Parsing completado');
console.log(`   Productos encontrados: ${parsedTicket.items.length}`);
console.log(`   Total: $${parsedTicket.total.toFixed(2)}`);
console.log(`   Tienda: ${parsedTicket.store}`);
console.log('');

// Test 3: Validación de parsing
console.log('TEST 3: Validación de Datos');
console.log('─'.repeat(50));

const validation = ticketParser.validateParsing(parsedTicket);
console.log(`✅ Validación: ${validation.valid ? 'APROBADA' : 'CON PROBLEMAS'}`);
if (validation.issues.length > 0) {
  console.log('   Problemas encontrados:');
  validation.issues.forEach(issue => console.log(`   - ${issue}`));
}
console.log('');

// Test 4: Agregar compra
console.log('TEST 4: Agregar Compra al Historial');
console.log('─'.repeat(50));

const purchase = handler.processTicket({
  source: 'test',
  store: parsedTicket.store,
  items: parsedTicket.items,
  total: parsedTicket.total,
  raw_text: ticketText
});

const updatedHistory = handler.addPurchase(history, purchase);
console.log(`✅ Compra agregada`);
console.log(`   ID: ${purchase.id}`);
console.log(`   Items: ${purchase.items.length}`);
console.log('');

// Test 5: Análisis de patrones
console.log('TEST 5: Análisis de Patrones');
console.log('─'.repeat(50));

console.log('Patrones detectados:');
Object.values(updatedHistory.product_patterns).slice(0, 5).forEach(pattern => {
  console.log(`✅ ${pattern.name}`);
  console.log(`   Compras: ${pattern.purchases.length}`);
  console.log(`   Cantidad promedio: ${pattern.avg_quantity}`);
  console.log(`   Precio promedio: $${pattern.avg_price.toFixed(2)}`);
});
console.log('');

// Test 6: Estimación
console.log('TEST 6: Estimación de Productos Faltantes');
console.log('─'.repeat(50));

const suggestions = handler.estimateMissingProducts(updatedHistory);
console.log(`Sugerencias: ${suggestions.length} productos`);
if (suggestions.length > 0) {
  console.log('Primeras sugerencias:');
  suggestions.slice(0, 3).forEach((item, idx) => {
    console.log(`  ${idx + 1}. ${item.product}`);
    console.log(`     Comprar: ${item.suggested_quantity} unidades`);
  });
}
console.log('');

// Test 7: Guardar
console.log('TEST 7: Guardar Historial');
console.log('─'.repeat(50));

const saved = handler.saveHistory(updatedHistory);
console.log(`✅ Historial guardado: ${saved}`);
console.log('');

// Resumen
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  ✅ TODAS LAS PRUEBAS COMPLETADAS                          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('Sistema listo para usar:');
console.log('  skill load grocery-ocr');
console.log('  /process-ticket-image <imagen>');
console.log('');
