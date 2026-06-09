"use client";

import { useEffect, useState } from "react";
import { Filter, Calendar, BookText, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import api from "@/lib/api";
import { DEFAULT_PAGE_LIMIT, INDIA_TIME_ZONE, LOOKUP_LIST_LIMIT } from "@/lib/constants";
import { LedgerEntry, Bucket, EntryType, TransactionType } from "@/types";
import { toast } from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/ui/Pagination";
import { clsx } from "clsx";

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    bucketId: "",
    entryType: "ALL",
    transactionType: "ALL",
    startDate: "",
    endDate: ""
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: DEFAULT_PAGE_LIMIT });

  useEffect(() => {
    fetchBuckets();
  }, []);

  useEffect(() => {
    fetchLedger(pagination.page);
  }, [filters, pagination.page]);

  const fetchBuckets = async () => {
    try {
      const response = await api.get(`/buckets?limit=${LOOKUP_LIST_LIMIT}`);
      setBuckets(response.data.data);
    } catch (error) {
      console.error("Failed to fetch buckets");
    }
  };

  const fetchLedger = async (page: number) => {
    setLoading(true);
    try {
      const response = await api.get("/ledger", {
        params: { ...filters, page, limit: pagination.limit }
      });
      setEntries(response.data.data);
      setPagination({
        page: response.data.pagination.page,
        pages: response.data.pagination.pages,
        total: response.data.pagination.total,
        limit: response.data.pagination.limit
      });
    } catch (error) {
      toast.error("Failed to fetch ledger");
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

  const formatIndianDateTime = (value: string) => {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: INDIA_TIME_ZONE,
      dateStyle: "medium",
      timeStyle: "medium",
      hour12: true,
    }).format(new Date(value));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center mb-4">
          <Filter className="h-4 w-4 mr-2 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bucket</label>
            <select
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.bucketId}
              onChange={(e) => setFilters({ ...filters, bucketId: e.target.value, page: 1 } as any)}
            >
              <option value="">All Buckets</option>
              {buckets.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Entry Type</label>
            <select
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.entryType}
              onChange={(e) => setFilters({ ...filters, entryType: e.target.value, page: 1 } as any)}
            >
              <option value="ALL">All Entries</option>
              {Object.values(EntryType).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Transaction</label>
            <select
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.transactionType}
              onChange={(e) => setFilters({ ...filters, transactionType: e.target.value, page: 1 } as any)}
            >
              <option value="ALL">All Types</option>
              {Object.values(TransactionType).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date</label>
            <input
              type="date"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 } as any)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">End Date</label>
            <input
              type="date"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 } as any)}
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <Spinner size="lg" />
          </div>
        )}
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Bucket</th>
              <th className="px-6 py-4 text-center">Type</th>
              <th className="px-6 py-4">Entry</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <tr key={entry._id} className={clsx(
                "hover:bg-slate-50 transition-colors",
                entry.transactionType === TransactionType.CREDIT ? "bg-green-50/20" : "bg-red-50/20"
              )}>
                <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                  {formatIndianDateTime(entry.createdAt)}
                </td>
                <td className="px-6 py-4 font-semibold text-slate-900 text-sm">
                  {entry.bucketId?.name}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    {entry.transactionType === TransactionType.CREDIT ? (
                      <ArrowUpCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={entry.entryType === EntryType.ALLOCATION ? "success" : entry.entryType === EntryType.EXPENSE ? "danger" : "warning"}>
                    {entry.entryType}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {entry.description}
                  {entry.allocationRuleVersion && (
                    <span className="ml-1 text-[10px] font-bold text-slate-300">V{entry.allocationRuleVersion}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={clsx(
                    "text-sm font-bold",
                    entry.transactionType === TransactionType.CREDIT ? "text-green-600" : "text-red-600"
                  )}>
                    {entry.transactionType === TransactionType.CREDIT ? "+" : "-"}{formatCurrency(entry.amount)}
                  </span>
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
  );
}
