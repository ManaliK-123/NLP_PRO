import React, { useState, useEffect } from 'react';
import { Scale, Sparkles, Clock, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { Decision } from '../types';

interface DecisionsViewProps {
  onSelectMeetingDecision?: (meetingId: number, timestamp: number) => void;
}

export const DecisionsView: React.FC<DecisionsViewProps> = ({ onSelectMeetingDecision }) => {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/decisions');
        const data = await res.json();
        setDecisions(data);
      } catch (err: any) {
        console.error('Failed to load decisions:', err);
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
          <Scale className="w-4 h-4" />
          <span>Decision Register</span>
        </div>
        <h2 className="text-2xl font-black text-slate-100 tracking-tight">Decisions & Architectural Alignments</h2>
        <p className="text-xs text-slate-400">
          All finalized, tentative, and undecided matters with full traceability and decision drift tracking.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-indigo-400">Loading decisions register...</div>
      ) : decisions.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
          No decisions recorded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map((dec) => (
            <div
              key={dec.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  {dec.topic || 'Project Decision'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  dec.status === 'Final'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {dec.status}
                </span>
              </div>

              <p className="text-xs text-slate-100 font-medium leading-relaxed">{dec.decision}</p>

              {/* Drift flag if supersedes previous decision */}
              {dec.supersedes_previous_decision && (
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Decision Drift: Superseded Previous Agreement</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{dec.drift_reason}</p>
                </div>
              )}

              {/* Evidence jump button */}
              {dec.evidence_quote && (
                <div
                  onClick={() => {
                    if (onSelectMeetingDecision) {
                      onSelectMeetingDecision(dec.meeting_id, dec.evidence_timestamp || 0);
                    }
                  }}
                  className="flex items-center justify-between bg-slate-950/70 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl text-xs cursor-pointer transition-all group"
                >
                  <span className="text-slate-400 font-mono text-[11px]">
                    Evidence: "{dec.evidence_quote}"
                  </span>
                  <span className="text-indigo-400 font-semibold text-[11px] group-hover:underline">
                    Jump to Recording
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
