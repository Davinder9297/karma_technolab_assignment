"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Filter } from "lucide-react";
import api from "@/lib/api";
import { DEFAULT_PAGE_LIMIT, LOOKUP_LIST_LIMIT } from "@/lib/constants";
import { Expense, Bucket, ExpenseStatus } from "@/types";
import { toast } from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/ui/Pagination";
import { clsx } from "clsx";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_LIMIT,
    total: 0,
    pages: 0
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [formData, setFormData] = useState({
    bucketId: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: ""
  });

  const [editFormData, setEditFormData] = useState({
    amount: "",
    description: ""
  });
  const [filterBucket, setFilterBucket] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchExpenses(pagination.page);
  }, [filterBucket, pagination.page]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const bRes = await api.get(`/buckets?limit=${LOOKUP_LIST_LIMIT}`);
      setBuckets(bRes.data.data);
      fetchExpenses(1);
    } catch (error) {
      toast.error("Failed to fetch initial data");
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async (page: number) => {
    setLoading(true);
    try {
      const response = await api.get("/expenses", {
        params: { 
          bucketId: filterBucket,
          page,
          limit: pagination.limit
        }
      });
      setExpenses(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/expenses", {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      toast.success("Expense added successfully");
      setFormData({
        bucketId: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        description: ""
      });
      fetchExpenses(1);
      setPagination(prev => ({ ...prev, page: 1 }));
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense? This will create a reversal ledger entry.")) return;
    setLoading(true);
    try {
      await api.delete(`/expenses/${id}`);
      toast.success("Expense deleted successfully");
      fetchExpenses(pagination.page);
    } catch (error) {
      toast.error("Failed to delete expense");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setEditFormData({
      amount: (expense.amount / 100).toString(),
      description: expense.description
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    setSubmitting(true);
    try {
      await api.patch(`/expenses/${editingExpense._id}`, {
        amount: parseFloat(editFormData.amount),
        description: editFormData.description
      });
      toast.success("Expense updated successfully");
      setIsEditModalOpen(false);
      fetchExpenses(pagination.page);
      // Also refresh buckets for dashboard/balance updates
      fetchInitialData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update expense");
    } finally {
      setSubmitting(false);
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
      {/* Add Expense Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <Plus className="h-5 w-5 mr-2 text-red-600" /> Add New Expense
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bucket</label>
            <select
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
              value={formData.bucketId}
              onChange={(e) => setFormData({ ...formData, bucketId: e.target.value })}
            >
              <option value="">Select Bucket</option>
              {buckets.map(b => (
                <option key={b._id} value={b._id}>{b.name} ({formatCurrency(b.balance?.currentBalance || 0)})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount (INR)</label>
            <input
              type="number"
              required
              step="0.01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Food, Rent, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="lg:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-red-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100 disabled:opacity-50 flex items-center"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" light className="mr-2" />
                  Recording...
                </>
              ) : (
                "Record Expense"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <Spinner size="lg" />
          </div>
        )}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Recent Expenses</h3>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              className="text-xs font-bold text-slate-500 uppercase bg-transparent outline-none cursor-pointer"
              value={filterBucket}
              onChange={(e) => {
                setFilterBucket(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">All Buckets</option>
              {buckets.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Bucket</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((expense) => (
              <tr key={expense._id} className={clsx(
                "hover:bg-slate-50 transition-colors",
                expense.status !== ExpenseStatus.ACTIVE && "opacity-60 grayscale bg-slate-50"
              )}>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {new Date(expense.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-slate-900">{expense.bucketId?.name}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 italic">
                  {expense.description}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-red-600">{formatCurrency(expense.amount)}</span>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={expense.status === ExpenseStatus.ACTIVE ? "danger" : "slate"}>
                    {expense.status}
                  </Badge>
                  {expense.status === ExpenseStatus.UPDATED && (
                    <span className="ml-2 text-[10px] font-bold text-amber-600 uppercase tracking-tighter">Edited</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    {expense.status !== ExpenseStatus.DELETED && (
                      <>
                        <button 
                          onClick={() => handleEditClick(expense)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(expense._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
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

      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Expense"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input 
              type="text" 
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (INR)</label>
            <input 
              type="number" 
              required
              step="0.01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={editFormData.amount}
              onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
            />
          </div>
          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors mt-4 flex items-center justify-center disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Spinner size="sm" light className="mr-2" />
                Updating...
              </>
            ) : (
              "Update Expense"
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
}
