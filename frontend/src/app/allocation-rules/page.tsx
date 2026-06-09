"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, History, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { IncomeType, Bucket, AllocationRule, RuleType } from "@/types";
import Modal from "@/components/ui/Modal";
import { toast } from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import { clsx } from "clsx";

export default function AllocationRulesPage() {
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [selectedType, setSelectedType] = useState<IncomeType | null>(null);
  const [rules, setRules] = useState<AllocationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New rule form state
  const [newRules, setNewRules] = useState<{ bucketId: string; ruleType: RuleType; value: number }[]>([
    { bucketId: "", ruleType: RuleType.PERCENTAGE, value: 0 }
  ]);
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedType) {
      fetchRules(selectedType._id);
    }
  }, [selectedType]);

  const fetchInitialData = async () => {
    try {
      const [itRes, bRes] = await Promise.all([
        api.get("/income-types"),
        api.get("/buckets")
      ]);
      setIncomeTypes(itRes.data.data);
      setBuckets(bRes.data.data);
      if (itRes.data.data.length > 0) {
        setSelectedType(itRes.data.data[0]);
      }
    } catch (error) {
      toast.error("Failed to fetch initial data");
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async (id: string) => {
    try {
      const response = await api.get(`/allocation-rules/${id}`);
      setRules(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch rules");
    }
  };

  const addRuleRow = () => {
    setNewRules([...newRules, { bucketId: "", ruleType: RuleType.PERCENTAGE, value: 0 }]);
  };

  const removeRuleRow = (index: number) => {
    setNewRules(newRules.filter((_, i) => i !== index));
  };

  const updateRuleRow = (index: number, field: string, value: any) => {
    const updated = [...newRules];
    updated[index] = { ...updated[index], [field]: value };
    setNewRules(updated);
  };

  const calculateTotalPercentage = () => {
    return newRules
      .filter(r => r.ruleType === RuleType.PERCENTAGE)
      .reduce((sum, r) => sum + r.value, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    const total = calculateTotalPercentage();
    if (total > 100000) {
      toast.error("Total percentage cannot exceed 100%");
      return;
    }

    try {
      await api.post("/allocation-rules", {
        incomeTypeId: selectedType._id,
        rules: newRules,
        effectiveFrom: new Date(effectiveFrom).toISOString()
      });
      toast.success("Rule version created successfully");
      setIsModalOpen(false);
      setNewRules([{ bucketId: "", ruleType: RuleType.PERCENTAGE, value: 0 }]);
      fetchRules(selectedType._id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create rule");
    }
  };

  const formatRuleValue = (type: RuleType, value: number) => {
    if (type === RuleType.PERCENTAGE) return `${value / 1000}%`;
    return `₹${value / 100}`;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Left Panel: Income Types */}
      <div className="col-span-12 lg:col-span-4 space-y-4">
        <h3 className="text-lg font-medium text-slate-700">Income Types</h3>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {incomeTypes.map((type) => (
              <button
                key={type._id}
                onClick={() => setSelectedType(type)}
                className={clsx(
                  "w-full px-6 py-4 flex items-center justify-between text-left transition-colors",
                  selectedType?._id === type._id ? "bg-blue-50 border-r-4 border-blue-600" : "hover:bg-slate-50"
                )}
              >
                <div>
                  <p className={clsx("font-semibold", selectedType?._id === type._id ? "text-blue-700" : "text-slate-900")}>
                    {type.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{type.description || "No description"}</p>
                </div>
                <ChevronRight className={clsx("h-4 w-4", selectedType?._id === type._id ? "text-blue-600" : "text-slate-300")} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Rule Versions */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-slate-700">
            Rules for <span className="text-blue-600 font-bold">{selectedType?.name}</span>
          </h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" /> New Version
          </button>
        </div>

        <div className="space-y-6">
          {rules.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center">
              <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No rule versions found for this income type.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-blue-600 font-semibold mt-2 hover:underline"
              >
                Create the first version
              </button>
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule._id} className={clsx(
                "bg-white rounded-xl border overflow-hidden shadow-sm",
                rule.isActive ? "border-blue-200 ring-1 ring-blue-50" : "border-slate-200"
              )}>
                <div className={clsx(
                  "px-6 py-4 flex items-center justify-between",
                  rule.isActive ? "bg-blue-50/50" : "bg-slate-50"
                )}>
                  <div className="flex items-center space-x-4">
                    <span className="bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-bold">
                      V{rule.version}
                    </span>
                    <div className="text-sm">
                      <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Effective From</p>
                      <p className="font-semibold text-slate-700">{new Date(rule.effectiveFrom).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant={rule.isActive ? "success" : "slate"}>
                    {rule.isActive ? "Currently Active" : "Inactive"}
                  </Badge>
                </div>
                
                <div className="p-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 text-left border-b border-slate-100">
                        <th className="pb-3 font-medium">Bucket</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {rule.rules.map((r, i) => {
                        const bucket = buckets.find(b => b._id === r.bucketId);
                        return (
                          <tr key={i}>
                            <td className="py-3 font-medium text-slate-700">{bucket?.name || "Deleted Bucket"}</td>
                            <td className="py-3 text-slate-500">{r.ruleType}</td>
                            <td className="py-3 text-right font-bold text-slate-900">{formatRuleValue(r.ruleType, r.value)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="mt-6">
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-xs font-bold text-slate-400 uppercase">Total Allocated</p>
                      <p className={clsx(
                        "text-sm font-bold",
                        rule.totalPercentage > 100000 ? "text-red-600" : "text-blue-600"
                      )}>
                        {rule.totalPercentage / 1000}%
                      </p>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={clsx(
                          "h-full rounded-full transition-all duration-500",
                          rule.totalPercentage > 100000 ? "bg-red-500" : "bg-blue-500"
                        )}
                        style={{ width: `${Math.min(rule.totalPercentage / 1000, 100)}%` }}
                      />
                    </div>
                    {rule.totalPercentage < 100000 && (
                      <p className="text-[10px] text-slate-400 mt-1 italic">
                        * {(100000 - rule.totalPercentage) / 1000}% will remain unallocated
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`New Version for ${selectedType?.name}`}
      >
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Effective From</label>
            <input 
              type="date" 
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-700">Allocation Rules</label>
              <button 
                type="button" 
                onClick={addRuleRow}
                className="text-xs text-blue-600 font-bold hover:text-blue-800 flex items-center"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Row
              </button>
            </div>
            
            {newRules.map((rule, index) => (
              <div key={index} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex-1 space-y-2">
                  <select
                    required
                    className="w-full text-sm px-2 py-1.5 border border-slate-200 rounded outline-none"
                    value={rule.bucketId}
                    onChange={(e) => updateRuleRow(index, "bucketId", e.target.value)}
                  >
                    <option value="">Select Bucket</option>
                    {buckets.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <select
                      className="w-2/5 text-xs px-2 py-1.5 border border-slate-200 rounded outline-none"
                      value={rule.ruleType}
                      onChange={(e) => updateRuleRow(index, "ruleType", e.target.value)}
                    >
                      <option value={RuleType.PERCENTAGE}>%</option>
                      <option value={RuleType.FIXED}>Fixed</option>
                    </select>
                    <input
                      type="number"
                      placeholder={rule.ruleType === RuleType.PERCENTAGE ? "Basis pts (1000=1%)" : "Paise"}
                      className="w-3/5 text-sm px-2 py-1.5 border border-slate-200 rounded outline-none"
                      value={rule.value || ""}
                      onChange={(e) => updateRuleRow(index, "value", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => removeRuleRow(index)}
                  className="p-1 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex justify-between text-sm font-bold mb-4">
              <span className="text-slate-500">Total Percentage:</span>
              <span className={calculateTotalPercentage() > 100000 ? "text-red-600" : "text-blue-600"}>
                {calculateTotalPercentage() / 1000}%
              </span>
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-100"
            >
              Save New Version
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
