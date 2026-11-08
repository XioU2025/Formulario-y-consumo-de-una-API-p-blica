/** Recurso con nombre y URL, forma común en la PokéAPI. */
export interface NamedResource {
  readonly name: string;
  readonly url: string;
}

/** Respuesta de GET /type/{tipo} (solo los campos que usamos). */
export interface TypeResponse {
  readonly pokemon: readonly { readonly pokemon: NamedResource }[];
}

/** Respuesta de GET /pokemon/{id} (solo los campos que usamos). */
export interface PokemonDetail {
  readonly id: number;
  readonly name: string;
  readonly height: number; // decímetros
  readonly weight: number; // hectogramos
  readonly sprites: { readonly front_default: string | null };
  readonly types: readonly { readonly type: NamedResource }[];
  readonly stats: readonly { readonly base_stat: number; readonly stat: NamedResource }[];
}

/** Modelo de dominio listo para mostrar en la interfaz. */
export interface Pokemon {
  readonly id: number;
  readonly name: string;
  readonly heightM: number;
  readonly weightKg: number;
  readonly sprite: string | null;
  readonly types: readonly string[];
  readonly hp: number;
  readonly attack: number;
  readonly defense: number;
}

/** Resultado de una búsqueda ya filtrada y limitada. */
export interface PokemonSearchResult {
  readonly pokemon: readonly Pokemon[];
  readonly totalMatches: number;
}

/** Datos ya validados y tipados que se obtienen del formulario. */
export interface SearchParams {
  readonly typeName: string;
  readonly typeLabel: string;
  readonly limit: number;
  readonly nameFilter: string;
  readonly simulateError: boolean;
}

/** Estados posibles de la interfaz (unión discriminada). */
export type ViewState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | {
      readonly status: 'success';
      readonly pokemon: readonly Pokemon[];
      readonly totalMatches: number;
      readonly typeLabel: string;
    }
  | { readonly status: 'empty'; readonly message: string }
  | { readonly status: 'error'; readonly message: string };

/** Nombres en español de los tipos (la API los entrega en inglés). */
export const TYPE_LABELS: Readonly<Record<string, string>> = {
  normal: 'Normal',
  fire: 'Fuego',
  water: 'Agua',
  electric: 'Eléctrico',
  grass: 'Planta',
  ice: 'Hielo',
  fighting: 'Lucha',
  poison: 'Veneno',
  ground: 'Tierra',
  flying: 'Volador',
  psychic: 'Psíquico',
  bug: 'Bicho',
  rock: 'Roca',
  ghost: 'Fantasma',
  dragon: 'Dragón',
  dark: 'Siniestro',
  steel: 'Acero',
  fairy: 'Hada',
};
