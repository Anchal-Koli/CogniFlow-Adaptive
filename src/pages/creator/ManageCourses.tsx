import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  GraduationCap,
  Layers3,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileText,
  PenSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CourseRow {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: string;
  is_published: boolean;
  created_at: string;
}

interface QuizQuestion {
  text: string;
  options: string[];
  correctAnswer: number;
  hint: string;
  explanation: string;
  difficulty: string;
}

interface QuizRow {
  id: string;
  course_id: string | null;
  title: string;
  topic: string;
  difficulty: string;
  description: string;
  time_limit: number;
  questions: QuizQuestion[];
  is_published: boolean;
  created_at: string;
}

interface QuestionForm {
  text: string;
  options: string[];
  correctAnswer: number;
  hint: string;
  explanation: string;
  difficulty: string;
}

type CreatorSection = "content" | "courses" | "quizzes";

const emptyQuestion: QuestionForm = {
  text: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  hint: "",
  explanation: "",
  difficulty: "medium",
};

export default function ManageCourses() {
  const qc = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const currentSection: CreatorSection = useMemo(() => {
    if (location.pathname.startsWith("/creator/quizzes")) return "quizzes";
    if (location.pathname.startsWith("/creator/courses")) return "courses";
    return "content";
  }, [location.pathname]);

  const [courseOpen, setCourseOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<CourseRow | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    topic: "",
    difficulty: "medium",
  });

  const [quizOpen, setQuizOpen] = useState(false);
  const [editQuiz, setEditQuiz] = useState<QuizRow | null>(null);
  const [quizForm, setQuizForm] = useState({
    title: "",
    topic: "",
    difficulty: "medium",
    description: "",
    time_limit: 10,
    course_id: "",
  });
  const [questions, setQuestions] = useState<QuestionForm[]>([{ ...emptyQuestion }]);

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["manage-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CourseRow[];
    },
  });

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery({
    queryKey: ["manage-quizzes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as QuizRow[];
    },
  });

  const courseMetrics = useMemo(() => {
    const total = courses.length;
    const published = courses.filter((c) => c.is_published).length;
    const drafts = total - published;
    return { total, published, drafts };
  }, [courses]);

  const quizMetrics = useMemo(() => {
    const total = quizzes.length;
    const published = quizzes.filter((q) => q.is_published).length;
    const drafts = total - published;
    const empty = quizzes.filter(
      (q) => !Array.isArray(q.questions) || q.questions.length === 0
    ).length;
    return { total, published, drafts, empty };
  }, [quizzes]);

  const saveCourse = useMutation({
    mutationFn: async (pub?: boolean) => {
      const payload = {
        title: courseForm.title,
        description: courseForm.description,
        topic: courseForm.topic,
        difficulty: courseForm.difficulty,
        is_published: pub ?? false,
      };

      if (editCourse) {
        const { error } = await supabase
          .from("courses")
          .update(payload)
          .eq("id", editCourse.id);

        if (error) throw error;
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { error } = await supabase
          .from("courses")
          .insert({ ...payload, created_by: user?.id });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage-courses"] });
      setCourseOpen(false);
      setEditCourse(null);
      setCourseForm({
        title: "",
        description: "",
        topic: "",
        difficulty: "medium",
      });
      toast.success(editCourse ? "Course updated" : "Course created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage-courses"] });
      toast.success("Course deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePublishCourse = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from("courses")
        .update({ is_published: published })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage-courses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveQuiz = useMutation({
    mutationFn: async (pub?: boolean) => {
      const payload = {
        title: quizForm.title,
        topic: quizForm.topic,
        difficulty: quizForm.difficulty,
        description: quizForm.description,
        time_limit: quizForm.time_limit,
        course_id:
          quizForm.course_id && quizForm.course_id !== "none"
            ? quizForm.course_id
            : null,
        questions: questions.map((q, i) => ({ id: `q-${i}`, ...q })),
        is_published: pub ?? false,
      };

      if (editQuiz) {
        const { error } = await supabase
          .from("quizzes")
          .update(payload)
          .eq("id", editQuiz.id);

        if (error) throw error;
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { error } = await supabase
          .from("quizzes")
          .insert({ ...payload, created_by: user?.id });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage-quizzes"] });
      setQuizOpen(false);
      setEditQuiz(null);
      setQuizForm({
        title: "",
        topic: "",
        difficulty: "medium",
        description: "",
        time_limit: 10,
        course_id: "",
      });
      setQuestions([{ ...emptyQuestion }]);
      toast.success(editQuiz ? "Quiz updated" : "Quiz created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteQuiz = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quizzes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage-quizzes"] });
      toast.success("Quiz deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePublishQuiz = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from("quizzes")
        .update({ is_published: published })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage-quizzes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEditCourse = (c: CourseRow) => {
    setEditCourse(c);
    setCourseForm({
      title: c.title,
      description: c.description,
      topic: c.topic,
      difficulty: c.difficulty,
    });
    setCourseOpen(true);
  };

  const openEditQuiz = (q: QuizRow) => {
    setEditQuiz(q);
    setQuizForm({
      title: q.title,
      topic: q.topic,
      difficulty: q.difficulty,
      description: q.description,
      time_limit: q.time_limit,
      course_id: q.course_id || "",
    });

    setQuestions(
      Array.isArray(q.questions) && q.questions.length > 0
        ? q.questions.map((qn) => ({
            text: qn.text || "",
            options: qn.options || ["", "", "", ""],
            correctAnswer: qn.correctAnswer ?? 0,
            hint: qn.hint || "",
            explanation: qn.explanation || "",
            difficulty: qn.difficulty || "medium",
          }))
        : [{ ...emptyQuestion }]
    );

    setQuizOpen(true);
  };

  const updateQuestion = (
    idx: number,
    field: keyof QuestionForm,
    value: string | number | string[]
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: q.options.map((o, j) => (j === oIdx ? value : o)),
            }
          : q
      )
    );
  };

  const resetCourseModal = () => {
    setEditCourse(null);
    setCourseForm({
      title: "",
      description: "",
      topic: "",
      difficulty: "medium",
    });
  };

  const resetQuizModal = () => {
    setEditQuiz(null);
    setQuizForm({
      title: "",
      topic: "",
      difficulty: "medium",
      description: "",
      time_limit: 10,
      course_id: "",
    });
    setQuestions([{ ...emptyQuestion }]);
  };

  const renderCourseDialog = () => (
    <Dialog
      open={courseOpen}
      onOpenChange={(open) => {
        setCourseOpen(open);
        if (!open) resetCourseModal();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={16} className="mr-1.5" />
          New Course
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editCourse ? "Edit Course" : "Create Course"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={courseForm.title}
              onChange={(e) =>
                setCourseForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="e.g. Machine Learning 101"
            />
          </div>

          <div>
            <Label>Topic</Label>
            <Input
              value={courseForm.topic}
              onChange={(e) =>
                setCourseForm((f) => ({ ...f, topic: e.target.value }))
              }
              placeholder="e.g. Machine Learning"
            />
          </div>

          <div>
            <Label>Difficulty</Label>
            <Select
              value={courseForm.difficulty}
              onValueChange={(v) => setCourseForm((f) => ({ ...f, difficulty: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={courseForm.description}
              onChange={(e) =>
                setCourseForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => saveCourse.mutate(false)}
              disabled={!courseForm.title.trim() || saveCourse.isPending}
            >
              Save Draft
            </Button>
            <Button
              onClick={() => saveCourse.mutate(true)}
              disabled={!courseForm.title.trim() || saveCourse.isPending}
            >
              Publish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderQuizDialog = () => (
    <Dialog
      open={quizOpen}
      onOpenChange={(open) => {
        setQuizOpen(open);
        if (!open) resetQuizModal();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={16} className="mr-1.5" />
          New Quiz
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editQuiz ? "Edit Quiz" : "Create Quiz"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Title</Label>
              <Input
                value={quizForm.title}
                onChange={(e) =>
                  setQuizForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Topic</Label>
              <Input
                value={quizForm.topic}
                onChange={(e) =>
                  setQuizForm((f) => ({ ...f, topic: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Difficulty</Label>
              <Select
                value={quizForm.difficulty}
                onValueChange={(v) => setQuizForm((f) => ({ ...f, difficulty: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Time Limit (min)</Label>
              <Input
                type="number"
                value={quizForm.time_limit}
                onChange={(e) =>
                  setQuizForm((f) => ({
                    ...f,
                    time_limit: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="md:col-span-2">
              <Label>Course (optional)</Label>
              <Select
                value={quizForm.course_id}
                onValueChange={(v) => setQuizForm((f) => ({ ...f, course_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={quizForm.description}
              onChange={(e) =>
                setQuizForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Questions ({questions.length})
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuestions((q) => [...q, { ...emptyQuestion }])}
              >
                <Plus size={14} className="mr-1" />
                Add
              </Button>
            </div>

            {questions.map((q, qi) => (
              <Card key={qi} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Q{qi + 1}
                  </span>

                  {questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() =>
                        setQuestions((qs) => qs.filter((_, i) => i !== qi))
                      }
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>

                <Input
                  placeholder="Question text"
                  value={q.text}
                  onChange={(e) => updateQuestion(qi, "text", e.target.value)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={q.correctAnswer === oi}
                        onChange={() => updateQuestion(qi, "correctAnswer", oi)}
                        className="accent-[hsl(var(--primary))]"
                      />
                      <Input
                        placeholder={`Option ${oi + 1}`}
                        value={opt}
                        onChange={(e) => updateOption(qi, oi, e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    placeholder="Hint"
                    value={q.hint}
                    onChange={(e) => updateQuestion(qi, "hint", e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Explanation"
                    value={q.explanation}
                    onChange={(e) =>
                      updateQuestion(qi, "explanation", e.target.value)
                    }
                    className="text-sm"
                  />
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => saveQuiz.mutate(false)}
              disabled={!quizForm.title.trim() || saveQuiz.isPending}
            >
              Save Draft
            </Button>
            <Button
              onClick={() => saveQuiz.mutate(true)}
              disabled={!quizForm.title.trim() || saveQuiz.isPending}
            >
              Publish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderContentOverview = () => {
    const totalAssets = courseMetrics.total + quizMetrics.total;
    const totalDrafts = courseMetrics.drafts + quizMetrics.drafts;
    const totalPublished = courseMetrics.published + quizMetrics.published;

    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <Layers3 className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-bold">{totalAssets}</p>
              <p className="text-xs text-muted-foreground">Courses + quizzes</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Published</p>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-bold">{totalPublished}</p>
              <p className="text-xs text-muted-foreground">Live learner content</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Drafts</p>
                <FileText className="h-4 w-4 text-orange-500" />
              </div>
              <p className="mt-2 text-2xl font-bold">{totalDrafts}</p>
              <p className="text-xs text-muted-foreground">Needs review before publish</p>
            </CardContent>
          </Card>

          <Card className="border-orange-500/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Quiz Issues</p>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </div>
              <p className="mt-2 text-2xl font-bold">{quizMetrics.empty}</p>
              <p className="text-xs text-muted-foreground">Empty quizzes detected</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Creator Priorities</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <p className="font-medium">Courses</p>
                </div>
                <p className="mt-2 text-2xl font-bold">{courseMetrics.total}</p>
                <p className="text-xs text-muted-foreground">
                  {courseMetrics.drafts} drafts pending review
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <PenSquare className="h-4 w-4 text-primary" />
                  <p className="font-medium">Quizzes</p>
                </div>
                <p className="mt-2 text-2xl font-bold">{quizMetrics.total}</p>
                <p className="text-xs text-muted-foreground">
                  {quizMetrics.drafts} drafts pending review
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <p className="font-medium">Empty Quizzes</p>
                </div>
                <p className="mt-2 text-2xl font-bold">{quizMetrics.empty}</p>
                <p className="text-xs text-muted-foreground">
                  Fix before publishing
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="font-medium">Workflow</p>
                </div>
                <p className="mt-2 text-sm font-medium">Draft → Review → Publish</p>
                <p className="text-xs text-muted-foreground">
                  Keep authoring consistent and safe
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button variant="outline" onClick={() => navigate("/creator/courses")}>
                <GraduationCap className="mr-2 h-4 w-4" />
                Manage Courses
              </Button>
              <Button variant="outline" onClick={() => navigate("/creator/quizzes")}>
                <PenSquare className="mr-2 h-4 w-4" />
                Manage Quizzes
              </Button>
              <Button variant="outline" onClick={() => setCourseOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Course
              </Button>
              <Button variant="outline" onClick={() => setQuizOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderCourses = () => {
    if (coursesLoading) {
      return <div className="text-muted-foreground text-sm">Loading courses...</div>;
    }

    if (courses.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No courses yet. Create your first one.
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-3">
        <AnimatePresence>
          {courses.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card>
                <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4 px-5">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{c.title}</span>
                      <Badge variant={c.is_published ? "default" : "secondary"}>
                        {c.is_published ? "Published" : "Draft"}
                      </Badge>
                      <Badge variant="outline">{c.difficulty}</Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {c.topic} · {c.description?.slice(0, 80)}
                      {c.description && c.description.length > 80 ? "…" : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={c.is_published}
                      onCheckedChange={(v) =>
                        togglePublishCourse.mutate({ id: c.id, published: v })
                      }
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEditCourse(c)}>
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteCourse.mutate(c.id)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  const renderQuizzes = () => {
    if (quizzesLoading) {
      return <div className="text-muted-foreground text-sm">Loading quizzes...</div>;
    }

    if (quizzes.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No quizzes yet. Create your first one.
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-3">
        <AnimatePresence>
          {quizzes.map((q) => {
            const questionCount = Array.isArray(q.questions) ? q.questions.length : 0;

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card>
                  <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4 px-5">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{q.title}</span>
                        <Badge variant={q.is_published ? "default" : "secondary"}>
                          {q.is_published ? "Published" : "Draft"}
                        </Badge>
                        <Badge variant="outline">{q.difficulty}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {questionCount} Qs · {q.time_limit} min
                        </span>
                        {questionCount === 0 && (
                          <Badge variant="destructive">Empty</Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {q.topic} · {q.description?.slice(0, 80)}
                        {q.description && q.description.length > 80 ? "…" : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={q.is_published}
                        onCheckedChange={(v) =>
                          togglePublishQuiz.mutate({ id: q.id, published: v })
                        }
                      />
                      <Button variant="ghost" size="icon" onClick={() => openEditQuiz(q)}>
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteQuiz.mutate(q.id)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  };

  const renderSettingsHeader = () => {
    const sectionMeta = {
      content: {
        title: "Content Studio",
        description: "Monitor drafts, publish readiness, and content health",
        icon: Layers3,
      },
      courses: {
        title: "Course Builder",
        description: "Create, edit, and publish structured learning modules",
        icon: GraduationCap,
      },
      quizzes: {
        title: "Quiz Builder",
        description: "Author quizzes, validate question quality, and publish safely",
        icon: PenSquare,
      },
    } as const;

    const active = sectionMeta[currentSection];

    return (
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <active.icon className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">{active.title}</h1>
            <p className="text-sm text-muted-foreground">{active.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={currentSection === "content" ? "default" : "outline"}
            onClick={() => navigate("/creator/content")}
          >
            Content Studio
          </Button>
          <Button
            variant={currentSection === "courses" ? "default" : "outline"}
            onClick={() => navigate("/creator/courses")}
          >
            Courses
          </Button>
          <Button
            variant={currentSection === "quizzes" ? "default" : "outline"}
            onClick={() => navigate("/creator/quizzes")}
          >
            Quizzes
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderSettingsHeader()}

      {(currentSection === "content" || currentSection === "courses") && renderCourseDialog()}
      {(currentSection === "content" || currentSection === "quizzes") && renderQuizDialog()}

      {currentSection === "content" && renderContentOverview()}
      {currentSection === "courses" && renderCourses()}
      {currentSection === "quizzes" && renderQuizzes()}
    </div>
  );
}