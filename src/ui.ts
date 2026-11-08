import { TYPE_LABELS } from './types.js';
import type { Pokemon, ViewState } from './types.js';

export interface UiElements {
  readonly form: HTMLFormElement;
  readonly submitButton: HTMLButtonElement;
  readonly resetButton: HTMLButtonElement;
  readonly status: HTMLElement;
  readonly results: HTMLUListElement;
  readonly resultsSection: HTMLElement;
}

function getElement<T extends HTMLElement>(id: string, type: new () => T): T {
  const element = document.getElementById(id);
  if (!(element instanceof type)) {
    throw new Error(`No se encontró el elemento #${id} con el tipo esperado.`);
  }
  return element;
}

export function getUiElements(): UiElements {
  return {
    form: getElement('search-form', HTMLFormElement),
    submitButton: getElement('submit-btn', HTMLButtonElement),
    resetButton: getElement('reset-btn', HTMLButtonElement),
    status: getElement('status', HTMLElement),
    results: getElement('results', HTMLUListElement),
    resultsSection: getElement('resultados', HTMLElement),
  };
}

function formatNumber(value: number): string {
  return value.toLocaleString('es', { maximumFractionDigits: 1 });
}

function createTextElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className !== undefined) {
    element.className = className;
  }
  return element;
}

/** Crea una tarjeta con textContent: los datos externos nunca se interpretan como HTML. */
function createPokemonCard(pokemon: Pokemon): HTMLLIElement {
  const item = document.createElement('li');
  item.className = 'pokemon-card';

  if (pokemon.sprite !== null) {
    const image = document.createElement('img');
    image.src = pokemon.sprite;
    image.alt = `Sprite de ${pokemon.name}`;
    image.width = 96;
    image.height = 96;
    image.loading = 'lazy';
    item.append(image);
  } else {
    item.append(createTextElement('div', 'Sin imagen', 'sprite-placeholder'));
  }

  const number = `#${String(pokemon.id).padStart(3, '0')}`;
  const badges = document.createElement('ul');
  badges.className = 'badges';
  badges.setAttribute('aria-label', 'Tipos');
  for (const typeName of pokemon.types) {
    badges.append(createTextElement('li', TYPE_LABELS[typeName] ?? typeName, `badge type-${typeName.replace(/[^a-z]/g, '')}`));
  }

  item.append(
    createTextElement('p', number, 'number'),
    createTextElement('h3', pokemon.name),
    badges,
    createTextElement('p', `Altura ${formatNumber(pokemon.heightM)} m · Peso ${formatNumber(pokemon.weightKg)} kg`, 'meta'),
    createTextElement('p', `PS ${pokemon.hp} · Ataque ${pokemon.attack} · Defensa ${pokemon.defense}`, 'meta'),
  );
  return item;
}

function setStatus(elements: UiElements, state: ViewState['status'], message: string, withSpinner = false): void {
  const { status } = elements;
  status.dataset['state'] = state;
  status.replaceChildren();

  if (withSpinner) {
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    spinner.setAttribute('aria-hidden', 'true');
    status.append(spinner);
  }

  status.append(createTextElement('span', message));
}

/** Pinta la interfaz según el estado actual. */
export function render(elements: UiElements, state: ViewState): void {
  const isLoading = state.status === 'loading';

  elements.results.replaceChildren();
  elements.submitButton.disabled = isLoading;
  elements.resetButton.disabled = isLoading;
  elements.form.setAttribute('aria-busy', String(isLoading));
  elements.resultsSection.setAttribute('aria-busy', String(isLoading));

  switch (state.status) {
    case 'idle':
      setStatus(elements, 'idle', 'Elige un tipo y pulsa «Buscar en la Pokédex» para ver resultados.');
      break;
    case 'loading':
      setStatus(elements, 'loading', 'Consultando la Pokédex…', true);
      break;
    case 'success':
      setStatus(
        elements,
        'success',
        `Mostrando ${state.pokemon.length} de ${state.totalMatches} Pokémon de tipo ${state.typeLabel}.`,
      );
      elements.results.append(...state.pokemon.map(createPokemonCard));
      break;
    case 'empty':
      setStatus(elements, 'empty', state.message);
      break;
    case 'error':
      setStatus(elements, 'error', state.message);
      break;
  }
}
