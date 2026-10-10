export default function DashboardNotFound() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Page not found</h2>
        <p className="text-sm text-muted-foreground">
          This dashboard page does not exist.
        </p>
      </div>
    </div>
  );
}
