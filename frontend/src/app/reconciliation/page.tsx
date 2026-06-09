"use client";

import { useEffect, useState } from "react";
import { RefreshCcw, Database, CheckCircle2, AlertCircle, History, ChevronDown, ChevronUp } from "lucide-react";
import api from "@/lib/api";
import { DEFAULT_PAGE_LIMIT } from "@/lib/constants";
import { ReconciliationRun } from "@/types";
import { toast } from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/ui/Pagination";
import { clsx } from "clsx";

export default function ReconciliationPage() {
  const [history, setHistory] = useState<ReconciliationRun[]>([]);
  const [currentRun, setCurrentRun] = useState<ReconciliationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [running, setRunning] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_LIMIT,
    total: 0,
    pages: 0
  });
  
  const [selectedMonth, setSelectedMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  useEffect(() => {
    fetchHistory(pagination.page);
  }, [pagination.page]);

  const fetchHistory = async (page: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/reconciliation/history?page=${page}&limit=${pagination.limit}`);
      setHistory(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error("Failed to fetch history");
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      const response = await api.post("/reconciliation/run", selectedMonth);
      setCurrentRun(response.data.data);
      toast.success("Reconciliation completed");
      fetchHistory(1);
      setPagination(prev => ({ ...prev, page: 1 }));
    } catch (error) {
      toast.error("Failed to run reconciliation");
    } finally {
      setRunning(false);
    }
  };

  const handleRebuild = async () => {
    if (!confirm("WARNING: This will recalculate all bucket balances from scratch by scanning every ledger entry. Are you sure?")) return;
    setRebuilding(true);
    try {
      const response = await api.post("/reconciliation/rebuild");
      setCurrentRun(response.data.reconciliation);
      toast.success("All balances rebuilt successfully");
      fetchHistory(1);
      setPagination(prev => ({ ...prev, page: 1 }));
    } catch (error) {
      toast.error("Failed to rebuild balances");
    } finally {
      setRebuilding(false);
    }
  };

  const formatCurrency = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(paise / 100);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-end gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Year</label>
          <select 
            className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-32"
            value={selectedMonth.year}
            onChange={(e) => setSelectedMonth({ ...selectedMonth, year: parseInt(e.target.value) })}
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Month</label>
          <select 
            className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-40"
            value={selectedMonth.month}
            onChange={(e) => setSelectedMonth({ ...selectedMonth, month: parseInt(e.target.value) })}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRun}
            disabled={running || rebuilding}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center shadow-lg shadow-blue-100"
          >
            <RefreshCcw className={clsx("h-4 w-4 mr-2", running && "animate-spin")} />
            {running ? "Checking..." : "Run Reconciliation"}
          </button>
          <button
            onClick={handleRebuild}
            disabled={running || rebuilding}
            className="bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-900 disabled:opacity-50 transition-all flex items-center shadow-lg shadow-slate-100"
          >
            <Database className={clsx("h-4 w-4 mr-2", rebuilding && "animate-spin")} />
            {rebuilding ? "Rebuilding..." : "Rebuild All Balances"}
          </button>
        </div>
      </div>

      {/* Current Run Results */}
      {currentRun && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">
              Results for {new Date(currentRun.year, currentRun.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <Badge variant={currentRun.status === "MATCHED" ? "success" : "danger"}>
              {currentRun.status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50/50">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Checked</p>
              <p className="text-2xl font-bold text-slate-900">{currentRun.totalBuckets}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase text-green-600">Matched</p>
              <p className="text-2xl font-bold text-green-600">{currentRun.matchedCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase text-red-600">Mismatched</p>
              <p className="text-2xl font-bold text-red-600">{currentRun.mismatchedCount}</p>
            </div>
          </div>

          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Bucket</th>
                <th className="px-6 py-4">Expected (Ledger)</th>
                <th className="px-6 py-4">Stored (DB)</th>
                <th className="px-6 py-4">Difference</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentRun.results.map((res, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900 text-sm">{res.bucketName}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatCurrency(res.expectedBalance)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatCurrency(res.storedBalance)}</td>
                  <td className="px-6 py-4 text-sm font-bold">
                    <span className={res.difference === 0 ? "text-slate-400" : res.difference > 0 ? "text-green-600" : "text-red-600"}>
                      {res.difference > 0 ? "+" : ""}{formatCurrency(res.difference)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {res.status === "MATCHED" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* History */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-700 flex items-center">
          <History className="h-5 w-5 mr-2" /> Reconciliation History
        </h3>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
              <Spinner size="lg" />
            </div>
          )}
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Run Date</th>
                <th className="px-6 py-4">Target Period</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Result</th>
                <th className="px-6 py-4 text-right">Mismatches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((run) => (
                <tr key={run._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(run.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {new Date(run.year, run.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="slate">{run.runType}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={run.status === "MATCHED" ? "success" : "danger"}>
                      {run.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    {run.mismatchedCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination 
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            isLoading={loading}
          />
        </div>
      </div>
    </div>
  );
}
