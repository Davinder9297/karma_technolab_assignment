import { clsx } from "clsx";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  light?: boolean;
}

export default function Spinner({ size = "md", className, light = false }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div
      className={clsx(
        "animate-spin rounded-full border-t-transparent",
        light ? "border-white" : "border-blue-600",
        sizeClasses[size],
        className
      )}
    />
  );
}
