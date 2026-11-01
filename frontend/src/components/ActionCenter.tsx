import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Check, 
  AlertCircle, 
  Edit2, 
  History, 
  ChevronRight,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Task } from '../types';
import { fetchTasks, updateTask } from '../api/client';

interface ActionCenterProps {
  onSelectMeetingTask?: (meetingId: number, timestamp: number) => void;
}

export const ActionCenter: React.FC<ActionCenterProps> = ({ onSelectMeetingTask }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');

  // Edit Task Modal State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editOwner, setEditOwner] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editNote, setEditNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await fetchTasks({
        search: search || undefined,
        status: statusFilter || undefined,
        owner: ownerFilter || undefined
      });
      setTasks(data);
    } catch (e: any) {
      console.error('Failed to load tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [search, statusFilter, ownerFilter]);

  const handleOpenEdit = (t: Task) => {
    setEditingTask(t);
    setEditOwner(t.owner);
    setEditStatus(t.status);
    setEditPriority(t.priority);
    setEditDeadline(t.deadline_text || '');
    setEditNote('');
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;
    try {
      setIsSaving(true);
      await updateTask(editingTask.id, {
        owner: editOwner,
        status: editStatus,
        priority: editPriority,
        deadline_text: editDeadline,
        note: editNote || 'Updated via Action Center'
      });
      setEditingTask(null);
      await loadTasks();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickToggleComplete = async (t: Task) => {
    const newStatus = t.status === 'Completed' ? 'In Progress' : 'Completed';
    try {
      await updateTask(t.id, {
        status: newStatus,
        note: `Quick toggle to ${newStatus}`
      });
      await loadTasks();
    } catch (err: any) {
      alert(`Failed to update: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Execution Center</span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Action Items & Deliverables</h2>
          <p className="text-xs text-slate-400">
            Track, reassign, update deadlines, and maintain full audit traceability for all commitments.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            {tasks.length} total tasks
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Blocked">Blocked</option>
          <option value="Completed">Completed</option>
          <option value="Needs Clarification">Needs Clarification</option>
        </select>

        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Owners</option>
          <option value="Rahul">Rahul</option>
          <option value="Priya">Priya</option>
          <option value="Alex">Alex</option>
          <option value="Unassigned">Unassigned</option>
        </select>
      </div>

      {/* Tasks Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-indigo-400">Loading action items...</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No action items match current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4 w-10"></th>
                  <th className="p-4">Deliverable / Task</th>
                  <th className="p-4">Owner</th>
                  <th className="p-4">Deadline</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Evidence</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/30 transition-all">
                    {/* Checkbox toggle */}
                    <td className="p-4">
                      <button
                        onClick={() => handleQuickToggleComplete(task)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          task.status === 'Completed'
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-700 hover:border-indigo-500 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    {/* Task Title */}
                    <td className="p-4">
                      <div className={`font-bold ${task.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                        {task.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{task.description}</div>
                    </td>

                    {/* Owner */}
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                        task.owner === 'Unassigned'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                      }`}>
                        <User className="w-3 h-3" />
                        <span>{task.owner}</span>
                      </span>
                    </td>

                    {/* Deadline */}
                    <td className="p-4">
                      <div className="flex items-center space-x-1 font-mono text-slate-300">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{task.deadline_text || 'Not set'}</span>
                      </div>
                      {task.deadline_status === 'Ambiguous' && (
                        <span className="text-[10px] text-amber-400 font-mono">(Ambiguous)</span>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        task.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300' :
                        task.priority === 'High' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {task.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        task.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : task.status === 'Blocked'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : task.status === 'Needs Clarification'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {task.status}
                      </span>
                    </td>

                    {/* Evidence quote */}
                    <td className="p-4">
                      {task.evidence_quote ? (
                        <button
                          onClick={() => {
                            if (onSelectMeetingTask && task.meeting_id) {
                              onSelectMeetingTask(task.meeting_id, task.evidence_timestamp || 0);
                            }
                          }}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 italic truncate max-w-[180px] block text-left"
                          title="Click to jump to meeting recording"
                        >
                          "{task.evidence_quote}"
                        </button>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    {/* Edit button */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                        title="Edit Task & Audit Trail"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Edit Action Item</h3>
            <p className="text-xs text-slate-400 font-medium">{editingTask.title}</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Owner</label>
                <input
                  type="text"
                  value={editOwner}
                  onChange={(e) => setEditOwner(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Completed">Completed</option>
                    <option value="Needs Clarification">Needs Clarification</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Deadline</label>
                <input
                  type="text"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Audit Log Note (Reason for change)</label>
                <input
                  type="text"
                  placeholder="e.g. Reassigned per team sync agreement"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Audit history snippet */}
              {editingTask.history && editingTask.history.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit History</span>
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                    {editingTask.history.map((h, i) => (
                      <div key={i} className="text-[10px] text-slate-400 bg-slate-950 p-1.5 rounded border border-slate-800/80">
                        <strong>{h.field_changed}</strong>: {h.old_value || 'None'} → {h.new_value} ({h.note})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
