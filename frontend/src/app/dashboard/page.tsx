"use client";

import { useEffect, useState } from "react";
import { Wallet, ArrowUpCircle, ArrowDownCircle, AlertCircle, PiggyBank } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import api from "@/lib/api";
import { DashboardBucket, DashboardData } from "@/types";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/dashboard/buckets");
        setData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(paise / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const buckets = data?.buckets || [];
  const totalUnallocated = data?.totalUnallocated || 0;
  const totalBalance = buckets.reduce((sum, item) => sum + item.balance.currentBalance, 0);
  const totalIncomeMonth = buckets.reduce((sum, item) => sum + item.thisMonth.credits, 0);
  const totalExpenseMonth = buckets.reduce((sum, item) => sum + item.thisMonth.debits, 0);
  const negativeBuckets = buckets.filter((item) => item.balance.currentBalance < 0).length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard 
          title="Total Balance" 
          value={formatCurrency(totalBalance)} 
          icon={Wallet} 
          color="blue"
        />
        <StatCard 
          title="Income This Month" 
          value={formatCurrency(totalIncomeMonth)} 
          icon={ArrowUpCircle} 
          color="green"
        />
        <StatCard 
          title="Expenses This Month" 
          value={formatCurrency(totalExpenseMonth)} 
          icon={ArrowDownCircle} 
          color="red"
        />
        <StatCard 
          title="Negative Buckets" 
          value={negativeBuckets} 
          icon={AlertCircle} 
          color={negativeBuckets > 0 ? "red" : "slate"}
        />
        <StatCard 
          title="Unallocated Balance" 
          value={formatCurrency(totalUnallocated)} 
          icon={PiggyBank} 
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buckets.map((item) => (
          <div key={item.bucket._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-base">{item.bucket.name}</h4>
                <p className="text-xs text-slate-500">{item.bucket.description || "No description"}</p>
              </div>
              {item.balance.currentBalance < 0 && (
                <Badge variant="danger">Overspent</Badge>
              )}
            </div>
            
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight" style={{ color: item.balance.currentBalance >= 0 ? "#10b981" : "#ef4444" }}>
                {formatCurrency(item.balance.currentBalance)}
              </p>
            </div>

            <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">This Month Credits</p>
                <p className="text-xs font-semibold text-green-600 mt-1">+{formatCurrency(item.thisMonth.credits)}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">This Month Debits</p>
                <p className="text-xs font-semibold text-red-600 mt-1">-{formatCurrency(item.thisMonth.debits)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
