# Carrefour Integration SKILL

Integración automática con Carrefour Argentina para sincronizar tu historial de compras y completar el carrito de forma inteligente.

## 🚀 Quick Start

### 1. Copiar archivo `.env`
```bash
cd /workspace/super/.opencode/skills/carrefour-integration
cp .env.example .env
```

### 2. Agregar credenciales
Edita `.env` con tus datos (usuario y contraseña de Carrefour):
```env
CARREFOUR_EMAIL=tu_email@gmail.com
CARREFOUR_PASSWORD=tu_contraseña_segura
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Autenticar
```bash
node cli.js setup
```

### 5. Sincronizar historial
```bash
node cli.js sync
```

### 6. Ver historial
```bash
node cli.js history
```

## 📦 Contenidos

```
├── SKILL.md              # Documentación oficial SKILL
├── README.md             # Este archivo
├── package.json          # Dependencias Node.js
├── .env.example          # Plantilla de configuración
├── auth.js               # Módulo de autenticación
├── history.js            # Módulo de historial de compras
├── cart.js               # Módulo de gestión de carrito
├── cli.js                # Interfaz de línea de comandos
└── .carrefour-data/      # Almacenamiento local (ignorado en Git)
    ├── cookies.json      # Sesión guardada
    └── history.json      # Historial sincronizado
```

## 🔐 Seguridad

**IMPORTANTE**: 
- El archivo `.env` contiene credenciales y **NUNCA debe commitirse** a Git
- Las cookies se guardan localmente en `.carrefour-data/` (también ignorado)
- No se comparten datos con terceros - todo se procesa localmente

## 🎯 Casos de Uso

### Caso 1: Sincronizar y analizar
```bash
node cli.js setup      # Una sola vez
node cli.js sync       # Obtener historial
node cli.js history    # Ver productos comprados
```

### Caso 2: Llenar carrito automáticamente
```javascript
const { CarrefourCart } = require('./cli');

const cart = new CarrefourCart(cookies);
await cart.addSuggestedProducts([
  { name: 'Leche descremada 1L', suggestedQuantity: 2 },
  { name: 'Pan blanco', suggestedQuantity: 1 },
  { name: 'Aceite de oliva', suggestedQuantity: 1 }
]);
```

### Caso 3: Buscar producto y agregar
```javascript
const cart = new CarrefourCart(cookies);

const product = await cart.searchProduct('Leche');
if (product) {
  await cart.addToCart(product.sku, 2);
}
```

## 📊 Datos Extraídos

### Del historial de compras:
- ID de orden
- Fecha de compra
- Monto total
- Estado de entrega
- **Productos**:
  - Nombre
  - SKU
  - Cantidad
  - Precio unitario
  - Precio total
  - Categoría

### Análisis de productos:
- Frecuencia de compra
- Cantidad promedio comprada
- Rango de precios
- Evolución temporal

## 🛠️ Integración con Grocery System

El SKILL se integra automáticamente con:

1. **grocery-analyzer**: Proporciona datos de productos para análisis de patrones
2. **grocery-ocr**: Complementa con datos de tickets físicos
3. **handler.js**: Sincroniza con la base de datos local

## 📝 Comandos CLI

```bash
# Autenticación (primera vez)
node cli.js setup

# Sincronizar historial
node cli.js sync

# Ver historial guardado
node cli.js history

# Estado de última sincronización
node cli.js status

# Agregar productos al carrito
node cli.js add-cart '{"name":"Leche","qty":2}'
```

## ⚙️ Configuración Avanzada

### Variables de entorno
```env
# Usuario Carrefour
CARREFOUR_EMAIL=tu_email@gmail.com
CARREFOUR_PASSWORD=tu_contraseña

# Opcional: Token de API (si Carrefour proporciona)
CARREFOUR_API_TOKEN=

# Configuración de conexión
CARREFOUR_BASE_URL=https://www.carrefour.com.ar
CARREFOUR_AUTH_MODE=web
CARREFOUR_TIMEOUT=30000
```

## 🚨 Troubleshooting

### "Cannot find module 'puppeteer'"
```bash
cd /workspace/super/.opencode/skills/carrefour-integration
npm install
```

### "Credenciales inválidas"
- Verifica que el email y contraseña sean correctos
- Intenta acceder manualmente a carrefour.com.ar
- Algunos navegadores pueden bloquear - intenta en incógnito

### "Timeout esperando elemento"
La estructura de Carrefour puede haber cambiado. Aumenta el timeout:
```env
CARREFOUR_TIMEOUT=60000
```

### "No se encuentra el historial de compras"
- Verifica tener órdenes en tu cuenta
- Algunos productos pueden no extraerse si la página cambió
- Revisa los logs para más detalles

## 📈 Próximas Mejoras

- [ ] Soporte para múltiples supermercados
- [ ] Dashboard web
- [ ] Notificaciones de cambios de precio
- [ ] Exportar datos a CSV
- [ ] API REST para acceso remoto
- [ ] Caché inteligente para optimizar sincronizaciones

## 📞 Soporte

Para reportar problemas:
1. Verifica que `.env` esté configurado correctamente
2. Revisa los logs de ejecución
3. Abre un issue en GitHub con los detalles

## 📄 Licencia

MIT License - Libre para usar y modificar

---

**Nota**: Este proyecto es unofficial y no está afiliado con Carrefour Argentina.
