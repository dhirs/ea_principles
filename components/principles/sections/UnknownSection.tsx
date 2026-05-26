export function UnknownSection({ node }: { node: unknown }) {
  return (
    <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-96 font-mono">
      {JSON.stringify(node, null, 2)}
    </pre>
  )
}
