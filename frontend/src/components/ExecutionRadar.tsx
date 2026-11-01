import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, ArrowUpRight } from 'lucide-react';
import { ExecutionRadarData } from '../types';

interface ExecutionRadarProps {
  data: ExecutionRadarData;
  onNavigateToEvidence?: (tab: string) => void;
}

export const ExecutionRadar: React.FC<ExecutionRadarProps> = ({ data, onNavigateToEvidence }) => {
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'Healthy':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: ShieldCheck,
          text: 'Healthy'
        };
      case 'Critical':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: ShieldAlert,
          text: 'Critical'
        };
      default:
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: AlertTriangle,
          text: 'At Risk'
        };
    }
  };

  const badge = getBadgeStyle(data.health_status);
  const BadgeIcon = badge.icon;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Health Badge */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-100">Execution Radar</h3>
            <span className="text-[11px] font-mono text-slate-400">v1.0</span>
          </div>
          <p className="text-xs text-slate-400">Multi-dimensional meeting actionability & project risk</p>
        </div>

        <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${badge.bg}`}>
          <BadgeIcon className="w-3.5 h-3.5" />
          <span>{badge.text}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Radar Chart */}
        <div className="md:col-span-6 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.radar_data}>
              <PolarGrid stroke="#334155" strokeDasharray="3 3" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontSize: '12px'
                }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.35}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Why? Diagnostic Breakdown */}
        <div className="md:col-span-6 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2 text-indigo-400">
              <Info className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Root Cause Diagnostics (Why?)</span>
            </div>
            <ul className="space-y-2">
              {data.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-2.5">
              <div className="text-xs text-slate-400">Completion</div>
              <div className="text-lg font-bold text-slate-100">{data.completion_rate}%</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-2.5">
              <div className="text-xs text-slate-400">Blocked</div>
              <div className={`text-lg font-bold ${data.blocked_tasks > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
                {data.blocked_tasks}
              </div>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-2.5">
              <div className="text-xs text-slate-400">Conflicts</div>
              <div className={`text-lg font-bold ${data.conflict_count > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                {data.conflict_count}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
