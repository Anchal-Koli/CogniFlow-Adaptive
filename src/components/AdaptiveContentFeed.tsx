import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Video, Code, FlaskConical, ChevronRight, TrendingUp, TrendingDown, X, CheckCircle2, Play } from "lucide-react";
import { toast } from "sonner";
import { useTopicStore } from "@/stores/topicStore";
import { useStudentStore } from "@/stores/studentStore";

interface ContentItem {
  id: string;
  title: string;
  type: "reading" | "video" | "exercise" | "lab";
  difficulty: number;
  relatedTopic?: string; // maps to TopicNode.label
  adaptedReason: string;
  estimatedTime: string;
  cognitiveAlignment: number;
  trend: "up" | "down" | "stable";
  content: string;
  questions?: { q: string; options: string[]; answer: number }[];
}

const contentItems: ContentItem[] = [
  {
    id: "1",
    title: "Gradient Descent Intuition",
    type: "video",
    difficulty: 0.6,
    relatedTopic: "Optimization",
    adaptedReason: "Matched to current cognitive load ceiling",
    estimatedTime: "12 min",
    cognitiveAlignment: 0.92,
    trend: "up",
    content: "Gradient descent is an optimization algorithm used to minimize a function by iteratively moving in the direction of steepest descent. Imagine rolling a ball down a hill — it naturally finds the lowest point. In machine learning, the 'hill' is the loss function, and we adjust model parameters to find the minimum loss.\n\nThe learning rate controls step size: too large and you overshoot, too small and convergence is slow. Variants include batch, stochastic (SGD), and mini-batch gradient descent.",
    questions: [
      { q: "What does gradient descent minimize?", options: ["Accuracy", "Loss function", "Learning rate", "Batch size"], answer: 1 },
      { q: "What happens with a very large learning rate?", options: ["Faster convergence", "Overshooting the minimum", "Better accuracy", "No effect"], answer: 1 },
    ],
  },
  {
    id: "2",
    title: "Matrix Multiplication Practice",
    type: "exercise",
    difficulty: 0.45,
    relatedTopic: "Linear Algebra",
    adaptedReason: "Spaced repetition interval triggered",
    estimatedTime: "8 min",
    cognitiveAlignment: 0.85,
    trend: "stable",
    content: "Practice multiplying matrices. Remember: for A(m×n) × B(n×p), the result is an (m×p) matrix. Each element C[i][j] = Σ A[i][k] × B[k][j].\n\nMultiply:\n[1 2]     [5 6]     [1×5+2×7  1×6+2×8]   [19 22]\n[3 4]  ×  [7 8]  =  [3×5+4×7  3×6+4×8] = [43 50]",
    questions: [
      { q: "What is element [1,1] of the result of [[1,2],[3,4]] × [[5,6],[7,8]]?", options: ["19", "22", "43", "50"], answer: 0 },
      { q: "Can you multiply a 3×2 matrix by a 3×2 matrix?", options: ["Yes", "No", "Only if transposed", "Only square matrices"], answer: 1 },
    ],
  },
  {
    id: "3",
    title: "Backpropagation Deep Dive",
    type: "reading",
    difficulty: 0.75,
    relatedTopic: "Deep Learning",
    adaptedReason: "Zone of proximal development detected",
    estimatedTime: "20 min",
    cognitiveAlignment: 0.78,
    trend: "up",
    content: "Backpropagation computes the gradient of the loss function with respect to each weight by the chain rule. It works in two phases:\n\n1. Forward pass: Input flows through the network, producing an output.\n2. Backward pass: The error signal propagates back, computing gradients layer by layer.\n\nThe chain rule states: ∂L/∂w = ∂L/∂a × ∂a/∂z × ∂z/∂w, where L is loss, a is activation, z is pre-activation, and w is weight.",
    questions: [
      { q: "What mathematical rule does backpropagation use?", options: ["Product rule", "Chain rule", "Quotient rule", "Power rule"], answer: 1 },
    ],
  },
  {
    id: "4",
    title: "Neural Network Sandbox",
    type: "lab",
    difficulty: 0.8,
    relatedTopic: "Deep Learning",
    adaptedReason: "High engagement pattern with interactive content",
    estimatedTime: "25 min",
    cognitiveAlignment: 0.71,
    trend: "down",
    content: "Build a simple neural network step by step:\n\n1. Define architecture: Input layer (2 neurons) → Hidden layer (3 neurons, ReLU) → Output (1 neuron, Sigmoid)\n2. Initialize random weights\n3. Forward pass: compute activations\n4. Calculate binary cross-entropy loss\n5. Backpropagate and update weights\n\nThis sandbox simulates 100 training epochs on XOR data.",
  },
];

const typeIcons = {
  reading: <BookOpen size={16} />,
  video: <Video size={16} />,
  exercise: <Code size={16} />,
  lab: <FlaskConical size={16} />,
};

const typeLabels = {
  reading: "Reading",
  video: "Video",
  exercise: "Exercise",
  lab: "Lab",
};

const AdaptiveContentFeed = () => {
  const topicNodes = useTopicStore((s) => s.topicNodes);
  const skillRating = useStudentStore((s) => s.profile.skillRating);

  // Sort content by weighted score: low mastery + difficulty alignment
  const sortedContent = useMemo(() => {
    const diffPref = Math.max(0.05, Math.min(0.95, (skillRating - 200) / 2000));
    const topicMap = new Map(topicNodes.map((t) => [t.label, t]));

    return [...contentItems]
      .map((item) => {
        const node = item.relatedTopic ? topicMap.get(item.relatedTopic) : undefined;
        const mastery = node?.mastery ?? 0.5;
        const masteryScore = 1 - mastery;
        const diffScore = 1 - Math.abs(diffPref - item.difficulty);
        const score = 0.6 * masteryScore + 0.4 * diffScore;
        const dynamicReason = mastery < 0.3
          ? `Low mastery (${Math.round(mastery * 100)}%) — prioritized`
          : mastery < 0.5
          ? `Building foundations (${Math.round(mastery * 100)}% mastery)`
          : item.adaptedReason;
        return { ...item, _score: score, adaptedReason: dynamicReason, cognitiveAlignment: Math.round((0.5 + score * 0.5) * 100) / 100 };
      })
      .sort((a, b) => b._score - a._score);
  }, [topicNodes, skillRating]);

  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});

  const handleOpen = useCallback((item: ContentItem) => {
    setSelectedContent(item);
    toast(`Opening: ${item.title}`, { icon: typeIcons[item.type] });
  }, []);

  const handleComplete = useCallback((id: string) => {
    setCompletedIds((prev) => new Set(prev).add(id));
    setSelectedContent(null);
    toast.success("Content completed! Cognitive model updated.", { description: "Mastery score adjusted based on performance" });
  }, []);

  const handleQuizAnswer = (questionKey: string, answerIdx: number) => {
    setQuizAnswers((prev) => ({ ...prev, [questionKey]: answerIdx }));
  };

  const checkQuiz = (itemId: string) => {
    setShowResults((prev) => ({ ...prev, [itemId]: true }));
    const item = contentItems.find((c) => c.id === itemId);
    if (!item?.questions) return;
    const correct = item.questions.filter((q, i) => quizAnswers[`${itemId}-${i}`] === q.answer).length;
    if (correct === item.questions.length) {
      toast.success(`Perfect! ${correct}/${item.questions.length} correct`);
    } else {
      toast(`${correct}/${item.questions.length} correct`, { description: "Review the material and try again" });
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-card-gradient border border-border rounded-xl p-5 glow-neural"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-foreground font-semibold text-sm tracking-wide uppercase">Adaptive Content Queue</h3>
          <span className="text-xs font-mono text-neural">AI-Calibrated</span>
        </div>
        <div className="space-y-3">
          {sortedContent.map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              onClick={() => handleOpen(item)}
              className={`group w-full text-left flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer ${
                completedIds.has(item.id)
                  ? "bg-mastery/5 border-mastery/20"
                  : "bg-secondary/50 border-border/50 hover:border-neural/30"
              }`}
            >
              <div className={`transition-colors ${completedIds.has(item.id) ? "text-mastery" : "text-muted-foreground group-hover:text-neural"}`}>
                {completedIds.has(item.id) ? <CheckCircle2 size={16} /> : typeIcons[item.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium truncate ${completedIds.has(item.id) ? "text-mastery line-through opacity-70" : "text-foreground"}`}>
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {typeLabels[item.type]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.adaptedReason}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-neural">{Math.round(item.cognitiveAlignment * 100)}%</span>
                    {item.trend === "up" ? <TrendingUp size={12} className="text-mastery" /> : item.trend === "down" ? <TrendingDown size={12} className="text-attention" /> : null}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{item.estimatedTime}</span>
                </div>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-neural transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Content Viewer Modal */}
      <AnimatePresence>
        {selectedContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedContent(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-card border border-border rounded-2xl p-6 glow-neural"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-neural">{typeIcons[selectedContent.type]}</div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{selectedContent.title}</h2>
                    <span className="text-xs text-muted-foreground font-mono">{typeLabels[selectedContent.type]} · {selectedContent.estimatedTime}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedContent(null)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Difficulty bar */}
              <div className="flex items-center gap-2 mb-5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Difficulty</span>
                <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full gradient-engagement rounded-full" style={{ width: `${selectedContent.difficulty * 100}%` }} />
                </div>
                <span className="text-[10px] font-mono text-engagement">{Math.round(selectedContent.difficulty * 100)}%</span>
              </div>

              {/* Content */}
              <div className="prose prose-invert prose-sm max-w-none mb-6">
                {selectedContent.content.split("\n\n").map((p, i) => (
                  <p key={i} className="text-sm text-secondary-foreground leading-relaxed whitespace-pre-line">{p}</p>
                ))}
              </div>

              {/* Quiz */}
              {selectedContent.questions && selectedContent.questions.length > 0 && (
                <div className="border-t border-border pt-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Knowledge Check</h3>
                  {selectedContent.questions.map((q, qi) => {
                    const key = `${selectedContent.id}-${qi}`;
                    const answered = quizAnswers[key] !== undefined;
                    const showResult = showResults[selectedContent.id];
                    const isCorrect = quizAnswers[key] === q.answer;
                    return (
                      <div key={qi} className="space-y-2">
                        <p className="text-sm text-foreground">{q.q}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, oi) => (
                            <button
                              key={oi}
                              onClick={() => handleQuizAnswer(key, oi)}
                              className={`text-left text-xs p-2.5 rounded-lg border transition-all ${
                                showResult && oi === q.answer
                                  ? "border-mastery bg-mastery/10 text-mastery"
                                  : showResult && quizAnswers[key] === oi && !isCorrect
                                  ? "border-attention bg-attention/10 text-attention"
                                  : quizAnswers[key] === oi
                                  ? "border-neural bg-neural/10 text-neural"
                                  : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => checkQuiz(selectedContent.id)}
                    className="w-full py-2.5 rounded-lg gradient-neural text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
                  >
                    Check Answers
                  </button>
                </div>
              )}

              {/* Complete button */}
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => handleComplete(selectedContent.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-mastery/10 border border-mastery/30 text-mastery font-medium text-sm hover:bg-mastery/20 transition-all"
                >
                  <CheckCircle2 size={16} /> Mark Complete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdaptiveContentFeed;
