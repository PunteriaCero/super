# Configuración de Credenciales - Carrefour Integration

## ⚠️ SEGURIDAD CRÍTICA

**NUNCA** compartas este archivo o el contenido de `.env` públicamente.

## Pasos para configurar

### 1. Navega a la carpeta del SKILL
```bash
cd /workspace/super/.opencode/skills/carrefour-integration
```

### 2. Copia el archivo de ejemplo
```bash
cp .env.example .env
```

### 3. Edita `.env` con tus credenciales
```bash
nano .env
```
O con tu editor preferido (VS Code, Vi, etc.)

### 4. Reemplaza los valores
Actualiza las siguientes líneas con tus datos:

```env
# Tu email de Carrefour
CARREFOUR_EMAIL=garcianatalia11@gmail.com

# Tu contraseña
CARREFOUR_PASSWORD=M@canudo2012
```

### 5. Guarda y cierra el archivo
- **Nano**: Ctrl+O, Enter, Ctrl+X
- **Vi**: :wq

### 6. Verifica que `.env` está en `.gitignore`
```bash
grep .env .gitignore
```

Debería mostrar `.env` en la lista. Si no está, contacta al administrador.

### 7. Prueba la autenticación
```bash
npm install
node cli.js setup
```

Si ves "✅ Autenticación exitosa", ¡todo está listo!

## Lo que sucede después de autenticarse

1. **Se guardan las cookies automáticamente** en `.carrefour-data/cookies.json`
2. **La contraseña NO se guarda** en ningún lado (solo se usa para login)
3. **Las cookies expiran** después de 30 días aproximadamente
4. **Puedes sincronizar sin ingresar contraseña nuevamente**

## Sincronizar historial

Una vez autenticado, puedes sincronizar:
```bash
node cli.js sync
```

Esto descarga:
- Todas tus órdenes de Carrefour
- Productos de cada orden
- Precios y cantidades
- Fechas y estados

## Próximos pasos

1. **Ver historial**:
   ```bash
   node cli.js history
   ```

2. **Agregar al carrito automáticamente**:
   ```bash
   node cli.js add-cart '[{"name":"Leche","suggestedQuantity":2}]'
   ```

3. **Integración con el analizador**:
   El sistema analizará los patrones automáticamente

## ¿Qué hacer si olvidas la contraseña?

1. Restablecela en carrefour.com.ar
2. Actualiza el valor en `.env`
3. Ejecuta `node cli.js setup` nuevamente

## Seguridad

✅ **Protegido por:**
- `.env` está en `.gitignore` (no se sube a Git)
- Contraseña se usa solo para autenticación
- Cookies se guardan localmente
- Sin acceso a terceros

❌ **Riesgos a evitar:**
- No compartas el archivo `.env`
- No publiques `.env` en GitHub
- No ejecutes código no confiable con `.env` visible
- No guardes `.env` en sincronización en la nube

---

**¡Listo para comenzar!** 🚀
