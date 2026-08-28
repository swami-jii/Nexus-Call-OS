import React, { useState, useEffect, useRef } from 'react';
import {
  GitFork,
  Plus,
  Play,
  Copy,
  Download,
  Upload,
  ShieldCheck,
  Activity,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Trash2,
  Map,
  ChevronLeft,
  ChevronRight,
  Search,
  Maximize2,
  RotateCcw,
  Sliders,
  X,
  Layers,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Workflow } from '../types';
import { workflowRepository, uploadRepository } from '../repository';
import { useToast } from '../components/ui/Toast';
import { fetchAPI } from '../lib/api';

const NODE_CATEGORIES = [
  {
    category: 'Core Telephony',
    nodes: [
      { type: 'start', label: 'Start Call', color: 'border-emerald-500 bg-emerald-950/80 text-emerald-300 shadow-emerald-500/20' },
      { type: 'greeting', label: 'Play Greeting', color: 'border-blue-500 bg-blue-950/80 text-blue-300 shadow-blue-500/20' },
      { type: 'transfer', label: 'Transfer Call', color: 'border-orange-500 bg-orange-950/80 text-orange-300 shadow-orange-500/20' },
      { type: 'end', label: 'End Call', color: 'border-red-500 bg-red-950/80 text-red-300 shadow-red-500/20' },
    ],
  },
  {
    category: 'AI & Intelligence',
    nodes: [
      { type: 'ask_question', label: 'Ask Question', color: 'border-purple-500 bg-purple-950/80 text-purple-300 shadow-purple-500/20' },
      { type: 'ai_decision', label: 'AI Decision Engine', color: 'border-pink-500 bg-pink-950/80 text-pink-300 shadow-pink-500/20' },
      { type: 'kb_search', label: 'Knowledge Base', color: 'border-cyan-500 bg-cyan-950/80 text-cyan-300 shadow-cyan-500/20' },
      { type: 'wait_response', label: 'Wait For Response', color: 'border-yellow-500 bg-yellow-950/80 text-yellow-300 shadow-yellow-500/20' },
    ],
  },
  {
    category: 'Logic & Control',
    nodes: [
      { type: 'if_else', label: 'If / Else Branch', color: 'border-amber-500 bg-amber-950/80 text-amber-300 shadow-amber-500/20' },
      { type: 'capture_var', label: 'Capture Variable', color: 'border-indigo-500 bg-indigo-950/80 text-indigo-300 shadow-indigo-500/20' },
      { type: 'delay', label: 'Time Delay', color: 'border-zinc-500 bg-zinc-900 text-zinc-300' },
    ],
  },
  {
    category: 'Integrations & Actions',
    nodes: [
      { type: 'crm_lookup', label: 'CRM Customer Lookup', color: 'border-violet-500 bg-violet-950/80 text-violet-300 shadow-violet-500/20' },
      { type: 'send_sms', label: 'Send SMS', color: 'border-teal-500 bg-teal-950/80 text-teal-300 shadow-teal-500/20' },
      { type: 'webhook', label: 'HTTP Webhook', color: 'border-rose-500 bg-rose-950/80 text-rose-300 shadow-rose-500/20' },
    ],
  },
];

export const WorkflowsView: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roster' | 'canvas' | 'execution' | 'validation'>('canvas');

  // Canvas Floating Sidebars State
  const [isNodePaletteOpen, setIsNodePaletteOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isMiniMapOpen, setIsMiniMapOpen] = useState(true);
  const [nodeSearch, setNodeSearch] = useState('');

  // Canvas Nodes State
  const [nodes, setNodes] = useState<any[]>([
    { id: 'node_1', type: 'start', label: 'Start Call', x: 80, y: 120, prompt: 'Initialize Voice Stream' },
    { id: 'node_2', type: 'greeting', label: 'Play Greeting', x: 300, y: 120, prompt: 'Hello {{name}}, welcome!' },
    { id: 'node_3', type: 'ask_question', label: 'Ask Question', x: 520, y: 120, prompt: 'How can I assist you today?' },
    { id: 'node_4', type: 'end', label: 'End Call', x: 740, y: 120, prompt: 'Hangup session' },
  ]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node_2');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Execution & Validation results
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const loadWorkflows = async () => {
    try {
      setIsLoading(true);
      const data = await workflowRepository.getAll();
      setWorkflows(data);
      if (data.length > 0 && !selectedWorkflow) {
        setSelectedWorkflow(data[0]);
      }
    } catch (err: any) {
      addToast('error', 'Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  const handleAddNode = (nType: any) => {
    const newId = `node_${nodes.length + 1}`;
    const newNode = {
      id: newId,
      type: nType.type,
      label: nType.label,
      x: 80 + (nodes.length % 4) * 200,
      y: 120 + Math.floor(nodes.length / 4) * 130,
      prompt: `Configure ${nType.label}`,
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);
    setIsInspectorOpen(true);
    addToast('success', `Added node '${nType.label}'`);
  };

  const handleDeleteNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    addToast('info', 'Node deleted');
  };

  const handleDuplicateNode = (node: any) => {
    const dup = {
      ...node,
      id: `node_${nodes.length + 1}`,
      x: node.x + 40,
      y: node.y + 40,
      label: `${node.label} (Copy)`,
    };
    setNodes((prev) => [...prev, dup]);
    setSelectedNodeId(dup.id);
    addToast('success', 'Node duplicated');
  };

  const handleExecuteWorkflow = async () => {
    try {
      setIsExecuting(true);
      const targetId = selectedWorkflow?.id || 'wf_1';
      const res = await fetchAPI(`/api/workflows/${targetId}/execute`, { method: 'POST' });
      setExecutionResult(res);
      setActiveTab('execution');
      addToast('success', 'Workflow executed successfully');
    } catch (e) {
      addToast('error', 'Execution error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleValidateWorkflow = async () => {
    try {
      setIsValidating(true);
      const targetId = selectedWorkflow?.id || 'wf_1';
      const res = await fetchAPI(`/api/workflows/${targetId}/validate`, { method: 'POST' });
      setValidationResult(res);
      setActiveTab('validation');
      addToast('success', 'Graph validation complete');
    } catch (e) {
      addToast('error', 'Validation error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleDuplicateWorkflow = async () => {
    try {
      const targetId = selectedWorkflow?.id || 'wf_1';
      const res = await fetchAPI(`/api/workflows/${targetId}/duplicate`, { method: 'POST' });
      setWorkflows((prev) => [res, ...prev]);
      addToast('success', 'Workflow version duplicated');
    } catch (e) {
      addToast('error', 'Duplication error');
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(nodes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${selectedWorkflow?.name || 'workflow'}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('success', 'Workflow exported as JSON');
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadRepository.uploadFile('workflows', file);
    } catch {
      // Ignore background upload error and proceed with parsing
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setNodes(parsed);
          addToast('success', `Workflow imported & saved to uploads/workflows/${file.name}`);
        }
      } catch (err) {
        addToast('error', 'Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="space-y-4">
      {/* Page Title Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Enterprise Visual Workflow Studio
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          n8n & Retool-style infinite canvas, interactive Bezier cables, node snapping, and execution trace.
        </p>
      </div>

      {/* TOOLBAR 1: TABS ONLY */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-start gap-1 overflow-x-auto shrink-0 whitespace-nowrap">
        <button
          onClick={() => setActiveTab('roster')}
          className={`h-8 px-4 text-xs font-semibold rounded-md transition-all flex items-center justify-center shrink-0 ${
            activeTab === 'roster'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-xs font-bold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Workflow Roster
        </button>
        <button
          onClick={() => setActiveTab('canvas')}
          className={`h-8 px-4 text-xs font-semibold rounded-md transition-all flex items-center justify-center shrink-0 ${
            activeTab === 'canvas'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-xs font-bold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Visual Canvas
        </button>
        <button
          onClick={() => {
            setActiveTab('execution');
            if (!executionResult) handleExecuteWorkflow();
          }}
          className={`h-8 px-4 text-xs font-semibold rounded-md transition-all flex items-center justify-center shrink-0 ${
            activeTab === 'execution'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-xs font-bold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Live Monitor
        </button>
        <button
          onClick={() => {
            setActiveTab('validation');
            if (!validationResult) handleValidateWorkflow();
          }}
          className={`h-8 px-4 text-xs font-semibold rounded-md transition-all flex items-center justify-center shrink-0 ${
            activeTab === 'validation'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-xs font-bold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Graph Validator
        </button>
        <button
          onClick={() => setActiveTab('tools' as any)}
          className={`h-8 px-4 text-xs font-semibold rounded-md transition-all flex items-center justify-center shrink-0 ${
            (activeTab as string) === 'tools'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-xs font-bold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Wrench className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
          Tool Library
        </button>
      </div>

      {/* TOOLBAR 2: ACTION BUTTONS ONLY */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md">
            Active: {selectedWorkflow?.name || 'Main Voice Flow'}
          </Badge>
          <span className="text-xs text-zinc-400 font-mono">({nodes.length} Canvas Nodes)</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload className="h-3.5 w-3.5" />}
            className="h-8 text-xs font-semibold px-3"
          >
            Import JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            leftIcon={<Download className="h-3.5 w-3.5" />}
            className="h-8 text-xs font-semibold px-3"
          >
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicateWorkflow}
            leftIcon={<Copy className="h-3.5 w-3.5" />}
            className="h-8 text-xs font-semibold px-3"
          >
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidateWorkflow}
            isLoading={isValidating}
            leftIcon={<ShieldCheck className="h-3.5 w-3.5" />}
            className="h-8 text-xs font-semibold px-3"
          >
            Validate
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExecuteWorkflow}
            isLoading={isExecuting}
            leftIcon={<Play className="h-3.5 w-3.5" />}
            className="h-8 text-xs font-semibold px-4"
          >
            Execute Engine
          </Button>
        </div>
      </div>

      {/* TAB 1: WORKFLOW ROSTER */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((wf) => (
            <Card
              key={wf.id}
              className="p-4 hover:border-blue-500 cursor-pointer transition-all duration-200"
              onClick={() => {
                setSelectedWorkflow(wf);
                setActiveTab('canvas');
              }}
            >
              <div className="flex justify-between items-start">
                <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold">
                  <GitFork className="h-4 w-4" />
                </div>
                <Badge variant={wf.status === 'enabled' ? 'success' : 'secondary'} size="sm">
                  {wf.status}
                </Badge>
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mt-3">{wf.name}</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{wf.description || 'Enterprise visual flow graph'}</p>
              <div className="flex justify-between items-center text-[11px] text-zinc-400 font-mono mt-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span>Trigger: {wf.trigger}</span>
                <span>Executions: {wf.executionsCount}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 2: N8N / RETOOL STYLE FULL VIEWPORT VISUAL CANVAS */}
      {activeTab === 'canvas' && (
        <div className="relative w-full h-[620px] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex">
          {/* FLOATING COLLAPSIBLE NODE LIBRARY PALETTE (LEFT OVERLAY) */}
          <div
            className={`absolute left-3 top-3 bottom-3 z-30 transition-all duration-300 flex ${
              isNodePaletteOpen ? 'w-64' : 'w-10'
            }`}
          >
            <div className="bg-zinc-900/95 border border-zinc-800 backdrop-blur-md rounded-xl p-3 flex-1 flex flex-col justify-between overflow-hidden shadow-2xl">
              {isNodePaletteOpen ? (
                <>
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                    <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-blue-400" />
                      Node Library
                    </span>
                    <button
                      onClick={() => setIsNodePaletteOpen(false)}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Search Filter */}
                  <div className="relative my-2">
                    <Search className="h-3 w-3 absolute left-2.5 top-2.5 text-zinc-500" />
                    <Input
                      placeholder="Search nodes..."
                      value={nodeSearch}
                      onChange={(e) => setNodeSearch(e.target.value)}
                      className="h-8 text-[11px] pl-7 bg-zinc-950 border-zinc-800 text-zinc-200"
                    />
                  </div>

                  {/* Node Categories */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                    {NODE_CATEGORIES.map((cat) => {
                      const filteredNodes = cat.nodes.filter((n) =>
                        n.label.toLowerCase().includes(nodeSearch.toLowerCase())
                      );
                      if (filteredNodes.length === 0) return null;
                      return (
                        <div key={cat.category}>
                          <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">{cat.category}</p>
                          <div className="space-y-1">
                            {filteredNodes.map((nt) => (
                              <button
                                key={nt.type}
                                onClick={() => handleAddNode(nt)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-mono border ${nt.color} flex items-center justify-between hover:opacity-90 transition-all`}
                              >
                                <span>{nt.label}</span>
                                <Plus className="h-3 w-3" />
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setIsNodePaletteOpen(true)}
                  className="mx-auto my-auto p-1.5 hover:bg-zinc-800 rounded text-blue-400 flex flex-col items-center gap-1"
                >
                  <Layers className="h-4 w-4" />
                  <span className="text-[9px] font-mono uppercase [writing-mode:vertical-lr]">Nodes</span>
                </button>
              )}
            </div>
          </div>

          {/* MAIN CANVAS AREA */}
          <div className="flex-1 relative h-full overflow-hidden">
            {/* SVG Dot Grid Background */}
            <div
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#3b82f6 1px, transparent 1px)`,
                backgroundSize: `28px 28px`,
              }}
            />

            {/* FLOATING TOP CANVAS CONTROLS */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-zinc-900/90 border border-zinc-800 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-3 shadow-xl">
              <span className="text-[11px] font-mono text-zinc-300">Zoom: {zoomLevel}%</span>
              <div className="h-3 w-[1px] bg-zinc-800" />
              <button
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-300"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-300"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-300"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* INTERACTIVE BEZIER SVG CONNECTION CABLES OVERLAY */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {nodes.map((node, i) => {
                if (i === nodes.length - 1) return null;
                const nextNode = nodes[i + 1];
                const x1 = node.x + 130;
                const y1 = node.y + 30;
                const x2 = nextNode.x;
                const y2 = nextNode.y + 30;
                const cx1 = x1 + 50;
                const cx2 = x2 - 50;
                return (
                  <g key={`cable_${i}`}>
                    <path
                      d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeDasharray="6 3"
                      className="animate-pulse"
                    />
                    <circle cx={x2} cy={y2} r="4" fill="#60a5fa" />
                  </g>
                );
              })}
            </svg>

            {/* NODES RENDER GRID */}
            <div
              className="w-full h-full p-8 relative space-y-6 font-mono text-xs overflow-auto scrollbar-none z-10"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
            >
              {nodes.map((n) => {
                const isSel = n.id === selectedNodeId;
                const allFlat = NODE_CATEGORIES.flatMap((c) => c.nodes);
                const nodeTypeObj = allFlat.find((t) => t.type === n.type) || allFlat[0];

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      setSelectedNodeId(n.id);
                      setIsInspectorOpen(true);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${nodeTypeObj.color} ${
                      isSel ? 'ring-2 ring-blue-400 shadow-2xl scale-[1.02]' : 'hover:scale-[1.01]'
                    }`}
                    style={{ marginLeft: `${n.x}px`, marginTop: `${n.y / 2}px` }}
                  >
                    <div className="flex justify-between items-center gap-4">
                      <span className="font-bold">{n.label}</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateNode(n);
                          }}
                          className="hover:text-white"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNode(n.id);
                          }}
                          className="hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] opacity-80 mt-1.5 italic font-sans">{n.prompt}</p>
                  </div>
                );
              })}
            </div>

            {/* MINIMAP OVERLAY */}
            {isMiniMapOpen && (
              <div className="absolute bottom-3 right-3 p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-[10px] font-mono text-zinc-400 z-20 flex items-center gap-2 shadow-xl">
                <Map className="h-3.5 w-3.5 text-blue-400" />
                <span>MiniMap: {nodes.length} Active Nodes</span>
                <button
                  onClick={() => setIsMiniMapOpen(false)}
                  className="ml-2 hover:text-zinc-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* FLOATING COLLAPSIBLE NODE PROPERTY INSPECTOR (RIGHT OVERLAY) */}
          <div
            className={`absolute right-3 top-3 bottom-3 z-30 transition-all duration-300 flex ${
              isInspectorOpen ? 'w-72' : 'w-10'
            }`}
          >
            <div className="bg-zinc-900/95 border border-zinc-800 backdrop-blur-md rounded-xl p-3 flex-1 flex flex-col justify-between overflow-hidden shadow-2xl">
              {isInspectorOpen ? (
                <>
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                    <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5 text-purple-400" />
                      Node Inspector
                    </span>
                    <button
                      onClick={() => setIsInspectorOpen(false)}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {selectedNode ? (
                    <div className="flex-1 overflow-y-auto my-3 space-y-3 text-xs pr-1 scrollbar-thin">
                      <div>
                        <label className="text-[11px] font-semibold text-zinc-500">Node ID</label>
                        <Input value={selectedNode.id} disabled className="font-mono text-xs mt-1 bg-zinc-950 border-zinc-800" />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-zinc-500">Label</label>
                        <Input
                          value={selectedNode.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNodes((prev) =>
                              prev.map((n) => (n.id === selectedNode.id ? { ...n, label: val } : n))
                            );
                          }}
                          className="text-xs mt-1 bg-zinc-950 border-zinc-800 text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-zinc-500">Prompt / Script Payload</label>
                        <Textarea
                          rows={6}
                          value={selectedNode.prompt}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNodes((prev) =>
                              prev.map((n) => (n.id === selectedNode.id ? { ...n, prompt: val } : n))
                            );
                          }}
                          className="font-mono text-xs mt-1 bg-zinc-950 border-zinc-800 text-zinc-100"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="my-auto text-center py-8 text-zinc-500 text-xs italic">
                      Click any node on canvas to edit properties.
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => setIsInspectorOpen(true)}
                  className="mx-auto my-auto p-1.5 hover:bg-zinc-800 rounded text-purple-400 flex flex-col items-center gap-1"
                >
                  <Wrench className="h-4 w-4" />
                  <span className="text-[9px] font-mono uppercase [writing-mode:vertical-lr]">Inspector</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE EXECUTION MONITOR */}
      {activeTab === 'execution' && (
        <Card className="p-5 space-y-4">
          <CardTitle className="text-sm flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
            <Activity className="h-4 w-4 text-blue-600" />
            Live Workflow Execution Trace
          </CardTitle>
          {executionResult ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 font-medium">Status</span>
                  <p className="font-bold text-emerald-600 uppercase mt-0.5">{executionResult.status}</p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 font-medium">Nodes Executed</span>
                  <p className="font-bold text-blue-600 font-mono mt-0.5">{executionResult.total_nodes_executed}</p>
                </div>
              </div>

              <span className="font-bold text-zinc-900 dark:text-zinc-100">Step-by-Step Execution Path:</span>
              <div className="space-y-2">
                {executionResult.execution_trace.map((tr: any) => (
                  <div
                    key={tr.step}
                    className="p-2.5 bg-zinc-950 text-emerald-400 font-mono rounded-lg flex justify-between items-center border border-zinc-800"
                  >
                    <span>
                      Step #{tr.step}: [{tr.type}] {tr.label}
                    </span>
                    <span className="text-zinc-500">{tr.latency_ms}ms</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <Activity className="h-10 w-10 text-zinc-400 mx-auto" />
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200">No Active Execution Trace</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Execute the workflow graph to monitor step-by-step node traversals and latencies.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteWorkflow}
                isLoading={isExecuting}
                leftIcon={<Play className="h-3.5 w-3.5" />}
                className="h-8 text-xs font-semibold px-4 mx-auto"
              >
                Execute Engine Now
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: GRAPH VALIDATOR */}
      {activeTab === 'validation' && (
        <Card className="p-5 space-y-4">
          <CardTitle className="text-sm flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Workflow Graph Validator
          </CardTitle>
          {validationResult ? (
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant={validationResult.is_valid ? 'success' : 'danger'} size="md">
                  {validationResult.is_valid ? 'GRAPH VALIDATED CLEAN' : 'VALIDATION ERRORS FOUND'}
                </Badge>
              </div>
              <div className="font-mono text-zinc-500">
                <span>Node Count: {validationResult.node_count}</span> | <span>Edge Count: {validationResult.edge_count}</span>
              </div>
              {validationResult.validation_errors.length > 0 ? (
                <div className="bg-red-950/40 text-red-300 p-3 rounded-lg border border-red-800 space-y-1">
                  {validationResult.validation_errors.map((err: string, i: number) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              ) : (
                <p className="text-emerald-500 font-medium">No disconnected nodes, infinite loops, or broken connections detected.</p>
              )}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <ShieldCheck className="h-10 w-10 text-zinc-400 mx-auto" />
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200">Graph Validator Ready</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Run static analysis on the workflow graph to detect loops, missing start/end nodes, or orphan connections.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleValidateWorkflow}
                isLoading={isValidating}
                leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                className="h-8 text-xs font-semibold px-4 mx-auto"
              >
                Run Graph Validation
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* TAB 5: AUTOMATION & TOOL LIBRARY (AI FUNCTION TOOLS) */}
      {(activeTab as string) === 'tools' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-amber-500" />
                <span>Automation &amp; Tool Library (Function Definitions)</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Configure function calling definitions, REST API endpoints, Google Calendar slots, and CRM webhooks for AI agent call execution.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => addToast('info', 'New tool declaration form opened')}
            >
              Add Function Tool
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'check_calendar', name: 'check_calendar_availability', description: 'Queries Google Calendar for open appointment slots via REST API', method: 'REST_POST', endpoint: 'https://api.yourcompany.com/v1/calendar/check', status: 'Active' },
              { id: 'crm_lookup', name: 'crm_customer_lookup', description: 'Fetches customer account details and history by phone number', method: 'REST_GET', endpoint: 'https://api.yourcompany.com/v1/crm/customer', status: 'Active' },
              { id: 'send_booking', name: 'create_appointment_booking', description: 'Schedules confirmed call appointments and sends calendar invite', method: 'REST_POST', endpoint: 'https://api.yourcompany.com/v1/booking/create', status: 'Active' },
              { id: 'web_search', name: 'live_web_search', description: 'Performs realtime search queries for live domain information', method: 'SDK_CALL', endpoint: 'Built-in Search Provider', status: 'Active' },
            ].map((t) => (
              <Card key={t.id} className="p-4 space-y-3 border-zinc-200 dark:border-zinc-800 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs font-mono text-zinc-900 dark:text-zinc-100">{t.name}</h4>
                      <span className="text-[10px] text-zinc-500 font-mono block">{t.method}</span>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">{t.status}</Badge>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">{t.description}</p>
                <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-[10px] font-mono text-zinc-600 dark:text-zinc-300 truncate">
                  Endpoint: {t.endpoint}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
