# Solución de Autenticación de Git/GitHub

## Problema
```
remote: Permission to diegvar/api_whatsapp_v2.git denied to wwdiegovarela.
fatal: unable to access 'https://github.com/diegvar/api_whatsapp_v2.git/': The requested URL returned error: 403
```

Esto significa que estás autenticado con el usuario `wwdiegovarela` pero el repositorio pertenece a `diegvar`.

## Soluciones

### Opción 1: Usar Token de Acceso Personal (PAT) - Recomendado

#### Paso 1: Crear un Token en GitHub

1. Ve a GitHub: https://github.com/settings/tokens
2. Click en "Generate new token" → "Generate new token (classic)"
3. Configura el token:
   - **Note**: "API WhatsApp v2" (o el nombre que prefieras)
   - **Expiration**: Elige una fecha (90 días, 1 año, o sin expiración)
   - **Scopes**: Marca al menos:
     - ✅ `repo` (acceso completo a repositorios)
4. Click en "Generate token"
5. **IMPORTANTE**: Copia el token inmediatamente (solo se muestra una vez)

#### Paso 2: Configurar el Token en Git

**En Windows (PowerShell o CMD):**

```bash
# Verificar configuración actual
git config --global user.name
git config --global user.email

# Configurar usuario (si no está configurado)
git config --global user.name "diegvar"
git config --global user.email "tu-email@ejemplo.com"

# Limpiar credenciales guardadas
git credential-manager-core erase
# O si usas Windows Credential Manager:
cmdkey /list
# Busca "git:https://github.com" y elimínalo con:
cmdkey /delete:git:https://github.com
```

**Luego, al hacer push, Git te pedirá credenciales:**
- **Username**: `diegvar` (o tu usuario de GitHub)
- **Password**: Pega el **token** que creaste (NO tu contraseña)

#### Paso 3: Guardar el Token de Forma Segura

**Opción A: Usar Git Credential Manager (Recomendado)**

```bash
# Configurar para usar credential manager
git config --global credential.helper manager-core

# Al hacer push, ingresar:
# Username: diegvar
# Password: [tu-token]
```

**Opción B: Guardar en URL (Menos Seguro pero Más Fácil)**

```bash
# Cambiar la URL del remoto para incluir el token
git remote set-url origin https://[TU_TOKEN]@github.com/diegvar/api_whatsapp_v2.git

# O mejor, usar el usuario:
git remote set-url origin https://diegvar@github.com/diegvar/api_whatsapp_v2.git
# Luego al hacer push, solo pedirá el token como contraseña
```

**⚠️ ADVERTENCIA**: Si guardas el token en la URL, no lo subas al repositorio. Usa variables de entorno o un archivo local.

### Opción 2: Usar SSH (Más Seguro a Largo Plazo)

#### Paso 1: Generar Clave SSH

```bash
# Generar nueva clave SSH
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"

# Presionar Enter para usar la ubicación por defecto
# Opcional: Agregar passphrase para más seguridad

# Ver la clave pública
cat ~/.ssh/id_ed25519.pub
# O en Windows:
type C:\Users\TuUsuario\.ssh\id_ed25519.pub
```

#### Paso 2: Agregar Clave SSH a GitHub

1. Copia el contenido de la clave pública (todo el texto)
2. Ve a GitHub: https://github.com/settings/keys
3. Click en "New SSH key"
4. **Title**: "Mi PC" (o el nombre que prefieras)
5. **Key**: Pega la clave pública
6. Click en "Add SSH key"

#### Paso 3: Cambiar URL del Repositorio a SSH

```bash
# Ver URL actual
git remote -v

# Cambiar a SSH
git remote set-url origin git@github.com:diegvar/api_whatsapp_v2.git

# Verificar
git remote -v
```

#### Paso 4: Probar Conexión

```bash
# Probar conexión SSH
ssh -T git@github.com

# Deberías ver: "Hi diegvar! You've successfully authenticated..."
```

### Opción 3: Usar GitHub CLI (gh)

#### Instalar GitHub CLI

**Windows:**
```powershell
# Con Chocolatey
choco install gh

# O descargar desde: https://cli.github.com/
```

**Linux:**
```bash
sudo apt install gh
```

#### Autenticarse

```bash
# Iniciar sesión
gh auth login

# Seguir las instrucciones:
# 1. Elegir GitHub.com
# 2. Elegir HTTPS o SSH
# 3. Autenticarse en el navegador
```

## Verificar Configuración Actual

```bash
# Ver usuario configurado
git config --global user.name
git config --global user.email

# Ver URL del remoto
git remote -v

# Ver credenciales guardadas (Windows)
cmdkey /list | findstr git
```

## Solución Rápida (Token en URL - Temporal)

Si necesitas una solución rápida ahora mismo:

```bash
# 1. Crear token en GitHub (ver Opción 1, Paso 1)

# 2. Cambiar URL del remoto
git remote set-url origin https://[TU_TOKEN_AQUI]@github.com/diegvar/api_whatsapp_v2.git

# 3. Hacer push
git push origin main

# 4. Después, cambiar de vuelta a URL normal (sin token)
git remote set-url origin https://github.com/diegvar/api_whatsapp_v2.git
```

## Limpiar Credenciales Guardadas

**Windows:**
```bash
# Ver todas las credenciales
cmdkey /list

# Eliminar credenciales de Git
cmdkey /delete:git:https://github.com

# O usar Git Credential Manager
git credential-manager-core erase
```

**Linux/Mac:**
```bash
# Eliminar credenciales guardadas
git credential-cache exit
# O
rm ~/.git-credentials
```

## Verificar que Funciona

```bash
# Hacer push de prueba
git push origin main

# Si funciona, verás algo como:
# "Enumerating objects: X, done."
# "Writing objects: 100%..."
```

## Recomendación Final

**Para desarrollo local (Windows):**
- Usa **Git Credential Manager** con un **Token de Acceso Personal**
- Es seguro y fácil de usar
- Se integra bien con Windows

**Para servidores:**
- Usa **SSH keys** para mayor seguridad
- No requiere tokens que expiren
- Más fácil de mantener a largo plazo

## Troubleshooting

### Error: "fatal: could not read Username"
```bash
# Verificar URL del remoto
git remote -v

# Si es HTTPS, asegúrate de tener credenciales configuradas
git config --global credential.helper manager-core
```

### Error: "Permission denied (publickey)"
```bash
# Verificar que la clave SSH está agregada a GitHub
ssh -T git@github.com

# Si falla, verificar que la clave está en el agente SSH
ssh-add ~/.ssh/id_ed25519
```

### Error: "remote: Invalid username or password"
- Verifica que estás usando el **token** y no la contraseña
- Verifica que el token tiene permisos `repo`
- Verifica que el token no ha expirado
