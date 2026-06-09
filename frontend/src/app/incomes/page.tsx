"use client";

import { useEffect, useState, Fragment } from "react";
import { Plus, Trash2, Calendar, Receipt, ChevronDown, ChevronUp } from "lucide-react";
import api from "@/lib/api";
import { DEFAULT_PAGE_LIMIT } from "@/lib/constants";
import { Income, IncomeType, IncomeStatus } from "@/types";
import { toast } from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/ui/Pagination";
import { clsx } from "clsx";

export default function IncomesPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_LIMIT,
    total: 0,
    pages: 0
  });
  const [formData, setFormData] = useState({
    incomeTypeId: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: ""
  });
  const [lastAllocation, setLastAllocation] = useState<Income | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchInitialData(pagination.page);
  }, [pagination.page]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchInitialData = async (page: number) => {
    setLoading(true);
    try {
      const [incRes, itRes] = await Promise.all([
        api.get(`/incomes?page=${page}&limit=${pagination.limit}`),
        api.get("/income-types")
      ]);
      setIncomes(incRes.data.data);
      setIncomeTypes(itRes.data.data);
      setPagination(incRes.data.pagination);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post("/incomes", {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      toast.success("Income added and allocated successfully");
      setLastAllocation(response.data.data);
      setFormData({
        incomeTypeId: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        description: ""
      });
      fetchInitialData(1);
      setPagination(prev => ({ ...prev, page: 1 }));
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add income");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to reverse this income? This will create reversal ledger entries for all allocations.")) return;
    setLoading(true);
    try {
      await api.delete(`/incomes/${id}`);
      toast.success("Income reversed successfully");
      fetchInitialData(pagination.page);
    } catch (error) {
      toast.error("Failed to reverse income");
    } finally {
      setLoading(false);
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
      {/* Add Income Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <Plus className="h-5 w-5 mr-2 text-blue-600" /> Add New Income
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Income Type</label>
            <select
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.incomeTypeId}
              onChange={(e) => setFormData({ ...formData, incomeTypeId: e.target.value })}
            >
              <option value="">Select Type</option>
              {incomeTypes.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount (INR)</label>
            <input
              type="number"
              required
              step="0.01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
            <input
              type="date"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Salary, Freelance, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="lg:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" light className="mr-2" />
                  Allocating...
                </>
              ) : (
                "Add & Allocate Income"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Last Allocation Preview */}
      {lastAllocation && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-green-800 flex items-center">
              <Receipt className="h-5 w-5 mr-2" /> 
              Income Allocated Successfully: {formatCurrency(lastAllocation.amount)}
            </h4>
            <button onClick={() => setLastAllocation(null)} className="text-green-600 hover:text-green-800">
              <Plus className="h-5 w-5 rotate-45" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lastAllocation.allocations.map((a, i) => (
              <div key={i} className="bg-white p-3 rounded-lg border border-green-100 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">{a.note === "unallocated" ? "Unallocated" : "Bucket"}</p>
                  <p className="font-semibold text-slate-700">{a.note === "unallocated" ? "Remaining" : (a.bucketName || (a.bucketId as any)?.name || "Unknown Bucket")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">{formatCurrency(a.amount)}</p>
                  <p className="text-[10px] text-slate-400">{a.ruleType === "PERCENTAGE" ? (a.ruleValue === 0 ? "0%" : `${a.ruleValue / 1000}%`) : "Fixed"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incomes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <Spinner size="lg" />
          </div>
        )}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Recent Incomes</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-4 py-4 w-10"></th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {incomes.map((income) => (
              <Fragment key={income._id}>
                <tr className={clsx(
                  "hover:bg-slate-50 transition-colors cursor-pointer",
                  income.status === IncomeStatus.REVERSED && "opacity-60 grayscale bg-slate-50"
                )} onClick={() => toggleRow(income._id)}>
                  <td className="px-4 py-4 text-center w-10">
                    {expandedRows[income._id] ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(income.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-900">{income.incomeTypeId?.name}</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">V{income.allocationRuleVersion}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 italic">
                    {income.description || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-green-600">{formatCurrency(income.amount)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={income.status === IncomeStatus.ACTIVE ? "success" : "slate"}>
                      {income.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {income.status === IncomeStatus.ACTIVE && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(income._id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
                {expandedRows[income._id] && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {income.allocations.map((a, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{a.note === "unallocated" ? "Unallocated" : "Bucket"}</p>
                              <p className="text-sm font-semibold text-slate-700">{a.note === "unallocated" ? "Remaining" : (a.bucketName || (a.bucketId as any)?.name || "Unknown Bucket")}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-green-600">{formatCurrency(a.amount)}</p>
                              <p className="text-[10px] text-slate-400">{a.ruleType === "PERCENTAGE" ? (a.ruleValue === 0 ? "0%" : `${a.ruleValue / 1000}%`) : "Fixed"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
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
  );
}
