"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { ButtonComponent } from "@/components/ui/button";
import { InputComponent } from "@/components/ui/input";
import {
  createExam,
  getExamsByClass,
  enterMarks,
  getMarksForEntry,
  type Exam,
  type MarkEntryItem,
} from "@/lib/api";
import { Loader2, AlertCircle, CheckCircle2, FileText, Clock } from "@/lib/lucide";
import { twMerge } from "tailwind-merge";

export default function TeacherExamsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [classes, setClasses] = useState<Array<{ id: string; name: string; section: string }>>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  // Exam creation form
  const [examName, setExamName] = useState("");
  const [examSubjects, setExamSubjects] = useState<string[]>([]);

  // Marks entry
  const [marks, setMarks] = useState<MarkEntryItem[]>([]);
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [fullMarks, setFullMarks] = useState("100");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadClasses();
    loadSubjects();
  }, [user]);

  const loadClasses = async () => {
    try {
      if (!user) return;
      const res = await fetch(`/api/users/schools/${user.schoolId}/classes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("sms_access_token")}` },
      });
      const data = await res.json();
      setClasses(data.data || []);
    } catch {
      setError(t("common.error"));
    }
  };

  const loadSubjects = async () => {
    try {
      const res = await fetch("/api/users/subjects", {
        headers: { Authorization: `Bearer ${localStorage.getItem("sms_access_token")}` },
      });
      const data = await res.json();
      // subjects come back as array of {id, name}
      const subs = data.data || [];
      if (subs.length > 0) setExamSubjects([subs[0].id]);
    } catch {
      setError(t("common.error"));
    }
  };

  const loadExams = useCallback(async (classId: string) => {
    setLoading(true);
    try {
      const res = await getExamsByClass(classId);
      setExams(res.data || []);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) loadExams(selectedClassId);
  }, [selectedClassId, loadExams]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await createExam({
        name: examName,
        classId: selectedClassId,
        subjects: examSubjects,
      });
      setSuccessMsg(t("common.success"));
      setExamName("");
      loadExams(selectedClassId);
    } catch (err: any) {
      setError(err?.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const loadMarksForEntry = useCallback(async (examId: string, subjectId: string) => {
    setLoading(true);
    setMarks([]);
    setScoreInputs({});
    try {
      const res = await getMarksForEntry(examId, subjectId);
      const items = (res.data || []) as MarkEntryItem[];
      setMarks(items);
      // Initialize score inputs
      const inputs: Record<string, string> = {};
      items.forEach((item) => {
        inputs[item.id] = item.score !== null ? String(item.score) : "";
      });
      setScoreInputs(inputs);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleScoreChange = (markId: string, value: string) => {
    setScoreInputs((prev) => ({ ...prev, [markId]: value }));
  };

  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const records = marks.map((m) => ({
        studentId: m.studentId,
        subjectId: selectedSubjectId,
        score: parseFloat(scoreInputs[m.id] || "0"),
        fullMarks: parseFloat(fullMarks),
      }));
      await enterMarks(selectedExamId, { records });
      setSuccessMsg(t("common.success"));
      loadMarksForEntry(selectedExamId, selectedSubjectId);
    } catch (err: any) {
      setError(err?.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Exams & Results</h1>
          <p className="text-muted-foreground text-sm">
            Create exams and enter marks
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {successMsg && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Create Exam form */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Create Exam</h3>
        <form onSubmit={handleCreateExam} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Class</label>
            <InputComponent
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Exam Name</label>
            <InputComponent
              placeholder="e.g. First Terminal Exam"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Subjects</label>
            <InputComponent
              placeholder="Subject IDs (comma-separated)"
              value={examSubjects.join(",")}
              onChange={(e) =>
                setExamSubjects(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
              }
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              Enter subject IDs separated by commas
            </p>
          </div>
          <ButtonComponent
            variant="default"
            type="submit"
            disabled={submitting || !examName || !selectedClassId || examSubjects.length === 0}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("common.loading")}
              </>
            ) : (
              <>
                <FileText size={16} className="mr-2" />
                Create Exam
              </>
            )}
          </ButtonComponent>
        </form>
      </div>

      {/* Exam selection + Marks entry */}
      {exams.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Enter Marks</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Exam</label>
                <InputComponent
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  disabled={loading || submitting}
                />
                {exams.find((e) => e.id === selectedExamId) && (
                  <p className="text-xs text-muted-foreground">
                    {exams.find((e) => e.id === selectedExamId)!.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <InputComponent
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  disabled={loading || submitting || !selectedExamId}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Marks</label>
                <InputComponent
                  type="number"
                  value={fullMarks}
                  onChange={(e) => setFullMarks(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {selectedExamId && selectedSubjectId && (
              <div className="pt-4 border-t">
                {loading && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> {t("common.loading")}
                  </div>
                )}
                {!loading && marks.length === 0 && (
                  <p className="text-muted-foreground text-sm">No students found.</p>
                )}
                {!loading && marks.length > 0 && (
                  <form onSubmit={handleSaveMarks} className="space-y-2">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-3 px-4 font-medium">#</th>
                          <th className="text-left py-3 px-4 font-medium">Student</th>
                          <th className="text-left py-3 px-4 font-medium">Roll No.</th>
                          <th className="text-center py-3 px-4 font-medium">Score</th>
                          <th className="text-center py-3 px-4 font-medium">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {marks.map((m, idx) => (
                          <tr key={m.id} className="hover:bg-accent/50">
                            <td className="py-3 px-4 text-muted-foreground">{idx + 1}</td>
                            <td className="py-3 px-4 font-medium">{m.student.name}</td>
                            <td className="py-3 px-4 text-muted-foreground">{m.student.rollNumber}</td>
                            <td className="py-3 px-4 text-center">
                              <InputComponent
                                type="number"
                                min="0"
                                step="0.1"
                                value={scoreInputs[m.id] || ""}
                                onChange={(e) => handleScoreChange(m.id, e.target.value)}
                                disabled={submitting}
                                className="w-full h-9 text-center px-2"
                              />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-xs font-medium text-muted-foreground">
                                {m.grade || "—"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-4 flex justify-end">
                      <ButtonComponent
                        variant="default"
                        type="submit"
                        disabled={submitting}
                        className="w-full md:w-auto"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t("common.loading")}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} className="mr-2" />
                            Save Marks
                          </>
                        )}
                      </ButtonComponent>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
