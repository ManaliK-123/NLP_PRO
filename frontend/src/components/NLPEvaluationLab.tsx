import React, { useState, useEffect } from 'react';
import { FlaskConical, BarChart3, Award, Zap, CheckCircle2, TrendingUp } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { fetchEvaluationBenchmark } from '../api/client';

export const NLPEvaluationLab: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchEvaluationBenchmark();
        setData(res);
      } catch (err: any) {
        console.error('Failed to load evaluation benchmark:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <FlaskConical className="w-4 h-4" />
          <span>Academic & Empirical Evaluation</span>
        </div>
        <h2 className="text-2xl font-black text-slate-100 tracking-tight">NLP Evaluation Lab</h2>
        <p className="text-xs text-slate-400">
          Rigorous empirical benchmarking of Rule-Based NLP, Fine-Tuned Transformers, and Hybrid architectures on meeting execution extraction.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-indigo-400">Running model benchmarks...</div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top Model Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rule Based */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Baseline 1</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {data.models.rule_based.latency_ms} ms Latency
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">{data.models.rule_based.name}</h3>
              <div className="text-2xl font-black text-slate-200">
                {data.models.rule_based.overall_score}% <span className="text-xs text-slate-400 font-normal">F1</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ultra-fast deterministic regex & linguistic heuristic parsing. Zero inference cost.
              </p>
            </div>

            {/* Transformer */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Baseline 2</span>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  {data.models.transformer.latency_ms} ms Latency
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">{data.models.transformer.name}</h3>
              <div className="text-2xl font-black text-indigo-400">
                {data.models.transformer.overall_score}% <span className="text-xs text-slate-400 font-normal">F1</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Sequence classification with context embeddings and dependency syntax parses.
              </p>
            </div>

            {/* Hybrid / LLM */}
            <div className="bg-gradient-to-b from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>State of the Art</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {data.models.hybrid_llm.latency_ms} ms Latency
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{data.models.hybrid_llm.name}</h3>
              <div className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                {data.models.hybrid_llm.overall_score}% <span className="text-xs text-slate-400 font-normal">F1</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Combines rule-based speed & deterministic precision with zero-shot semantics.
              </p>
            </div>
          </div>

          {/* Comparative Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">Cross-Task Benchmark Performance (F1 / Accuracy %)</h3>
              <p className="text-xs text-slate-400">Evaluated on {data.test_cases_count} multi-speaker meeting scenarios with ground truth annotations</p>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.breakdown} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                  <XAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={[60, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="rule_based" name="Rule-Based" fill="#64748b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="transformer" name="Transformer" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hybrid_llm" name="Hybrid / LLM" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Research Metrics Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Evaluation Dimension</th>
                  <th className="p-4">Rule-Based F1</th>
                  <th className="p-4">Transformer F1</th>
                  <th className="p-4">Hybrid SOTA F1</th>
                  <th className="p-4">Delta Gain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.breakdown.map((row: any, idx: number) => {
                  const gain = (row.hybrid_llm - row.rule_based).toFixed(1);
                  return (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-4 font-bold text-slate-200">{row.metric}</td>
                      <td className="p-4 text-slate-400 font-mono">{row.rule_based}%</td>
                      <td className="p-4 text-indigo-400 font-mono">{row.transformer}%</td>
                      <td className="p-4 text-cyan-400 font-mono font-bold">{row.hybrid_llm}%</td>
                      <td className="p-4 text-emerald-400 font-mono">+{gain}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};
