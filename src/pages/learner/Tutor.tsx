import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const quickPrompts = [
  "Explain Bayes' theorem simply",
  "What should I study next?",
  "Help me understand backpropagation",
  "Give me a practice problem on eigenvalues",
];

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash"; // confirmed from your available models

// ---------- UNIVERSAL EDUCATION FALLBACK ENGINE ----------
const buildFallbackResponse = (input: string): string => {
  const q = input.trim();
  const l = q.toLowerCase();

  // Out-of-domain protection
  const educationKeywords = [
    "study", "learn", "subject", "topic", "exam", "quiz", "assignment", "project", "viva",
    "interview", "coding", "programming", "algorithm", "data structure", "dsa", "java", "python",
    "c++", "javascript", "html", "css", "react", "database", "dbms", "sql", "os", "operating system",
    "computer network", "cn", "math", "mathematics", "probability", "statistics", "linear algebra",
    "machine learning", "deep learning", "ai", "security", "cyber", "compiler", "notes", "resource",
    "roadmap", "motivation", "revision", "time table", "timetable", "plan", "prepare", "preparation"
  ];

  const looksEducational =
    educationKeywords.some((k) => l.includes(k)) ||
    l.startsWith("what is") ||
    l.startsWith("explain") ||
    l.startsWith("teach me") ||
    l.startsWith("help me") ||
    l.startsWith("can you help") ||
    l.startsWith("how to") ||
    l.startsWith("give me") ||
    l.startsWith("make");

  if (!looksEducational) {
    return `I’m focused on **education and learning support only**.\n\nI can help you with:\n- **Concept explanations**\n- **Coding / DSA / CS subjects**\n- **Math / reasoning**\n- **Projects / viva / interview prep**\n- **Study plans / motivation / resources**\n\nAsk me any **academic or skill-building** question.`;
  }

  // 1) "What should I study next?" / recommendation
  if (
    l.includes("what should i study next") ||
    l.includes("study next") ||
    l.includes("what to study next") ||
    l.includes("recommend what to study") ||
    l.includes("what should i learn next")
  ) {
    return `Based on your learning profile, the best next focus areas are:\n\n### Recommended Priority\n1. **Optimization (22% mastery)** → weakest area, needs immediate attention\n2. **Statistics (38% mastery)** → important for data understanding\n3. **Probability (48% mastery)** → foundation for ML and reasoning\n\n### Best Next Study Order\n- **Gradient Descent basics**\n- **Probability distributions**\n- **Conditional probability + Bayes' theorem**\n- **One short practice quiz after each topic**\n\n🎯 **Start today with:** **Gradient Descent + basic Optimization concepts**.`;
  }

  // 2) Broad "help me with X" / "teach me X"
  const broadPatterns = [
    "help me with",
    "teach me",
    "i don't understand",
    "where should i start in",
    "can you help me with"
  ];

  const matchedBroad = broadPatterns.find((p) => l.includes(p));

  if (matchedBroad) {
    let topic = q;
    topic = topic.replace(/can you help me with/gi, "");
    topic = topic.replace(/help me with/gi, "");
    topic = topic.replace(/teach me/gi, "");
    topic = topic.replace(/i don't understand/gi, "");
    topic = topic.replace(/where should i start in/gi, "");
    topic = topic.replace(/\?/g, "").trim();

    if (!topic) topic = "this topic";

    return `Absolutely — let’s start learning **${topic}** properly.\n\n### What is **${topic}**?\n**${topic}** is an important academic topic/skill that you should understand conceptually first before memorizing details.\n\n### How to approach it\n1. Learn the **basic definition and core idea**\n2. Understand **why it matters**\n3. Break it into **subtopics**\n4. Practice with **examples / questions**\n5. Revise weak points\n\n### Best way I can help you next\nI can now give you one of these for **${topic}**:\n- **Beginner explanation**\n- **Complete roadmap**\n- **Short notes**\n- **Practice questions**\n- **Interview / viva explanation**\n\n🎯 If you want the best next step, ask: **“Explain ${topic} from beginner level.”**`;
  }

  // 3) Concept questions: "what is", "explain"
  if (
    l.startsWith("what is") ||
    l.startsWith("explain") ||
    l.startsWith("define") ||
    l.includes(" meaning of ")
  ) {
    let topic = q
      .replace(/^what is\s+/i, "")
      .replace(/^explain\s+/i, "")
      .replace(/^define\s+/i, "")
      .replace(/\?/g, "")
      .trim();

    if (!topic) topic = "this concept";

    return `### **${topic}** — Simple Explanation\n\n**Definition:**\n**${topic}** is an academic concept/topic that should be understood in terms of its purpose, structure, and practical use.\n\n**Why it matters:**\n- It builds your **conceptual understanding**\n- It often appears in **exams, viva, and interviews**\n- It helps connect with related topics\n\n**How to study it:**\n1. Learn the definition\n2. Understand a **simple example**\n3. Identify **important subtopics**\n4. Practice 2–3 questions\n5. Revise common mistakes\n\n🎯 If you want, I can now explain **${topic}** in **full detail with example + exam point of view**.`;
  }

  // 4) Roadmap / plan
  if (
    l.includes("roadmap") ||
    l.includes("how should i learn") ||
    l.includes("how to learn") ||
    l.includes("study plan") ||
    l.includes("plan for") ||
    l.includes("prepare for")
  ) {
    return `### **Study Roadmap / Plan**\n\nHere’s the best universal way to learn any academic topic effectively:\n\n1. **Start with basics** → definition + purpose\n2. **Break into subtopics** → don’t study randomly\n3. **Learn with examples** → theory alone is weak\n4. **Practice questions / coding / problems**\n5. **Revise actively** → short notes + recall\n6. **Test yourself** → quizzes / viva / mock questions\n7. **Fix weak areas** → focus on mistakes, not comfort zone\n\n### Best strategy\n- **Day 1–2:** Basics\n- **Day 3–5:** Core concepts\n- **Day 6–7:** Practice\n- **Day 8:** Revision + test\n\n🎯 If you want, ask me: **“Give me a roadmap for [topic] from beginner to advanced.”**`;
  }

  // 5) Resources
  if (
    l.includes("resource") ||
    l.includes("best books") ||
    l.includes("best youtube") ||
    l.includes("best course") ||
    l.includes("where can i learn")
  ) {
    return `### **Best Educational Resource Strategy**\n\nFor any topic, use this resource mix:\n\n- **Books / Notes** → strong theory and exam clarity\n- **YouTube** → visual explanation and intuition\n- **Practice Platforms** → real application\n- **Official Docs** → accuracy for technical topics\n- **Mock Questions / PYQs** → exam relevance\n\n### Recommended resource types\n- **Books** for fundamentals\n- **YouTube** for quick understanding\n- **Practice sites** for coding/problem solving\n- **Short notes / revision sheets** before exams\n\n🎯 Ask me like this for better results:\n**“Best resources for DBMS for college + interview”**\nOR\n**“Best DSA resources for beginner in Java”**`;
  }

  // 6) Motivation / consistency
  if (
    l.includes("motivation") ||
    l.includes("procrastination") ||
    l.includes("not able to study") ||
    l.includes("how to focus") ||
    l.includes("consistency")
  ) {
    return `### **Study Motivation & Consistency (Practical)**\n\nForget emotional motivation. Use a system.\n\n### What actually works:\n1. Study in **45–60 min focused blocks**\n2. Start with the **hardest topic first**\n3. Keep a **daily target**, not vague goals\n4. Revise **yesterday’s topic for 10–15 min**\n5. Solve **questions**, don’t just read theory\n6. Track weak areas and repeat them\n\n### Best rule\n**Discipline > Motivation**\n\n🎯 For your project and academics, the best move is: **1 difficult topic + 1 easy revision topic daily**.`;
  }

  // 7) Coding help
  if (
    l.includes("code") ||
    l.includes("program") ||
    l.includes("java") ||
    l.includes("python") ||
    l.includes("c++") ||
    l.includes("javascript") ||
    l.includes("bug") ||
    l.includes("error") ||
    l.includes("debug")
  ) {
    return `### **Coding Help (Educational Mode)**\n\nI can help you with coding in a proper learning way:\n\n- **Understand the logic first**\n- **Write clean code**\n- **Explain errors / bugs**\n- **Show dry run / output reasoning**\n- **Explain time complexity when relevant**\n\n🎯 Ask in this format for best results:\n- **“Explain this Java code”**\n- **“Fix this error in my React code”**\n- **“Solve this DSA problem in Java with explanation”**\n- **“Why is this code giving wrong output?”**`;
  }

  // 8) Default universal educational answer
  return `I can help you as a **full education-focused AI Tutor**.\n\n### I can assist with:\n- **Concept explanations**\n- **Short notes / detailed answers**\n- **Coding / DSA / CS subjects**\n- **Math / reasoning / problem solving**\n- **Projects / viva / interview prep**\n- **Study plans / roadmaps / resources**\n- **Motivation / consistency in study context**\n\n🎯 Ask me clearly like this for the best output:\n- **Explain [topic] from beginner level**\n- **Give me roadmap for [subject]**\n- **Solve this question step by step**\n- **Make viva questions for [topic]**\n- **Suggest resources for [topic]**`;
};

// ---------- MAIN COMPONENT ----------
const Tutor = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hi! I'm your **AI Tutor**.\n\nI can help you with:\n- **Concept explanations**\n- **Coding / DSA / CS subjects**\n- **Math / reasoning**\n- **Projects / viva / interview prep**\n- **Study plans / resources / motivation**\n\nAsk me anything related to **education or learning** and I’ll help you properly.",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState<"ai" | "fallback">("ai");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const generateResponse = async (userInput: string): Promise<string> => {
    if (!API_KEY) {
      setMode("fallback");
      return "⚠️ **Gemini API key missing in .env**\n\n" + buildFallbackResponse(userInput);
    }

    const prompt = `You are an advanced AI Tutor inside a project called "Cognitive Adaptive Learning System".

You are NOT a generic chatbot.
You are a highly capable, education-focused AI teaching assistant designed to support students like a real teacher, mentor, academic coach, and study guide.

PRIMARY ROLE:
Your job is to help the student with ANY EDUCATION-RELATED need in a realistic, high-value, teacher-like way.

You can help with:
- Explaining concepts deeply and clearly
- Teaching from beginner to advanced level
- Solving doubts in simple language
- Giving step-by-step learning roadmaps
- Creating study plans
- Recommending what to study next
- Generating notes and summaries
- Creating practice questions / quizzes / MCQs
- Solving academic coding problems
- Helping with debugging for learning purposes
- Explaining algorithms, code, logic, and problem-solving
- Helping with mathematics and logical reasoning
- Helping with science, engineering, commerce, humanities, and general academic subjects
- Helping with project work, viva preparation, presentations, reports, and academic communication
- Suggesting educational resources (books, websites, channels, courses, documentation, practice platforms)
- Giving motivation, discipline tips, consistency strategies, and productivity advice ONLY in an educational/student context
- Helping students revise, retain, and improve performance
- Adapting answers to weak areas and mastery levels

STRICT DOMAIN BOUNDARY:
You must ONLY respond to education-related content.
If the user asks something outside education, politely redirect them back to educational help.

QUALITY STANDARD:
- Never give shallow filler like "Yes, I can help with that" and stop
- Never stop mid-sentence
- Never give vague generic answers
- Always provide practical, teacher-like, useful answers
- If the user asks broadly, teach first and guide next
- If the user asks for help, immediately start helping

HOW TO HANDLE QUESTIONS:
1. Broad topic → explain what it is, why it matters, major subtopics, roadmap, what to study first
2. Concept question → definition, simple explanation, why it matters, example, next step
3. Roadmap request → step-by-step plan from beginner to advanced
4. Coding help → explain logic, then code if needed, with complexity if relevant
5. Math/problem solving → solve step by step
6. Notes/short answers → adapt to requested format
7. Motivation → keep it practical and educational
8. Resources → suggest useful learning resources with why they help
9. Vague questions → make a smart assumption, help first, then ask one clarifying question if needed

PERSONALIZATION CONTEXT:
Student mastery profile:
- Statistics: 38% mastery
- Optimization: 22% mastery
- Deep Learning: 12% mastery
- Linear Algebra: 65% mastery
- Probability: 48% mastery

Use this profile when relevant.

RESPONSE STYLE:
- Sound like a strong teacher + academic mentor
- Clear, structured, calm, and helpful
- Student-friendly English
- Use **bold** for important terms
- Prefer bullet points / mini-sections
- Usually provide at least 6–15 meaningful lines unless the user explicitly asks for something very short

SPECIAL BEHAVIOR:
If the user asks:
- "Can you help me with X?"
- "Teach me X"
- "I don't understand X"
- "Where should I start in X?"

Then DO NOT say only "Yes".
Immediately begin teaching X in a useful way.

FINAL INSTRUCTION:
Give the best possible education-focused answer to the student's query.
Be complete, practical, and teacher-like.
Stay strictly within the educational domain.

Student query: ${userInput}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.5,
              topK:40,
              topP :0.9,
              maxOutputTokens: 1500,
            },
          }),
        }
      );

      const data = await response.json();
      console.log("Gemini full response:", data);

      if (!response.ok) {
        setMode("fallback");
        const errorMessage = data?.error?.message || `HTTP ${response.status}`;
        return `⚠️ **Gemini Error:** ${errorMessage}\n\n${buildFallbackResponse(userInput)}`;
      }

      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part?.text || "")
          .join("\n")
          .trim() || "";

      const weakPatterns = [
        "i can help with that",
        "i can certainly help",
        "absolutely, i can help",
        "sure, i can help",
        "can you clarify",
        "your question seems incomplete",
        "please provide more details",
      ];

      const lowerText = text.toLowerCase();

      const isWeakResponse =
        !text ||
        text.trim().length < 120 ||
        weakPatterns.some((pattern) => lowerText.includes(pattern));

      if (isWeakResponse) {
        setMode("fallback");
        return buildFallbackResponse(userInput);
      }

      setMode("ai");
      return text;
    } catch (error: unknown) {
      console.error("Gemini fetch error:", error);
      setMode("fallback");

      const message =
        error instanceof Error ? error.message : "Unknown error";

      return `⚠️ **Gemini request failed:** ${message}\n\n${buildFallbackResponse(userInput)}`;
    }
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      try {
        const response = await generateResponse(text);

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (error: unknown) {
        console.error("Tutor error:", error);

        const message =
          error instanceof Error ? error.message : "Unknown error";

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            `⚠️ **Unexpected error:** ${message}\n\n` +
            buildFallbackResponse(text),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setMode("fallback");
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Tutor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personalized education-focused help for concepts, coding, projects, viva, and study planning
          </p>
        </div>

        <div
          className={`text-xs px-3 py-1 rounded-full border shrink-0 ${
            mode === "ai"
              ? "border-green-500/30 text-green-400 bg-green-500/10"
              : "border-amber-500/30 text-amber-400 bg-amber-500/10"
          }`}
        >
          {mode === "ai" ? "Gemini Live" : "Fallback Mode"}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg gradient-neural flex items-center justify-center shrink-0">
                <Bot size={16} className="text-primary-foreground" />
              </div>
            )}

            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary/10 border border-primary/20 text-foreground"
                  : "bg-card-gradient border border-border text-foreground"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content.split(/(\*\*.*?\*\*)/g).map((part: string, i: number) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={i} className="text-primary">
                      {part.slice(2, -2)}
                    </strong>
                  ) : (
                    <span key={i}>{part}</span>
                  )
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-lg gradient-neural flex items-center justify-center shrink-0">
              <Bot size={16} className="text-primary-foreground" />
            </div>

            <div className="bg-card-gradient border border-border rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="w-2 h-2 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mb-3">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            disabled={isTyping}
            className="text-xs px-3 py-1.5 rounded-full bg-secondary/50 text-muted-foreground border border-border hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50"
          >
            <Sparkles size={10} className="inline mr-1" />
            {p}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder="Ask me anything about concepts, coding, DSA, projects, viva, notes, or study plans..."
          disabled={isTyping}
          className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 transition-colors disabled:opacity-50"
        />

        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isTyping}
          className="px-4 rounded-xl gradient-neural text-primary-foreground hover:opacity-90 disabled:opacity-30 transition-all"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default Tutor;

        