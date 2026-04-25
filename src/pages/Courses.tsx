import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Search,
  Filter,
  Clock3,
  ChevronRight,
  BookOpen,
  Layers3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PageLoader from "@/components/PageLoader";
import { useNavigate } from "react-router-dom";

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

const Courses = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "easy" | "medium" | "hard">("all");
  const navigate = useNavigate();

  const {
    data: courses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["courses-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, topic, difficulty, is_published, image_url")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("COURSES PAGE ERROR:", error);
        throw error;
      }

      return (data || []) as CourseRow[];
    },
    retry: 1,
  });

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const title = (course.title || "").toLowerCase();
      const topic = (course.topic || "").toLowerCase();
      const description = (course.description || "").toLowerCase();
      const keyword = search.toLowerCase();

      const matchesSearch =
        title.includes(keyword) ||
        topic.includes(keyword) ||
        description.includes(keyword);

      const matchesFilter =
        filter === "all"
          ? true
          : (course.difficulty || "").toLowerCase() === filter;

      return matchesSearch && matchesFilter;
    });
  }, [courses, search, filter]);

  if (isLoading) return <PageLoader />;

  if (error) {
    return (
      <div className="bg-card-gradient border border-border rounded-xl p-8 text-center">
        <h3 className="text-foreground font-semibold mb-2">Failed to load courses</h3>
        <p className="text-sm text-muted-foreground">
          Please check course permissions or published data in Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse your available learning paths and continue your progress.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
          <BookOpen size={14} className="text-primary" />
          <span className="text-xs font-semibold text-primary">
            {courses.length} Published Courses
          </span>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses by title, topic, or keyword..."
            className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-muted-foreground" />
          {(["all", "easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${
                filter === d
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 ? (
        <div className="bg-card-gradient border border-border rounded-xl p-8 text-center">
          <GraduationCap size={28} className="mx-auto text-muted-foreground mb-3" />
          <h3 className="text-foreground font-semibold mb-1">No courses found</h3>
          <p className="text-sm text-muted-foreground">
            Try changing your search or difficulty filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCourses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card-gradient border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all group"
            >
              {/* Cover */}
              <div className="h-40 border-b border-border bg-secondary/30 overflow-hidden">
                {course.image_url ? (
                  <img
                    src={course.image_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Layers3 size={28} />
                      <span className="text-xs">Course Preview</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <GraduationCap size={16} className="text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {course.topic || "General"}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-1 rounded-full border font-medium capitalize ${
                      difficultyStyles[(course.difficulty || "").toLowerCase()] ||
                      "text-primary bg-primary/10 border-primary/20"
                    }`}
                  >
                    {course.difficulty || "Standard"}
                  </span>
                </div>

                <h3 className="text-foreground font-semibold line-clamp-2 mb-2 min-h-[48px]">
                  {course.title}
                </h3>

                <p className="text-xs text-muted-foreground line-clamp-3 mb-4 min-h-[48px]">
                  {course.description || "No description available for this course yet."}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock3 size={12} />
                    Self-paced
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} />
                    Structured
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all text-sm font-semibold"
                >
                  View Course
                  <ChevronRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses;