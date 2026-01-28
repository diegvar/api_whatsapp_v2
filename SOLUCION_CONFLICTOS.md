# Solución de Conflictos en Git Pull

## Problema
Cuando intentas hacer `git pull` y hay cambios locales que entran en conflicto:

```
error: Your local changes to the following files would be overwritten by merge:
        dist/index.js
        dist/services/whatsapp.service.js
        package-lock.json
        package.json
Please commit your changes or stash them before you merge.
```

## Soluciones

### Opción 1: Guardar cambios locales (Stash) - Recomendado

Si quieres conservar los cambios locales por si acaso:

```bash
# Guardar cambios locales temporalmente
git stash

# Hacer pull
git pull origin main

# Ver qué cambios se guardaron (opcional)
git stash list

# Si necesitas recuperar los cambios guardados (generalmente NO es necesario)
# git stash pop
```

### Opción 2: Descartar cambios locales - Más Simple

Si los cambios locales no son importantes y quieres usar solo lo del repositorio:

```bash
# Descartar todos los cambios locales
git reset --hard HEAD

# Hacer pull
git pull origin main
```

### Opción 3: Forzar actualización desde remoto

Si estás seguro de que quieres sobrescribir todo con lo del remoto:

```bash
# Obtener cambios del remoto
git fetch origin

# Forzar reset al estado del remoto
git reset --hard origin/main
```

## Para el Caso Específico del Servidor

En producción, generalmente quieres usar **Opción 2** o **Opción 3** porque:

1. Los cambios del repositorio son la fuente de verdad
2. Los archivos compilados (`dist/`) se regeneran o vienen del repo
3. `package.json` y `package-lock.json` deben venir del repo

### Comando Recomendado para Servidor:

```bash
# Descartar cambios locales y actualizar desde remoto
git reset --hard HEAD
git pull origin main

# Reinstalar dependencias (por si cambió package.json)
npm install

# Reiniciar PM2
pm2 restart whatsapp-api
```

## Prevención de Conflictos

Para evitar esto en el futuro:

1. **No editar archivos directamente en el servidor** - Siempre editar en local y hacer push
2. **Usar .gitignore correctamente** - Asegurar que archivos generados no se trackeen
3. **Compilar en el servidor** - O incluir `dist/` en el repo de forma consistente

## Verificar Estado Antes de Pull

```bash
# Ver qué archivos tienen cambios
git status

# Ver diferencias (opcional)
git diff

# Luego decidir si hacer stash o reset
```
