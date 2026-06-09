"use client";

import { useEffect, useState } from "react";
import { Wallet, ArrowUpCircle, ArrowDownCircle, AlertCircle } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import api from "@/lib/api";
import { DashboardBucket } from "@/types";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";

export default function Dashboard() {
  const [data, setData] = useState<DashboardBucket[]>([]);
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

  const totalBalance = data.reduce((sum, item) => sum + item.balance.currentBalance, 0);
  const totalIncomeMonth = data.reduce((sum, item) => sum + item.thisMonth.credits, 0);
  const totalExpenseMonth = data.reduce((sum, item) => sum + item.thisMonth.debits, 0);
  const negativeBuckets = data.filter((item) => item.balance.currentBalance < 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((item) => (
          <div key={item.bucket._id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{item.bucket.name}</h4>
                <p className="text-sm text-slate-500">{item.bucket.description || "No description"}</p>
              </div>
              {item.balance.currentBalance < 0 && (
                <Badge variant="danger">Overspent</Badge>
              )}
            </div>
            
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight" style={{ color: item.balance.currentBalance >= 0 ? "#10b981" : "#ef4444" }}>
                {formatCurrency(item.balance.currentBalance)}
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">This Month Credits</p>
                <p className="text-sm font-semibold text-green-600 mt-1">+{formatCurrency(item.thisMonth.credits)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">This Month Debits</p>
                <p className="text-sm font-semibold text-red-600 mt-1">-{formatCurrency(item.thisMonth.debits)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
