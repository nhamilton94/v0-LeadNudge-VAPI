export function ThemeTest() {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Theme Test</h2>
      <div className="flex gap-4">
        <div className="p-4 bg-primary text-primary-foreground rounded-md">Primary Background</div>
        <div className="p-4 border border-primary text-primary rounded-md">Primary Border & Text</div>
        <div className="p-4 ring-2 ring-primary rounded-md">Primary Ring</div>
      </div>
    </div>
  )
}
