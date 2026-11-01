import React from 'react';
import { 
  CheckSquare, 
  Video, 
  AlertTriangle, 
  Clock, 
  Scale, 
  ArrowUpRight, 
  Plus, 
  Sparkles,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { DashboardAnalytics } from '../types';
import { ExecutionRadar } from './ExecutionRadar';

interface DashboardProps {
  analytics: DashboardAnalytics;
  onSelectMeeting: (meetingId: number) => void;
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ analytics, onSelectMeeting, onNavigateTab }) => {
  const radar = analytics.radar;

  const topMetricCards = [
    {
      title: 'Meetings Analyzed',
      value: analytics.total_meetings,
      subtext: `${analytics.completed_meetings} processed successfully`,
      icon: Video,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      onClick: () => onNavigateTab('meetings')
    },
    {
      title: 'Open Deliverables',
      value: radar.total_tasks - radar.completed_tasks,
      subtext: `${radar.completed_tasks} completed (${radar.completion_rate}%)`,
      icon: CheckSquare,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      onClick: () => onNavigateTab('tasks')
    },
    {
      title: 'Blocked Tasks',
      value: radar.blocked_tasks,
      subtext: radar.blocked_tasks > 0 ? 'Requires unblocking' : 'Zero blockers',
      icon: AlertTriangle,
      color: radar.blocked_tasks > 0 ? 'text-amber-400' : 'text-slate-400',
      bg: radar.blocked_tasks > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-800/40 border-slate-800',
      onClick: () => onNavigateTab('tasks')
    },
    {
      title: 'Detected Conflicts',
      value: radar.conflict_count,
      subtext: radar.conflict_count > 0 ? 'Schedule discrepancy' : 'Fully aligned',
      icon: ShieldAlert,
      color: radar.conflict_count > 0 ? 'text-rose-400' : 'text-slate-400',
      bg: radar.conflict_count > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-800/40 border-slate-800',
      onClick: () => onNavigateTab('meetings')
    }
  ];

  return (
    <div className="space-y-8 py-2">
      {/* Hero Welcome & Quick Capture CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Execution Intelligence Platform</span>
          </div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-400">
            Real-time project alignment, evidence-backed commitments, and execution radar.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('new_meeting')}
          className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Meeting Capture</span>
        </button>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topMetricCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={card.onClick}
              className={`p-5 rounded-2xl border ${card.bg} shadow-lg hover:border-indigo-500/40 transition-all cursor-pointer group`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                <div className={`p-2 rounded-xl bg-slate-900/60 ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-100 mb-1">{card.value}</div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>{card.subtext}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-all" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Key Innovation: Execution Radar Card */}
      <ExecutionRadar data={radar} onNavigateToEvidence={onNavigateTab} />

      {/* Two Column Grid: Upcoming Deadlines & Recent Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upcoming Deadlines */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Upcoming Deadlines</h3>
              <p className="text-xs text-slate-400">Verifiable commitments approaching due dates</p>
            </div>
            <button
              onClick={() => onNavigateTab('tasks')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {analytics.upcoming_tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectMeeting(task.meeting_id)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-all" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-all">
                      {task.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">Owner: {task.owner}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-1 font-mono text-xs text-slate-300">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{task.deadline}</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${
                    task.priority === 'Critical' ? 'text-rose-400' :
                    task.priority === 'High' ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {task.priority} Priority
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Meetings */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Recent Meetings</h3>
              <p className="text-xs text-slate-400">Processed meeting intelligence workspaces</p>
            </div>
            <button
              onClick={() => onNavigateTab('meetings')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {analytics.recent_meetings.map((m) => (
              <div
                key={m.id}
                onClick={() => onSelectMeeting(m.id)}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-800/30 transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-all truncate max-w-[200px]">
                    {m.title}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(m.date).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                  <span className="text-slate-400 font-mono text-[11px]">
                    {m.task_count} deliverables • {m.conflict_count} conflicts
                  </span>
                  <div className="text-[11px] font-bold text-indigo-400">
                    Score: {m.actionability_score}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
