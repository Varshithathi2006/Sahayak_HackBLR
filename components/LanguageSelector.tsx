"use client";

import { useFormStore } from "@/lib/formStore";
import { SUPPORTED_LANGUAGES } from "@/lib/localizations";
import { Languages } from "lucide-react";

export default function LanguageSelector() {
  const { selectedLanguage, setLanguage } = useFormStore();

  const handleLanguageChange = (code: string) => {
    setLanguage(code);
    console.log(`🌐 Interface language changed to: ${code}`);
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Languages className="w-3 h-3 text-slate-500" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Interface Language
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`
              flex flex-col items-center justify-center p-2 rounded border transition-all duration-200
              ${selectedLanguage === lang.code 
                ? "bg-violet-600/20 border-violet-500/50 text-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.1)]" 
                : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400"
              }
              cursor-pointer active:scale-95
            `}
          >
            <span className="text-[11px] font-bold leading-tight">{lang.nativeName}</span>
            <span className="text-[8px] opacity-60 uppercase font-medium">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
