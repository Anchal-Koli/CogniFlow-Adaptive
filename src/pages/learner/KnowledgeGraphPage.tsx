import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  Trophy,
  Clock,
  Play,
  Lock,
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchTopicNodes, fetchQuizzes } from "@/lib/api";
import { useTopicStore } from "@/stores/topicStore";
import { toast } from "sonner";
import PageLoader from "@/components/PageLoader";
import { useAuth } from "@/contexts/AuthContext";
import {
  generateRecommendations,
  generateTopicInsights,
} from "@/lib/recommendationEngine";

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  mastery: number;
  size: number;
}

const edges = [
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

const getMasteryColor = (m: number) =>
  m >= 0.7
    ? "hsl(150, 60%, 50%)"
    : m >= 0.4
    ? "hsl(38, 90%, 55%)"
    : "hsl(185, 70%, 50%)";

const KnowledgeGraphPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { data: topicNodes, isLoading: topicsLoading } = useQuery({
    queryKey: ["topic-nodes"],
    queryFn: fetchTopicNodes,
  });

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: fetchQuizzes,
  });

  // fallback store
  const storeTopicNodes = useTopicStore((s) => s.topicNodes);
  const nodes = topicNodes ?? storeTopicNodes;

  const topicInsights = useMemo(() => {
    if (!nodes?.length) return [];
    return generateTopicInsights(nodes);
  }, [nodes]);

  const recommendations = useMemo(() => {
    if (!nodes?.length || !quizzes?.length) return [];
    return generateRecommendations(nodes, quizzes, profile?.skill_rating ?? 1200, 6);
  }, [nodes, quizzes, profile?.skill_rating]);

  const recommendedTopicId = topicInsights.find((t) => t.recommended)?.topicId || null;

  const layoutNodes: GraphNode[] = useMemo(
    () =>
      nodes.map((t) => ({
        id: t.id,
        label: t.label,
        mastery: t.mastery,
        ...(nodePositions[t.id] || { x: 300, y: 200, size: 20 }),
      })),
    [nodes]
  );

  const insightMap = useMemo(
    () => new Map(topicInsights.map((t) => [t.topicId, t])),
    [topicInsights]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 800;
    const height = 480;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // draw edges
    edges.forEach((edge) => {
      const from = layoutNodes.find((n) => n.id === edge.from);
      const to = layoutNodes.find((n) => n.id === edge.to);
      if (!from || !to) return;

      const fromInsight = insightMap.get(from.id);
      const toInsight = insightMap.get(to.id);

      const isRelatedHover = hoveredNode === from.id || hoveredNode === to.id;
      const isBlockedPath = !!toInsight?.locked;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);

      if (isBlockedPath) {
        ctx.strokeStyle = "hsla(0, 70%, 60%, 0.22)";
        ctx.lineWidth = 1.5;
      } else if (isRelatedHover) {
        ctx.strokeStyle = "hsla(185, 70%, 50%, 0.55)";
        ctx.lineWidth = 2.2;
      } else {
        ctx.strokeStyle = "hsla(222, 20%, 30%, 0.35)";
        ctx.lineWidth = 1;
      }

      ctx.stroke();
    });

    // draw nodes
    layoutNodes.forEach((node) => {
      const insight = insightMap.get(node.id);
      const color = getMasteryColor(node.mastery);
      const isSel = selectedNode === node.id;
      const isHov = hoveredNode === node.id;
      const isRecommended = recommendedTopicId === node.id;
      const isLocked = !!insight?.locked;

      const r = isHov || isSel ? node.size + 4 : node.size;

      // outer glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + (isRecommended ? 18 : 10), 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r + 18);

      if (isRecommended) {
        glow.addColorStop(0, "hsla(48, 100%, 60%, 0.28)");
        glow.addColorStop(1, "transparent");
      } else {
        glow.addColorStop(
          0,
          color.replace(")", `, ${Math.max(0.12, node.mastery * 0.35)})`).replace("hsl", "hsla")
        );
        glow.addColorStop(1, "transparent");
      }

      ctx.fillStyle = glow;
      ctx.fill();

      // node fill
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isLocked ? "hsl(222, 18%, 11%)" : isSel ? "hsl(222, 25%, 16%)" : "hsl(222, 25%, 13%)";
      ctx.fill();

      // border
      ctx.strokeStyle = isRecommended ? "hsl(48, 100%, 60%)" : isLocked ? "hsl(0, 70%, 60%)" : color;
      ctx.lineWidth = isSel ? 3 : 2;
      ctx.stroke();

      // mastery ring (only if unlocked)
      if (!isLocked) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * node.mastery);
        ctx.strokeStyle = isRecommended ? "hsl(48, 100%, 60%)" : color;
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // center text
      if (isLocked) {
        ctx.fillStyle = "hsl(0, 80%, 65%)";
        ctx.font = "bold 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🔒", node.x, node.y + 5);
      } else if (isRecommended) {
        ctx.fillStyle = "hsl(48, 100%, 65%)";
        ctx.font = "bold 10px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText("BEST", node.x, node.y + 4);
      } else {
        ctx.fillStyle = color;
        ctx.font = "bold 11px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.round(node.mastery * 100)}%`, node.x, node.y + 4);
      }

      // label
      ctx.fillStyle = isHov || isSel ? "hsl(210, 20%, 95%)" : "hsl(210, 20%, 78%)";
      ctx.font = `${isHov ? "bold " : ""}12px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(node.label, node.x, node.y + r + 20);

      // status badge
      if (isRecommended) {
        ctx.fillStyle = "hsl(48, 100%, 65%)";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.fillText("recommended", node.x, node.y + r + 34);
      } else if (isLocked) {
        ctx.fillStyle = "hsl(0, 80%, 65%)";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.fillText("locked", node.x, node.y + r + 34);
      }
    });
  }, [hoveredNode, selectedNode, layoutNodes, insightMap, recommendedTopicId]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clicked = layoutNodes.find(
      (n) => Math.hypot(n.x - (e.clientX - rect.left), n.y - (e.clientY - rect.top)) < n.size + 5
    );

    setSelectedNode(clicked?.id || null);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const hov = layoutNodes.find(
      (n) => Math.hypot(n.x - (e.clientX - rect.left), n.y - (e.clientY - rect.top)) < n.size + 5
    );

    setHoveredNode(hov?.id || null);

    if (canvasRef.current) {
      canvasRef.current.style.cursor = hov ? "pointer" : "default";
    }
  };

  if (topicsLoading || quizzesLoading) return <PageLoader rows={2} />;

  const sel = selectedNode ? nodes.find((t) => t.id === selectedNode) : null;
  const selInsight = selectedNode ? insightMap.get(selectedNode) : null;

  const selectedRecommendation =
    selectedNode && recommendations.length
      ? recommendations.find((r) => r.topicId === selectedNode && !r.locked)
      : null;

  const globalBestRecommendation = recommendations.find((r) => !r.locked);

  const handleStartPractice = () => {
    if (!sel) return;

    if (selInsight?.locked) {
      const blockedLabels =
        selInsight.blockedBy
          ?.map((id) => nodes.find((t) => t.id === id)?.label || id)
          .join(", ") || "prerequisites";

      toast.error(`This topic is locked. Improve: ${blockedLabels}`);
      return;
    }

    const bestQuizForTopic = recommendations.find((r) => r.topicId === sel.id && !r.locked);

    if (bestQuizForTopic) {
      navigate(`/app/quizzes/${bestQuizForTopic.quizId}`);
      return;
    }

    toast.info(`No direct quiz found for ${sel.label}. Add more content for this topic.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Knowledge Graph</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Adaptive learning path driven by mastery, prerequisites, and recommended progression.
          </p>
        </div>

        {globalBestRecommendation && (
          <div className="bg-card-gradient border border-border rounded-2xl px-4 py-3 min-w-full lg:min-w-[360px]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-2">
              <Sparkles size={14} className="text-yellow-400" />
              Best next move
            </div>
            <div className="text-sm font-semibold text-foreground">
              {globalBestRecommendation.quizTitle}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {globalBestRecommendation.reason}
            </p>
            <button
              onClick={() => navigate(`/app/quizzes/${globalBestRecommendation.quizId}`)}
              className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
            >
              Start Recommended Quiz <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 bg-card-gradient border border-border rounded-2xl p-5 glow-neural"
        >
          <div className="flex flex-wrap gap-4 mb-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-mastery" /> Mastered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" /> Learning
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" /> New
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Recommended
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Locked
            </span>
          </div>

          <canvas
            ref={canvasRef}
            style={{ width: 800, height: 480 }}
            className="w-full max-w-full rounded-xl"
            onClick={handleClick}
            onMouseMove={handleMove}
            onMouseLeave={() => setHoveredNode(null)}
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {sel && selInsight && (
            <motion.div
              key={sel.id}
              initial={{ opacity: 0, x: 30, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 360 }}
              exit={{ opacity: 0, x: 30, width: 0 }}
              className="bg-card-gradient border border-border rounded-2xl p-5 overflow-hidden shrink-0 w-full xl:w-[360px]"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{sel.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selInsight.locked
                      ? "Locked by prerequisites"
                      : selInsight.recommended
                      ? "Recommended next topic"
                      : "Topic performance overview"}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {selInsight.recommended && !selInsight.locked && (
                <div className="mb-4 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3">
                  <div className="flex items-center gap-2 text-yellow-300 text-sm font-semibold">
                    <Sparkles size={14} />
                    Best next learning step
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This topic currently offers the strongest improvement opportunity.
                  </p>
                </div>
              )}

              {selInsight.locked && (
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                  <div className="flex items-center gap-2 text-red-300 text-sm font-semibold">
                    <Lock size={14} />
                    Topic locked
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete prerequisite mastery before advancing here.
                  </p>
                </div>
              )}

              <div className="mb-5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Mastery</span>
                  <span className="font-mono text-foreground">{Math.round(sel.mastery * 100)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${sel.mastery * 100}%`,
                      background:
                        sel.mastery >= 0.7
                          ? "linear-gradient(90deg, hsl(150,60%,45%), hsl(150,60%,55%))"
                          : sel.mastery >= 0.4
                          ? "linear-gradient(90deg, hsl(38,90%,48%), hsl(38,90%,58%))"
                          : "linear-gradient(90deg, hsl(185,70%,42%), hsl(185,70%,52%))",
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3 rounded-xl bg-secondary/50 text-center border border-border">
                  <Trophy size={14} className="mx-auto text-accent mb-1" />
                  <p className="text-lg font-bold font-mono text-foreground">{sel.quizAttempts}</p>
                  <p className="text-[10px] text-muted-foreground">Quiz Attempts</p>
                </div>

                <div className="p-3 rounded-xl bg-secondary/50 text-center border border-border">
                  <Clock size={14} className="mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold font-mono text-foreground">{sel.totalTime}m</p>
                  <p className="text-[10px] text-muted-foreground">Time Spent</p>
                </div>
              </div>

              {selInsight.locked && selInsight.blockedBy.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Blocked By
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selInsight.blockedBy.map((p) => (
                      <button
                        key={p}
                        onClick={() => setSelectedNode(p)}
                        className="text-[10px] px-2 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/15 transition-all"
                      >
                        {nodes.find((t) => t.id === p)?.label || p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {sel.prerequisites.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Prerequisites
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {sel.prerequisites.map((p) => {
                      const prereq = nodes.find((t) => t.id === p);
                      const weak = (prereq?.mastery ?? 0) < 0.6;

                      return (
                        <button
                          key={p}
                          onClick={() => setSelectedNode(p)}
                          className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                            weak
                              ? "bg-red-500/10 text-red-300 border-red-500/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          }`}
                        >
                          {prereq?.label || p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedRecommendation && !selectedRecommendation.locked && (
                <div className="mb-5 rounded-xl border border-primary/20 bg-primary/10 p-3">
                  <h4 className="text-xs text-primary uppercase tracking-wide mb-2">
                    Recommended Practice
                  </h4>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedRecommendation.quizTitle}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedRecommendation.reason}
                  </p>
                </div>
              )}

              <div className="mb-5">
                <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Resources
                </h4>
                <div className="space-y-2">
                  {sel.resources.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 text-xs text-muted-foreground border border-border"
                    >
                      <BookOpen size={12} className="text-primary shrink-0" />
                      <span className="truncate">{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStartPractice}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
                  selInsight.locked
                    ? "bg-red-500/10 text-red-300 border border-red-500/20"
                    : "gradient-neural text-primary-foreground hover:opacity-90"
                }`}
              >
                {selInsight.locked ? (
                  <>
                    <AlertTriangle size={14} /> Resolve Prerequisites First
                  </>
                ) : (
                  <>
                    <Play size={14} /> Start Practice
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KnowledgeGraphPage;