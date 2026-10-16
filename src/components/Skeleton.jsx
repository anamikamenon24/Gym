// Glass-style shimmering placeholders shown while data loads.
export function Skeleton({ className = '', ...props }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden="true" {...props} />
}

export function CardSkeleton({ className = '', lines = 3 }) {
  return (
    <div className={`glass p-5 ${className}`} aria-busy="true">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-7 w-2/3" />
      {Array.from({ length: lines - 1 }, (_, i) => (
        <Skeleton key={i} className="mt-3 h-4" style={{ width: `${80 - i * 15}%` }} />
      ))}
    </div>
  )
}
