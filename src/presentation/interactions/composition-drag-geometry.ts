const AUTO_SCROLL_EDGE = 52
const AUTO_SCROLL_MAX_SPEED = 14
const VERTICAL_DROP_MARGIN = 40

export function findNearestCompositionGap(
  lane: HTMLElement | null,
  clientX: number,
): number | undefined {
  if (!lane) return undefined
  const points = lane.querySelectorAll<HTMLElement>('[data-composition-index]')
  let nearest: { index: number; distance: number } | undefined
  for (const point of points) {
    const index = Number(point.dataset.compositionIndex)
    if (!Number.isInteger(index)) continue
    const rectangle = point.getBoundingClientRect()
    const distance = Math.abs(clientX - (rectangle.left + rectangle.width / 2))
    if (!nearest || distance < nearest.distance) nearest = { index, distance }
  }
  return nearest?.index
}

export function calculateHorizontalAutoScroll(
  rectangle: Pick<DOMRect, 'left' | 'right' | 'width'>,
  clientX: number,
): number {
  const edge = Math.min(AUTO_SCROLL_EDGE, rectangle.width / 3)
  if (edge <= 0) return 0
  if (clientX < rectangle.left + edge) {
    const intensity = (rectangle.left + edge - clientX) / edge
    return -Math.ceil(AUTO_SCROLL_MAX_SPEED * Math.min(1, intensity))
  }
  if (clientX > rectangle.right - edge) {
    const intensity = (clientX - (rectangle.right - edge)) / edge
    return Math.ceil(AUTO_SCROLL_MAX_SPEED * Math.min(1, intensity))
  }
  return 0
}

export function isWithinVerticalDropZone(
  rectangle: Pick<DOMRect, 'top' | 'bottom'>,
  clientY: number,
): boolean {
  return (
    clientY >= rectangle.top - VERTICAL_DROP_MARGIN &&
    clientY <= rectangle.bottom + VERTICAL_DROP_MARGIN
  )
}
