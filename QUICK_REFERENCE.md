# QUICK_REFERENCE.md - Referencia Rápida

## 🚀 Comandos Essenciales

### Desarrollo

```bash
# Tests
npm test                          # Ejecutar todos los tests

# CLI
node .opencode/skills/grocery-ocr/cli.js /help              # Ver comandos
node .opencode/skills/grocery-ocr/cli.js /process-ticket-image <ruta>

# Carrefour
cd .opencode/skills/carrefour-integration
npm install
node cli.js setup
node cli.js sync

# Ver estructura
cat handler.js                    # Core logic
cat config.json                   # Configuración
cat .opencode/skills/grocery-ocr/SKILL.md    # OCR SKILL
```

---

## 📋 Estructura de Archivos Clave

```
/workspace/super/
├── handler.js ...................... Core (214 líneas, 8 funciones)
├── config.json ..................... Parámetros del sistema
├── data/grocery_history.json ....... Base de datos (JSON)
│
├── ARCHITECTURE.md ................. Arquitectura técnica
├── DEVELOPMENT_GUIDELINES.md ....... Guía de desarrollo
├── QUICK_REFERENCE.md .............. Este archivo
│
└── .opencode/skills/
    ├── grocery-ocr/
    │   ├── ocr-processor.js ........ Motor OCR
    │   ├── ticket-parser.js ........ Parser de tickets
    │   ├── processor.js ............ Orquestación
    │   └── cli.js .................. Interfaz CLI
    ├── grocery-analyzer/
    │   └── SKILL.md ................ Documentación
    └── carrefour-integration/
        ├── auth.js ................. Autenticación
        ├── history.js .............. Sincronización
        ├── cart.js ................. Carrito automático
        └── cli.js .................. Interfaz CLI
```

---

## 🔄 Flujos Principales

### Flujo 1: Procesar Ticket

```
Usuario adjunta foto
      ↓
ocr-processor (Tesseract + Google Vision)
      ↓
ticket-parser (extrae datos)
      ↓
handler.processTicket()
      ↓
handler.addPurchase()
      ↓
handler.updatePatterns()
      ↓
grocery_history.json (guardar)
      ↓
✅ Compra registrada
```

### Flujo 2: Obtener Recomendaciones

```
Usuario: /suggest-shopping
      ↓
handler.loadHistory()
      ↓
handler.estimateMissingProducts()
      ↓
Buscar productos con:
- últimas compras hace ≥ (frecuencia × 0.8) días
- Al menos 2 compras históricas
      ↓
Ordenar por urgencia
      ↓
✅ Mostrar lista recomendada
```

### Flujo 3: Sincronizar Carrefour

```
node cli.js sync
      ↓
auth.js (Puppeteer login)
      ↓
history.js (descargar órdenes)
      ↓
Para cada orden:
  handler.addPurchase()
  handler.updatePatterns()
      ↓
✅ Historial sincronizado
```

---

## 📊 Estructura de Datos

### Compra (Purchase)

```javascript
{
  id: 1717594800000,
  date: "2026-06-10T10:00:00Z",
  source: "ocr" | "carrefour" | "manual",
  store: "Carrefour" | "Disco" | "Jumbo",
  items: [
    {
      name: "Leche",
      quantity: 2,
      unit: "L",
      price: 1.50
    }
  ],
  total: 45.50,
  raw_text: "[opcional]"
}
```

### Patrón (Pattern)

```javascript
{
  name: "Leche",
  purchases: [
    { date: "...", quantity: 2, price: 1.50, source: "ocr" },
    { date: "...", quantity: 2, price: 1.60, source: "carrefour" }
  ],
  avg_quantity: 2,
  avg_price: 1.55,
  frequency_days: 7
}
```

### Recomendación (Suggestion)

```javascript
{
  product: "Leche",
  last_purchase_days_ago: 6,
  typical_frequency_days: 7,
  suggested_quantity: 2,
  estimated_price: 1.55,
  purchases_count: 3
}
```

---

## 🛠️ Funciones de handler.js

### Cargar y Guardar

```javascript
loadHistory()              // → Object (lee grocery_history.json)
initializeHistory()        // → Object (crea estructura vacía)
saveHistory(history)       // → Boolean (persiste JSON)
```

### Procesar Compras

```javascript
processTicket(ticketData)           // → Object (normaliza)
addPurchase(history, purchase)      // → Object (agrega + patterns)
updatePatterns(history, purchase)   // → void (calcula stats)
```

### Análisis

```javascript
estimateMissingProducts(history)    // → Array (sugerencias)
showSummary(history)                // → void (imprime resumen)
```

---

## 🎯 Tareas Comunes

### Agregar Nuevo Comando

```javascript
// 1. Crear función en handler.js si es lógica core
function newFunction() { ... }
module.exports = { ..., newFunction }

// 2. Agregar en cli.js
if (command === '/new-command') {
  const result = handler.newFunction();
  console.log(result);
}

// 3. Agregar test en test.js
function testNewFunction() { ... }

// 4. Documentar en SKILL.md
```

### Crear Nueva SKILL

```bash
# 1. Crear directorio
mkdir .opencode/skills/new-skill

# 2. Crear archivos mínimos
# - analyzer.js (lógica)
# - cli.js (interfaz)
# - SKILL.md (documentación)

# 3. Usar handler.js
const handler = require('../../../handler');
const history = handler.loadHistory();
```

### Modificar handler.js

```javascript
// ⚠️ IMPORTANTE: esto afecta TODO
// 1. Crear test ANTES
// 2. Cambiar función
// 3. Ejecutar npm test
// 4. Actualizar documentación
```

---

## 🔍 Debugging Rápido

### JSON corrupto

```bash
node -e "const j = require('./data/grocery_history.json'); console.log(Object.keys(j))"
```

### Ver estructura

```bash
node -e "const h = require('./handler'); const hist = h.loadHistory(); console.log(JSON.stringify(hist, null, 2).slice(0, 500))"
```

### Ver patterns

```bash
node -e "const h = require('./handler'); const hist = h.loadHistory(); Object.values(hist.product_patterns).forEach(p => console.log(p.name, p.frequency_days, 'días'))"
```

### Resetear base de datos

```bash
node -e "const h = require('./handler'); h.saveHistory(h.initializeHistory()); console.log('✅ Reset')"
```

---

## ✅ Checklist Pre-Commit

```
□ npm test pasa
□ Sin console.log de debug
□ Código indentado (2 espacios)
□ Funciones tienen docstring
□ JSON válido
□ SKILL.md actualizado si aplica
□ Commit message descriptivo
```

---

## 📞 Referencias Rápidas

| Tarea | Documento |
|-------|-----------|
| Entender arquitectura | ARCHITECTURE.md |
| Agregar feature | DEVELOPMENT_GUIDELINES.md |
| Ver estado actual | STATUS.txt |
| Instalar | INSTALL.md |
| Inicio rápido | QUICK_START.md |
| Resumen técnico | SUMMARY.md |

---

## 🚀 Comenzar

```bash
# 1. Ver qué hay
ls -la
cat ARCHITECTURE.md    # 5 min read

# 2. Ejecutar tests
npm test

# 3. Probar CLI
node .opencode/skills/grocery-ocr/cli.js /help

# 4. Ver datos
cat data/grocery_history.json

# 5. Hacer cambios
# (Consulta DEVELOPMENT_GUIDELINES.md)
```

---

## 🎓 Recursos Externos

**Si necesitas saber cómo...**

- **Usar Tesseract**: Google "tesseract ocr node.js"
- **Usar Puppeteer**: Google "puppeteer web automation"
- **Usar Google Vision**: Consulta carrefour-integration SKILL.md
- **JSON en Node.js**: `require('./file.json')`

---

**Actualizado**: Junio 2026  
**Para consultado**: Rápido y frecuente  
**Complemento de**: ARCHITECTURE.md y DEVELOPMENT_GUIDELINES.md
