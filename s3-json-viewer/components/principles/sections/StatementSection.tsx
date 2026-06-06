import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { asObject, asString } from "@/lib/principles/types"
import { markdownComponents } from "@/components/principles/markdownComponents"

export function StatementSection({ node }: { node: unknown }) {
  const description = asString(asObject(node)?.description)
  if (!description) return null
  return (
    <div className="text-base leading-relaxed text-foreground/90 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {description}
      </ReactMarkdown>
    </div>
  )
}
