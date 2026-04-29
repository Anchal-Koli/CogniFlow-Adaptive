import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Trophy, Clock, Play } from "lucide-react";
import { fetchTopicNodes } from "@/lib/api";
import { useTopicStore } from "@/stores/topicStore";
import { toast } from "sonner";
import PageLoader from "@/components/PageLoader";

interface GraphNode { id: string; label: string; x: number; y: number; mastery: number; size: number; }

const edges = [
  { from: "calc", to: "linalg" }, { from: "calc", to: "prob" },
  { from: "linalg", to: "ml" }, { from: "prob", to: "stats" },
  { from: "stats", to: "ml" }, { from: "ml", to: "dl" },
  { from: "linalg", to: "opt" }, { from: "opt", to: "dl" },
  { from: "nla", to: "calc" }, { from: "calc", to: "opt" },
];

const nodePositions: Record<string, { x: number; y: number; size: number }> = {
  calc: { x: 250, y: 140, size: 32 },
  linalg: { x: 450, y: 100, size: 28 },
  prob: { x: 180, y: 290, size: 26 },
  stats: { x: 400, y: 270, size: 24 },
  ml: { x: 600, y: 190, size: 30 },
  dl: { x: 650, y: 340, size: 26 },
  opt: { x: 500, y: 380, size: 22 },
  nla: { x: 100, y: 160, size: 22 },
};

const getMasteryColor = (m: number) => m >= 0.7 ? "hsl(150, 60%, 50%)" : m >= 0.4 ? "hsl(38, 90%, 55%)" : "hsl(185, 70%, 50%)";

const KnowledgeGraphPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { data: topicNodes, isLoading } = useQuery({
    queryKey: ["topic-nodes"],
    queryFn: fetchTopicNodes,
  });

  // Keep store reference for detail panel actions
  const storeTopicNodes = useTopicStore((s) => s.topicNodes);
  const nodes = topicNodes ?? storeTopicNodes;

  const layoutNodes: GraphNode[] = nodes.map((t) => ({
    id: t.id,
    label: t.label,
    mastery: t.mastery,
    ...(nodePositions[t.id] || { x: 300, y: 200, size: 20 }),
  }));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 800 * dpr; canvas.height = 480 * dpr;
    ctx.scale(dpr, dpr); ctx.clearRect(0, 0, 800, 480);

    edges.forEach((edge) => {
      const from = layoutNodes.find((n) => n.id === edge.from)!;
      const to = layoutNodes.find((n) => n.id === edge.to)!;
      if (!from || !to) return;
      const hl = hoveredNode === from.id || hoveredNode === to.id;
      ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = hl ? "hsla(185, 70%, 50%, 0.5)" : "hsla(222, 20%, 30%, 0.4)";
      ctx.lineWidth = hl ? 2 : 1; ctx.stroke();
    });

    layoutNodes.forEach((node) => {
      const color = getMasteryColor(node.mastery);
      const isSel = selectedNode === node.id;
      const isHov = hoveredNode === node.id;
      const r = isHov || isSel ? node.size + 4 : node.size;

      ctx.beginPath(); ctx.arc(node.x, node.y, r + 10, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r + 15);
      glow.addColorStop(0, color.replace(")", `, ${node.mastery * 0.4})`).replace("hsl", "hsla"));
      glow.addColorStop(1, "transparent"); ctx.fillStyle = glow; ctx.fill();

      ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? "hsl(222, 25%, 16%)" : "hsl(222, 25%, 13%)"; ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = isSel ? 3 : 2; ctx.stroke();

      ctx.beginPath(); ctx.arc(node.x, node.y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * node.mastery);
      ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.stroke();

      ctx.fillStyle = isHov || isSel ? "hsl(210, 20%, 95%)" : "hsl(210, 20%, 78%)";
      ctx.font = `${isHov ? "bold " : ""}12px Inter, sans-serif`;
      ctx.textAlign = "center"; ctx.fillText(node.label, node.x, node.y + r + 20);

      ctx.fillStyle = color; ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.fillText(`${Math.round(node.mastery * 100)}%`, node.x, node.y + 4);
    });
  }, [hoveredNode, selectedNode, layoutNodes]);

  useEffect(() => { draw(); }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
    const clicked = layoutNodes.find((n) => Math.hypot(n.x - (e.clientX - rect.left), n.y - (e.clientY - rect.top)) < n.size + 5);
    setSelectedNode(clicked?.id || null);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
    const hov = layoutNodes.find((n) => Math.hypot(n.x - (e.clientX - rect.left), n.y - (e.clientY - rect.top)) < n.size + 5);
    setHoveredNode(hov?.id || null);
    if (canvasRef.current) canvasRef.current.style.cursor = hov ? "pointer" : "default";
  };

  if (isLoading) return <PageLoader rows={2} />;

  const sel = selectedNode ? nodes.find((t) => t.id === selectedNode) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Knowledge Graph</h1>
        <p className="text-sm text-muted-foreground mt-1">Click any node for details</p>
      </div>
      <div className="flex gap-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 bg-card-gradient border border-border rounded-xl p-5 glow-neural">
          <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-mastery" /> Mastered</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent" /> Learning</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> New</span>
          </div>
          <canvas ref={canvasRef} style={{ width: 800, height: 480 }} className="w-full max-w-full rounded-lg"
            onClick={handleClick} onMouseMove={handleMove} onMouseLeave={() => setHoveredNode(null)} />
        </motion.div>

        <AnimatePresence>
          {sel && (
            <motion.div initial={{ opacity: 0, x: 30, width: 0 }} animate={{ opacity: 1, x: 0, width: 320 }} exit={{ opacity: 0, x: 30, width: 0 }}
              className="bg-card-gradient border border-border rounded-xl p-5 overflow-hidden shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">{sel.label}</h3>
                <button onClick={() => setSelectedNode(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
              </div>
              <div className="mb-5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Mastery</span>
                  <span className="font-mono text-foreground">{Math.round(sel.mastery * 100)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full gradient-mastery rounded-full" style={{ width: `${sel.mastery * 100}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3 rounded-lg bg-secondary/50 text-center">
                  <Trophy size={14} className="mx-auto text-accent mb-1" />
                  <p className="text-lg font-bold font-mono text-foreground">{sel.quizAttempts}</p>
                  <p className="text-[10px] text-muted-foreground">Quiz Attempts</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 text-center">
                  <Clock size={14} className="mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold font-mono text-foreground">{sel.totalTime}m</p>
                  <p className="text-[10px] text-muted-foreground">Time Spent</p>
                </div>
              </div>
              {sel.prerequisites.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Prerequisites</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {sel.prerequisites.map((p) => (
                      <button key={p} onClick={() => setSelectedNode(p)}
                        className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all">
                        {nodes.find((t) => t.id === p)?.label || p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mb-5">
                <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Resources</h4>
                <div className="space-y-2">
                  {sel.resources.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
                      <BookOpen size={12} className="text-primary shrink-0" /><span className="truncate">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => toast.success(`Starting practice for ${sel.label}!`)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl gradient-neural text-primary-foreground font-medium text-sm hover:opacity-90 transition-all">
                <Play size={14} /> Start Practice
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KnowledgeGraphPage;
