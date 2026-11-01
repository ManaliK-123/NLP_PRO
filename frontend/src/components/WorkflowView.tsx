import React, { useState, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitMerge, CheckSquare, Scale, AlertTriangle, Clock, User, Sparkles, ExternalLink, X } from 'lucide-react';
import { fetchMeetingWorkflow } from '../api/client';

// Custom Node Component for React Flow
const CustomWorkflowNode = ({ data }: any) => {
  const isTask = data.category === 'task';
  const isDecision = data.category === 'decision';
  const isConflict = data.category === 'conflict';

  return (
    <div className={`px-4 py-3 rounded-2xl shadow-xl border min-w-[240px] text-xs backdrop-blur-md transition-all ${
      isTask
        ? data.status === 'Completed'
          ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-100'
          : data.status === 'Blocked'
          ? 'bg-rose-950/70 border-rose-500/50 text-rose-100'
          : data.status === 'Needs Clarification'
          ? 'bg-amber-950/70 border-amber-500/40 text-amber-100'
          : 'bg-indigo-950/70 border-indigo-500/40 text-indigo-100'
        : isDecision
        ? data.status === 'Final'
          ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-100'
          : 'bg-amber-950/70 border-amber-500/40 text-amber-100'
        : 'bg-rose-950/70 border-rose-500/40 text-rose-100'
    }`}>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-indigo-500" />

      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[10px]">
          {isTask && <CheckSquare className="w-3.5 h-3.5" />}
          {isDecision && <Scale className="w-3.5 h-3.5" />}
          {isConflict && <AlertTriangle className="w-3.5 h-3.5" />}
          <span>{data.category}</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-900/60 font-semibold">
          {data.status}
        </span>
      </div>

      <div className="font-bold text-slate-100 text-xs mb-1 truncate">{data.label}</div>

      {data.owner && (
        <div className="flex items-center space-x-1 text-[11px] text-slate-300">
          <User className="w-3 h-3 text-indigo-400" />
          <span>{data.owner}</span>
        </div>
      )}

      {data.deadline && data.deadline !== 'None' && (
        <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono mt-0.5">
          <Clock className="w-2.5 h-2.5" />
          <span>{data.deadline}</span>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-indigo-500" />
    </div>
  );
};

const nodeTypes = {
  customWorkflowNode: CustomWorkflowNode
};

interface WorkflowViewProps {
  meetingId?: number;
  onNavigateToTimestamp?: (ts: number) => void;
}

export const WorkflowView: React.FC<WorkflowViewProps> = ({ meetingId = 1, onNavigateToTimestamp }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkflow() {
      try {
        setLoading(true);
        const graph = await fetchMeetingWorkflow(meetingId);
        setNodes(graph.nodes);
        setEdges(graph.edges);
      } catch (e: any) {
        console.error('Failed to load workflow graph:', e);
      } finally {
        setLoading(false);
      }
    }
    loadWorkflow();
  }, [meetingId]);

  const onNodeClick = (_: any, node: any) => {
    setSelectedNode(node);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <GitMerge className="w-4 h-4" />
            <span>DAG Execution Graph</span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Interactive Workflow</h2>
          <p className="text-xs text-slate-400">
            Causal pipeline of deliverables, decisions, blockers, and dependencies.
          </p>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center space-x-3 text-xs bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-slate-300">Task</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Decision</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-300">Conflict / Blocker</span>
          </div>
        </div>
      </div>

      {/* Main React Flow Graph Canvas */}
      <div className="h-[620px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
        {loading ? (
          <div className="flex items-center justify-center h-full space-x-3 text-indigo-400 text-xs">
            <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Computing workflow dependency layout...</span>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-950"
          >
            <Background color="#1e293b" gap={20} />
            <Controls className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden fill-slate-200" />
            <MiniMap
              nodeColor={() => '#6366f1'}
              maskColor="rgba(15, 23, 42, 0.7)"
              className="bg-slate-900 border border-slate-800 rounded-lg"
            />
          </ReactFlow>
        )}

        {/* Selected Node Evidence Inspector Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Node Evidence</span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-100">{selectedNode.data.label}</h4>
              <p className="text-xs text-slate-400 mt-1">{selectedNode.data.detail || selectedNode.data.status}</p>
            </div>

            {selectedNode.data.owner && (
              <div className="text-xs text-slate-300">
                <strong>Assigned to:</strong> {selectedNode.data.owner}
              </div>
            )}

            {selectedNode.data.evidence_quote && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-indigo-500/20 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Meeting Evidence</span>
                <p className="text-xs text-slate-300 italic">"{selectedNode.data.evidence_quote}"</p>
                <div className="text-[10px] font-mono text-indigo-400 pt-1">
                  Timestamp: {selectedNode.data.evidence_timestamp}s
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
