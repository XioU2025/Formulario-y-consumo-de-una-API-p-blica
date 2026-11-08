# Pokédex (PokéAPI)

Aplicación de navegador hecha con **HTML + CSS + TypeScript** que captura datos mediante un formulario accesible, gestiona el evento `submit` con `FormData` y consume una API pública con `fetch` y `async/await`. Muestra los Pokémon encontrados como una lista de tarjetas creada dinámicamente en el DOM.

## API utilizada

**[PokéAPI](https://pokeapi.co/)** — API REST pública y gratuita sobre Pokémon, con CORS habilitado y sin clave.

- Documentación: <https://pokeapi.co/docs/v2>
- Endpoints usados:
  - `GET https://pokeapi.co/api/v2/type/{tipo}` → lista de Pokémon de un tipo (por ejemplo `type/fire`).
  - `GET https://pokeapi.co/api/v2/pokemon/{id}` → detalle de cada Pokémon mostrado (sprite, tipos, altura, peso y estadísticas).
- Imágenes: los sprites provienen de la URL que entrega la propia API (`sprites.front_default`).
- Modelos TypeScript (`src/types.ts`): `TypeResponse`, `PokemonDetail` (forma del JSON recibido) y `Pokemon` (modelo de dominio que se renderiza).

## Cómo ejecutar

Requisitos: [Node.js](https://nodejs.org/) 18 o superior.

```bash
npm install      # instala TypeScript
npm run build    # compila src/*.ts -> dist/*.js
npm start        # servidor local en http://localhost:3000
```

También se puede usar `npm run dev` (compila y levanta el servidor) o `npm run watch` (recompila al guardar). Para cambiar el puerto: `PORT=8080 npm start`.

> La carpeta `dist/` ya viene compilada, por lo que `npm start` funciona incluso sin ejecutar el build.

## Uso del formulario

| Campo | Validación nativa |
| --- | --- |
| Tipo de Pokémon | `<select>` con `required` (la opción vacía no es válida) |
| Cantidad a mostrar | `required`, `type="number"`, `min="1"`, `max="12"`, `step="1"` |
| Nombre contiene | opcional, `maxlength="20"`, `pattern` (letras, números y guiones) |
| Forzar error | casilla para provocar un 404 y demostrar el estado de error |

Al enviar, la app consulta el tipo elegido, filtra por nombre (si se escribió algo), ordena por número de Pokédex y pide el detalle de los primeros *N* Pokémon.

## Estados de interfaz implementados

| Estado | Cuándo ocurre | Qué se muestra |
| --- | --- | --- |
| **Inicial** | Al abrir la página o pulsar «Limpiar» | Mensaje de instrucciones, lista vacía |
| **Cargando** | Mientras las solicitudes `fetch` están en curso | Indicador giratorio + mensaje; botones deshabilitados |
| **Éxito** | La API devuelve Pokémon que cumplen el filtro | Resumen («Mostrando X de Y…») y tarjetas con sprite, número, nombre, tipos, medidas y estadísticas |
| **Sin resultados** | Ningún Pokémon del tipo coincide con el nombre buscado | Mensaje de aviso indicando los criterios usados |
| **Error** | `response.ok` es `false`, falla la red, hay *timeout* (10 s) o el JSON no tiene el formato esperado | Mensaje de error comprensible |

Después de un resultado o de un error se puede realizar una nueva consulta de inmediato.

## Decisiones técnicas

- **Formulario semántico y accesible:** `<label for>` en todos los controles, textos de ayuda enlazados con `aria-describedby`, `aria-live="polite"` en el área de estado, `aria-busy`, enlace «Saltar a los resultados», foco visible y `alt` en cada sprite.
- **Validación nativa + `FormData`:** el navegador valida con los atributos HTML; en `submit` se usa `checkValidity()` / `reportValidity()` y los valores se leen con `new FormData(form)` y se convierten a tipos estrictos (`SearchParams`).
- **`fetch` robusto:** `async/await`, `response.ok` se comprueba **antes** de leer el cuerpo, un `AbortController` común para el *timeout* y errores tipados (`HttpError`, `TimeoutError`, `InvalidDataError`). El detalle de los Pokémon se pide en paralelo con `Promise.all`.
- **TypeScript estricto:** `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, etc. El JSON se recibe como `unknown` y se valida con *type guards* (`isTypeResponse`, `isPokemonDetail`) antes de tratarlo como un tipo conocido.
- **Sin duplicados:** la variable `isLoading` ignora envíos mientras hay una operación activa y los botones se deshabilitan durante la carga.
- **Seguridad:** todos los datos externos se insertan con `textContent` (`createElement` + `append`); no se usa `innerHTML` en ninguna parte del código. La URL del sprite solo se acepta si empieza con `https://`.
- **Formas alternativas:** se descartan los Pokémon con número mayor a 1025 (Mega, Gigamax, etc.) para mostrar solo entradas de la Pokédex nacional.

## Estructura

```
.
├── index.html          # Estructura semántica
├── css/styles.css      # Estilos (responsive, modo oscuro, foco visible)
├── src/                # Código fuente TypeScript
│   ├── main.ts         # Eventos, FormData y flujo principal
│   ├── api.ts          # fetch, errores y validación de las respuestas
│   ├── ui.ts           # Renderizado de estados y tarjetas (textContent)
│   └── types.ts        # Modelos, tipos de estado y etiquetas de tipos
├── dist/               # JavaScript compilado (salida de tsc)
├── docs/GUIA_ENTREGA.md
├── server.mjs          # Servidor estático local sin dependencias
├── tsconfig.json
└── package.json
```