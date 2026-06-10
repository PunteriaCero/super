# Guía de Instalación y Troubleshooting

## ✅ Verificación Rápida

Para verificar que todo está listo, ejecuta:

```bash
cd /workspace/super
node test.js
```

Debería ver pruebas pasando en verde.

---

## 📦 Dependencias

### Obligatorias
- **Node.js** (≥12.0.0) - Para ejecutar los scripts

### Opcionales pero Recomendadas
- **Tesseract OCR** - Para procesar imágenes localmente (rápido)
- **Google Cloud SDK** - Fallback si Tesseract no está disponible

---

## 🔧 Instalación

### 1. Tesseract OCR (Recomendado)

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-spa
```

**macOS:**
```bash
brew install tesseract
```

**Windows:**
Descarga desde: https://github.com/UB-Mannheim/tesseract/wiki

Verifica que está instalado:
```bash
tesseract --version
```

### 2. Google Cloud Vision API (Fallback)

Si Tesseract no está disponible, el sistema intenta usar Google Vision API.

**Setup:**
```bash
# Instala Google Cloud SDK
# En Ubuntu/Debian:
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Configura autenticación
gcloud auth application-default login
```

**Instala la librería de Python:**
```bash
pip install google-cloud-vision
```

---

## 🚀 Primeros Pasos

### 1. Prepara la SKILL
```bash
skill load grocery-ocr
```

### 2. Adjunta una imagen de ticket

Copia una foto de ticket a una ubicación accesible, luego:

```bash
/process-ticket-image /ruta/a/ticket.jpg
```

### 3. El sistema debería:
- ✅ Extraer el texto con OCR
- ✅ Parsear productos y precios
- ✅ Guardar en la BD
- ✅ Mostrar un resumen

---

## ❌ Troubleshooting

### Error: "OCR falló"

**Problema:** Tesseract no está instalado y Vision API no está disponible

**Solución:**
1. Instala Tesseract (ver arriba)
2. O configura Google Cloud SDK + Vision API

```bash
# Verifica que tesseract está en el PATH
which tesseract

# Si no está, agrégalo:
export PATH=$PATH:/usr/bin
```

### Error: "Imagen no encontrada"

**Problema:** La ruta de la imagen es incorrecta

**Solución:**
```bash
# Usa rutas absolutas
/process-ticket-image /workspace/super/tickets/ticket.jpg

# O rutas relativas desde /workspace/super
/process-ticket-image ./tickets/ticket.jpg

# Verifica que el archivo existe
ls -la ./tickets/
```

### Error: "No se encontraron productos"

**Problema:** El OCR no leyó bien la imagen

**Solución:**
- Asegúrate que la imagen está clara y bien iluminada
- Evita ángulos, sombras o dobleces
- Intenta con otra foto del ticket

### Error: "Parser falló"

**Problema:** El formato del ticket no se parsea

**Solución:**
- Algunos formatos de tickets pueden no ser estándar
- Incluye el texto completo del ticket en el reporte

---

## 🧪 Pruebas Manual

### Test 1: Procesar imagen de prueba
```bash
# Copia una imagen a ./tickets/
cp ~/ticket.jpg ./tickets/test_ticket.jpg

# Procesa
/process-ticket-image ./tickets/test_ticket.jpg

# Verifica que se guardó
node -e "
const h = require('./handler');
const hist = h.loadHistory();
console.log('Compras:', hist.purchases.length);
console.log('Última:', hist.purchases[hist.purchases.length-1]);
"
```

### Test 2: Verificar patrones
```bash
/analyze-purchases
```

### Test 3: Obtener sugerencias
```bash
/suggest-shopping
```

---

## 📊 Archivos Generados

Después de procesar tickets:

```
/workspace/super/
├── data/
│   └── grocery_history.json    # BD con todas las compras
├── tickets/                     # Carpeta para guardar fotos
└── .setup.json                  # Configuración del setup
```

### Estructura de grocery_history.json

```json
{
  "purchases": [
    {
      "id": 1717594800000,
      "date": "2024-06-05",
      "store": "Carrefour",
      "items": [
        {
          "name": "Leche",
          "quantity": 2,
          "price": 1.50,
          "category": "dairy"
        }
      ],
      "total": 25.50
    }
  ],
  "product_patterns": {
    "leche": {
      "purchases": [...],
      "avg_quantity": 2,
      "frequency_days": 7
    }
  }
}
```

---

## 🔍 Debug Mode

Para ver más detalles de lo que está pasando:

```bash
# Set debug mode
export DEBUG=grocery:*

# Procesa con debug
/process-ticket-image ./tickets/ticket.jpg
```

---

## 📞 Soporte

Si tienes problemas:

1. Ejecuta las pruebas: `node test.js`
2. Verifica dependencias: `tesseract --version`
3. Revisa los logs en `data/grocery_history.json`
4. Prueba con otra imagen de ticket

---

## ✨ Comandos Útiles

```bash
# Ver historial completo
/history

# Limpiar datos (CUIDADO!)
/reset

# Ver resumen
/summary

# Ver ayuda
/help
```

---

**Última actualización:** 2024-06-05
