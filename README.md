# Aula360

<p align="center">
  <img src="./assets/logo-aula360.png" alt="Logo Aula360" width="420"/>
</p>

## Descripción del proyecto

Aula360 es una aplicación móvil desarrollada para mejorar el seguimiento académico y la comunicación entre profesores y padres de familia.

La aplicación permite registrar notas, asistencia, actividades académicas, enviar notificaciones inmediatas y mantener un chat institucional dentro de la misma plataforma, evitando depender de medios externos como WhatsApp.

Este proyecto está orientado al fortalecimiento de la comunicación educativa y se relaciona con el ODS 4: Educación de calidad.

---

## Problema identificado

En muchas instituciones educativas, la comunicación entre profesores y padres de familia no siempre es inmediata ni organizada.

Cuando un estudiante falta, tiene una nota nueva, una actividad pendiente o una novedad académica, el padre de familia muchas veces se entera tarde o por medios informales.

Además, el uso de WhatsApp para temas académicos puede generar desorden, pérdida de información y falta de trazabilidad.

---

## Solución propuesta

Aula360 propone una aplicación móvil con dos roles principales:

- Profesor
- Padre de familia

El profesor puede registrar información académica del estudiante, y el padre puede consultarla desde su celular.

Además, la app permite recibir notificaciones push y comunicarse mediante un chat institucional.

---

## Funcionalidades principales

### Rol profesor

- Crear grados.
- Registrar materias.
- Registrar estudiantes.
- Registrar notas.
- Registrar asistencia.
- Registrar actividades académicas.
- Configurar horario de atención.
- Enviar mensajes por chat institucional.
- Generar notificaciones para los padres de familia.

### Rol padre de familia

- Crear cuenta como padre.
- Vincular estudiante mediante identificación.
- Consultar notas.
- Consultar asistencia.
- Consultar actividades académicas.
- Revisar notificaciones.
- Comunicarse con el profesor por chat institucional.

---

## Tecnologías utilizadas

- React Native
- Expo
- JavaScript
- Supabase
- Firebase Cloud Messaging
- Expo Notifications
- EAS Build
- GitHub

---

## Instalación del proyecto

Para clonar el repositorio:

```bash
git clone https://github.com/ejcc2806/aula360-mobile.git
```

Entrar a la carpeta del proyecto:

```bash
cd aula360-mobile
```

Instalar dependencias:

```bash
npm install
```

Ejecutar el proyecto en Expo:

```bash
npm start
```

---

## Variables de entorno

El proyecto utiliza variables de entorno para conectarse con Supabase.

Se debe crear un archivo `.env` con la siguiente estructura:

```env
EXPO_PUBLIC_SUPABASE_URL=TU_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
```

Importante: por seguridad, el archivo `.env` no debe subirse al repositorio.

---

## Generar APK

Para generar una APK de prueba usando EAS Build:

```bash
npx.cmd --yes eas-cli@latest build -p android --profile preview --clear-cache
```

---

## Estado del proyecto

El proyecto se encuentra en fase funcional.

Actualmente cuenta con:

- Registro de usuarios.
- Roles de profesor y padre de familia.
- Creación de grados.
- Registro de materias.
- Registro de estudiantes.
- Registro de notas.
- Registro de asistencia.
- Registro de actividades académicas.
- Historial de notificaciones.
- Notificaciones push en segundo plano.
- Chat institucional.
- Perfil de usuario.
- Configuración de cuenta.
- Diseño visual personalizado con identidad de Aula360.

---

## Objetivo del proyecto

Desarrollar e implementar Aula360 como una aplicación móvil para el seguimiento académico y la comunicación inmediata entre profesores y padres de familia.

La finalidad es fortalecer la comunicación educativa, mejorar el acceso a la información académica y permitir que los padres reciban alertas oportunas sobre el proceso académico de sus hijos.

---

## Relación con el ODS 4

Aula360 se relaciona con el Objetivo de Desarrollo Sostenible 4: Educación de calidad.

La aplicación busca apoyar los procesos educativos mediante herramientas digitales que faciliten la comunicación, el seguimiento académico y la participación de los padres de familia en la formación de los estudiantes.

---

## Equipo de trabajo

- Edwin Cortés
- Edison

---

## Universidad

Universidad CESMAG  
Ingeniería de Sistemas  
Proyecto interestructurante

---

## Autor

Desarrollado como proyecto académico para la Universidad CESMAG.
