import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Message { id: string; role: "user" | "assistant"; content: string; }

const quickPrompts = [
  "Explain Bayes' theorem simply",
  "What should I study next?",
  "Help me understand backpropagation",
  "Give me a practice problem on eigenvalues",
];

const aiResponses: Record<string, string> = {
  "explain bayes": "**Bayes' Theorem** lets you update your belief after seeing new evidence.\n\n**Formula:** P(A|B) = P(B|A) × P(A) / P(B)\n\nThink of it like hearing a sound at night — Bayes helps you weigh prior knowledge with new evidence.\n\n📊 Your Probability mastery is at 48% — I'd recommend reviewing conditional probability.",
  "study next": "Based on your knowledge graph:\n\n1. **Statistics** (38% mastery) — Prerequisites met\n2. **Optimization** (22%) — Needed for ML\n3. **Review Probability** — Strengthen Bayes' Theorem\n\n🎯 **Today:** Complete Statistics quiz, then Optimization chapter.",
  "backpropagation": "**Backpropagation** uses the **chain rule** to compute gradients.\n\n**Two phases:**\n1. **Forward pass** — compute output\n2. **Backward pass** — propagate error back\n\n**Chain rule:** ∂L/∂w = ∂L/∂a × ∂a/∂z × ∂z/∂w\n\n💡 Your Deep Learning mastery is 12% — master gradient descent first!",
  "eigenvalues": "**Practice Problem:**\n\nFind eigenvalues of A = [[4, 1], [2, 3]]\n\n1. det(A - λI) = 0\n2. (4-λ)(3-λ) - 2 = 0\n3. λ² - 7λ + 10 = 0\n4. (λ-5)(λ-2) = 0\n\n**Answer:** λ₁ = 5, λ₂ = 2 ✅\n\nYour Linear Algebra mastery is 65% — getting close!",
};

const getResponse = (input: string): string => {
  const l = input.toLowerCase();
  if (l.includes("bayes") || l.includes("theorem")) return aiResponses["explain bayes"];
  if (l.includes("study") || l.includes("next") || l.includes("recommend")) return aiResponses["study next"];
  if (l.includes("backprop") || l.includes("backward")) return aiResponses["backpropagation"];
  if (l.includes("eigen") || l.includes("practice")) return aiResponses["eigenvalues"];
  return "I can help with:\n\n• **Topic explanations** — Any concept\n• **Study recommendations** — Based on mastery\n• **Practice problems** — Tailored to weak areas\n\nTry asking about a specific topic!";
};

const Tutor = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: "👋 Hi Alex! I'm your AI tutor. I've analyzed your cognitive profile.\n\nYou have **weak areas** in Statistics and Optimization. Want help strengthening those?" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: text }]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: getResponse(text) }]);
      setIsTyping(false);
    }, 800 + Math.random() * 1200);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">AI Tutor</h1>
        <p className="text-sm text-muted-foreground mt-1">Personalized help based on your learning profile</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {messages.map((msg) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg gradient-neural flex items-center justify-center shrink-0">
                <Bot size={16} className="text-primary-foreground" />
              </div>
            )}
            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
              msg.role === "user" ? "bg-primary/10 border border-primary/20 text-foreground" : "bg-card-gradient border border-border text-foreground"
            }`}>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content.split(/(\*\*.*?\*\*)/).map((part, i) =>
                  part.startsWith("**") && part.endsWith("**")
                    ? <strong key={i} className="text-primary">{part.slice(2, -2)}</strong>
                    : <span key={i}>{part}</span>
                )}
              </div>
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <User size={16} className="text-muted-foreground" />
              </div>
            )}
          </motion.div>
        ))}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg gradient-neural flex items-center justify-center shrink-0">
              <Bot size={16} className="text-primary-foreground" />
            </div>
            <div className="bg-card-gradient border border-border rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 150, 300].map((d) => <span key={d} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mb-3">
        {quickPrompts.map((p) => (
          <button key={p} onClick={() => sendMessage(p)}
            className="text-xs px-3 py-1.5 rounded-full bg-secondary/50 text-muted-foreground border border-border hover:text-primary hover:border-primary/30 transition-all">
            <Sparkles size={10} className="inline mr-1" />{p}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Ask me anything about your curriculum..."
          className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 transition-colors" />
        <button onClick={() => sendMessage(input)} disabled={!input.trim()}
          className="px-4 rounded-xl gradient-neural text-primary-foreground hover:opacity-90 disabled:opacity-30 transition-all">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default Tutor;
