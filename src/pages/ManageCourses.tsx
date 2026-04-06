import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, BookOpen, GraduationCap } from "lucide-react";
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

interface QuizRow {
  id: string;
  course_id: string | null;
  title: string;
  topic: string;
  difficulty: string;
  description: string;
  time_limit: number;
  questions: any[];
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

const emptyQuestion: QuestionForm = { text: "", options: ["", "", "", ""], correctAnswer: 0, hint: "", explanation: "", difficulty: "medium" };

export default function ManageCourses() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"courses" | "quizzes">("courses");

  // --- Courses ---
  const [courseOpen, setCourseOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<CourseRow | null>(null);
  const [courseForm, setCourseForm] = useState({ title: "", description: "", topic: "", difficulty: "medium" });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["manage-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as CourseRow[];
    },
  });

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
        const { error } = await supabase.from("courses").update(payload).eq("id", editCourse.id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("courses").insert({ ...payload, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage-courses"] });
      setCourseOpen(false);
      setEditCourse(null);
      setCourseForm({ title: "", description: "", topic: "", difficulty: "medium" });
      toast.success(editCourse ? "Course updated" : "Course created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["manage-courses"] }); toast.success("Course deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const togglePublishCourse = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("courses").update({ is_published: published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["manage-courses"] }); },
  });

  // --- Quizzes ---
  const [quizOpen, setQuizOpen] = useState(false);
  const [editQuiz, setEditQuiz] = useState<QuizRow | null>(null);
  const [quizForm, setQuizForm] = useState({ title: "", topic: "", difficulty: "medium", description: "", time_limit: 10, course_id: "" });
  const [questions, setQuestions] = useState<QuestionForm[]>([{ ...emptyQuestion }]);

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery({
    queryKey: ["manage-quizzes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as QuizRow[];
    },
  });

  const saveQuiz = useMutation({
    mutationFn: async (pub?: boolean) => {
      const payload = {
        title: quizForm.title,
        topic: quizForm.topic,
        difficulty: quizForm.difficulty,
        description: quizForm.description,
        time_limit: quizForm.time_limit,
        course_id: quizForm.course_id && quizForm.course_id !== "none" ? quizForm.course_id : null,
        questions: questions.map((q, i) => ({ id: `q-${i}`, ...q })),
        is_published: pub ?? false,
      };
      if (editQuiz) {
        const { error } = await supabase.from("quizzes").update(payload).eq("id", editQuiz.id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("quizzes").insert({ ...payload, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage-quizzes"] });
      setQuizOpen(false);
      setEditQuiz(null);
      setQuizForm({ title: "", topic: "", difficulty: "medium", description: "", time_limit: 10, course_id: "" });
      setQuestions([{ ...emptyQuestion }]);
      toast.success(editQuiz ? "Quiz updated" : "Quiz created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteQuiz = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quizzes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["manage-quizzes"] }); toast.success("Quiz deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const togglePublishQuiz = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("quizzes").update({ is_published: published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["manage-quizzes"] }); },
  });

  const openEditCourse = (c: CourseRow) => {
    setEditCourse(c);
    setCourseForm({ title: c.title, description: c.description, topic: c.topic, difficulty: c.difficulty });
    setCourseOpen(true);
  };

  const openEditQuiz = (q: QuizRow) => {
    setEditQuiz(q);
    setQuizForm({ title: q.title, topic: q.topic, difficulty: q.difficulty, description: q.description, time_limit: q.time_limit, course_id: q.course_id || "" });
    setQuestions(
      (q.questions as any[]).length > 0
        ? (q.questions as any[]).map((qn: any) => ({ text: qn.text || "", options: qn.options || ["", "", "", ""], correctAnswer: qn.correctAnswer ?? 0, hint: qn.hint || "", explanation: qn.explanation || "", difficulty: qn.difficulty || "medium" }))
        : [{ ...emptyQuestion }]
    );
    setQuizOpen(true);
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? value : o)) } : q
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Content</h1>
          <p className="text-sm text-muted-foreground">Create and manage courses & quizzes</p>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2">
        <Button variant={tab === "courses" ? "default" : "outline"} size="sm" onClick={() => setTab("courses")}>
          <GraduationCap size={16} className="mr-1.5" /> Courses
        </Button>
        <Button variant={tab === "quizzes" ? "default" : "outline"} size="sm" onClick={() => setTab("quizzes")}>
          <BookOpen size={16} className="mr-1.5" /> Quizzes
        </Button>
      </div>

      {/* ===== COURSES TAB ===== */}
      {tab === "courses" && (
        <div className="space-y-4">
          <Dialog open={courseOpen} onOpenChange={(o) => { setCourseOpen(o); if (!o) { setEditCourse(null); setCourseForm({ title: "", description: "", topic: "", difficulty: "medium" }); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus size={16} className="mr-1.5" /> New Course</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editCourse ? "Edit Course" : "Create Course"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Title</Label><Input value={courseForm.title} onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Machine Learning 101" /></div>
                <div><Label>Topic</Label><Input value={courseForm.topic} onChange={(e) => setCourseForm((f) => ({ ...f, topic: e.target.value }))} placeholder="e.g. Machine Learning" /></div>
                <div><Label>Difficulty</Label>
                  <Select value={courseForm.difficulty} onValueChange={(v) => setCourseForm((f) => ({ ...f, difficulty: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Description</Label><Textarea value={courseForm.description} onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))} rows={3} /></div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => saveCourse.mutate(false)} disabled={!courseForm.title || saveCourse.isPending}>Save Draft</Button>
                  <Button onClick={() => saveCourse.mutate(true)} disabled={!courseForm.title || saveCourse.isPending}>Publish</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {coursesLoading ? (
            <div className="text-muted-foreground text-sm">Loading courses…</div>
          ) : courses.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No courses yet. Create your first one!</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              <AnimatePresence>
                {courses.map((c) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <Card>
                      <CardContent className="flex items-center justify-between py-4 px-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{c.title}</span>
                            <Badge variant={c.is_published ? "default" : "secondary"}>{c.is_published ? "Published" : "Draft"}</Badge>
                            <Badge variant="outline">{c.difficulty}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{c.topic} · {c.description.slice(0, 80)}{c.description.length > 80 ? "…" : ""}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={c.is_published} onCheckedChange={(v) => togglePublishCourse.mutate({ id: c.id, published: v })} />
                          <Button variant="ghost" size="icon" onClick={() => openEditCourse(c)}><Pencil size={15} /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCourse.mutate(c.id)}><Trash2 size={15} /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ===== QUIZZES TAB ===== */}
      {tab === "quizzes" && (
        <div className="space-y-4">
          <Dialog open={quizOpen} onOpenChange={(o) => { setQuizOpen(o); if (!o) { setEditQuiz(null); setQuizForm({ title: "", topic: "", difficulty: "medium", description: "", time_limit: 10, course_id: "" }); setQuestions([{ ...emptyQuestion }]); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus size={16} className="mr-1.5" /> New Quiz</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editQuiz ? "Edit Quiz" : "Create Quiz"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Title</Label><Input value={quizForm.title} onChange={(e) => setQuizForm((f) => ({ ...f, title: e.target.value }))} /></div>
                  <div><Label>Topic</Label><Input value={quizForm.topic} onChange={(e) => setQuizForm((f) => ({ ...f, topic: e.target.value }))} /></div>
                  <div><Label>Difficulty</Label>
                    <Select value={quizForm.difficulty} onValueChange={(v) => setQuizForm((f) => ({ ...f, difficulty: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Time Limit (min)</Label><Input type="number" value={quizForm.time_limit} onChange={(e) => setQuizForm((f) => ({ ...f, time_limit: Number(e.target.value) }))} /></div>
                  <div className="col-span-2"><Label>Course (optional)</Label>
                    <Select value={quizForm.course_id} onValueChange={(v) => setQuizForm((f) => ({ ...f, course_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="No course" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Description</Label><Textarea value={quizForm.description} onChange={(e) => setQuizForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></div>

                {/* Questions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Questions ({questions.length})</Label>
                    <Button variant="outline" size="sm" onClick={() => setQuestions((q) => [...q, { ...emptyQuestion }])}><Plus size={14} className="mr-1" /> Add</Button>
                  </div>
                  {questions.map((q, qi) => (
                    <Card key={qi} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Q{qi + 1}</span>
                        {questions.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qi))}><Trash2 size={14} /></Button>
                        )}
                      </div>
                      <Input placeholder="Question text" value={q.text} onChange={(e) => updateQuestion(qi, "text", e.target.value)} />
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-1.5">
                            <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer === oi} onChange={() => updateQuestion(qi, "correctAnswer", oi)} className="accent-[hsl(var(--primary))]" />
                            <Input placeholder={`Option ${oi + 1}`} value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} className="text-sm" />
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Hint" value={q.hint} onChange={(e) => updateQuestion(qi, "hint", e.target.value)} className="text-sm" />
                        <Input placeholder="Explanation" value={q.explanation} onChange={(e) => updateQuestion(qi, "explanation", e.target.value)} className="text-sm" />
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => saveQuiz.mutate(false)} disabled={!quizForm.title || saveQuiz.isPending}>Save Draft</Button>
                  <Button onClick={() => saveQuiz.mutate(true)} disabled={!quizForm.title || saveQuiz.isPending}>Publish</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {quizzesLoading ? (
            <div className="text-muted-foreground text-sm">Loading quizzes…</div>
          ) : quizzes.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No quizzes yet. Create your first one!</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              <AnimatePresence>
                {quizzes.map((q) => (
                  <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <Card>
                      <CardContent className="flex items-center justify-between py-4 px-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{q.title}</span>
                            <Badge variant={q.is_published ? "default" : "secondary"}>{q.is_published ? "Published" : "Draft"}</Badge>
                            <Badge variant="outline">{q.difficulty}</Badge>
                            <span className="text-xs text-muted-foreground">{(q.questions as any[]).length} Qs · {q.time_limit}min</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{q.topic} · {q.description.slice(0, 80)}{q.description.length > 80 ? "…" : ""}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={q.is_published} onCheckedChange={(v) => togglePublishQuiz.mutate({ id: q.id, published: v })} />
                          <Button variant="ghost" size="icon" onClick={() => openEditQuiz(q)}><Pencil size={15} /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteQuiz.mutate(q.id)}><Trash2 size={15} /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
