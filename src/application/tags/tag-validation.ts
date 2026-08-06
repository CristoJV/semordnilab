import {
  TAG_COLORS,
  TAG_ICONS,
  type TagColor,
  type TagIcon,
} from '@/application/dto/semordnilap-tag'

export const MAX_TAG_NAME_LENGTH = 40

export function cleanTagName(name: string): string {
  const cleaned = name.normalize('NFKC').trim().replace(/\s+/g, ' ')
  if (!cleaned) throw new Error('La etiqueta necesita un nombre.')
  if (cleaned.length > MAX_TAG_NAME_LENGTH) {
    throw new Error(
      `El nombre de la etiqueta no puede superar ${MAX_TAG_NAME_LENGTH} caracteres.`,
    )
  }
  return cleaned
}

export function normalizeTagName(name: string): string {
  return cleanTagName(name).toLocaleLowerCase('es-ES')
}

export function assertTagColor(color: string): asserts color is TagColor {
  if (!TAG_COLORS.includes(color as TagColor)) {
    throw new Error('El color de la etiqueta no está disponible.')
  }
}

export function assertTagIcon(icon: string): asserts icon is TagIcon {
  if (!TAG_ICONS.includes(icon as TagIcon)) {
    throw new Error('El icono de la etiqueta no está disponible.')
  }
}
