import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 shadow-glow">
        <LeafMark className="h-5 w-5 text-primary-foreground" />
      </span>
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight">
          Verda<span className="text-primary">.</span>
        </span>
      )}
    </div>
  );
}

export function LeafMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 22c0-5 0-8 0-8m0 0c-3 0-6-2-6-6 0 0 4 0 6 3 0-3-1-6-3-9 3 1 5 4 5 7 0-3 2-5 5-6-1 4-2 7-5 8 2-2 5-2 7-2 0 4-3 5-6 5h-3Z"
        fill="currentColor"
        fillOpacity="0.95"
      />
    </svg>
  );
}
