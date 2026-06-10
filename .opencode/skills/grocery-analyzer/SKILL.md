---
name: grocery-analyzer
description: Analiza historial de compras y estima productos faltantes considerando patrones de consumo, frecuencia y variaciones estacionales
license: MIT
compatibility: opencode
metadata:
  version: "1.0"
  category: grocery-tracking
---

## What I do

- Analiza el historial de compras almacenado
- Identifica patrones de consumo (frecuencia, cantidades)
- Detecta variaciones estacionales
- Estima qué productos pueden estar faltando
- Sugiere cantidad aproximada a comprar
- Aprende automáticamente de nuevas compras

## When to use me

Carga esta SKILL cuando necesites:
- Revisar el historial de compras actual
- Obtener recomendaciones de qué comprar
- Analizar patrones de consumo
- Actualizar preferencias y patrones

## Como usar

```
skill load grocery-analyzer
```

Comandos disponibles:

```
/analyze-purchases
```
Muestra un análisis completo del historial y patrones detectados

```
/suggest-next-shopping
```
Estima qué productos falta comprar según patrones

```
/view-patterns
```
Muestra los patrones de compra identificados

```
/view-seasonal-trends
```
Muestra tendencias estacionales detectadas

## Algoritmo de estimación

El analizador considera:

1. **Frecuencia**: Cada cuánto tiempo se compra cada producto
2. **Cantidad**: Cantidad promedio comprada
3. **Intervalos**: Días entre compras del mismo producto
4. **Estacionalidad**: Cambios según la época del año
5. **Familia**: 4 personas (consumo multiplicado)

## Notas

- Los datos se actualizan con cada nuevo ticket procesado
- El sistema mejora con más historiales disponibles
- Requiere al menos 3-4 tickets para hacer estimaciones precisas
