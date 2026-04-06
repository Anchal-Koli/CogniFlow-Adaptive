import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useTopicStore } from "@/stores/topicStore";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  mastery: number;
  size: number;
}

interface Edge {
  from: string;
  to: string;
}

const nodePositions: Record<string, { x: number; y: number; size: number }> = {
  calc: { x: 200, y: 120, size: 28 },
  linalg: { x: 350, y: 80, size: 24 },
  prob: { x: 150, y: 250, size: 22 },
  stats: { x: 320, y: 230, size: 20 },
  ml: { x: 480, y: 160, size: 26 },
  dl: { x: 520, y: 280, size: 22 },
  opt: { x: 400, y: 330, size: 18 },
  nla: { x: 100, y: 140, size: 18 },
};

const edges: Edge[] = [
  { from: "calc", to: "linalg" },
  { from: "calc", to: "prob" },
  { from: "linalg", to: "ml" },
  { from: "prob", to: "stats" },
  { from: "stats", to: "ml" },
  { from: "ml", to: "dl" },
  { from: "linalg", to: "opt" },
  { from: "opt", to: "dl" },
  { from: "nla", to: "calc" },
  { from: "calc", to: "opt" },
];

const getMasteryColor = (mastery: number) => {
  if (mastery >= 0.7) return "hsl(150, 60%, 50%)";
  if (mastery >= 0.4) return "hsl(38, 90%, 55%)";
  return "hsl(185, 70%, 50%)";
};

const KnowledgeGraph = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { topicNodes } = useTopicStore();

  const nodes: Node[] = topicNodes.map((t) => ({
    id: t.id,
    label: t.label,
    mastery: t.mastery,
    ...(nodePositions[t.id] || { x: 300, y: 200, size: 20 }),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 620 * dpr;
    canvas.height = 400 * dpr;
    ctx.scale(dpr, dpr);

    edges.forEach((edge) => {
      const from = nodes.find((n) => n.id === edge.from)!;
      const to = nodes.find((n) => n.id === edge.to)!;
      if (!from || !to) return;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = "hsla(222, 20%, 30%, 0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    nodes.forEach((node) => {
      const color = getMasteryColor(node.mastery);

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size + 8, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(node.x, node.y, node.size, node.x, node.y, node.size + 12);
      glow.addColorStop(0, color.replace(")", `, ${node.mastery * 0.3})`).replace("hsl", "hsla"));
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
      ctx.fillStyle = "hsl(222, 25%, 13%)";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * node.mastery);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "hsl(210, 20%, 85%)";
      ctx.font = "11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(node.label, node.x, node.y + node.size + 18);
    });
  }, [nodes]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-card-gradient border border-border rounded-xl p-5 glow-neural"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground font-semibold text-sm tracking-wide uppercase">Knowledge Graph</h3>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-mastery" /> Mastered</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-engagement" /> Learning</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neural" /> New</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: 620, height: 400 }}
        className="w-full max-w-full"
      />
    </motion.div>
  );
};

export default KnowledgeGraph;
