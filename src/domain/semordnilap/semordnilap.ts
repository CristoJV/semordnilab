import { InvalidSemordnilapError } from './errors'
import type {
  AtomicSemordnilap,
  CompositionSnapshot,
  DatasetId,
  Semordnilap,
  SemordnilapId,
  SemordnilapReference,
} from './types'

const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: 'grapheme',
})

export function reverseUnicode(value: string): string {
  return Array.from(graphemeSegmenter.segment(value), ({ segment }) => segment)
    .reverse()
    .join('')
}

export function validateAtomicSemordnilap(
  semordnilap: AtomicSemordnilap,
): void {
  if (!semordnilap.source.text.trim() || !semordnilap.target.text.trim()) {
    throw new InvalidSemordnilapError(
      'Las expresiones visibles no pueden estar vacías.',
    )
  }

  if (!semordnilap.source.normalized || !semordnilap.target.normalized) {
    throw new InvalidSemordnilapError(
      'Las expresiones normalizadas no pueden estar vacías.',
    )
  }

  if (
    semordnilap.source.normalized !==
    reverseUnicode(semordnilap.target.normalized)
  ) {
    throw new InvalidSemordnilapError(
      'Las expresiones normalizadas no forman un semordnilap.',
    )
  }
}

export function composeAtomicSemordnilaps(
  components: readonly AtomicSemordnilap[],
): CompositionSnapshot {
  return composeSemordnilaps(components)
}

export function composeSemordnilaps(
  components: readonly Semordnilap[],
): CompositionSnapshot {
  const source = components.map(({ source: expression }) => expression)
  const target = components
    .toReversed()
    .map(({ target: expression }) => expression)
  const sourceNormalized = source.map(({ normalized }) => normalized).join('')
  const targetNormalized = target.map(({ normalized }) => normalized).join('')

  return {
    source,
    target,
    sourceText: source.map(({ text }) => text).join(' '),
    targetText: target.map(({ text }) => text).join(' '),
    sourceNormalized,
    targetNormalized,
    isSemordnilap:
      components.length > 0 &&
      sourceNormalized === reverseUnicode(targetNormalized),
    isComposite: components.length >= 2,
  }
}

export function createStableSemordnilapId(
  kind: 'atomic' | 'composite',
  datasetId: DatasetId,
  identityParts: readonly string[],
): SemordnilapId {
  const input = [datasetId, ...identityParts].join('\u001f')
  let hash = 0xcbf29ce484222325n
  const prime = 0x100000001b3n

  for (const character of input) {
    hash ^= BigInt(character.codePointAt(0) ?? 0)
    hash = BigInt.asUintN(64, hash * prime)
  }

  return `${kind}:${datasetId}:${hash.toString(36)}`
}

export function toSemordnilapReference(
  semordnilap: Semordnilap,
): SemordnilapReference {
  return {
    kind: semordnilap.kind,
    datasetId: semordnilap.datasetId,
    semordnilapId: semordnilap.id,
  }
}
