import { findNormalizedMatch } from './catalog-search'

type HighlightedTextProps = {
  text: string
  query: string
}

export function HighlightedText({ text, query }: HighlightedTextProps) {
  const match = findNormalizedMatch(text, query)
  if (!match) return text
  return (
    <>
      {text.slice(0, match.start)}
      <mark>{text.slice(match.start, match.end)}</mark>
      {text.slice(match.end)}
    </>
  )
}
