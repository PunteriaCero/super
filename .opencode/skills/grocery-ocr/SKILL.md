---
name: grocery-ocr
description: Extrae texto de imágenes de tickets de compra usando OCR para análisis de compras en supermercado
license: MIT
compatibility: opencode
metadata:
  version: "1.0"
  category: grocery-tracking
  scripts:
    - ocr-processor.js
    - ticket-parser.js
    - processor.js
    - cli.js
---

## What I do

- Extrae texto de imágenes de tickets usando OCR (Tesseract o Google Vision API)
- Parsea automáticamente productos, cantidades y precios
- Identifica categorías de productos (lácteos, carnes, frutas, etc)
- Guarda automáticamente en la base de datos JSON
- Valida la calidad de los datos extraídos

## Scripts Incluidos

### ocr-processor.js
- Procesa imágenes con OCR
- Intenta Tesseract primero (rápido, local)
- Fallback a Google Vision API si es necesario
- Soporta JPG, PNG, PDF

### ticket-parser.js
- Extrae productos, cantidades, precios de texto OCR
- Identifica tienda, fecha, total automáticamente
- Categoriza productos por tipo
- Valida datos extraídos

### processor.js
- Pipeline completo OCR → Parser → Storage
- Integración con handler.js
- Genera reportes de procesamiento

### cli.js
- Interfaz de línea de comandos
- Maneja todos los comandos del sistema

## When to use me

Carga esta SKILL cuando necesites:
- Procesar una imagen de ticket de compra
- Extraer productos, cantidades y precios automáticamente
- Analizar patrones de compra
- Obtener sugerencias de qué comprar

## Comandos Disponibles

### Procesamiento
```
/process-ticket-image /ruta/a/ticket.jpg
```
- Procesa una imagen de ticket
- Extrae datos automáticamente
- Guarda en la BD

### Análisis
```
/suggest-shopping
```
- Sugiere qué comprar basado en patrones

```
/analyze-purchases
```
- Muestra análisis detallado de patrones

### Información
```
/view-purchase-history
/summary
/help
```

## Requisitos

- Imagen en formato JPG, PNG o PDF
- Buena iluminación y enfoque
- Máximo 5MB de tamaño
- Tesseract instalado (recomendado) O credenciales de Google Vision

## Flujo de Uso

1. **Primero**: Carga la SKILL
   ```
   skill load grocery-ocr
   ```

2. **Adjunta un ticket**: 
   ```
   /process-ticket-image ./tickets/ticket.jpg
   ```

3. **El sistema automáticamente**:
   - Extrae el texto con OCR
   - Parsea productos, cantidades, precios
   - Valida los datos
   - Guarda en la BD JSON
   - Actualiza patrones de consumo
   - Muestra un resumen

4. **Después de 3-4 tickets**:
   ```
   /suggest-shopping
   ```

## Ejemplo de Salida

```
📷 Procesando ticket: ticket.jpg
✅ OCR completado (método: tesseract)
✅ Parsing completado
   Productos encontrados: 8
   Total: $45.50
   Tienda: Carrefour
   Fecha: 2024-06-05

PRODUCTOS DETECTADOS:
   1. Leche
      • Cantidad: 2 un
      • Precio: $1.50
      • Categoría: dairy
   ...
```

## Notas Técnicas

- OCR soporta español e inglés
- Validación automática de datos
- Manejo de errores robusto
- Fallback automático entre métodos OCR
- Almacenamiento local (privado)
