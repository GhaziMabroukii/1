import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingIconProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingIcon({ className, size = "md" }: LoadingIconProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  return (
    <Loader2 
      className={cn("animate-spin", sizeClasses[size], className)} 
      aria-hidden="true"
    />
  );
}