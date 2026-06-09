"use client";

import { usePathname } from "next/navigation";

export default function TopBar() {
  const pathname = usePathname();
  
  const getTitle = () => {
    const path = pathname.split("/").pop();
    if (!path) return "Dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1).replace("-", " ");
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center px-8 justify-between sticky top-0 z-10">
      <h2 className="text-xl font-semibold text-slate-800">{getTitle()}</h2>
      <div className="flex items-center space-x-4">
        <div className="bg-slate-100 px-3 py-1 rounded-full text-sm font-medium text-slate-600 border border-slate-200">
          Demo User
        </div>
      </div>
    </header>
  );
}
