// src/components/ui/Skeleton.tsx
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />;
}

// Timer card skeleton shown while settings load
export function TimerCardSkeleton() {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body items-center gap-8 py-10">
        <Skeleton className="h-10 w-64 rounded-full" />
        <Skeleton className="w-56 h-56 rounded-full" />
        <Skeleton className="h-14 w-48 rounded-full" />
      </div>
    </div>
  );
}
