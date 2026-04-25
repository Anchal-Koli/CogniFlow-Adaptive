import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageLoader from "@/components/PageLoader";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Clock3,
  Target,
  Sparkles,
  CheckCircle2,
  Layers3,
  Trophy,
} from "lucide-react";

interface CourseRow {
  id: string;
  title: string;
  description: string | null;
  topic: string | null;
  difficulty: string | null;
  is_published: boolean;
  image_url: string | null;
}

const difficultyStyles: Record<string, string> = {
  easy: "text-mastery bg-mastery/10 border-mastery/20",
  medium: "text-accent bg-accent/10 border-accent/20",
  hard: "text-destructive bg-destructive/10 border-destructive/20",
};

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["course-details", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, topic, difficulty, is_published, image_url")
        .eq("id", id)
        .eq("is_published", true)
        .single();

      if (error) {
        console.error("COURSE DETAILS ERROR:", error);
        throw error;
      }

      return data as CourseRow;
    },
    retry: 1,
  });

  if (isLoading) return <PageLoader />;

  if (error || !course) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/courses")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Courses
        </button>

        <div className="bg-card-gradient border border-border rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Course not found</h2>
          <p className="text-sm text-muted-foreground">
            This course may be unpublished or missing from the database.
          </p>
        </div>
      </div>
    );
  }

  const difficulty = (course.difficulty || "standard").toLowerCase();
  const topic = course.topic || "General Learning";
  const description =
    course.description || "This course currently has no detailed description.";

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/courses")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Courses
      </button>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card-gradient border border-border rounded-2xl overflow-hidden"
      >
        <div className="grid lg:grid-cols-[1.4fr_0.9fr] gap-0">
          {/* Left Content */}
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap size={18} className="text-primary" />
              <span className="text-sm text-muted-foreground">{topic}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span
                className={`text-xs px-3 py-1.5 rounded-full border font-semibold capitalize ${
                  difficultyStyles[difficulty] ||
                  "text-primary bg-primary/10 border-primary/20"
                }`}
              >
                {course.difficulty || "Standard"}
              </span>

              <span className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground bg-secondary/30">
                Self-paced
              </span>

              <span className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground bg-secondary/30">
                Structured Path
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight mb-4">
              {course.title}
            </h1>

            <p className="text-sm md:text-base text-muted-foreground leading-7 max-w-3xl mb-6">
              {description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={16} className="text-primary" />
                  <span className="text-sm font-semibold text-foreground">Format</span>
                </div>
                <p className="text-xs text-muted-foreground">Guided concept-first learning</p>
              </div>

              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock3 size={16} className="text-accent" />
                  <span className="text-sm font-semibold text-foreground">Pace</span>
                </div>
                <p className="text-xs text-muted-foreground">Learn anytime at your own speed</p>
              </div>

              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={16} className="text-mastery" />
                  <span className="text-sm font-semibold text-foreground">Goal</span>
                </div>
                <p className="text-xs text-muted-foreground">Strong academic + practical clarity</p>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="border-t lg:border-t-0 lg:border-l border-border bg-secondary/20 min-h-[260px]">
            {course.image_url ? (
              <img
                src={course.image_url}
                alt={course.title}
                className="w-full h-full object-cover min-h-[260px]"
              />
            ) : (
              <div className="w-full h-full min-h-[260px] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <Layers3 size={28} className="text-primary" />
                </div>
                <h3 className="text-foreground font-semibold mb-2">Course Preview</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  A structured learning journey designed to improve conceptual understanding.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_0.9fr] gap-6">
        {/* Left Section */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-6"
        >
          <div className="bg-card-gradient border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">What you’ll learn</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/20 p-4">
                <CheckCircle2 size={18} className="text-mastery mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Core concepts</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Build strong fundamentals in {topic}.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/20 p-4">
                <CheckCircle2 size={18} className="text-mastery mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Structured progression</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Move from basics to deeper understanding in a clean sequence.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/20 p-4">
                <CheckCircle2 size={18} className="text-mastery mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Quiz readiness</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Prepare better for assessments and revision sessions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/20 p-4">
                <CheckCircle2 size={18} className="text-mastery mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Practical confidence</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Strengthen academic and interview-level understanding.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card-gradient border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">How to study this course</h2>
            </div>

            <div className="space-y-4">
              {[
                "Start with the course overview and understand the learning objective.",
                "Read the concepts in sequence instead of skipping random topics.",
                "Revise key ideas after each study session for better retention.",
                "Use quizzes after studying to test actual understanding.",
              ].map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-sm text-muted-foreground leading-6">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Section */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="bg-card-gradient border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Course Snapshot</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Category</span>
                <span className="text-foreground font-medium">{topic}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Difficulty</span>
                <span className="text-foreground font-medium capitalize">
                  {course.difficulty || "Standard"}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mode</span>
                <span className="text-foreground font-medium">Self-paced</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="text-mastery font-medium">Published</span>
              </div>
            </div>
          </div>

          <div className="bg-card-gradient border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-accent" />
              <h3 className="text-lg font-semibold text-foreground">Best Use Case</h3>
            </div>

            <p className="text-sm text-muted-foreground leading-6">
              This course is ideal for students who want a clean, focused learning path
              without distractions — especially useful for academic preparation, revision,
              and building strong fundamentals.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/quizzes")}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all"
          >
            Go to Quizzes
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default CourseDetails;