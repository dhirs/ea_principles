import { ChevronRight } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { asArray, asObject, asString } from "@/lib/principles/types"
import { markdownComponents } from "@/components/principles/markdownComponents"

// Semantic-version-style classifier the summaries lead with (e.g. "MINOR. …").
const TAG_STYLES: Record<string, string> = {
  MAJOR: "bg-red-500/15 text-red-600 dark:text-red-400",
  MINOR: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  PATCH: "bg-muted text-muted-foreground",
}

// Split a leading "MAJOR." / "MINOR." / "PATCH." classifier off the summary so
// it can be shown as a badge instead of buried in the prose.
function splitTag(summary: string): { tag: string | null; body: string } {
  const m = summary.match(/^(MAJOR|MINOR|PATCH)\.\s*/)
  if (!m) return { tag: null, body: summary }
  return { tag: m[1], body: summary.slice(m[0].length) }
}

function MetaLine({
  tag,
  version,
  date,
  author,
}: {
  tag: string | null
  version: string | undefined
  date: string | undefined
  author: string | undefined
}) {
  return (
    <span className="flex flex-1 items-center gap-2 text-xs font-mono text-muted-foreground">
      {tag && (
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${TAG_STYLES[tag] ?? "bg-muted text-muted-foreground"}`}
        >
          {tag}
        </span>
      )}
      {version && <span className="font-semibold text-foreground">v{version}</span>}
      {date && <span>{date}</span>}
      {author && <span>· {author}</span>}
    </span>
  )
}

function Body({ text }: { text: string }) {
  return (
    <div className="mt-2 text-sm leading-relaxed text-foreground/85 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {/* preserve single newlines as <br> — markdown would otherwise collapse them */}
        {text.replace(/\n/g, "  \n")}
      </ReactMarkdown>
    </div>
  )
}

export function ChangeHistorySection({ node }: { node: unknown }) {
  const o = asObject(node)
  if (!o) return null
  // Data is stored oldest-first; show newest version at the top.
  const changes = [...(asArray(o.changes) ?? [])].reverse()
  const current = asString(o.current_version)
  return (
    <div className="space-y-3">
      {current && (
        <div className="text-xs text-muted-foreground">
          Current version: <span className="font-mono text-foreground">v{current}</span>
        </div>
      )}
      {changes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No history recorded.</p>
      ) : (
        <ol className="space-y-2">
          {changes.map((raw, i) => {
            const c = asObject(raw)
            const version = asString(c?.version)
            const date = asString(c?.date)
            const author = asString(c?.author)
            const { tag, body } = splitTag(asString(c?.summary) ?? "")
            // Newest entry is expanded by default; older ones collapse so the
            // tab stays scannable instead of stacking walls of prose.
            if (i === 0) {
              return (
                <li key={i} className="border-l-2 border-primary/40 pl-3">
                  <MetaLine tag={tag} version={version} date={date} author={author} />
                  {body && <Body text={body} />}
                </li>
              )
            }
            return (
              <li key={i} className="border-l-2 border-muted pl-3">
                <details className="group">
                  <summary className="flex cursor-pointer list-none select-none items-center gap-1.5 [&::-webkit-details-marker]:hidden">
                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                    <MetaLine tag={tag} version={version} date={date} author={author} />
                  </summary>
                  {body && <Body text={body} />}
                </details>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
