# Sistema de Seguimiento de Compras de Supermercado

Un agente inteligente para rastrear compras de supermercado (online y presenciales), analizar patrones de consumo y estimar qué productos falta comprar.

## Estructura del Proyecto

```
/workspace/super/
├── .opencode/skills/
│   ├── grocery-ocr/                 # SKILL: Procesa imágenes de tickets
│   ├── grocery-analyzer/            # SKILL: Analiza patrones y estima compras
│   └── carrefour-integration/       # SKILL: Sincroniza con Carrefour
├── data/
│   └── grocery_history.json         # Almacenamiento de compras e historiales
├── handler.js                       # Lógica principal del sistema
└── README.md                        # Este archivo
```

## Características Principales

### 1. Procesamiento de Tickets (OCR)
- Extrae texto de fotos de tickets
- Identifica productos, cantidades y precios
- Almacena en formato estructurado

### 2. Análisis de Patrones
- Identifica productos comprados regularmente
- Calcula frecuencia de compra de cada producto
- Detecta variaciones estacionales

### 3. Estimación Inteligente
- Sugiere qué productos comprar basado en:
  - Frecuencia histórica de compra
  - Cantidad promedio consumida
  - Variaciones estacionales
  - Consumo para 4 personas

### 4. Integración con Carrefour
- Sincroniza historial de compras online
- Importa automáticamente nuevas compras
- Combina con tickets manuales

## Cómo Usar

### Paso 1: Cargar SKILLs

Para procesar un ticket:
```
skill load grocery-ocr
```

Para ver recomendaciones:
```
skill load grocery-analyzer
```

Para sincronizar con Carrefour:
```
skill load carrefour-integration
```

### Paso 2: Registrar Compras

**Opción A: Con foto de ticket**
```
/process-ticket-image /ruta/a/ticket.jpg
```

**Opción B: Con historial de Carrefour**
```
/setup-carrefour
/sync-carrefour
```

### Paso 3: Obtener Recomendaciones

Ver análisis completo:
```
/analyze-purchases
```

Ver qué falta comprar:
```
/suggest-next-shopping
```

## Estructura de Datos (JSON)

```json
{
  "metadata": {
    "version": "1.0",
    "created": "ISO_DATE",
    "family_members": 4,
    "composition": "1 hombre, 1 mujer, 2 chicos",
    "last_updated": "ISO_DATE"
  },
  "purchases": [
    {
      "id": 1717594800000,
      "date": "ISO_DATE",
      "source": "ocr|carrefour|manual",
      "store": "Carrefour|Disco|etc",
      "items": [
        {
          "name": "Leche",
          "quantity": 2,
          "unit": "L",
          "price": 1.50
        }
      ],
      "total": 45.50,
      "raw_text": "..." // Texto extraído del OCR (si aplica)
    }
  ],
  "product_patterns": {
    "leche": {
      "name": "Leche",
      "purchases": [
        {
          "date": "ISO_DATE",
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
      "increase": 30,
      "notes": "Mayor consumo por calor"
    }
  },
  "carrefour_credentials": {
    "email": "xxx@example.com",
    "password": "encrypted",
    "last_sync": "ISO_DATE"
  }
}
```

## Algoritmo de Estimación

El sistema calcula automáticamente:

1. **Frecuencia**: Cada cuánto se compra cada producto
2. **Cantidad Promedio**: Cuánto se compra típicamente
3. **Intervalo Típico**: Días entre compras
4. **Umbral de Alerta**: 80% del intervalo típico
5. **Ajuste por Familia**: Multiplica por 4 (4 personas)

Cuando `días desde última compra ≥ intervalo × 0.8`, se sugiere compra.

## Flujo de Trabajo Recomendado

```
Semana 1-2: Registra 3-4 tickets
    ↓
Semana 3: Sistema identifica patrones
    ↓
Semana 4+: Recibe recomendaciones automáticas
    ↓
Continua: Actualiza con nuevos tickets
```

## Próximas Fases

- **Fase 2**: Crear SKILLs para realizar compras en plataformas
- **Fase 3**: Optimización de presupuesto
- **Fase 4**: Integración con más supermercados

## Notas Importantes

- El OCR mejora con fotos claras y bien iluminadas
- Los patrones se refinan con más datos históricos
- Todos los datos se almacenan localmente en JSON
- Las credenciales de Carrefour se encriptan

## Próximos Pasos

1. Prepara fotos de tickets recientes
2. Configura acceso a Carrefour (cuando esté listo)
3. Comienza a registrar compras regularmente
4. Recibe recomendaciones inteligentes

---

**Creado**: 2026-06-05  
**Última actualización**: 2026-06-05
