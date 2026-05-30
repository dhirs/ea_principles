import type { Components } from "react-markdown"

// Tailwind-styled element map for ReactMarkdown. The project has no
// @tailwindcss/typography plugin, so we style each element explicitly here.
export const markdownComponents: Components = {
  h1: (props) => <h1 className="mt-2 mb-4 text-2xl font-semibold" {...props} />,
  h2: (props) => <h2 className="mt-8 mb-3 text-xl font-semibold border-b pb-1" {...props} />,
  h3: (props) => <h3 className="mt-6 mb-2 text-lg font-semibold" {...props} />,
  h4: (props) => <h4 className="mt-4 mb-2 text-base font-semibold" {...props} />,
  p: (props) => <p className="my-3 leading-relaxed text-foreground/90" {...props} />,
  a: (props) => (
    <a
      className="text-primary underline underline-offset-4 hover:opacity-80"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  ul: (props) => <ul className="my-3 list-disc space-y-1.5 pl-6 text-foreground/90" {...props} />,
  ol: (props) => <ol className="my-3 list-decimal space-y-1.5 pl-6 text-foreground/90" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  blockquote: (props) => (
    <blockquote className="my-4 border-l-4 border-border pl-4 italic text-foreground/70" {...props} />
  ),
  hr: () => <hr className="my-6 border-border" />,
  code: ({ className, children, ...props }) => {
    const isBlock = /language-/.test(className ?? "")
    if (isBlock) {
      return (
        <code className={`${className ?? ""} font-mono text-sm`} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm" {...props}>
        {children}
      </code>
    )
  },
  pre: (props) => (
    <pre
      className="my-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm leading-relaxed"
      {...props}
    />
  ),
  table: (props) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props) => <th className="border border-border bg-muted px-3 py-2 text-left font-semibold" {...props} />,
  td: (props) => <td className="border border-border px-3 py-2 align-top" {...props} />,
  img: (props) => <img className="my-4 max-w-full rounded-lg" {...props} />,
}
