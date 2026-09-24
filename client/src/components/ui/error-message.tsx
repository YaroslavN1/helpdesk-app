function ErrorMessage({ error }: { error: string | null | undefined }) {
  if (!error) return
  return <div className="text-xs text-destructive">{error}</div>
}

export { ErrorMessage }
