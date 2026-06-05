import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { asArray, asObject, asString } from "@/lib/principles/types"
import { markdownComponents } from "@/components/principles/markdownComponents"

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
        <ol className="space-y-3">
          {changes.map((raw, i) => {
            const c = asObject(raw)
            const version = asString(c?.version)
            const date = asString(c?.date)
            const author = asString(c?.author)
            const summary = asString(c?.summary)
            return (
              <li key={i} className="text-sm border-l-2 border-muted pl-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  {version && <span className="font-semibold text-foreground">v{version}</span>}
                  {date && <span>{date}</span>}
                  {author && <span>· {author}</span>}
                </div>
                {summary && (
                  <div className="mt-1 text-foreground/85 leading-relaxed [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {/* preserve single newlines as <br> — markdown would otherwise collapse them */}
                      {summary.replace(/\n/g, "  \n")}
                    </ReactMarkdown>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
