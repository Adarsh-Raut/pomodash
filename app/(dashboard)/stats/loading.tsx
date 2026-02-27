export default function StatsLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="skeleton h-9 w-36" />
        <div className="skeleton h-4 w-52 mt-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-5 gap-3">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-9 w-24" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
      <div className="card bg-base-100 shadow">
        <div className="card-body p-6 gap-4">
          <div className="skeleton h-5 w-40" />
          <div className="skeleton h-72 w-full rounded-xl" />
        </div>
      </div>
      <div className="card bg-base-100 shadow">
        <div className="card-body p-5 gap-3">
          <div className="skeleton h-5 w-36" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
