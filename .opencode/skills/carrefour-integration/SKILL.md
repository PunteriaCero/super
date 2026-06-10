---
name: carrefour-integration
description: Integración con Carrefour Argentina - Sincroniza historial de compras y completa carrito automáticamente
license: MIT
compatibility: opencode
metadata:
  version: "2.0"
  category: grocery-tracking
  platform: carrefour-argentina
  auth_method: puppeteer_web_automation
  supports:
    - purchase_history_sync
    - cart_population
    - product_search
    - automated_checkout
---

## What I do

- ✅ Se conecta a tu cuenta de Carrefour Argentina
- ✅ Descarga el historial completo de compras online
- ✅ Extrae productos, cantidades, fechas, precios y categorías
- ✅ Identifica productos únicos y patrones de compra
- ✅ Busca productos en Carrefour por nombre
- ✅ Agrega productos automáticamente al carrito
- ✅ Completa carrito con sugerencias inteligentes
- ✅ Sincroniza datos con el sistema de análisis de patrones

## When to use me

Carga esta SKILL cuando necesites:
- Configurar acceso a tu cuenta de Carrefour
- Sincronizar historial de compras (órdenes, productos, precios)
- Obtener lista de productos que compras habitualmente
- Llenar automáticamente el carrito con sugerencias
- Ver datos históricos de tus compras en Carrefour
- Integrar Carrefour con el sistema de recomendaciones

## Instalación Rápida

### 1. Copia las credenciales a `.env`

```bash
cd /workspace/super/.opencode/skills/carrefour-integration
cp .env.example .env
```

Edita `.env` con tus credenciales:
```
CARREFOUR_EMAIL=tu_email@ejemplo.com
CARREFOUR_PASSWORD=tu_contraseña_segura
```

### 2. Instala dependencias

```bash
npm install
```

Requiere:
- **Node.js** >= 14.0.0
- **puppeteer** (para automatización de navegador) - se instala automáticamente
- **axios** (para llamadas HTTP)
- **dotenv** (para variables de entorno)

## Como usar

### Opción A: Desde CLI

```bash
# Configurar credenciales y autenticarse
node cli.js setup

# Sincronizar historial de compras
node cli.js sync

# Ver historial sincronizado
node cli.js history

# Ver última sincronización
node cli.js status

# Agregar productos al carrito
node cli.js add-cart '[{"name":"Leche","suggestedQuantity":2}]'
```

### Opción B: Desde Node.js

```javascript
const { CarrefourAuth, CarrefourHistory, CarrefourCart } = require('./cli');

// Autenticación
const auth = new CarrefourAuth({
  email: 'tu_email@gmail.com',
  password: 'tu_contraseña'
});
const result = await auth.authenticate();

// Obtener historial
const history = new CarrefourHistory(auth.getCookies());
const orders = await history.fetchPurchaseHistory();

// Agregar al carrito
const cart = new CarrefourCart(auth.getCookies());
await cart.addSuggestedProducts([
  { name: 'Leche', suggestedQuantity: 2 },
  { name: 'Pan', suggestedQuantity: 1 }
]);
```

## Módulos Disponibles

### CarrefourAuth (auth.js)
Maneja autenticación con Carrefour usando Puppeteer.
- `authenticate()` - Realiza login y obtiene sesión
- `validateCredentials()` - Verifica credenciales configuradas
- `saveCookies(filePath)` - Guarda cookies para reutilizar
- `loadCookies(filePath)` - Carga cookies guardadas

### CarrefourHistory (history.js)
Extrae datos de compras del historial.
- `fetchPurchaseHistory()` - Obtiene todas las órdenes con detalles
- `extractOrders()` - Extrae lista básica de órdenes
- `enrichOrderDetails(orders)` - Agrega detalles de productos
- `getUniqueProducts(orders)` - Lista productos únicos con estadísticas
- `filterByDate(orders, from, to)` - Filtra por rango de fechas

### CarrefourCart (cart.js)
Gestiona el carrito y agrega productos.
- `searchProduct(name)` - Busca producto por nombre
- `addToCart(sku, quantity)` - Agrega producto al carrito
- `addSuggestedProducts(array)` - Agrega múltiples sugerencias
- `getCartContents()` - Obtiene contenido actual del carrito
- `clearCart()` - Vacía el carrito

## Variables de Entorno

Crea un archivo `.env` en la carpeta de la SKILL:

```env
# Requeridas
CARREFOUR_EMAIL=tu_email@gmail.com
CARREFOUR_PASSWORD=tu_contraseña_segura

# Opcionales
CARREFOUR_API_TOKEN=
CARREFOUR_BASE_URL=https://www.carrefour.com.ar
CARREFOUR_AUTH_MODE=web
CARREFOUR_TIMEOUT=30000
```

## Seguridad y Privacidad

### ✅ Cómo protegemos tus datos

1. **Sin almacenamiento de contraseñas en texto**: Solo se usa para autenticación
2. **Cookies locales**: Se guardan en `.carrefour-data/` (ignorado en Git)
3. **Sin compartir datos**: Todo se procesa localmente
4. **Encriptación**: Considera agregar a tu sistema
5. **NUNCA commits `.env`**: Está en `.gitignore`

### ⚠️ Responsabilidades tuyas

- Mantén tu `.env` seguro (no lo compartas)
- Revisa regularmente qué productos se agregan al carrito
- Usa contraseña única para Carrefour si es posible
- Considera cambiar contraseña después de usar esta integración

## Flujo Completo de Ejemplo

```javascript
// 1. Autenticar
const auth = new CarrefourAuth();
await auth.authenticate();

// 2. Obtener historial
const history = new CarrefourHistory(auth.getCookies());
const orders = await history.fetchPurchaseHistory();

// 3. Analizar patrones (usar con grocery-analyzer)
const uniqueProducts = history.getUniqueProducts(orders);
console.log('Productos comprados:', uniqueProducts);

// 4. Obtener sugerencias del analizador
const suggestions = await analyzer.getSuggestions(uniqueProducts);

// 5. Llenar carrito automáticamente
const cart = new CarrefourCart(auth.getCookies());
await cart.addSuggestedProducts(suggestions);

// 6. Usuario revisa y completa compra en Carrefour
```

## Sincronización con grocery-analyzer

Esta SKILL se integra con `grocery-analyzer` para:

1. Obtener historial de Carrefour
2. Extraer productos y patrones
3. Generar sugerencias inteligentes
4. Agregar automáticamente al carrito

```javascript
// Desde handler.js
const { syncCarrefour } = require('./skills/carrefour-integration/cli');
const { analyzePatterns } = require('./skills/grocery-analyzer/analyzer');

const carrefourData = await syncCarrefour();
const suggestions = analyzePatterns(carrefourData);
await cart.addSuggestedProducts(suggestions);
```

## Solución de Problemas

### "Credenciales inválidas"
- Verifica usuario y contraseña en `.env`
- Asegúrate que la cuenta está activa en Carrefour
- Intenta acceder manualmente a carrefour.com.ar primero

### "No se puede obtener historial"
- Verifica que tengas órdenes en tu cuenta
- La página de Carrefour podría haber cambiado (selectores CSS)
- Aumenta `CARREFOUR_TIMEOUT` en `.env`

### "Productos no se agregan al carrito"
- El producto podría no existir en Carrefour actualmente
- Verifica disponibilidad en carrefour.com.ar
- La estructura del carrito podría haber cambiado

### Timeout o errores de conexión
- Aumenta `CARREFOUR_TIMEOUT` a 60000 (60 segundos)
- Verifica tu conexión a internet
- Intenta nuevamente después de unos minutos

## Notas Técnicas

- **Navegador automatizado**: Usa Puppeteer + headless Chrome
- **Sincronización**: Puede tomar 2-5 minutos dependiendo de historial
- **Límites**: Carrefour no tiene límite público de solicitudes
- **Frecuencia**: Puedes sincronizar tan seguido como quieras
- **Historial completo**: Se descarga de más antiguo a más reciente

## Roadmap Futuro

- [ ] Soporte para múltiples cuentas de Carrefour
- [ ] Historial de precios y tracking de cambios
- [ ] Notificaciones de descuentos en productos habituales
- [ ] Integración con otros supermercados (Disco, Jumbo, etc.)
- [ ] Exportar historial a CSV/Excel
- [ ] API REST para acceso remoto
- [ ] Dashboard web con visualización de datos

## Licencia y Uso

MIT License - Libre para usar, modificar y distribuir

**Nota**: Este proyecto es unofficial y no está afiliado con Carrefour Argentina. Úsalo responsablemente y respeta los términos de servicio de Carrefour.
