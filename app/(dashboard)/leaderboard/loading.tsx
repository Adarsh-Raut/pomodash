export default function LeaderboardLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <div className="skeleton h-9 w-44" />
        <div className="skeleton h-4 w-56 mt-2" />
      </div>
      <div className="card bg-base-100 shadow overflow-hidden">
        <div className="card-body p-0">
          <div className="px-6 py-3 border-b border-base-300">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-3 w-full" />
              ))}
            </div>
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-4 border-b border-base-200"
            >
              <div className="skeleton w-8 h-8 rounded-full shrink-0" />
              <div className="skeleton w-10 h-10 rounded-full shrink-0" />
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-4 w-12 ml-auto" />
              <div className="skeleton h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
