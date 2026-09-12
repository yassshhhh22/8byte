export function LoadingState() {
  return (
    <div className="space-y-5" aria-label="Loading portfolio data" role="status">
      <span className="sr-only">Loading portfolio data...</span>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-12">
        <div className="skeleton h-32 col-span-2 lg:col-span-5" />
        <div className="skeleton h-32 lg:col-span-2" />
        <div className="skeleton h-32 lg:col-span-3" />
        <div className="skeleton h-32 lg:col-span-2" />
      </div>
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="skeleton h-80 lg:col-span-4" />
        <div className="skeleton h-80 lg:col-span-5" />
        <div className="skeleton h-80 lg:col-span-3" />
      </div>
      <div className="skeleton h-96" />
    </div>
  );
}
