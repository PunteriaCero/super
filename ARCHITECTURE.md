# ARCHITECTURE.md - Sistema de Seguimiento de Compras de Supermercado

## 📋 Resumen Ejecutivo

Este es un **sistema inteligente de análisis de compras de supermercado** que combina OCR, análisis de patrones y automatización de carrito para sugerir qué productos comprar y cuándo.

**Versión**: 1.0.0  
**Estado**: ✅ Operativo  
**Última actualización**: Junio 2026

---

## 🎯 Propósito del Proyecto

Rastrear compras de supermercado (online y presenciales) mediante:
1. Extracción automática de texto de tickets (OCR)
2. Sincronización con historial de Carrefour
3. Análisis inteligente de patrones de consumo
4. Generación de recomendaciones automáticas

**Objetivo final**: Automatizar decisiones de compra basadas en datos históricos reales.

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENTRADA DE DATOS                             │
├─────────────────────────────────────────────────────────────────┤
│  📷 Fotos de Tickets  │  💳 Carrefour Online  │  ✏️ Manual      │
└────────┬──────────────────┬──────────────────────┬──────────────┘
         │                  │                      │
         ▼                  ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  GROCERY-OCR     │  │  CARREFOUR-      │  │  HANDLER.JS      │
│   SKILL          │  │  INTEGRATION     │  │  (Manual Entry)  │
│                  │  │   SKILL          │  │                  │
│ • Tesseract OCR  │  │                  │  │ • Validación     │
│ • Google Vision  │  │ • Web Scraping   │  │ • Normalización  │
│ • Ticket Parser  │  │ • Cart Automation│  │                  │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   HANDLER.JS (CORE)  │
                    │                      │
                    │ • loadHistory()      │
                    │ • addPurchase()      │
                    │ • updatePatterns()   │
                    │ • estimateMissing()  │
                    └────────┬─────────────┘
                             │
                             ▼
                    ┌──────────────────────┐
                    │  GROCERY_HISTORY.JSON│
                    │  (Base de Datos)     │
                    │                      │
                    │ • purchases[]        │
                    │ • patterns{}         │
                    │ • seasonal_trends{}  │
                    └────────┬─────────────┘
                             │
                             ▼
                    ┌──────────────────────┐
                    │  GROCERY-ANALYZER    │
                    │   SKILL              │
                    │                      │
                    │ • Análisis avanzado  │
                    │ • Recomendaciones    │
                    │ • Reportes           │
                    └──────────────────────┘
```

---

## 📦 Módulos Principales

### 1. **handler.js (CORE - 214 líneas)**

**Responsabilidad**: Gestión central de datos y lógica de análisis

#### Funciones Principales:

| Función | Entrada | Salida | Propósito |
|---------|---------|--------|----------|
| `loadHistory()` | - | `Object` | Carga JSON del disco |
| `initializeHistory()` | - | `Object` | Crea estructura inicial |
| `saveHistory(history)` | `Object` | `Boolean` | Persiste en JSON |
| `processTicket(ticketData)` | `Object` | `Object` | Normaliza datos de ticket |
| `addPurchase(history, purchase)` | `Object, Object` | `Object` | Agrega compra al historial |
| `updatePatterns(history, purchase)` | `Object, Object` | `void` | Calcula patrones de consumo |
| `estimateMissingProducts(history)` | `Object` | `Array` | Sugiere productos a comprar |
| `showSummary(history)` | `Object` | `void` | Imprime resumen en consola |

#### Estructura de Datos: `grocery_history.json`

```json
{
  "metadata": {
    "version": "1.0",
    "created": "2026-06-10T10:00:00Z",
    "family_members": 4,
    "composition": "1 hombre, 1 mujer, 2 chicos",
    "last_updated": "2026-06-10T15:30:00Z"
  },
  "purchases": [
    {
      "id": 1717594800000,
      "date": "2026-06-10T10:00:00Z",
      "source": "ocr|carrefour|manual",
      "store": "Carrefour|Disco|Jumbo",
      "items": [
        {
          "name": "Leche 1L",
          "quantity": 2,
          "unit": "L",
          "price": 1.50,
          "category": "Lácteos"
        }
      ],
      "total": 45.50,
      "raw_text": "[Texto OCR original si aplica]"
    }
  ],
  "product_patterns": {
    "leche": {
      "name": "Leche",
      "purchases": [
        {
          "date": "2026-06-03T10:00:00Z",
          "quantity": 2,
          "price": 1.50,
          "source": "ocr"
        }
      ],
      "avg_quantity": 2,
      "avg_price": 1.50,
      "frequency_days": 7
    }
  },
  "seasonal_trends": {
    "enero": {
      "category": "Bebidas",
      "increase_percent": 30,
      "notes": "Mayor consumo por calor"
    }
  }
}
```

#### Algoritmo: `estimateMissingProducts()`

```
Para cada producto en product_patterns:
  1. Obtener última fecha de compra
  2. Calcular días desde última compra
  3. Obtener frecuencia típica en días
  
  SI: días_desde_última ≥ (frecuencia_típica × 0.8)
  ENTONCES: Sugerir compra
  
  Retornar: Array ordenado por urgencia (más antiguo primero)
```

**Ejemplo**:
- Producto: Leche
- Frecuencia típica: 7 días
- Última compra: hace 6 días
- Umbral: 7 × 0.8 = 5.6 días
- ¿6 ≥ 5.6? ✅ SÍ → Sugerir compra

---

### 2. **grocery-ocr SKILL (5 archivos)**

**Responsabilidad**: Procesar imágenes de tickets y extraer datos estructurados

#### Módulos:

```
grocery-ocr/
├── ocr-processor.js ............ Motor OCR dual (Tesseract + Google Vision)
├── ticket-parser.js ............ Extrae estructura de texto plano
├── processor.js ................ Orquestación OCR → Parser → Storage
├── cli.js ....................... Interfaz de comandos
└── SKILL.md ..................... Documentación
```

#### Flujo: `processor.js`

```
┌──────────────────────┐
│  Imagen de Ticket    │
│  (JPG/PNG/PDF)       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────┐
│ ocr-processor.js             │
│ Intenta métodos por orden:   │
│ 1. Tesseract (local)         │
│ 2. Google Vision (fallback)  │
└──────────┬───────────────────┘
           │
           ▼ (Texto plano)
┌──────────────────────────────┐
│ ticket-parser.js             │
│ Extrae:                      │
│ • Productos                  │
│ • Cantidades                 │
│ • Precios                    │
│ • Tienda                     │
│ • Fecha                      │
│ • Total                      │
└──────────┬───────────────────┘
           │
           ▼ (Datos estructurados)
┌──────────────────────────────┐
│ processor.js                 │
│ Valida y normaliza:          │
│ • Crea ticket object         │
│ • Llama handler.addPurchase()│
│ • Guarda en JSON             │
└──────────────────────────────┘
```

#### Comandos Disponibles:

```bash
/process-ticket-image <ruta>       # Procesa imagen
/analyze-purchases                 # Análisis de patrones
/suggest-shopping                  # Qué comprar
/view-purchase-history             # Historial completo
/summary                           # Resumen ejecutivo
/help                              # Ayuda
```

---

### 3. **carrefour-integration SKILL (28 archivos)**

**Responsabilidad**: Automatizar acceso a Carrefour y sincronizar compras online

#### Módulos Principales:

```
carrefour-integration/
├── cli.js .......................... CLI principal (6 comandos)
├── auth.js ......................... Autenticación Puppeteer
├── history.js ...................... Sincronización de historial
├── cart.js ......................... Automatización de carrito
├── carrefour-analyzer-bridge.js .... Integración con análisis
├── api-client.js ................... Cliente REST (fallback)
├── real-carrefour-client.js ........ Cliente web real
└── test-*.js ....................... Test suite
```

#### Flujo: Autenticación → Sincronización → Carrito

```
┌──────────────────────────────┐
│ Credenciales Carrefour       │
│ (email + password)           │
│ Almacenadas en .env          │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ auth.js - Puppeteer          │
│ • Abre navegador             │
│ • Login automático           │
│ • Captura cookies/tokens     │
│ • Offline fallback con mock  │
└──────────┬───────────────────┘
           │
           ▼ (Session válida)
┌──────────────────────────────┐
│ history.js - Sync            │
│ • Descarga órdenes pasadas   │
│ • Extrae productos           │
│ • Normaliza datos            │
│ • Guarda en cache local      │
└──────────┬───────────────────┘
           │
           ▼ (Datos sincronizados)
┌──────────────────────────────┐
│ handler.js (CORE)            │
│ • addPurchase() para c/order │
│ • updatePatterns()           │
│ • Integra con análisis       │
└──────────┬───────────────────┘
           │
           ▼ (Análisis listo)
┌──────────────────────────────┐
│ cart.js - Automatización      │
│ • Busca productos            │
│ • Agrega al carrito          │
│ • Auto-compra (opcional)     │
└──────────────────────────────┘
```

#### Comandos Disponibles:

```bash
node cli.js setup              # Guardar credenciales
node cli.js sync               # Sincronizar historial
node cli.js history            # Ver compras sincronizadas
node cli.js status             # Estado de sincronización
node cli.js add-cart           # Agregar productos al carrito
node cli.js test               # Ejecutar tests
```

---

### 4. **grocery-analyzer SKILL (Wrapper)**

**Responsabilidad**: Interfaz de usuario para análisis avanzado

#### Comandos:

```bash
/analyze-purchases          # Análisis detallado
/suggest-next-shopping      # Recomendaciones
/view-patterns              # Patrones detectados
/view-seasonal-trends       # Estacionalidad
```

Utiliza internamente `handler.js` para cálculos.

---

## 🔄 Flujos de Trabajo Completos

### Flujo A: Procesamiento de Ticket Manual

```
Usuario adjunta foto de ticket
                │
                ▼
        /process-ticket-image
                │
                ▼
        ocr-processor (Tesseract)
                │
        ┌───────┴───────┐
        │               │
      ✅ OK          ❌ Error
        │               │
        │               ▼
        │         Google Vision API
        │               │
        └───────┬───────┘
                │
                ▼
        ticket-parser (extrae datos)
                │
                ▼
        handler.processTicket()
                │
                ▼
        handler.addPurchase()
                │
                ▼
        handler.updatePatterns()
                │
                ▼
        grocery_history.json (guardar)
                │
                ▼
        ✅ Compra registrada
```

### Flujo B: Sincronización Carrefour

```
Usuario: /setup-carrefour
                │
                ▼
    Ingresa email + password
                │
                ▼
        auth.js (Puppeteer)
                │
        ┌───────┴───────┐
        │               │
      ✅ Auth OK     ❌ Error
        │               │
        │               ▼
        │           Usar mock data
        │           (offline mode)
        │               │
        └───────┬───────┘
                │
                ▼
        history.js (descarga órdenes)
                │
                ▼
        Normaliza cada orden
                │
                ▼
        handler.addPurchase() × N
                │
                ▼
        Integra con patrones
                │
                ▼
        ✅ Sincronización completa
```

### Flujo C: Obtener Recomendaciones

```
Usuario: /suggest-shopping
                │
                ▼
        handler.loadHistory()
                │
                ▼
        handler.estimateMissingProducts()
                │
    ┌───────────┼───────────┐
    │           │           │
 ¿Mín 3    ¿Hay      ¿Hay
 compras?  patrones? urgencia?
    │           │           │
   NO          NO          SÍ
    │           │           │
    ▼           ▼           ▼
 "Sin datos" "Sin datos" Mostrar list
                              ordenada
                                │
                                ▼
                         ✅ Recomendaciones
```

---

## 📊 Validación de Esquemas

### Ticket Entry (Entrada normalizada)

```javascript
{
  source: "ocr" | "carrefour" | "manual",        // Requerido
  store: "Carrefour" | "Disco" | ...,            // Requerido
  items: [                                        // Requerido, min 1
    {
      name: String,                               // Requerido, min 3 chars
      quantity: Number > 0,                       // Requerido
      unit: "L" | "kg" | "un" | ...,             // Requerido
      price: Number >= 0,                         // Opcional
      category: String                            // Opcional
    }
  ],
  total: Number >= 0,                             // Opcional
  raw_text: String                                // Opcional (solo OCR)
}
```

### Pattern Entry (Patrón aprendido)

```javascript
{
  name: String,                                   // Nombre del producto
  purchases: [                                    // Historial de compras
    {
      date: ISO_DATE,
      quantity: Number,
      price: Number,
      source: String
    }
  ],
  avg_quantity: Number,                           // Calculado
  avg_price: Number,                              // Calculado
  frequency_days: Number                          // Calculado
}
```

---

## ⚙️ Configuración (config.json)

```json
{
  "system": {
    "name": "Grocery Tracking System",
    "version": "1.0.0",
    "data_dir": "./data",
    "history_file": "./data/grocery_history.json"
  },
  "ocr": {
    "enabled": true,
    "method": "cloud-vision",
    "supported_formats": ["jpg", "jpeg", "png", "pdf"],
    "max_file_size_mb": 5,
    "language": "es",
    "optimization": "minimize-tokens"
  },
  "analysis": {
    "enabled": true,
    "min_purchases_for_pattern": 2,
    "min_purchases_for_estimation": 3,
    "frequency_threshold_percent": 80,
    "family_size": 4
  },
  "carrefour": {
    "enabled": true,
    "api_type": "web-scraping",
    "requires_credentials": true,
    "auto_sync": false,
    "supports_historical": true
  },
  "storage": {
    "format": "json",
    "encryption": "local-only",
    "backup_enabled": false
  }
}
```

---

## 📁 Estructura de Directorios

```
/workspace/super/
├── ARCHITECTURE.md ...................... Este archivo
├── README.md ............................ Guía general
├── QUICK_START.md ....................... Inicio rápido
├── handler.js ........................... CORE (214 líneas)
├── config.json .......................... Configuración
├── package.json ......................... Dependencias npm
├── test.js .............................. Unit tests
│
├── .opencode/skills/
│   ├── grocery-ocr/
│   │   ├── ocr-processor.js ............. Tesseract + Google Vision
│   │   ├── ticket-parser.js ............. Extractor de datos
│   │   ├── processor.js ................. Orquestación
│   │   ├── cli.js ....................... Interfaz CLI
│   │   └── SKILL.md ..................... Documentación
│   │
│   ├── grocery-analyzer/
│   │   └── SKILL.md ..................... Documentación
│   │
│   └── carrefour-integration/
│       ├── cli.js ....................... CLI (6 comandos)
│       ├── auth.js ...................... Puppeteer auth
│       ├── history.js ................... Sincronización
│       ├── cart.js ...................... Automatización carrito
│       ├── carrefour-analyzer-bridge.js . Integración
│       ├── .env ......................... Credenciales (gitignored)
│       ├── .carrefour-data/ ............. Cache local
│       ├── package.json ................. Deps específicas
│       ├── SKILL.md ..................... Documentación
│       └── test-*.js .................... Tests
│
├── data/
│   └── grocery_history.json ............. Base de datos principal
│
└── docs/
    ├── INSTALL.md ....................... Instalación
    ├── SUMMARY.md ....................... Resumen técnico
    ├── STRUCTURE.txt .................... Estructura
    ├── STATUS.txt ....................... Estado del proyecto
    └── PROJECT_COMPLETION_REPORT.md ..... Reporte final
```

---

## 🔐 Seguridad y Privacidad

### Principios

1. **Local-first**: Todos los datos en JSON local
2. **No cloud**: Nada se sincroniza a servidores externos*
3. **Encriptación**: Credenciales Carrefour almacenadas seguras
4. **Respaldo**: JSON fácil de exportar/respaldar

*Nota: Google Vision API solo si se configura explícitamente

### Archivos Sensibles

```
.env .......................... ❌ Gitignored (credenciales)
.carrefour-data/cookies.json ... ⚠️ Tokens de sesión (local)
grocery_history.json ........... ⚠️ Datos privados (local)
```

---

## 🚀 Punto de Entrada

### Para Usuario Final

```bash
# 1. Cargar SKILL
skill load grocery-ocr

# 2. Procesar ticket
/process-ticket-image ./tickets/ticket.jpg

# 3. Después de 3-4 tickets:
/suggest-shopping
```

### Para Desarrollador

```bash
# Ver código core
cat handler.js

# Ver test suite
npm test

# Ver SKILL specific
cat .opencode/skills/grocery-ocr/SKILL.md
```

---

## ✅ Verificación: ¿Qué Debería Funcionar?

| Componente | Estado | Nota |
|------------|--------|------|
| JSON storage | ✅ | handler.js loadHistory/saveHistory |
| OCR processing | ✅ | grocery-ocr SKILL |
| Pattern learning | ✅ | handler.js updatePatterns |
| Recommendations | ✅ | handler.js estimateMissingProducts |
| Carrefour integration | ✅ | carrefour-integration SKILL |
| CLI interface | ✅ | grocey-ocr/cli.js |
| Tests | ✅ | test.js (7 tests pass) |

---

## 🔗 Dependencias Entre Módulos

```
┌─────────────────────┐
│   grocery-ocr       │
│   (SKILL)           │
│                     │
│ Usa: handler.js     │────┐
│ Salida: purchase    │    │
└─────────────────────┘    │
                           │
┌─────────────────────┐    │
│  carrefour-integ    │    │
│  (SKILL)            │    │
│                     │    │
│ Usa: handler.js     │────┤
│ Usa: patterns       │    │
│ Salida: purchase    │    ├──► handler.js (CORE)
└─────────────────────┘    │     ↓
                           │     grocery_history.json
┌─────────────────────┐    │
│  grocery-analyzer   │    │
│  (SKILL)            │    │
│                     │    │
│ Lee: history.json   │────┘
│ Usa: handler funcs  │
└─────────────────────┘
```

---

## 📝 Notas de Desarrollo

### Para Agregar Una Nueva Feature

1. Determinar si va en SKILL o en handler.js
2. Si es SKILL: Crear directorio en `.opencode/skills/`
3. Si es handler.js: Exportar nueva función
4. Actualizar config.json si hay nuevas opciones
5. Agregar tests en test.js o archivo específico
6. Documentar en SKILL.md o README.md

### Para Modificar handler.js

- Cambios aquí afectan TODAS las SKILLs
- Siempre mantener índice de funciones exportadas
- Actualizar tipo de dato de grocery_history.json
- Agregar test en test.js

### Para Agregar Nuevo Comando CLI

- Agregar en cli.js del SKILL respectivo
- Debe usar funciones de handler.js o del propio SKILL
- Documentar en SKILL.md
- Agregar test si es lógica nueva

---

## 🎓 Conclusión

Este sistema está **bien definido arquitecturalmente**:

✅ **Responsabilidades claras**: Cada módulo tiene propósito específico  
✅ **Flujos documentados**: Entrada → Procesamiento → Salida  
✅ **Esquemas validados**: Estructura de JSON esperada  
✅ **Interfaz consistente**: SKILLs usan handler.js  
✅ **Testeable**: Tests cubren funcionalidad core  

**Punto de referencia**: Consultar este documento cuando se dude de responsabilidades.

---

**Fecha**: Junio 2026  
**Versión**: 1.0  
**Autor**: OpenCode Agent  
**Próxima revisión**: Cuando se agreguen nuevas fases
