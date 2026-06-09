import { clsx } from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "danger" | "warning" | "info" | "slate";
}

const variants = {
  success: "bg-green-100 text-green-700 border-green-200",
  danger: "bg-red-100 text-red-700 border-red-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function Badge({ children, variant = "slate" }: BadgeProps) {
  return (
    <span className={clsx(
      "px-2 py-0.5 rounded-full text-xs font-semibold border",
      variants[variant]
    )}>
      {children}
    </span>
  );
}
