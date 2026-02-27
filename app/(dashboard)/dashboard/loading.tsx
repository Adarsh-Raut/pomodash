export default function DashboardLoading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Timer skeleton */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body gap-6 py-8 items-center">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-8 w-24 rounded-full" />
              ))}
            </div>
            <div className="skeleton w-56 h-56 rounded-full" />
            <div className="skeleton h-14 w-48 rounded-xl" />
          </div>
        </div>
        {/* Task list skeleton */}
        <div className="card bg-base-100 shadow">
          <div className="card-body gap-4 p-5">
            <div className="skeleton h-5 w-20" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="card bg-base-100 shadow">
          <div className="card-body gap-4">
            <div className="skeleton h-5 w-16" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-12 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow">
          <div className="card-body gap-3">
            <div className="skeleton h-5 w-32" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
