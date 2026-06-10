# GUÍA RÁPIDA - Sistema de Seguimiento de Compras

## ✅ Lo que está listo

Tu workspace está completamente configurado con:

### SKILLs disponibles:
1. **grocery-ocr** - Procesa fotos de tickets
2. **grocery-analyzer** - Analiza compras y sugiere lo que falta
3. **carrefour-integration** - Sincroniza con Carrefour

### Archivos creados:
- `/data/grocery_history.json` - Base de datos de compras
- `handler.js` - Lógica del sistema
- `config.json` - Configuración
- `README.md` - Documentación completa

---

## 🚀 Próximos Pasos

### PASO 1: Cargar la primera SKILL
```
skill load grocery-ocr
```

### PASO 2: Adjunta una foto de ticket
Cuando tengas una foto de un ticket de compra, adjúntala y pide:
```
/process-ticket-image
```

El sistema:
- Extraerá el texto del ticket (OCR)
- Identificará productos, cantidades y precios
- Guardará todo en la base de datos JSON

### PASO 3: Después de 3-4 tickets
```
skill load grocery-analyzer
/suggest-next-shopping
```

El sistema te dirá qué productos comprar basado en patrones.

### PASO 4: Integrar Carrefour (opcional, cuando lo necesites)
```
skill load carrefour-integration
/setup-carrefour
```

Proporciona tus credenciales y luego:
```
/sync-carrefour
```

---

## 📋 Flujo Típico de Uso

```
Semana 1:
  1. Cargas foto de ticket 1
  2. Cargas foto de ticket 2
  
Semana 2:
  3. Cargas foto de ticket 3
  4. Cargas foto de ticket 4
  
Semana 3:
  5. Pides recomendaciones con /suggest-next-shopping
  6. Sistema sugiere qué comprar
```

---

## 🎯 Comandos Principales

**OCR:**
- `/process-ticket-image` - Procesa una foto de ticket

**Análisis:**
- `/analyze-purchases` - Resumen completo
- `/suggest-next-shopping` - Qué comprar ahora
- `/view-patterns` - Patrones detectados
- `/view-seasonal-trends` - Tendencias estacionales

**Carrefour:**
- `/setup-carrefour` - Configura acceso
- `/sync-carrefour` - Importa historial
- `/view-carrefour-history` - Ver historial importado

---

## 💡 Qué hace el Sistema

1. **Extrae datos** de fotos de tickets
2. **Identifica patrones**: qué compras regularmente
3. **Calcula frecuencia**: cada cuántos días compras cada cosa
4. **Detecta estacionalidad**: cambios según época
5. **Estima lo que falta**: sugiere cuándo y qué comprar
6. **Se aprende**: mejora con más datos

---

## 📊 Ejemplo de Estimación

Si compraste leche:
- Ticket 1 (hace 30 días): 2L
- Ticket 2 (hace 14 días): 2L
- Ticket 3 (hace 5 días): 2L

Sistema calcula:
- **Frecuencia**: ~7 días
- **Cantidad promedio**: 2L
- **Siguiente compra sugerida**: Cuando pasen 5-6 días (80% de 7)

---

## ❓ ¿Dudas?

Lee `README.md` para documentación completa:
```
cat README.md
```

O pregunta: "Cómo uso..." y te explicaré paso a paso.

---

**¡Listo para empezar! Adjunta tu primer ticket cuando tengas. 📷**
