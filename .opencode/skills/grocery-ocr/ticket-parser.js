#!/usr/bin/env node

/**
 * Ticket Parser
 * Extrae productos, cantidades y precios del texto de un ticket
 */

/**
 * Patrones regex para identificar elementos del ticket
 */
const PATTERNS = {
  // Patrones para encontrar precios (ej: $12.50, 12,50, etc)
  price: /(\$|\d{1,3}[.,]\d{2})/g,
  
  // Patrones para cantidades (ej: 2x, 2 un, 2 L, etc)
  quantity: /(\d+)\s*(?:x|un|l|kg|gr|ml|pc|piezas|unidades|litros|kilos|gramos|mililitros)?/gi,
  
  // Palabras comunes en tickets de supermercado
  keywords: {
    produce: ['tomate', 'lechuga', 'cebolla', 'papa', 'zanahoria', 'manzana', 'plátano', 'naranja'],
    dairy: ['leche', 'queso', 'yogur', 'crema', 'mantequilla', 'helado'],
    meat: ['carne', 'pollo', 'pavo', 'jamón', 'salchicha', 'lomo', 'res'],
    groceries: ['pan', 'arroz', 'pasta', 'harina', 'azúcar', 'sal', 'aceite'],
    beverages: ['agua', 'jugo', 'refresco', 'café', 'té', 'cerveza', 'vino'],
    cleaning: ['jabón', 'detergente', 'cloro', 'papel', 'servilleta', 'bolsas']
  }
};

/**
 * Normaliza el precio a número
 */
function normalizePrice(priceStr) {
  if (!priceStr) return null;
  
  // Remueve $ y espacios
  let normalized = priceStr.replace(/\$\s*/g, '').trim();
  
  // Convierte coma a punto decimal
  normalized = normalized.replace(',', '.');
  
  const price = parseFloat(normalized);
  return isNaN(price) ? null : price;
}

/**
 * Extrae líneas que probablemente sean productos
 */
function extractProductLines(text) {
  const lines = text.split('\n');
  const productLines = [];

  lines.forEach((line, index) => {
    // Ignora líneas muy cortas o que son encabezados comunes
    if (line.length < 3) return;
    if (line.match(/^(TICKET|COMPROBANTE|RECIBO|TOTAL|SUBTOTAL|DESCUENTO|IVA|FECHA|HORA|TIENDA|CAJERO)/i)) return;
    
    // Busca líneas que tengan números (precios/cantidades)
    if (line.match(/\d+/)) {
      productLines.push({
        text: line,
        index: index
      });
    }
  });

  return productLines;
}

/**
 * Identifica categoría de un producto
 */
function identifyCategory(productName) {
  const name = productName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(PATTERNS.keywords)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return category;
    }
  }
  
  return 'otros';
}

/**
 * Parsea una línea de producto
 */
function parseProductLine(line) {
  const text = line.trim();
  
  // Extrae todas las cantidades potenciales
  const quantityMatches = text.match(/(\d+)\s*(?:x|un|l|kg|gr|ml)?/gi);
  const quantity = quantityMatches ? parseInt(quantityMatches[0]) : 1;
  
  // Extrae precios
  const priceMatches = text.match(/\d+[.,]\d{2}/g);
  const price = priceMatches ? normalizePrice(priceMatches[priceMatches.length - 1]) : null;
  
  // Extrae el nombre del producto (todo lo que no sea número/precio)
  let productName = text
    .replace(/\d+[.,]\d{2}/g, '') // Remueve precios
    .replace(/\d+\s*(?:x|un|l|kg|gr|ml)?/gi, '') // Remueve cantidades
    .replace(/[\$\(\)]/g, '') // Remueve caracteres especiales
    .trim();
  
  if (productName.length < 2) {
    productName = text;
  }

  return {
    name: productName,
    quantity: quantity,
    unit: 'un',
    price: price,
    category: identifyCategory(productName),
    raw_text: text
  };
}

/**
 * Extrae total del ticket
 */
function extractTotal(text) {
  // Busca líneas con "TOTAL" o patrones similares
  const totalLines = text.split('\n').filter(line => 
    line.match(/^(TOTAL|MONTO|A PAGAR|DEBE)/i)
  );

  if (totalLines.length > 0) {
    const priceMatches = totalLines[0].match(/\d+[.,]\d{2}/);
    if (priceMatches) {
      return normalizePrice(priceMatches[0]);
    }
  }

  return null;
}

/**
 * Extrae fecha del ticket
 */
function extractDate(text) {
  // Patrones comunes de fecha
  const patterns = [
    /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/,  // DD/MM/YYYY o DD-MM-YY
    /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/,     // YYYY/MM/DD
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

/**
 * Extrae nombre del supermercado
 */
function extractStoreName(text) {
  // Busca al principio del ticket
  const firstLines = text.split('\n').slice(0, 5).join(' ');
  
  // Busca palabras conocidas de supermercados
  const stores = ['Carrefour', 'Disco', 'Jumbo', 'Éxito', 'Walmart', 'AhorroMas'];
  
  for (const store of stores) {
    if (firstLines.includes(store)) {
      return store;
    }
  }

  return 'Desconocido';
}

/**
 * Parsea el texto completo del ticket
 */
function parseTicket(ocrText) {
  try {
    const productLines = extractProductLines(ocrText);
    const items = productLines
      .map(line => parseProductLine(line.text))
      .filter(item => item.name.length > 0);

    const date = extractDate(ocrText);
    const total = extractTotal(ocrText);
    const store = extractStoreName(ocrText);

    return {
      success: true,
      store: store,
      date: date || new Date().toISOString().split('T')[0],
      items: items,
      total: total || items.reduce((sum, item) => sum + (item.price || 0), 0),
      item_count: items.length,
      raw_text: ocrText
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      raw_text: ocrText
    };
  }
}

/**
 * Valida que el parsing sea razonable
 */
function validateParsing(parsedTicket) {
  const issues = [];

  if (parsedTicket.items.length === 0) {
    issues.push('No se encontraron productos');
  }

  if (parsedTicket.total <= 0) {
    issues.push('Total inválido');
  }

  if (!parsedTicket.date) {
    issues.push('No se encontró fecha');
  }

  // Verifica que los items tengan nombres razonables
  const invalidItems = parsedTicket.items.filter(item => item.name.length < 2);
  if (invalidItems.length > 0) {
    issues.push(`${invalidItems.length} productos con nombres inválidos`);
  }

  return {
    valid: issues.length === 0,
    issues: issues
  };
}

// Exporta funciones
module.exports = {
  parseTicket,
  validateParsing,
  parseProductLine,
  extractDate,
  extractTotal,
  extractStoreName,
  normalizePrice
};

// CLI
if (require.main === module) {
  const ticketText = process.argv.slice(2).join(' ');
  
  if (!ticketText) {
    console.error('Uso: ticket-parser.js "texto del ticket"');
    process.exit(1);
  }

  const result = parseTicket(ticketText);
  const validation = validateParsing(result);

  console.log(JSON.stringify({
    ...result,
    validation: validation
  }, null, 2));
}
