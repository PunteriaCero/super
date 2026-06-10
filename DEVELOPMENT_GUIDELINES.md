# DEVELOPMENT_GUIDELINES.md - Guía para Desarrolladores

## 📖 Introducción

Este documento proporciona guías prácticas para trabajar en el proyecto. Para entender la arquitectura general, consulta **ARCHITECTURE.md**.

---

## 🎯 Antes de Empezar

### 1. Leer la Documentación Requerida

```bash
# Orden recomendado:
1. README.md ...................... Propósito general
2. ARCHITECTURE.md ................ Estructura técnica (ESTE ARCHIVO PRIMERO)
3. DEVELOPMENT_GUIDELINES.md ...... Guía de desarrollo (estás aquí)
4. Código de handler.js ........... Core logic
5. SKILL específica ............... Según lo que trabajes
```

### 2. Configurar Ambiente

```bash
# Clonar / entrar al proyecto
cd /workspace/super

# Verificar estructura
ls -la .opencode/skills/
cat config.json

# Ejecutar tests
npm test                    # Verificar todo funciona
```

### 3. Entender el Flujo de Datos

```
Entrada (usuario/API) 
    ↓
Procesamiento (SKILL o handler.js)
    ↓
Normalización (esquema JSON)
    ↓
Almacenamiento (grocery_history.json)
    ↓
Análisis (handler.js)
    ↓
Salida (recomendaciones/reportes)
```

---

## 🛠️ Guías por Tipo de Tarea

### TAREA A: Agregar un Nuevo Comando CLI

**Ejemplo**: Agregar comando `/reset-history` para limpiar base de datos

#### Paso 1: Crear la lógica en handler.js (si aplica)

```javascript
// handler.js
function resetHistory() {
  const newHistory = initializeHistory();
  saveHistory(newHistory);
  return newHistory;
}

module.exports = {
  // ... otras funciones
  resetHistory  // ← AGREGAR AQUÍ
};
```

#### Paso 2: Agregar comando en cli.js del SKILL

```javascript
// grocery-ocr/cli.js
if (command === '/reset-history') {
  const handler = require('../../handler');
  const result = handler.resetHistory();
  
  console.log('✅ Base de datos reiniciada');
  console.log(`Fecha: ${result.metadata.created}`);
  return;
}
```

#### Paso 3: Agregar test en test.js

```javascript
// test.js
function testResetHistory() {
  const handler = require('./handler');
  const history = handler.loadHistory();
  
  const reset = handler.resetHistory();
  
  if (reset.purchases.length === 0 && 
      reset.metadata.version === '1.0') {
    console.log('✅ TEST 8: Reset History ............ PASA');
    return true;
  }
  return false;
}
```

#### Paso 4: Documentar en SKILL.md

```markdown
## Comandos Disponibles

### Análisis
- /process-ticket-image
- /suggest-shopping
- /analyze-purchases

### Administración
- /reset-history      ← NUEVO: Limpia toda la base de datos
- /summary
- /help
```

#### Paso 5: Ejecutar y verificar

```bash
npm test                    # Verificar que pasa
node .opencode/skills/grocery-ocr/cli.js /reset-history  # Probar manualmente
```

---

### TAREA B: Agregar Un Nuevo SKILL

**Ejemplo**: Crear SKILL `price-comparison` para comparar precios entre supermercados

#### Paso 1: Crear directorio

```bash
mkdir -p .opencode/skills/price-comparison
cd .opencode/skills/price-comparison
```

#### Paso 2: Crear archivos mínimos

```javascript
// .opencode/skills/price-comparison/analyzer.js
const handler = require('../../../handler');

function compareProductPrices(productName) {
  const history = handler.loadHistory();
  const pattern = history.product_patterns[productName.toLowerCase()];
  
  if (!pattern) {
    return { error: 'Producto no encontrado' };
  }
  
  return {
    product: pattern.name,
    purchases: pattern.purchases,
    avg_price: pattern.avg_price,
    min_price: Math.min(...pattern.purchases.map(p => p.price)),
    max_price: Math.max(...pattern.purchases.map(p => p.price)),
    price_variance: Math.max(...pattern.purchases.map(p => p.price)) - 
                   Math.min(...pattern.purchases.map(p => p.price))
  };
}

module.exports = {
  compareProductPrices
};
```

```javascript
// .opencode/skills/price-comparison/cli.js
const analyzer = require('./analyzer');

if (command === '/compare-prices') {
  const productName = args[0];
  const result = analyzer.compareProductPrices(productName);
  
  if (result.error) {
    console.log(`❌ ${result.error}`);
  } else {
    console.log(`\n📊 Comparación: ${result.product}`);
    console.log(`Promedio: $${result.avg_price}`);
    console.log(`Mín: $${result.min_price}`);
    console.log(`Máx: $${result.max_price}`);
    console.log(`Varianza: $${result.price_variance}`);
  }
}
```

```markdown
# SKILL.md
---
name: price-comparison
description: Compara precios de productos entre diferentes tiendas
license: MIT
compatibility: opencode
metadata:
  version: "1.0"
  category: grocery-tracking
---

## What I do
- Analiza precios históricos de un producto
- Identifica dónde es más barato
- Calcula varianza de precios
- Sugiere mejores opciones

## When to use me
Carga esta SKILL cuando necesites:
- Comparar precios de un producto
- Identificar tiendas más económicas
- Analizar tendencias de precios

## Comandos
```bash
/compare-prices "Leche"
```
```

#### Paso 3: Actualizar config.json

```json
{
  "features": {
    "pattern_learning": true,
    "seasonal_detection": true,
    "price_tracking": true,
    "price_comparison": true,  // ← NUEVO
    "quantity_estimation": true,
    "shopping_suggestions": true
  }
}
```

#### Paso 4: Crear test específica

```javascript
// .opencode/skills/price-comparison/test.js
const analyzer = require('./analyzer');
const handler = require('../../../handler');

// Crear datos de prueba
const testData = {
  metadata: { version: '1.0', created: new Date().toISOString() },
  product_patterns: {
    leche: {
      name: 'Leche',
      purchases: [
        { price: 1.50, date: '2026-06-01' },
        { price: 1.60, date: '2026-06-08' },
        { price: 1.40, date: '2026-06-15' }
      ]
    }
  }
};

const result = analyzer.compareProductPrices('leche');
console.log(result);
```

---

### TAREA C: Modificar handler.js

**Importante**: Esta es la función core, cambios aquí afectan todo el sistema.

#### Checklist antes de modificar:

- [ ] Entiendo cómo la función se usa desde otros módulos
- [ ] He leído el docstring de la función
- [ ] He creado un test ANTES de cambiar
- [ ] Mi cambio no rompe funciones existentes
- [ ] He actualizado el comentario si cambió comportamiento
- [ ] He ejecutado `npm test`
- [ ] He actualizado documentación

#### Ejemplo: Agregar validación de precio negativo

```javascript
// ANTES
function addPurchase(history, purchase) {
  history.purchases.push(purchase);
  updatePatterns(history, purchase);
  history.metadata.last_updated = new Date().toISOString();
  return history;
}

// DESPUÉS
function addPurchase(history, purchase) {
  // ✅ VALIDAR: precios no pueden ser negativos
  if (purchase.total < 0) {
    throw new Error('Total no puede ser negativo');
  }
  
  purchase.items.forEach(item => {
    if (item.price < 0) {
      throw new Error(`Precio negativo en ${item.name}`);
    }
  });
  
  history.purchases.push(purchase);
  updatePatterns(history, purchase);
  history.metadata.last_updated = new Date().toISOString();
  return history;
}

// TEST
function testPriceValidation() {
  const handler = require('./handler');
  const history = handler.initializeHistory();
  
  const invalidPurchase = {
    items: [{ name: 'Leche', price: -1 }],
    total: -5
  };
  
  try {
    handler.addPurchase(history, invalidPurchase);
    console.log('❌ TEST: Price Validation ......... FALLA');
    return false;
  } catch (error) {
    console.log('✅ TEST: Price Validation ......... PASA');
    return true;
  }
}
```

---

### TAREA D: Integrar Nueva Fuente de Datos

**Ejemplo**: Agregar soporte para tickets de otra cadena (Walmart)

#### Paso 1: Normalizar datos de Walmart

```javascript
// .opencode/skills/walmart-integration/normalizer.js
function normalizeWalmartOrder(walmartOrder) {
  return {
    source: 'walmart',
    store: 'Walmart',
    date: new Date(walmartOrder.orderDate).toISOString(),
    items: walmartOrder.products.map(p => ({
      name: p.productName,
      quantity: p.quantity,
      unit: 'un',  // Walmart usa unidades
      price: p.unitPrice
    })),
    total: walmartOrder.totalAmount
  };
}

module.exports = { normalizeWalmartOrder };
```

#### Paso 2: Integrar en SKILL

```javascript
// .opencode/skills/walmart-integration/cli.js
const normalizer = require('./normalizer');
const handler = require('../../../handler');

if (command === '/sync-walmart') {
  const walmartOrders = fetchWalmartOrders();  // API específica
  
  const history = handler.loadHistory();
  
  walmartOrders.forEach(order => {
    const normalized = normalizer.normalizeWalmartOrder(order);
    const purchase = handler.processTicket(normalized);
    handler.addPurchase(history, purchase);
  });
  
  handler.saveHistory(history);
  console.log(`✅ Sincronizados ${walmartOrders.length} pedidos`);
}
```

#### Paso 3: Verificar que grocery_history.json acepta la fuente

```json
{
  "purchases": [
    {
      "source": "ocr|carrefour|walmart",  // ← Agregar aquí
      "store": "Carrefour|Disco|Walmart"   // ← Agregar aquí
    }
  ]
}
```

---

## 📋 Checklist de Calidad

Antes de hacer un commit, verifica:

### Código
- [ ] Funciones tienen docstring explicativo
- [ ] Variables tienen nombres claros
- [ ] No hay `console.log` de depuración
- [ ] Código está indentado (2 espacios)
- [ ] No hay funciones >150 líneas

### Funcionalidad
- [ ] `npm test` pasa 100%
- [ ] Testé manualmente el nuevo comando
- [ ] Testé casos edge (vacío, inválido, etc)
- [ ] Sin errores en consola

### Documentación
- [ ] Actualicé SKILL.md si aplica
- [ ] Actualicé README.md si aplica
- [ ] Agregué comentarios en código complejo
- [ ] Si hay nuevas opciones en config.json, documentadas

### Datos
- [ ] Nuevo comando respeta estructura grocery_history.json
- [ ] Validé esquema JSON
- [ ] Sin pérdida de datos existentes
- [ ] Backward compatible con datos viejos

### Git
- [ ] Commit message descriptivo
- [ ] Sin archivos `*.log` o `.env`
- [ ] Archivos sensibles en .gitignore
- [ ] 1 responsabilidad por commit

---

## 🔍 Debugging

### Problema: Comando no funciona

```bash
# 1. Verificar syntax
node -c .opencode/skills/grocery-ocr/cli.js

# 2. Probar directamente
node -e "const cli = require('./cli'); console.log(cli)"

# 3. Ver errors detallados
node cli.js /comando 2>&1 | head -50

# 4. Agregar console.log temporales
console.log('DEBUG:', variable);
npm test
```

### Problema: JSON corrupto

```bash
# Validar JSON
node -e "const json = require('./data/grocery_history.json'); console.log(JSON.stringify(json, null, 2))"

# Si está corrupto, restaurar backup
cp data/grocery_history.json.backup data/grocery_history.json

# O reiniciar
node -e "const h = require('./handler'); h.saveHistory(h.initializeHistory())"
```

### Problema: Pattern no calcula

```bash
# 1. Verificar hay datos
node -e "const h = require('./handler'); const hist = h.loadHistory(); console.log(Object.keys(hist.product_patterns).length, 'productos')"

# 2. Verificar mínimo de compras (config: 2)
node -e "const h = require('./handler'); const hist = h.loadHistory(); Object.values(hist.product_patterns).forEach(p => console.log(p.name, p.purchases.length, 'compras'))"

# 3. Recalcular manualmente
node -e "const h = require('./handler'); const hist = h.loadHistory(); h.saveHistory(hist); console.log('Recalculado')"
```

---

## 📦 Versionado

### Versión Actual: 1.0.0

Cambiar versión en:
1. `package.json` → `"version": "1.0.0"`
2. `config.json` → `"version": "1.0.0"`
3. `handler.js` → `metadata.version`
4. Cada SKILL.md → `metadata.version`

### Cambios de Versión

```
1.0.0 → 1.1.0   (feature nueva)
1.0.0 → 1.0.1   (bug fix)
1.0.0 → 2.0.0   (breaking change)
```

---

## 🚀 Deploying Cambios

### Paso 1: Test Local

```bash
npm test                    # Unit tests
node test.js               # Integration tests
npm run cli -- /help       # Manual test
```

### Paso 2: Commit Semántico

```bash
git add .
git commit -m "feat: add new command /compare-prices

- Add price comparison analyzer
- Display min/max/avg prices for product
- Update price_tracking configuration
- Add tests for edge cases"
```

### Paso 3: Actualizar Docs

```bash
# Agregar a ARCHITECTURE.md si cambió responsabilidades
# Agregar a README.md si es feature visible
# Actualizar SKILL.md específico
```

### Paso 4: Push a GitHub (si aplica)

```bash
git push origin main
```

---

## 🎓 Ejemplos Reales

### Ejemplo 1: Bug Fix Simple

**Problema**: `frequency_days` devuelve Infinity en algunos casos

```javascript
// IDENTIFICAR EL BUG
if (pattern.purchases.length > 1) {
  // ...
  pattern.frequency_days = Math.round(totalDays / (dates.length - 1));
} else {
  // ❌ BUG: frequency_days queda undefined
}

// FIX
if (pattern.purchases.length > 1) {
  // ...
  pattern.frequency_days = Math.round(totalDays / (dates.length - 1));
} else {
  // ✅ Setear valor por defecto
  pattern.frequency_days = 0;
}

// TEST
console.assert(pattern.frequency_days !== undefined);
```

### Ejemplo 2: Feature Con Breaking Change

**Nueva feature**: Cambiar estructura de seasonal_trends

```javascript
// VIEJO (1.0.0)
"seasonal_trends": {
  "enero": { "category": "Bebidas", "increase": 30 }
}

// NUEVO (2.0.0)
"seasonal_trends": {
  "Q1": {
    "month": "enero",
    "products": {
      "bebidas": { "increase_percent": 30 }
    }
  }
}

// MIGRACIÓN
function migrateSeasonalTrends(oldData) {
  const newData = {};
  Object.entries(oldData).forEach(([month, data]) => {
    const quarter = getQuarter(month);
    newData[quarter] = { month, products: { [data.category.toLowerCase()]: data } };
  });
  return newData;
}
```

---

## 📞 Soporte

### Dudas sobre:

- **Estructura general** → Consulta ARCHITECTURE.md
- **Cómo hacer X** → Busca en DEVELOPMENT_GUIDELINES.md (este archivo)
- **Usar comando Y** → Ver SKILL.md específico
- **Bugs** → Revisa Debugging section arriba

### Agregar Nueva Documentación

Si hay algo no documentado:
1. Crea archivo `DOC_NUEVO.md`
2. Agrega referencia en README.md
3. Haz commit: `docs: add new documentation`

---

## ✅ Finalización

Después de terminar una tarea:

```bash
# 1. Verificar cambios
git status
git diff

# 2. Ejecutar tests
npm test

# 3. Commit semántico
git commit -m "type: description"

# 4. Push (si aplica)
git push

# 5. Actualizar documentación
# (Si cambió comportamiento o se agregó feature)
```

---

**Fecha**: Junio 2026  
**Para**: Desarrollo del Sistema de Seguimiento de Compras  
**Revisión**: Cuando se agreguen nuevas fases
