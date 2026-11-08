import type {
  NamedResource,
  Pokemon,
  PokemonDetail,
  PokemonSearchResult,
  TypeResponse,
} from './types.js';

const BASE_URL = 'https://pokeapi.co/api/v2/';
const TIMEOUT_MS = 10000;
/** Los Pokémon con id mayor son formas alternativas (Mega, Gigamax, etc.) sin sprite propio. */
const MAX_POKEDEX_ID = 1025;

/** Error lanzado cuando el servidor responde con un código HTTP no exitoso. */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, statusText: string) {
    super(`HTTP ${status} ${statusText}`.trim());
    this.name = 'HttpError';
    this.status = status;
  }
}

/** Error lanzado cuando la solicitud supera el tiempo máximo de espera. */
export class TimeoutError extends Error {
  constructor() {
    super(`La solicitud superó los ${TIMEOUT_MS / 1000} segundos.`);
    this.name = 'TimeoutError';
  }
}

/** Error lanzado cuando el JSON recibido no tiene la forma esperada. */
export class InvalidDataError extends Error {
  constructor() {
    super('La respuesta del servidor no tiene el formato esperado.');
    this.name = 'InvalidDataError';
  }
}

// ---------- Validación de la forma del JSON (type guards) ----------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNamedResource(value: unknown): value is NamedResource {
  return isRecord(value) && typeof value['name'] === 'string' && typeof value['url'] === 'string';
}

function isTypeResponse(value: unknown): value is TypeResponse {
  if (!isRecord(value)) {
    return false;
  }
  const list = value['pokemon'];
  return Array.isArray(list) && list.every((entry) => isRecord(entry) && isNamedResource(entry['pokemon']));
}

function isPokemonDetail(value: unknown): value is PokemonDetail {
  if (!isRecord(value)) {
    return false;
  }
  const { id, name, height, weight, sprites, types, stats } = value;
  if (
    typeof id !== 'number' ||
    typeof name !== 'string' ||
    typeof height !== 'number' ||
    typeof weight !== 'number' ||
    !isRecord(sprites) ||
    !Array.isArray(types) ||
    !Array.isArray(stats)
  ) {
    return false;
  }
  const frontDefault = sprites['front_default'];
  return (
    (frontDefault === null || typeof frontDefault === 'string') &&
    types.every((entry) => isRecord(entry) && isNamedResource(entry['type'])) &&
    stats.every((entry) => isRecord(entry) && typeof entry['base_stat'] === 'number' && isNamedResource(entry['stat']))
  );
}

// ---------- Utilidades ----------

/** Extrae el id numérico de URLs como https://pokeapi.co/api/v2/pokemon/25/ */
function extractPokemonId(url: string): number | null {
  const match = /\/pokemon\/(\d+)\/?$/.exec(url);
  const idText = match?.[1];
  return idText === undefined ? null : Number(idText);
}

function isHttpsUrl(value: string | null): value is string {
  return value !== null && value.startsWith('https://');
}

function statValue(detail: PokemonDetail, statName: string): number {
  return detail.stats.find((entry) => entry.stat.name === statName)?.base_stat ?? 0;
}

function toPokemon(detail: PokemonDetail): Pokemon {
  const sprite = detail.sprites.front_default;
  return {
    id: detail.id,
    name: detail.name,
    heightM: detail.height / 10,
    weightKg: detail.weight / 10,
    sprite: isHttpsUrl(sprite) ? sprite : null,
    types: detail.types.map((entry) => entry.type.name),
    hp: statValue(detail, 'hp'),
    attack: statValue(detail, 'attack'),
    defense: statValue(detail, 'defense'),
  };
}

/** GET + comprobación de response.ok + JSON validado con un type guard. */
async function getJson<T>(path: string, signal: AbortSignal, guard: (value: unknown) => value is T): Promise<T> {
  const response = await fetch(new URL(path, BASE_URL), {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new HttpError(response.status, response.statusText);
  }

  const data: unknown = await response.json();
  if (!guard(data)) {
    throw new InvalidDataError();
  }
  return data;
}

/**
 * Busca Pokémon de un tipo, filtra por nombre y obtiene el detalle de los primeros `limit`.
 * Si `simulateError` es true, consulta un tipo inexistente para provocar un 404.
 */
export async function searchPokemon(
  typeName: string,
  nameFilter: string,
  limit: number,
  simulateError: boolean,
): Promise<PokemonSearchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const typePath = simulateError ? 'type/tipo-inexistente' : `type/${encodeURIComponent(typeName)}`;
    const typeData = await getJson(typePath, controller.signal, isTypeResponse);

    const needle = nameFilter.toLowerCase();
    const matches: { id: number; name: string }[] = [];
    for (const entry of typeData.pokemon) {
      const id = extractPokemonId(entry.pokemon.url);
      if (id !== null && id <= MAX_POKEDEX_ID && entry.pokemon.name.includes(needle)) {
        matches.push({ id, name: entry.pokemon.name });
      }
    }
    matches.sort((a, b) => a.id - b.id);

    const selected = matches.slice(0, limit);
    const details = await Promise.all(
      selected.map((item) => getJson(`pokemon/${item.id}`, controller.signal, isPokemonDetail)),
    );

    return { pokemon: details.map(toPokemon), totalMatches: matches.length };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new TimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
