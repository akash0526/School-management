"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { ButtonComponent } from "@/components/ui/button";
import { InputComponent } from "@/components/ui/input";
import { twMerge } from "tailwind-merge";
import { AttendanceBadge } from "@/components/ui/attendance-badge";
import {
  markAttendance,
  getClassAttendance,
  type StudentAttendanceItem,
} from "@/lib/api";
import {
  FileCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Calendar,
  Clock,
} from "@/lib/lucide";

const STATUS_OPTIONS: Array<{
  value: "PRESENT" | "ABSENT" | "LATE";
  labelKey: string;
  icon: any;
}> = [
  { value: "PRESENT", labelKey: "common.present", icon: FileCheck },
  { value: "ABSENT", labelKey: "common.absent", icon: AlertCircle },
  { value: "LATE", labelKey: "common.late", icon: Clock },
];

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();

  const [classes, setClasses] = useState<Array<{ id: string; name: string; section: string }>>([]);
  const [students, setStudents] = useState<StudentAttendanceItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState("");
  const [statuses, setStatuses] = useState<Record<string, "PRESENT" | "ABSENT" | "LATE">>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  // Load classes for this teacher's school
  useEffect(() => {
    if (!user) return;
    // Classes are loaded from the backend via /api/users/schools/:schoolId/classes
    // For now, we fetch them on mount
    fetchClasses();
  }, [user]);

  const fetchClasses = async () => {
    if (!user) return;
    try {
      const res = await fetch(
        `/api/users/schools/${user.schoolId}/classes`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("sms_access_token")}` },
        }
      );
      const data = await res.json();
      const cls = data.data || [];
      setClasses(cls);
      if (cls.length > 0) {
        setSelectedClassId(cls[0].id);
        loadAttendance(cls[0].id);
      }
    } catch {
      setError(t("common.error"));
    }
  };

  const loadAttendance = useCallback(async (classId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getClassAttendance(classId, date);
      const data = res.data || [];
      const map: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
      const items: StudentAttendanceItem[] = data.map((s: any) => {
        map[s.id] = s.status;
        return s;
      });
      setStudents(items);
      setStatuses(map);
      setAlreadyMarked(items.length > 0);
      setSubmitted(false);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    if (selectedClassId) loadAttendance(selectedClassId);
  }, [selectedClassId, date, loadAttendance]);

  const handleStatusChange = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE") => {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAllPresent = () => {
    const next: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
    students.forEach((s) => {
      next[s.id] = "PRESENT";
    });
    setStatuses(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const records = students.map((s) => ({
        studentId: s.id,
        status: statuses[s.id] || "PRESENT",
      }));
      await markAttendance({
        classId: selectedClassId,
        date,
        records,
      });
      setSubmitted(true);
      setSuccessMsg(t("common.success"));
      setAlreadyMarked(true);
    } catch (err: any) {
      setError(err?.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStatuses({});
    setSubmitted(false);
    setSuccessMsg(null);
    setError(null);
    loadAttendance(selectedClassId);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.attendance")}</h1>
          <p className="text-muted-foreground text-sm">
            Mark student attendance for a class
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

      <div className="rounded-xl border bg-card p-6">
        <div className="space-y-4">
          {/* Class + Date selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("dashboard.myClasses")}</label>
              <InputComponent
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={loading || submitting}
              />
              {classes.length > 0 && (
                <div className="flex gap-2 text-xs text-muted-foreground">
                  {classes
                    .filter((c) => c.id === selectedClassId)
                    .map((c) => (
                      <span key={c.id} className="px-2 py-1 rounded bg-muted border">
                        {c.name} {c.section}
                      </span>
                    ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("common.today")}</label>
              <InputComponent
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading || submitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <ButtonComponent
                variant="outline"
                onClick={() => loadAttendance(selectedClassId)}
                disabled={!selectedClassId || loading || submitting}
                className="w-full"
              >
                <Calendar size={16} className="mr-2" /> {t("common.next")}
              </ButtonComponent>
            </div>
          </div>

          {alreadyMarked && !submitted && (
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700 flex items-center gap-2">
              <Clock size={16} /> Attendance already marked for this date. You can edit and re-submit.
            </div>
          )}

          {/* Students list */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">#</th>
                  <th className="text-left py-3 px-4 font-medium">{t("common.name")}</th>
                  <th className="text-left py-3 px-4 font-medium">Roll No.</th>
                  <th className="text-center py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-accent/50 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium">{s.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{s.rollNumber}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleStatusChange(s.id, opt.value)}
                            className={twMerge(
                              "flex w-8 h-8 items-center justify-center rounded border text-xs transition",
                              statuses[s.id] === opt.value
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-input hover:bg-accent"
                            )}
                            title={t(opt.labelKey)}
                            aria-label={t(opt.labelKey)}
                          >
                            <opt.icon size={12} />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No students found for this class.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          {students.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t">
              <ButtonComponent
                variant="outline"
                onClick={handleMarkAllPresent}
                disabled={submitting || submitted}
                className="w-full sm:w-auto"
              >
                <FileCheck size={16} className="mr-2" /> {t("dashboard.attendance")} All Present
              </ButtonComponent>
              {submitted ? (
                <ButtonComponent
                  variant="outline"
                  onClick={handleReset}
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  <RotateCcw size={16} className="mr-2" /> Reset
                </ButtonComponent>
              ) : (
                <ButtonComponent
                  variant="default"
                  onClick={handleSubmit}
                  disabled={submitting || submitted}
                  className="w-full sm:w-auto"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("common.loading")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} className="mr-2" />
                      {t("common.submit")}
                    </>
                  )}
                </ButtonComponent>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
