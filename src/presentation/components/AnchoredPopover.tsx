import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'

type AnchoredPopoverProps = {
  anchorRef: RefObject<HTMLElement | null>
  ariaLabel: string
  children: ReactNode
  className?: string
  onClose: () => void
}

const VIEWPORT_MARGIN = 8
const ANCHOR_GAP = 6
const PREFERRED_WIDTH = 272

function calculatePosition(anchor: HTMLElement | null): CSSProperties {
  const rect = anchor?.getBoundingClientRect()
  const viewport = window.visualViewport
  const viewportLeft = viewport?.offsetLeft ?? 0
  const viewportTop = viewport?.offsetTop ?? 0
  const viewportWidth = viewport?.width ?? window.innerWidth
  const viewportHeight = viewport?.height ?? window.innerHeight
  const width = Math.min(
    PREFERRED_WIDTH,
    Math.max(0, viewportWidth - VIEWPORT_MARGIN * 2),
  )
  const top = (rect?.bottom ?? viewportTop) + ANCHOR_GAP
  const preferredLeft = (rect?.right ?? viewportLeft + width) - width
  const left = Math.min(
    Math.max(preferredLeft, viewportLeft + VIEWPORT_MARGIN),
    viewportLeft + viewportWidth - width - VIEWPORT_MARGIN,
  )

  return {
    position: 'fixed',
    top,
    left,
    width,
    maxHeight: Math.max(
      96,
      viewportTop + viewportHeight - top - VIEWPORT_MARGIN,
    ),
    zIndex: 25,
  }
}

export function AnchoredPopover({
  anchorRef,
  ariaLabel,
  children,
  className,
  onClose,
}: AnchoredPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const [position, setPosition] = useState<CSSProperties>({
    position: 'fixed',
    visibility: 'hidden',
  })

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useLayoutEffect(() => {
    const updatePosition = () =>
      setPosition(calculatePosition(anchorRef.current))
    updatePosition()
    const viewport = window.visualViewport
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    viewport?.addEventListener('resize', updatePosition)
    viewport?.addEventListener('scroll', updatePosition)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      viewport?.removeEventListener('resize', updatePosition)
      viewport?.removeEventListener('scroll', updatePosition)
    }
  }, [anchorRef])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        panelRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      ) {
        return
      }
      onCloseRef.current()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      onCloseRef.current()
      anchorRef.current?.focus()
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [anchorRef])

  return createPortal(
    <div
      ref={panelRef}
      className={className}
      style={position}
      role="dialog"
      aria-label={ariaLabel}
    >
      {children}
    </div>,
    document.body,
  )
}
