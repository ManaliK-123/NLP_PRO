import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Clock, 
  GitCommit, 
  Sparkles, 
  User, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { fetchProjects, fetchProjectMemory } from '../api/client';
import { Project } from '../types';

export const ProjectMemoryView: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [memoryData, setMemoryData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const projs = await fetchProjects();
        setProjects(projs);
        if (projs.length > 0) {
          setSelectedProjectId(projs[0].id);
          const mem = await fetchProjectMemory(projs[0].id);
          setMemoryData(mem);
        }
      } catch (err: any) {
        console.error('Failed to load project memory:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleSelectProject = async (id: number) => {
    setSelectedProjectId(id);
    try {
      setLoading(true);
      const mem = await fetchProjectMemory(id);
      setMemoryData(mem);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <FolderKanban className="w-4 h-4" />
          <span>Cross-Meeting Intelligence</span>
        </div>
        <h2 className="text-2xl font-black text-slate-100 tracking-tight">Project Memory & Decision Drift</h2>
        <p className="text-xs text-slate-400">
          Trace how commitments, deadlines, and architectural decisions evolve across multiple meetings.
        </p>
      </div>

      {/* Project Selector Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelectProject(p.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedProjectId === p.id
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-indigo-400">Loading cross-meeting intelligence...</div>
      ) : memoryData ? (
        <div className="space-y-6">
          {/* Decision Drift Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-base font-bold text-slate-100">Decision Drift Intelligence</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Detects when a decision made in an earlier meeting drifts or gets superseded.
                </p>
              </div>

              <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">
                {memoryData.decision_drifts?.length || 0} Drifts Tracked
              </span>
            </div>

            {memoryData.decision_drifts && memoryData.decision_drifts.length > 0 ? (
              <div className="space-y-3">
                {memoryData.decision_drifts.map((drift: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{drift.topic}</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Previous Decision</span>
                        <p className="text-xs text-slate-300 font-medium">"{drift.previous_decision}"</p>
                      </div>

                      <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 space-y-1">
                        <span className="text-[10px] text-indigo-400 uppercase font-semibold">Updated Decision (Drift)</span>
                        <p className="text-xs text-slate-100 font-bold">"{drift.new_decision}"</p>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <strong>Audit Reason:</strong> {drift.reason}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400">
                No decision drift recorded yet in this project.
              </div>
            )}
          </div>

          {/* Responsibility Distribution & Unresolved Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Responsibility Bar Chart */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">Responsibility Distribution</h3>
                <p className="text-xs text-slate-400">Deliverables distribution per team member</p>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={memoryData.responsibility_distribution || []}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis dataKey="owner" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="tasks" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Unresolved Matters across meetings */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">Project-Wide Unresolved Items</h3>
                <p className="text-xs text-slate-400">Items still requiring confirmation or owner assignment</p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {memoryData.unresolved_items && memoryData.unresolved_items.length > 0 ? (
                  memoryData.unresolved_items.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-400">{item.title}</span>
                        <span className="text-[10px] font-mono text-slate-500">Meeting #{item.meeting_id}</span>
                      </div>
                      <p className="text-xs text-slate-300">{item.detail}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">All items resolved.</p>
                )}
              </div>
            </div>
          </div>

          {/* Task Lifecycle Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">Task Lifecycle & Audit History</h3>
              <p className="text-xs text-slate-400">Complete provenance of task modifications across time</p>
            </div>

            <div className="space-y-3">
              {memoryData.task_timeline?.map((t: any) => (
                <div key={t.task_id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100">{t.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Owner: {t.owner}</span>
                  </div>

                  {t.history && t.history.length > 0 ? (
                    <div className="flex items-center space-x-2 overflow-x-auto py-1">
                      {t.history.map((h: any, i: number) => (
                        <div key={i} className="flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 whitespace-nowrap">
                          <GitCommit className="w-3 h-3 text-indigo-400" />
                          <span>{h.field}: {h.old || 'Init'} → <strong>{h.new}</strong> ({h.note})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500">Created with initial assignment</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
