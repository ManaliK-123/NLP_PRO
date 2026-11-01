import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  ExternalLink, 
  CheckSquare, 
  Scale, 
  AlertTriangle, 
  FileText, 
  MessageSquare, 
  GitMerge, 
  Sparkles, 
  Clock, 
  User, 
  Download, 
  Edit3, 
  Check, 
  X,
  Send,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Maximize2,
  Layers
} from 'lucide-react';
import { MeetingDetail, TranscriptSegment, Task, Decision, Conflict, Question } from '../types';
import { updateSpeaker, askMeetingQuestion, updateTask } from '../api/client';

interface MeetingWorkspaceProps {
  meeting: MeetingDetail;
  onRefreshMeeting: () => void;
  onOpenFullWorkflow?: () => void;
}

export const MeetingWorkspace: React.FC<MeetingWorkspaceProps> = ({ 
  meeting, 
  onRefreshMeeting,
  onOpenFullWorkflow 
}) => {
  const [activeTab, setActiveTab] = useState<'transcript' | 'tasks' | 'decisions' | 'conflicts' | 'mom' | 'ask'>('transcript');
  
  // Media Player state
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(meeting.duration_seconds || 30);
  const [highlightedTime, setHighlightedTime] = useState<number | null>(null);

  // Speaker name editing state
  const [editingSpeakerId, setEditingSpeakerId] = useState<number | null>(null);
  const [editingSpeakerName, setEditingSpeakerName] = useState('');

  // Ask the Meeting state
  const [userQuery, setUserQuery] = useState('');
  const [qaMessages, setQaMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; evidence?: any[] }>>([
    {
      sender: 'ai',
      text: 'Hello! I am your grounded Meeting Assistant. Ask me anything about deliverables, owners, deadlines, or open questions.',
      evidence: []
    }
  ]);
  const [isAsking, setIsAsking] = useState(false);

  // Auto-track current segment
  const currentSegment = meeting.segments.find(
    (s) => currentTime >= s.start_time && currentTime <= s.end_time
  );

  // Seek video to exact timestamp
  const seekTo = (timestamp: number) => {
    setCurrentTime(timestamp);
    setHighlightedTime(timestamp);
    if (mediaRef.current) {
      try {
        mediaRef.current.currentTime = timestamp;
        const playPromise = mediaRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => {
              // Handled: Browser policy or pending media state
            });
        }
      } catch (err) {
        console.warn("Media seek error:", err);
      }
    }
  };


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle speaker rename
  const handleSaveSpeaker = async (speakerId: number) => {
    if (!editingSpeakerName.trim()) return;
    try {
      await updateSpeaker(meeting.id, speakerId, editingSpeakerName.trim());
      setEditingSpeakerId(null);
      onRefreshMeeting();
    } catch (e: any) {
      alert(`Could not rename speaker: ${e.message}`);
    }
  };

  // Handle Ask Meeting
  const handleAskMeeting = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userQuery.trim() || isAsking) return;

    const q = userQuery.trim();
    setUserQuery('');
    setQaMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setIsAsking(true);

    try {
      const response = await askMeetingQuestion(meeting.id, q);
      setQaMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: response.answer,
          evidence: response.evidence
        }
      ]);
    } catch (err: any) {
      setQaMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `Error answering question: ${err.message}` }
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Meeting Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400 mb-1">
              <span>{meeting.project_name || 'Autonomous Driving Project'}</span>
              <span>•</span>
              <span>Meeting #{meeting.id}</span>
              <span>•</span>
              <span>{new Date(meeting.meeting_date).toLocaleDateString()}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-100">{meeting.title}</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{meeting.agenda || 'Meeting sync and deliverables review'}</p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Actionability score pill */}
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Actionability Score</div>
              <div className="text-xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                {meeting.actionability_score}/100
              </div>
            </div>

            {/* Quick Export MOM Dropdown */}
            <a
              href={`/api/meetings/${meeting.id}/export/pdf`}
              download
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Split Screen Workspace: LEFT = Media Player | RIGHT = Synchronized Evidence Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN: Video/Audio Player ================= */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Media Screen Area */}
            <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden group">
              {meeting.media_path ? (
                meeting.media_type === 'audio' ? (
                  <div className="flex flex-col items-center justify-center p-6 space-y-3 w-full h-full bg-gradient-to-b from-slate-900 to-slate-950">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Volume2 className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-200">Audio Recording</span>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">16kHz High-Fidelity Capture</p>
                    </div>
                    {/* Simulated Waveform Bars */}
                    <div className="flex items-center space-x-1 h-8 pt-2">
                      {[40, 70, 30, 85, 60, 95, 45, 80, 55, 90, 35, 75, 50, 85, 65, 30, 90].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: isPlaying ? `${h}%` : '20%' }}
                          className="w-1 bg-indigo-500/70 rounded-full transition-all duration-300"
                        />
                      ))}
                    </div>
                    <audio
                      ref={mediaRef as any}
                      src={`/api/meetings/${meeting.id}/media`}
                      onTimeUpdate={() => {
                        if (mediaRef.current) setCurrentTime(mediaRef.current.currentTime);
                      }}
                      onLoadedMetadata={() => {
                        if (mediaRef.current && mediaRef.current.duration) setDuration(mediaRef.current.duration);
                      }}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <video
                    ref={mediaRef as any}
                    src={`/api/meetings/${meeting.id}/media`}
                    onTimeUpdate={() => {
                      if (mediaRef.current) setCurrentTime(mediaRef.current.currentTime);
                    }}
                    onLoadedMetadata={() => {
                      if (mediaRef.current && mediaRef.current.duration) setDuration(mediaRef.current.duration);
                    }}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                /* Demo Simulation Player (When running in Demo Mode without physical file) */
                <div className="flex flex-col items-center justify-center p-6 space-y-3 w-full h-full bg-gradient-to-b from-indigo-950/40 to-slate-950">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center shadow-lg border border-indigo-500/30">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="text-center px-4">
                    <span className="text-xs font-bold text-slate-100">Live Grounded Media Replay</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Seek to any evidence statement to verify spoken claims and dialogue.
                    </p>
                  </div>
                  {/* Waveform representation */}
                  <div className="flex items-center space-x-1.5 h-10 pt-2">
                    {[30, 60, 45, 90, 75, 40, 85, 100, 70, 50, 80, 65, 95, 40, 60, 85, 30].map((h, i) => (
                      <div
                        key={i}
                        style={{ height: isPlaying ? `${h}%` : '25%' }}
                        className="w-1.5 bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-full transition-all duration-300"
                      />
                    ))}
                  </div>
                  {/* Audio mock element */}
                  <audio
                    ref={mediaRef as any}
                    onTimeUpdate={() => {
                      if (mediaRef.current) setCurrentTime(mediaRef.current.currentTime);
                    }}
                    className="hidden"
                  />
                </div>
              )}

              {/* Active Speaker HUD Overlay */}
              {currentSegment && (
                <div className="absolute top-3 left-3 flex items-center space-x-2 bg-slate-900/90 border border-slate-700 px-3 py-1 rounded-full backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-slate-200">{currentSegment.speaker_label}</span>
                </div>
              )}
            </div>

            {/* Custom Media Controls Bar */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-3">
              {/* Progress Slider */}
              <div className="flex items-center space-x-3">
                <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={duration || 30}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[11px] font-mono text-slate-400 w-10">
                  {formatTime(duration || 30)}
                </span>
              </div>

              {/* Play / Pause / Reset Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      if (mediaRef.current) {
                        if (isPlaying) mediaRef.current.pause();
                        else mediaRef.current.play();
                        setIsPlaying(!isPlaying);
                      } else {
                        setIsPlaying(!isPlaying);
                      }
                    }}
                    className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/30"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  <button
                    onClick={() => seekTo(0)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    title="Rewind to start"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Click any evidence to seek</span>
                </div>
              </div>
            </div>
          </div>

          {/* Media Provenance & Source Inspector Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Media Sources & Validation</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                meeting.media_validation_status === 'warning'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {meeting.media_validation_status === 'warning' ? 'Duration Notice' : 'Grounded & Verified'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/80">
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Video Source</div>
                <div className="font-semibold text-slate-200 truncate mt-0.5" title={meeting.video_source || meeting.media_path || 'None'}>
                  {meeting.video_source || (meeting.media_type === 'video' ? 'Recorded Video File' : 'Audio-Only')}
                </div>
                {meeting.video_duration ? (
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Duration: {formatTime(meeting.video_duration)}
                  </div>
                ) : null}
              </div>

              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Audio Source</div>
                <div className="font-semibold text-slate-200 truncate mt-0.5" title={meeting.audio_source || 'Extracted'}>
                  {meeting.audio_source || (meeting.audio_path ? 'External WAV Audio' : 'Extracted from Video')}
                </div>
                {meeting.audio_duration ? (
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Duration: {formatTime(meeting.audio_duration)}
                  </div>
                ) : null}
              </div>
            </div>

            {meeting.media_validation_message && (
              <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/50">
                {meeting.media_validation_message}
              </p>
            )}
          </div>

          {/* Speakers Identification Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Identified Speakers</span>
              <span className="text-[11px] text-slate-400">{meeting.speakers.length} participants</span>
            </div>
            <div className="space-y-2">
              {meeting.speakers.map((spk) => (
                <div key={spk.id} className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 px-3 py-2 rounded-xl text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[10px]">
                      {spk.display_name.charAt(0)}
                    </div>
                    {editingSpeakerId === spk.id ? (
                      <input
                        type="text"
                        value={editingSpeakerName}
                        onChange={(e) => setEditingSpeakerName(e.target.value)}
                        className="bg-slate-800 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <div>
                        <div className="font-semibold text-slate-100">{spk.display_name}</div>
                        <div className="text-[10px] text-slate-400">{spk.role || spk.original_label}</div>
                      </div>
                    )}
                  </div>

                  <div>
                    {editingSpeakerId === spk.id ? (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleSaveSpeaker(spk.id)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingSpeakerId(null)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingSpeakerId(spk.id);
                          setEditingSpeakerName(spk.display_name);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-400"
                        title="Rename Speaker"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Synchronized Intelligence Tabs ================= */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[620px]">
          {/* Tab Navigation Bar */}
          <div className="flex items-center space-x-1 p-2 bg-slate-950/80 border-b border-slate-800 overflow-x-auto">
            {[
              { id: 'transcript', label: 'Transcript', icon: FileText, badge: meeting.segments.length },
              { id: 'tasks', label: 'Action Items', icon: CheckSquare, badge: meeting.tasks.length },
              { id: 'decisions', label: 'Decisions', icon: Scale, badge: meeting.decisions.length },
              { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle, badge: meeting.conflicts.length, alert: meeting.conflicts.length > 0 },
              { id: 'mom', label: 'Automated MOM', icon: FileText },
              { id: 'ask', label: 'Ask Meeting', icon: MessageSquare, highlight: true },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    tab.highlight && isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : isActive
                      ? 'bg-slate-800 text-indigo-400 border border-slate-700/80'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      tab.alert ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Panes */}
          <div className="p-6 flex-1 overflow-y-auto max-h-[680px]">
            {/* 1. TRANSCRIPT TAB */}
            {activeTab === 'transcript' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                  <span>Preserved Timestamps & Dialogue</span>
                  <span>Click any line to jump video</span>
                </div>

                <div className="space-y-2.5">
                  {meeting.segments.map((seg) => {
                    const isPlayingCurrent = currentTime >= seg.start_time && currentTime <= seg.end_time;
                    const isJumpTarget = highlightedTime !== null && Math.abs(seg.start_time - highlightedTime) < 1.5;

                    return (
                      <div
                        key={seg.id}
                        onClick={() => seekTo(seg.start_time)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isPlayingCurrent || isJumpTarget
                            ? 'bg-indigo-500/15 border-indigo-500 shadow-md segment-active'
                            : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-indigo-400">{seg.speaker_label}</span>
                          <span className="font-mono text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {formatTime(seg.start_time)} - {formatTime(seg.end_time)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">{seg.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. ACTION ITEMS TAB */}
            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                  <span>{meeting.tasks.length} Extracted Deliverables</span>
                  <span className="text-emerald-400 font-semibold">100% Traceable</span>
                </div>

                <div className="space-y-3">
                  {meeting.tasks.map((task) => (
                    <div key={task.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-slate-100">{task.title}</h4>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              task.status === 'Completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : task.status === 'Needs Clarification'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          task.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300' :
                          task.priority === 'High' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {task.priority} Priority
                        </span>
                      </div>

                      {/* Owner & Deadline chips */}
                      <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                        <div className="flex items-center space-x-1.5 text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          <User className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Owner: <strong className={task.owner === 'Unassigned' ? 'text-amber-400' : 'text-slate-100'}>{task.owner}</strong></span>
                        </div>

                        <div className="flex items-center space-x-1.5 text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Due: <strong className="text-slate-100">{task.deadline_text || 'Not specified'}</strong></span>
                          {task.deadline_status === 'Ambiguous' && (
                            <span className="text-[10px] text-amber-400 ml-1 font-mono">(Ambiguous)</span>
                          )}
                        </div>
                      </div>

                      {/* Evidence citation pill with Video Jump */}
                      {task.evidence_quote && (
                        <div
                          onClick={() => seekTo(task.evidence_timestamp || 0)}
                          className="flex items-center justify-between bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-500/30 px-3 py-2 rounded-lg text-xs cursor-pointer transition-all group"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-indigo-400 font-bold">
                              [{formatTime(task.evidence_timestamp || 0)}]
                            </span>
                            <span className="text-slate-300 italic">"{task.evidence_quote}"</span>
                          </div>
                          <span className="text-[10px] font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center space-x-1">
                            <span>Jump to evidence</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. DECISIONS TAB */}
            {activeTab === 'decisions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                  <span>Final & Undecided Matters</span>
                  <span>Decision Memory Enabled</span>
                </div>

                <div className="space-y-3">
                  {meeting.decisions.map((dec) => (
                    <div key={dec.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400">{dec.topic || 'Architecture Decision'}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          dec.status === 'Final'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {dec.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-100 font-medium">{dec.decision}</p>

                      {/* Decision Drift alert if superseding previous decision */}
                      {dec.supersedes_previous_decision && (
                        <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 space-y-1">
                          <div className="font-bold flex items-center space-x-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Decision Drift Detected:</span>
                          </div>
                          <p className="text-[11px] text-slate-300">{dec.drift_reason}</p>
                        </div>
                      )}

                      {/* Evidence button */}
                      {dec.evidence_quote && (
                        <div
                          onClick={() => seekTo(dec.evidence_timestamp || 0)}
                          className="flex items-center justify-between bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
                        >
                          <span className="text-slate-400 font-mono text-[11px]">
                            Evidence: [{formatTime(dec.evidence_timestamp || 0)}]
                          </span>
                          <span className="text-indigo-400 font-semibold text-[11px]">Jump to Video</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. CONFLICTS TAB (DUAL EVIDENCE JUMP!) */}
            {activeTab === 'conflicts' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>
                    Contradictory statements detected. Both perspectives are preserved with evidence timestamps.
                  </span>
                </div>

                <div className="space-y-4">
                  {meeting.conflicts.map((conf) => (
                    <div key={conf.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-100">{conf.topic}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {conf.status}
                        </span>
                      </div>

                      {/* Two conflicting statements side by side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Statement A */}
                        <div
                          onClick={() => seekTo(conf.timestamp_a || 0)}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all space-y-1 group"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-300">{conf.speaker_a || 'Speaker A'}</span>
                            <span className="font-mono text-indigo-400 group-hover:underline">
                              [{formatTime(conf.timestamp_a || 0)}]
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 italic">"{conf.statement_a}"</p>
                          <span className="text-[10px] text-indigo-400 font-semibold block pt-1">
                            Click to hear Statement A
                          </span>
                        </div>

                        {/* Statement B */}
                        <div
                          onClick={() => seekTo(conf.timestamp_b || 0)}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all space-y-1 group"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-300">{conf.speaker_b || 'Speaker B'}</span>
                            <span className="font-mono text-indigo-400 group-hover:underline">
                              [{formatTime(conf.timestamp_b || 0)}]
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 italic">"{conf.statement_b}"</p>
                          <span className="text-[10px] text-indigo-400 font-semibold block pt-1">
                            Click to hear Statement B
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        <strong>Resolution Directive:</strong> {conf.resolution}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. AUTOMATED MOM TAB */}
            {activeTab === 'mom' && (
              <div className="space-y-6">
                {/* MOM Header with Export Actions */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Minutes of Meeting (MOM)</h3>
                    <p className="text-xs text-slate-400">Generated automatically from verifiable discussion items</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={`/api/meetings/${meeting.id}/export/pdf`}
                      download
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                    >
                      PDF
                    </a>
                    <a
                      href={`/api/meetings/${meeting.id}/export/markdown`}
                      download
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                    >
                      Markdown
                    </a>
                    <a
                      href={`/api/meetings/${meeting.id}/export/csv`}
                      download
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                    >
                      CSV
                    </a>
                  </div>
                </div>

                {meeting.mom_json ? (
                  <div className="space-y-5 text-xs text-slate-300">
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                      <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Executive Summary</span>
                      <p className="leading-relaxed">{meeting.mom_json.executive_summary}</p>
                    </div>

                    {/* Action Items Table */}
                    <div className="space-y-2">
                      <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Action Items Table</span>
                      <div className="border border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                            <tr>
                              <th className="p-3">Task</th>
                              <th className="p-3">Owner</th>
                              <th className="p-3">Deadline</th>
                              <th className="p-3">Priority</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {meeting.mom_json.action_items?.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-800/30">
                                <td className="p-3 font-medium text-slate-100">{item.task}</td>
                                <td className="p-3 font-semibold text-indigo-400">{item.owner}</td>
                                <td className="p-3">{item.deadline}</td>
                                <td className="p-3">{item.priority}</td>
                                <td className="p-3">{item.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">MOM generation in progress...</p>
                )}
              </div>
            )}

            {/* 6. GROUNDED ASK THE MEETING CHAT TAB */}
            {activeTab === 'ask' && (
              <div className="flex flex-col h-[560px]">
                <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Grounded Assistant</h3>
                    <p className="text-[11px] text-slate-400">Answers are strictly backed by meeting recording evidence</p>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Zero-Hallucination
                  </span>
                </div>

                {/* Conversation messages scroll area */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {qaMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.text}</p>
                      </div>

                      {/* Verifiable Evidence Chips below AI message */}
                      {msg.evidence && msg.evidence.length > 0 && (
                        <div className="mt-2 space-y-1.5 max-w-[85%]">
                          {msg.evidence.map((ev, evIdx) => (
                            <button
                              key={evIdx}
                              onClick={() => seekTo(ev.timestamp)}
                              className="flex items-center space-x-2 text-[11px] bg-slate-950 hover:bg-slate-800 border border-indigo-500/30 px-2.5 py-1 rounded-lg text-slate-300 transition-all text-left w-full"
                            >
                              <span className="font-mono font-bold text-indigo-400">
                                [{formatTime(ev.timestamp)}]
                              </span>
                              <span className="truncate italic">"{ev.quote}"</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {isAsking && (
                    <div className="flex items-center space-x-2 text-xs text-indigo-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 w-fit">
                      <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      <span>Searching meeting transcript & extracted evidence...</span>
                    </div>
                  )}
                </div>

                {/* Question Input form */}
                <form onSubmit={handleAskMeeting} className="pt-3 border-t border-slate-800 flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. Who owns dataset preparation? What deadlines were mentioned?"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isAsking || !userQuery.trim()}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
