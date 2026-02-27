export default function SettingsLoading() {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="skeleton h-9 w-28" />
      <div className="card bg-base-100 shadow">
        <div className="card-body gap-6">
          <div className="skeleton h-5 w-36" />
          <div className="grid grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-12 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card bg-base-100 shadow">
        <div className="card-body gap-4">
          <div className="skeleton h-5 w-24" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-10 w-full rounded-lg" />
          ))}
          <div className="space-y-2">
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-4 w-full rounded-full" />
          </div>
        </div>
      </div>
      <div className="skeleton h-12 w-full rounded-xl" />
    </div>
  );
}
