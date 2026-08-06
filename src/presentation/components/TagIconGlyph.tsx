import type { TagColor, TagIcon } from '@/application'

type TagIconGlyphProps = {
  icon: TagIcon
  color: TagColor
  className?: string
  title?: string
}

function IconPath({ icon }: { icon: TagIcon }) {
  switch (icon) {
    case 'star':
      return (
        <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
      )
    case 'heart':
      return (
        <path d="M20.4 5.7a5.2 5.2 0 0 0-7.4 0L12 6.8l-1.1-1.1a5.2 5.2 0 1 0-7.3 7.4L12 21l8.4-7.9a5.2 5.2 0 0 0 0-7.4Z" />
      )
    case 'bookmark':
      return (
        <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z" />
      )
    case 'flag':
      return <path d="M5 21V4m0 1h10l-1.5 3L15 11H5" />
    case 'sparkles':
      return (
        <>
          <path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3Z" />
          <path d="m18.5 14 1 2.5L22 17.5l-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5ZM5 13l.9 2.1L8 16l-2.1.9L5 19l-.9-2.1L2 16l2.1-.9L5 13Z" />
        </>
      )
    case 'lightbulb':
      return (
        <>
          <path d="M9 18h6m-5 3h4m3-8.5c0 2-1.2 3.3-2.4 4.5H9.4C8.2 15.8 7 14.5 7 12.5a5 5 0 1 1 10 0Z" />
        </>
      )
    case 'book':
      return (
        <>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
          <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
        </>
      )
    case 'person':
      return (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
        </>
      )
    case 'place':
      return (
        <>
          <path d="M20 10c0 5.5-8 11-8 11S4 15.5 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      )
    case 'language':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.2 2.5 3.4 5.5 3.4 9S14.2 18.5 12 21c-2.2-2.5-3.4-5.5-3.4-9S9.8 5.5 12 3Z" />
        </>
      )
    case 'puzzle':
      return (
        <path d="M19 13h-2.2a2.8 2.8 0 1 0-5.6 0H9V9H5a2 2 0 0 1-2-2V4h4a2.8 2.8 0 1 1 5.6 0H17a2 2 0 0 1 2 2v7Zm0 0v6a2 2 0 0 1-2 2h-6v-2.2a2.8 2.8 0 1 0-5.6 0H3V13h2.2" />
      )
    case 'tag':
      return (
        <>
          <path d="M20.5 13.5 13 21l-10-10V3h8l9.5 9.5a1.4 1.4 0 0 1 0 2Z" />
          <circle cx="7.5" cy="7.5" r="1.2" />
        </>
      )
  }
}

export function TagIconGlyph({
  icon,
  color,
  className,
  title,
}: TagIconGlyphProps) {
  return (
    <span
      className={className}
      data-color={color}
      title={title}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <IconPath icon={icon} />
      </svg>
    </span>
  )
}
