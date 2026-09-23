function ErrorMessage({ error }: { error: string | null }) {
  if (!error) return
  return <div className="text-xs text-destructive">{error}</div>
}

export { ErrorMessage }
