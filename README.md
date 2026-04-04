# MisFinanzas 📈

<p align="center">
  <em>Una aplicación web estilo Premium Dark (Glassmorphism) para hacerle seguimiento a gastos diarios, fijos y tu calendario financiero.</em>
</p>

---

## 🚀 Arquitectura

El proyecto está dividido plenamente en dos entornos independientes:
- **`web/` (Frontend):** Angular 21 (Zoneless) usando Signals, Tailwind/SCSS puro, y un diseño enfocado en la experiencia e interfaces premium modernas.
- **`api/` (Backend):** NestJS conectado a **SQL Server** mediante TypeORM. Maneja seguridad vía JSON Web Tokens (JWT) y notificaciones de contraseña por email (Nodemailer).

---

## 🛠️ Requisitos Previos

Si vas a levantar este proyecto en tu máquina desde cero, asegúrate de tener:
- [Node.js](https://nodejs.org/es/) (Recomendado v18+).
- Instancia local de **SQL Server** corriendo.
- Una cuenta de correo (Gmail) con contraseña de aplicación, para simular el envío de correos.

---

## 🔌 Configuración y Puesta en Marcha

### 1. Clona el repositorio
```bash
git clone https://github.com/SoledadPf/MisFinanzas.git
cd MisFinanzas
```

### 2. Configuración del Backend (NestJS + SQL Server)
Instala las dependencias:
```bash
cd api
npm install
```

Crea tu archivo de variables de entorno copiando las credenciales necesarias:
```bash
# Crea un archivo ".env" en la carpeta "api/" con esta estructura:
DB_HOST=127.0.0.1
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=tu_contraseña_aqui
DB_DATABASE=MisFinanzasDB

JWT_SECRET=escribe_un_secreto_seguro_para_jwt
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

PORT=3000
FRONTEND_URL=http://localhost:4200

# Nodemailer Envío de Correos (Para tests, se usa Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email_de_prueba@gmail.com
SMTP_PASS="tu_contraseña_de_aplicacion"
```

Inicia el entorno del API:
```bash
npm run start:dev
```
> *Nota: Asegúrate de configurar manualmente la migración de tus tablas en tu SQL Server si TypeORM está ajustado en `synchronize: false`.*

---

### 3. Configuración del Frontend (Angular 21)
Abre otra terminal y navega hasta la carpeta del cliente:
```bash
cd web
npm install
```

Arranca el servidor web (Angular CLI en modo dev):
```bash
npm run start
# o
ng serve
```
El cliente cargará por defecto en: `http://localhost:4200`.

---

## 🎨 Características UI
- **Glassmorphism Theme**: Tableros traslucidos con desenfoque de fondo.
- **Renderizado Reactivo (Zoneless)**: Mejora del consumo de memoria implementando de principio a fin el `ChangeDetectorRef` y Signals de Angular 21+.
- **Validación de Correo**: Incluye flujos reales de recuperación al correo (OTP - PIN de 6 dígitos).

## 📄 Autor
Creado y mantenido por [@SoledadPf](https://github.com/SoledadPf).
