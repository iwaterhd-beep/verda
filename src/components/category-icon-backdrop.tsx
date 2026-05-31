import { cn } from "@/lib/utils";
import {
  categorySurfaceStyle,
  type CategoryDisplay,
} from "@/lib/product-categories";

export function CategoryIconBackdrop({
  display,
  className,
  children,
}: {
  display: CategoryDisplay;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn("grid place-items-center rounded-xl bg-gradient-to-br", className)}
      style={categorySurfaceStyle(display.color)}
    >
      {children}
    </span>
  );
}
