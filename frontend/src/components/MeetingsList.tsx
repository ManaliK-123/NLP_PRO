import React, { useState, useEffect } from 'react';
import { Video, Search, Clock, Plus, ChevronRight, AlertTriangle, CheckSquare, Sparkles } from 'lucide-react';
import { MeetingListItem } from '../types';
import { fetchMeetings } from '../api/client';

interface MeetingsListProps {
  onSelectMeeting: (meetingId: number) => void;
  onNewMeeting: () => void;
}

export const MeetingsList: React.FC<MeetingsListProps> = ({ onSelectMeeting, onNewMeeting }) => {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchMeetings();
      setMeetings(data);
    } catch (e: any) {
      console.error('Failed to load meetings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = meetings.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    (m.project_name && m.project_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Video className="w-4 h-4" />
            <span>Recorded Discussions</span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Analyzed Meetings</h2>
          <p className="text-xs text-slate-400">
            Select a meeting to open the evidence-backed execution workspace.
          </p>
        </div>

        <button
          onClick={onNewMeeting}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Capture Meeting</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search meetings by title or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Meetings Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-indigo-400">Loading meeting records...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
          No meetings found. Click "Capture Meeting" to record or upload a new meeting.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              onClick={() => onSelectMeeting(m.id)}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/30 transition-all cursor-pointer shadow-lg group space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 block mb-1">
                    {m.project_name || 'Autonomous Driving Project'} • {new Date(m.meeting_date).toLocaleDateString()}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-all">
                    {m.title}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {m.actionability_score}% Actionable
                  </span>
                </div>
              </div>

              {/* Badges / Metrics bar */}
              <div className="flex items-center space-x-3 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                <div className="flex items-center space-x-1">
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{m.task_count} tasks</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{Math.floor(m.duration_seconds / 60)}m {(m.duration_seconds % 60).toFixed(0)}s</span>
                </div>
                {m.audio_source && (
                  <div className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono truncate max-w-[150px]">
                    {m.audio_source.includes('External') ? 'Paired Media' : 'Single Media'}
                  </div>
                )}
                {m.conflict_count > 0 && (
                  <div className="flex items-center space-x-1 text-rose-400 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{m.conflict_count} conflict</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
