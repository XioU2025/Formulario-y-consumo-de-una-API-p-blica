import { HttpError, InvalidDataError, TimeoutError, searchPokemon } from './api.js';
import { TYPE_LABELS } from './types.js';
import type { SearchParams, ViewState } from './types.js';
import { getUiElements, render } from './ui.js';

const MAX_LIMIT = 12;

const elements = getUiElements();
let isLoading = false;

function setState(state: ViewState): void {
  isLoading = state.status === 'loading';
  render(elements, state);
}

function readSearchParams(form: HTMLFormElement): SearchParams | null {
  const formData = new FormData(form);

  const rawType = formData.get('type');
  const rawLimit = formData.get('limit');
  const rawName = formData.get('nameFilter');

  if (typeof rawType !== 'string' || typeof rawLimit !== 'string' || typeof rawName !== 'string') {
    return null;
  }

  const typeName = rawType.trim();
  if (!/^[a-z]+$/.test(typeName)) {
    return null;
  }

  const limit = Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return null;
  }

  return {
    typeName,
    typeLabel: TYPE_LABELS[typeName] ?? typeName,
    limit,
    nameFilter: rawName.trim().toLowerCase(),
    simulateError: formData.get('simulateError') !== null,
  };
}

function describeError(error: unknown): string {
  if (error instanceof HttpError) {
    return `La PokéAPI respondió con un error (${error.status}). Intenta nuevamente.`;
  }
  if (error instanceof TimeoutError) {
    return 'La solicitud tardó demasiado. Revisa tu conexión e intenta nuevamente.';
  }
  if (error instanceof InvalidDataError) {
    return error.message;
  }
  if (error instanceof TypeError) {
    return 'No se pudo conectar con la PokéAPI. Revisa tu conexión a internet.';
  }
  return 'Ocurrió un error inesperado. Intenta nuevamente.';
}

async function handleSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();

  // Evita solicitudes duplicadas mientras hay una operación en curso.
  if (isLoading) {
    return;
  }

  if (!elements.form.checkValidity()) {
    elements.form.reportValidity();
    return;
  }

  const params = readSearchParams(elements.form);
  if (params === null) {
    elements.form.reportValidity();
    return;
  }

  setState({ status: 'loading' });

  try {
    const result = await searchPokemon(params.typeName, params.nameFilter, params.limit, params.simulateError);

    if (result.pokemon.length === 0) {
      const detail = params.nameFilter === '' ? '' : ` que contenga «${params.nameFilter}»`;
      setState({
        status: 'empty',
        message: `No se encontró ningún Pokémon de tipo ${params.typeLabel}${detail}.`,
      });
      return;
    }

    setState({
      status: 'success',
      pokemon: result.pokemon,
      totalMatches: result.totalMatches,
      typeLabel: params.typeLabel,
    });
  } catch (error) {
    console.error('Error al consultar la API:', error);
    setState({ status: 'error', message: describeError(error) });
  }
}

elements.form.addEventListener('submit', (event) => {
  void handleSubmit(event);
});

elements.form.addEventListener('reset', () => {
  if (isLoading) {
    return;
  }
  setState({ status: 'idle' });
});

setState({ status: 'idle' });
