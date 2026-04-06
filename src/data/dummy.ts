// Cogniflow Adaptive — Dummy Data Layer

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
  timeLimit: number;
  attempts: number;
  bestScore: number | null;
  description: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  hint: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface TopicNode {
  id: string;
  label: string;
  mastery: number;
  quizAttempts: number;
  totalTime: number;
  resources: string[];
  prerequisites: string[];
}

export interface StudentProfile {
  name: string;
  email: string;
  avatar: string;
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  totalHours: number;
  badges: Badge[];
  learningStyle: string;
  joinDate: string;
  skillRating: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
}

export interface Notification {
  id: string;
  type: "reminder" | "achievement" | "recommendation" | "alert";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// ============ QUIZZES ============

export const quizzes: Quiz[] = [
  {
    id: "q1", title: "Gradient Descent Fundamentals", topic: "Optimization", difficulty: "medium",
    questionCount: 5, timeLimit: 10, attempts: 3, bestScore: 80,
    description: "Test your understanding of gradient descent optimization, learning rates, and convergence.",
    questions: [
      { id: "q1-1", text: "What does gradient descent minimize?", options: ["Accuracy", "Loss function", "Learning rate", "Batch size"], correctAnswer: 1, hint: "Think about what we're trying to reduce during training.", explanation: "Gradient descent iteratively minimizes the loss function by adjusting parameters in the direction of steepest descent.", difficulty: "easy" },
      { id: "q1-2", text: "What happens with a very large learning rate?", options: ["Faster convergence", "Overshooting the minimum", "Better accuracy", "No effect"], correctAnswer: 1, hint: "Consider what happens when steps are too big.", explanation: "A very large learning rate causes overshooting, potentially diverging instead of converging.", difficulty: "medium" },
      { id: "q1-3", text: "Which variant uses a single sample per update?", options: ["Batch GD", "Mini-batch GD", "Stochastic GD", "Adam"], correctAnswer: 2, hint: "The name comes from randomness in sample selection.", explanation: "Stochastic GD updates parameters using one randomly selected training sample.", difficulty: "easy" },
      { id: "q1-4", text: "What is the role of momentum in gradient descent?", options: ["Reduces learning rate", "Accelerates convergence by accumulating past gradients", "Increases batch size", "Normalizes weights"], correctAnswer: 1, hint: "Think of a ball rolling down a hill gaining speed.", explanation: "Momentum accumulates past gradients to accelerate SGD and dampen oscillations.", difficulty: "hard" },
      { id: "q1-5", text: "At a saddle point, the gradient is:", options: ["Maximum", "Zero", "Undefined", "Negative"], correctAnswer: 1, hint: "Saddle points share a property with local minima and maxima.", explanation: "At saddle points, the gradient is zero but it's neither a minimum nor maximum.", difficulty: "medium" },
    ],
  },
  {
    id: "q2", title: "Linear Algebra Essentials", topic: "Linear Algebra", difficulty: "easy",
    questionCount: 5, timeLimit: 8, attempts: 5, bestScore: 100,
    description: "Core linear algebra concepts including matrices, vectors, and transformations.",
    questions: [
      { id: "q2-1", text: "What is the determinant of a 2×2 identity matrix?", options: ["0", "1", "2", "Undefined"], correctAnswer: 1, hint: "The identity matrix has 1s on the diagonal.", explanation: "The determinant of any identity matrix is 1.", difficulty: "easy" },
      { id: "q2-2", text: "Two vectors are orthogonal when their dot product is:", options: ["1", "-1", "0", "Infinity"], correctAnswer: 2, hint: "Orthogonal means perpendicular.", explanation: "Two vectors are orthogonal if their dot product equals zero.", difficulty: "easy" },
      { id: "q2-3", text: "The rank of a matrix represents:", options: ["Number of rows", "Maximum linearly independent columns", "Trace value", "Largest eigenvalue"], correctAnswer: 1, hint: "It's related to linear independence.", explanation: "The rank is the maximum number of linearly independent row or column vectors.", difficulty: "medium" },
      { id: "q2-4", text: "An eigenvalue λ satisfies which equation?", options: ["Av = v", "Av = λv", "A = λI", "det(A) = λ"], correctAnswer: 1, hint: "It involves a matrix, vector, and scalar.", explanation: "Eigenvalues satisfy Av = λv.", difficulty: "medium" },
      { id: "q2-5", text: "The transpose of a product (AB)ᵀ equals:", options: ["AᵀBᵀ", "BᵀAᵀ", "(BA)ᵀ", "AB"], correctAnswer: 1, hint: "The order reverses.", explanation: "The transpose of a product reverses the order: (AB)ᵀ = BᵀAᵀ.", difficulty: "easy" },
    ],
  },
  {
    id: "q3", title: "Neural Network Architecture", topic: "Deep Learning", difficulty: "hard",
    questionCount: 5, timeLimit: 15, attempts: 1, bestScore: null,
    description: "Advanced concepts in neural network design, activation functions, and architecture choices.",
    questions: [
      { id: "q3-1", text: "ReLU activation is defined as:", options: ["max(0, x)", "1/(1+e^-x)", "tanh(x)", "(e^x - e^-x)/(e^x + e^-x)"], correctAnswer: 0, hint: "It's the simplest — just clips negatives.", explanation: "ReLU outputs max(0, x), passing positive values through and zeroing negatives.", difficulty: "easy" },
      { id: "q3-2", text: "What problem does batch normalization address?", options: ["Overfitting", "Internal covariate shift", "Vanishing gradients only", "Data augmentation"], correctAnswer: 1, hint: "It normalizes layer inputs during training.", explanation: "Batch normalization addresses internal covariate shift by normalizing layer inputs.", difficulty: "hard" },
      { id: "q3-3", text: "In a CNN, what does a pooling layer do?", options: ["Adds nonlinearity", "Reduces spatial dimensions", "Increases feature maps", "Normalizes activations"], correctAnswer: 1, hint: "Think about downsampling.", explanation: "Pooling layers reduce spatial dimensions, providing translation invariance.", difficulty: "medium" },
      { id: "q3-4", text: "Dropout during training helps prevent:", options: ["Underfitting", "Overfitting", "Vanishing gradients", "Mode collapse"], correctAnswer: 1, hint: "It randomly deactivates neurons.", explanation: "Dropout prevents co-adaptation and reduces overfitting.", difficulty: "medium" },
      { id: "q3-5", text: "The attention mechanism computes:", options: ["Weighted sum of values based on query-key similarity", "Max pooling over sequences", "Convolution over time steps", "Recurrent hidden states"], correctAnswer: 0, hint: "It uses queries, keys, and values.", explanation: "Attention computes a weighted sum of values using query-key similarity.", difficulty: "hard" },
    ],
  },
  {
    id: "q4", title: "Probability & Bayes Theorem", topic: "Probability", difficulty: "medium",
    questionCount: 5, timeLimit: 12, attempts: 2, bestScore: 60,
    description: "Probability distributions, Bayes theorem, and conditional probability.",
    questions: [
      { id: "q4-1", text: "P(A|B) is called:", options: ["Joint probability", "Marginal probability", "Conditional probability", "Prior probability"], correctAnswer: 2, hint: "It's the probability of A given B.", explanation: "P(A|B) is the conditional probability of A given B.", difficulty: "easy" },
      { id: "q4-2", text: "Bayes' theorem relates:", options: ["Mean and variance", "Prior and posterior", "Bias and variance", "Loss and accuracy"], correctAnswer: 1, hint: "It updates beliefs with evidence.", explanation: "Bayes' theorem updates prior to posterior using evidence.", difficulty: "medium" },
      { id: "q4-3", text: "The expected value of a fair six-sided die is:", options: ["3", "3.5", "4", "6"], correctAnswer: 1, hint: "Average all possible outcomes.", explanation: "E[X] = (1+2+3+4+5+6)/6 = 3.5", difficulty: "easy" },
      { id: "q4-4", text: "Two events are independent if:", options: ["P(A∩B) = P(A)P(B)", "P(A∩B) = 0", "P(A|B) = P(B)", "P(A) + P(B) = 1"], correctAnswer: 0, hint: "One event doesn't affect the other.", explanation: "Events are independent if P(A∩B) = P(A)P(B).", difficulty: "medium" },
      { id: "q4-5", text: "The normal distribution is parameterized by:", options: ["λ only", "p and n", "μ and σ²", "α and β"], correctAnswer: 2, hint: "Center and spread.", explanation: "The normal distribution is defined by mean (μ) and variance (σ²).", difficulty: "easy" },
    ],
  },
];

// ============ TOPIC NODES ============

export const topicNodes: TopicNode[] = [
  { id: "calc", label: "Calculus", mastery: 0.82, quizAttempts: 8, totalTime: 340, resources: ["MIT OCW Calculus", "3Blue1Brown Essence of Calculus"], prerequisites: [] },
  { id: "linalg", label: "Linear Algebra", mastery: 0.65, quizAttempts: 5, totalTime: 280, resources: ["Gilbert Strang Lectures", "Interactive Linear Algebra"], prerequisites: ["calc"] },
  { id: "prob", label: "Probability", mastery: 0.48, quizAttempts: 4, totalTime: 200, resources: ["Khan Academy Probability", "StatQuest"], prerequisites: ["calc"] },
  { id: "stats", label: "Statistics", mastery: 0.38, quizAttempts: 3, totalTime: 150, resources: ["Intro to Statistical Learning", "Statistics 110 Harvard"], prerequisites: ["prob"] },
  { id: "ml", label: "Machine Learning", mastery: 0.28, quizAttempts: 2, totalTime: 120, resources: ["Andrew Ng ML Course", "Hands-On ML"], prerequisites: ["linalg", "stats"] },
  { id: "dl", label: "Deep Learning", mastery: 0.12, quizAttempts: 1, totalTime: 60, resources: ["Deep Learning Book", "Fast.ai"], prerequisites: ["ml"] },
  { id: "opt", label: "Optimization", mastery: 0.22, quizAttempts: 2, totalTime: 90, resources: ["Convex Optimization Boyd", "Optimization for ML"], prerequisites: ["calc", "linalg"] },
  { id: "nla", label: "Numerical Methods", mastery: 0.55, quizAttempts: 4, totalTime: 180, resources: ["Numerical Recipes", "Computational Science"], prerequisites: [] },
];

// ============ STUDENT PROFILE ============

export const studentProfile: StudentProfile = {
  name: "Alex Chen",
  email: "alex.chen@university.edu",
  avatar: "AC",
  level: 14,
  xp: 2840,
  xpToNext: 3200,
  streak: 12,
  totalHours: 47.5,
  learningStyle: "Visual-Kinesthetic",
  joinDate: "2025-09-15",
  skillRating: 1200,
  badges: [
    { id: "b1", name: "First Steps", icon: "🚀", description: "Complete your first lesson", earned: true, earnedDate: "2025-09-16" },
    { id: "b2", name: "Quiz Master", icon: "🧠", description: "Score 100% on any quiz", earned: true, earnedDate: "2025-10-02" },
    { id: "b3", name: "Streak Warrior", icon: "🔥", description: "Maintain a 7-day streak", earned: true, earnedDate: "2025-10-20" },
    { id: "b4", name: "Deep Thinker", icon: "💡", description: "Spend 40+ hours learning", earned: true, earnedDate: "2026-01-15" },
    { id: "b5", name: "Knowledge Explorer", icon: "🗺️", description: "Master 5 topics above 50%", earned: false },
    { id: "b6", name: "Speed Demon", icon: "⚡", description: "Complete a quiz in under 2 minutes", earned: false },
  ],
};

// ============ NOTIFICATIONS ============

export const notifications: Notification[] = [
  { id: "n1", type: "recommendation", title: "AI Study Plan Ready", message: "Your personalized study plan focuses on Probability weak areas.", time: "5 min ago", read: false },
  { id: "n2", type: "achievement", title: "Badge Unlocked: Deep Thinker", message: "You've reached 40+ hours of total learning time!", time: "2 hours ago", read: false },
  { id: "n3", type: "reminder", title: "Spaced Repetition Due", message: "Review Linear Algebra eigenvalues — optimal recall window closing.", time: "4 hours ago", read: true },
  { id: "n4", type: "alert", title: "Cognitive Load Warning", message: "Your last session showed elevated cognitive load. Consider lighter topics.", time: "Yesterday", read: true },
];

// ============ WEEKLY PROGRESS ============

export const weeklyProgress = [
  { day: "Mon", minutes: 45, xp: 120, quizzes: 1 },
  { day: "Tue", minutes: 60, xp: 180, quizzes: 2 },
  { day: "Wed", minutes: 30, xp: 80, quizzes: 0 },
  { day: "Thu", minutes: 75, xp: 220, quizzes: 1 },
  { day: "Fri", minutes: 50, xp: 150, quizzes: 1 },
  { day: "Sat", minutes: 90, xp: 280, quizzes: 3 },
  { day: "Sun", minutes: 40, xp: 100, quizzes: 0 },
];

// ============ LEADERBOARD ============

export const leaderboard = [
  { rank: 1, name: "Sarah Kim", xp: 4200, level: 18, streak: 28 },
  { rank: 2, name: "Alex Chen", xp: 2840, level: 14, streak: 12 },
  { rank: 3, name: "James Liu", xp: 2650, level: 13, streak: 9 },
  { rank: 4, name: "Maria Santos", xp: 2100, level: 11, streak: 15 },
  { rank: 5, name: "Raj Patel", xp: 1890, level: 10, streak: 5 },
  { rank: 6, name: "Emma Wilson", xp: 1720, level: 9, streak: 7 },
];

// ============ ANALYTICS ============

export const topicPerformance = [
  { topic: "Calculus", accuracy: 85, timeSpent: 340, mastery: 82 },
  { topic: "Linear Algebra", accuracy: 78, timeSpent: 280, mastery: 65 },
  { topic: "Numerical Methods", accuracy: 72, timeSpent: 180, mastery: 55 },
  { topic: "Probability", accuracy: 60, timeSpent: 200, mastery: 48 },
  { topic: "Statistics", accuracy: 55, timeSpent: 150, mastery: 38 },
  { topic: "Machine Learning", accuracy: 50, timeSpent: 120, mastery: 28 },
  { topic: "Optimization", accuracy: 45, timeSpent: 90, mastery: 22 },
  { topic: "Deep Learning", accuracy: 35, timeSpent: 60, mastery: 12 },
];

export const focusTimeline = [
  { time: "0-5m", focus: 92 }, { time: "5-10m", focus: 88 }, { time: "10-15m", focus: 82 },
  { time: "15-20m", focus: 75 }, { time: "20-25m", focus: 68 }, { time: "25-30m", focus: 55 },
  { time: "30-35m", focus: 48 }, { time: "35-40m", focus: 42 },
];
