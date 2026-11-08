# Guía de entrega (Canvas)

> Este archivo es solo de apoyo; puedes borrarlo antes de subir el repositorio.

## 1. Subir el repositorio a GitHub (público)

```bash
git init
git add .
git commit -m "Tarea: Pokédex con formulario y consumo de PokéAPI"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

Verifica que el repositorio esté en modo **Public**.

## 2. Guion del video (máximo 3 minutos)

| Tiempo | Qué mostrar |
| --- | --- |
| 0:00–0:20 | Presentarte y abrir la app en `http://localhost:3000` (estado inicial) |
| 0:20–0:50 | Validación: enviar sin elegir tipo, escribir `13` en cantidad y un símbolo como `$` en «Nombre contiene» |
| 0:50–1:30 | Abrir DevTools → pestaña **Network** (filtro Fetch/XHR), elegir «Fuego» y enviar; mostrar la solicitud `type/fire`, las solicitudes `pokemon/{id}`, el estado 200 y la pestaña **Response** (JSON) |
| 1:30–2:00 | Mostrar el estado «cargando» (opcional: *throttling* a «Slow 4G») y las tarjetas renderizadas |
| 2:00–2:25 | Estado vacío: escribir `zzzz` en «Nombre contiene» → «sin resultados» |
| 2:25–2:50 | Estado de error: marcar «Forzar error», enviar y mostrar el 404 en Network y el mensaje en pantalla |
| 2:50–3:00 | Mostrar brevemente `src/` y el README |

Sube el video a Google Drive → *Compartir* → **«Cualquier persona con el enlace» (Lector)** y comprueba el enlace en una ventana de incógnito. **Cronométralo: no debe pasar de 3:00.**

## 3. Contenido del PDF

1. Enlace al video (Drive).
2. Enlace al repositorio de GitHub.
3. Capturas: formulario (con y sin error de validación), tarjetas de resultados, estado vacío, estado de error y la solicitud HTTP en Network (pestañas *Headers* y *Response*).
