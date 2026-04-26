"use client";

import { useFormStore } from "@/lib/formStore";
import { History, DatabaseBackup } from "lucide-react";

export default function ReturningUserBanner() {
  const { returningUser, updateField, form } = useFormStore();

  if (!returningUser) return null;

  const pastForm = returningUser.form;
  
  const handleReuse = () => {
    Object.entries(pastForm).forEach(([k, v]) => {
      if (v !== undefined)
        updateField(k as any, v as any);
    });
  };

  return (
    <div className="animate-slide-in mb-6 flex items-center justify-between p-4 bg-blue-600/10 border border-blue-500/20 rounded shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-600/20 rounded flex items-center justify-center">
          <History className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-0.5">Historical Data Detected</h4>
          <p className="text-xs text-slate-300 font-medium tracking-tight">
            System found a registry entry for <span className="text-white">ID: {returningUser.userId}</span> from {new Date(returningUser.updatedAt).toLocaleDateString()}.
          </p>
        </div>
      </div>
      
      <button
        id="reuse-data-btn"
        onClick={handleReuse}
        className="flex items-center gap-2 text-[10px] font-black text-white bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded uppercase tracking-widest transition-all"
      >
        <DatabaseBackup className="w-3.5 h-3.5" />
        Synchronize Registry
      </button>
    </div>
  );
}
