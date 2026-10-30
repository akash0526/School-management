"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { getHomeworkByClass, type Homework } from "@/lib/api";
import { Clock, FileText, Image, Loader2, AlertCircle } from "@/lib/lucide";
import { twMerge } from "tailwind-merge";

export default function StudentHomeworkPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [classes, setClasses] = useState<Array<{ id: string; name: string; section: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const cls = data.data || [];
      setClasses(cls);
      if (cls.length > 0) {
        setSelectedClassId(cls[0].id);
        loadHomework(cls[0].id);
      }
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const loadHomework = async (classId: string) => {
    setLoading(true);
    try {
      const res = await getHomeworkByClass(classId);
      const list = (res.data || []) as Homework[];
      // Group by due date
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(todayStart.getDate() - todayStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const dueToday: Homework[] = [];
      const dueThisWeek: Homework[] = [];
      const upcoming: Homework[] = [];

      for (const hw of list) {
        const due = new Date(hw.dueDate);
        if (due >= todayStart && due < new Date(todayStart.getTime() + 86400000)) {
          dueToday.push(hw);
        } else if (due >= weekStart && due <= weekEnd) {
          dueThisWeek.push(hw);
        } else {
          upcoming.push(hw);
        }
      }

      setHomeworkList([...dueToday, ...dueThisWeek, ...upcoming]);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.homework")}</h1>
          <p className="text-muted-foreground text-sm">
            Your homework assignments
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> {t("common.loading")}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle size={16} /> {error}
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
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                loadHomework(e.target.value);
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px]"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">Homework</h3>
            {homeworkList.length === 0 ? (
              <p className="text-muted-foreground text-sm">No homework assigned.</p>
            ) : (
              <div className="space-y-3">
                {homeworkList.map((hw) => {
                  const due = new Date(hw.dueDate);
                  const now = new Date();
                  const isOverdue = due < now && !hw.title.toLowerCase().includes("done");
                  return (
                    <div
                      key={hw.id}
                      className={twMerge(
                        "p-4 rounded-lg border flex items-start gap-3",
                        isOverdue ? "border-red-200 bg-red-50" : "border-muted/50 bg-card"
                      )}
                    >
                      <div className="flex-shrink-0 mt-1">
                        <FileText size={20} className={isOverdue ? "text-red-600" : "text-primary"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold">{hw.title}</h4>
                          {isOverdue && (
                            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">Overdue</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{hw.description}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Due:</span>
                          <span className={`font-medium ${isOverdue ? "text-red-600" : "text-foreground"}`}>
                            {due.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{hw.subject?.name || hw.subjectId}</span>
                          {hw.attachmentUrl && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <a href={hw.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                                <Image size={12} className="text-primary" /> View attachment
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
