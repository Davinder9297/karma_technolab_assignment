"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2 } from "lucide-react";
import api from "@/lib/api";
import { DEFAULT_PAGE_LIMIT } from "@/lib/constants";
import { IncomeType } from "@/types";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/ui/Pagination";
import { toast } from "react-hot-toast";

export default function IncomeTypesPage() {
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_LIMIT,
    total: 0,
    pages: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchIncomeTypes(pagination.page);
  }, [pagination.page]);

  const fetchIncomeTypes = async (page: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/income-types?page=${page}&limit=${pagination.limit}`);
      setIncomeTypes(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error("Failed to fetch income types");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/income-types", formData);
      toast.success("Income type created successfully");
      setIsModalOpen(false);
      setFormData({ name: "", description: "" });
      fetchIncomeTypes(1);
      setPagination(prev => ({ ...prev, page: 1 }));
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create income type");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-slate-700">Manage Income Types</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" /> Add New
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <Spinner size="lg" />
          </div>
        )}
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-bold">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {incomeTypes.map((type) => (
              <tr key={type._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{type.name}</td>
                <td className="px-6 py-4 text-slate-500">{type.description || "-"}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button className="p-1 text-slate-400 hover:text-blue-600">
                      <Edit2 className="h-4 w-4" />
                    </button>
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
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add Income Type"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input 
              type="text" 
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors mt-4 flex items-center justify-center disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Spinner size="sm" light className="mr-2" />
                Creating...
              </>
            ) : (
              "Create Income Type"
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
}
