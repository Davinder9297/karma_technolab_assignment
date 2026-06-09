"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wallet, 
  PiggyBank, 
  Settings2, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  BookText, 
  RefreshCcw 
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Income Types", href: "/income-types", icon: Wallet },
  { name: "Buckets", href: "/buckets", icon: PiggyBank },
  { name: "Allocation Rules", href: "/allocation-rules", icon: Settings2 },
  { name: "Incomes", href: "/incomes", icon: ArrowUpCircle },
  { name: "Expenses", href: "/expenses", icon: ArrowDownCircle },
  { name: "Ledger", href: "/ledger", icon: BookText },
  { name: "Reconciliation", href: "/reconciliation", icon: RefreshCcw },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-slate-900 text-white min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-blue-400">Budget System</h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                isActive 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
