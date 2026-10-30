"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { getExamsByClass, getExamResults, downloadReportCard, type Exam } from "@/lib/api";
import { Loader2, AlertCircle, FileText, Clock } from "@/lib/lucide";
import { ButtonComponent } from "@/components/ui/button";
import { twMerge } from "tailwind-merge";

export default function StudentResultsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [classes, setClasses] = useState<Array<{ id: string; name: string; section: string }>>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const studentId = user?.id || "";

  useEffect(() => {
    if (!user) return;
    loadClasses();
  }, [user]);

  const loadClasses = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/schools/${user.schoolId}/classes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("sms_access_token")}` },
      });
      const data = await res.json();
      setClasses(data.data || []);
      if (data.data && data.data.length > 0) {
        setSelectedClassId(data.data[0].id);
        loadExams(data.data[0].id);
      }
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const loadExams = async (classId: string) => {
    setLoading(true);
    try {
      const res = await getExamsByClass(classId);
      setExams(res.data || []);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) loadExams(selectedClassId);
  }, [selectedClassId]);

  const viewResults = async (examId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getExamResults(examId, studentId);
      setResults(res.data);
    } catch (err: any) {
      setError(err?.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!selectedExamId || !studentId) return;
    setPdfLoading(true);
    try {
      const res = await downloadReportCard(selectedExamId, studentId);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report-card-${studentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setError("Failed to download report card");
      }
    } catch (err: any) {
      setError(err?.message || t("common.error"));
    } finally {
      setPdfLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.results")}</h1>
          <p className="text-muted-foreground text-sm">
            View your exam results and download report card
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading && !results && (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> {t("common.loading")}
        </div>
      )}

      {!loading && classes.length === 0 && (
        <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
          No classes found.
        </div>
      )}

      {!loading && classes.length > 0 && (
        <>
          <div className="rounded-xl border bg-card p-4">
            <label className="text-sm font-medium mb-2 block">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px]"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <label className="text-sm font-medium mb-2 block">Select Exam</label>
            <select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                if (e.target.value) viewResults(e.target.value);
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px]"
            >
              <option value="">Select an exam</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          {results && (
            <div className="rounded-xl border bg-card p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold">
                    Results: {results.exam.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {results.student.name} (Roll: {results.student.rollNumber})
                  </p>
                </div>
                <ButtonComponent
                  variant="default"
                  onClick={downloadPdf}
                  disabled={pdfLoading}
                  className="min-w-[auto]"
                >
                  {pdfLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <FileText size={16} className="mr-2" />
                      Download PDF
                    </>
                  )}
                </ButtonComponent>
              </div>

              <div className="rounded-xl border p-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-3 px-4 font-medium">Subject</th>
                      <th className="text-center py-3 px-4 font-medium">Full Marks</th>
                      <th className="text-center py-3 px-4 font-medium">Obtained</th>
                      <th className="text-center py-3 px-4 font-medium">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {results.results.map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-accent/50">
                        <td className="py-3 px-4">{r.subject}</td>
                        <td className="py-3 px-4 text-center">{r.fullMarks}</td>
                        <td className="py-3 px-4 text-center">{r.score}</td>
                        <td className="py-3 px-4 text-center font-medium">
                          {r.grade}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t font-bold">
                      <td className="py-3 px-4">Total</td>
                      <td className="py-3 px-4 text-center">{results.totalMarks}</td>
                      <td className="py-3 px-4 text-center">{results.total}</td>
                      <td className="py-3 px-4 text-center">—</td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Percentage</p>
                    <p className="text-lg font-bold">{results.percentage}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">GPA</p>
                    <p className="text-lg font-bold">{results.gpa}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
