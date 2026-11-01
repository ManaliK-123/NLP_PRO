import React from 'react';
import { Settings, Cpu, HardDrive, CheckCircle2, ShieldCheck, Zap, Database } from 'lucide-react';

interface SettingsViewProps {
  activeProviderName?: string;
  onResetDemoData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ activeProviderName, onResetDemoData }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>System & Engine Preferences</span>
        </div>
        <h2 className="text-2xl font-black text-slate-100 tracking-tight">Settings & Engine Control</h2>
        <p className="text-xs text-slate-400">
          Configure local speech models, NLP extraction providers, and zero-friction offline execution modes.
        </p>
      </div>

      {/* AI Engine Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Local & Demo-First Mode (100% Offline)</h3>
              <p className="text-xs text-slate-400">The entire application functions natively without any paid API keys</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
            Active & Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Active AI Provider</span>
            <span className="font-bold text-slate-100">{activeProviderName || 'Local NLP Engine'}</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Speech Transcription</span>
            <span className="font-bold text-slate-100">faster-whisper (tiny/base)</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Media Conversion</span>
            <span className="font-bold text-slate-100">FFmpeg static engine</span>
          </div>
        </div>
      </div>

      {/* Database & Storage */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Relational Database Engine</h3>
            <p className="text-xs text-slate-400">Zero-friction SQLite storage with PostgreSQL migration schema</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <span className="text-slate-400 font-mono">meeting_execution.db</span>
          <button
            onClick={onResetDemoData}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            Reload Seeded Demo Data
          </button>
        </div>
      </div>
    </div>
  );
};
