import { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "red" | "amber" | "slate";
}

const colors = {
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  green: "bg-green-50 text-green-600 border-green-100",
  red: "bg-red-50 text-red-600 border-red-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  slate: "bg-slate-50 text-slate-600 border-slate-100",
};

export default function StatCard({ title, value, icon: Icon, description, trend, color = "blue" }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={clsx("p-2 rounded-lg border", colors[color])}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <span className={clsx(
            "text-sm font-medium",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            {trend.isPositive ? "+" : "-"}{trend.value}%
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
    </div>
  );
}
