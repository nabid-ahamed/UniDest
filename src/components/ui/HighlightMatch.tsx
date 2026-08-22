import { Fragment } from 'react'

/**
 * Renders `text` with every case-insensitive occurrence of `query` wrapped in a
 * subtle highlight. Shared by the search typeaheads (MultiSelect, AddTagDialog)
 * and the messenger contact search so the matched characters stand out.
 *
 * Purely presentational: it never changes `text` or which rows match, so the
 * upstream filtering, ranking and ordering are untouched. A blank query (or one
 * that is only whitespace) renders the text verbatim with no markup.
 */
export function HighlightMatch({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>

  // Escape regex metacharacters so a query like "c++" or "(hons)" is matched
  // literally rather than being interpreted as a pattern.
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Capturing group keeps the delimiters, so the split alternates between the
  // unmatched text and the matched slices (preserving the original casing).
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  const needle = q.toLowerCase()

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === needle ? (
          <mark key={i} className="rounded-[2px] bg-brand-100 font-semibold text-brand-700">
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}
