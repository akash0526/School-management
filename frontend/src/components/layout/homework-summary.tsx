"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { getHomeworkByClass, type Homework } from "@/lib/api";
import { FileText, Loader2 } from "@/lib/lucide";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

interface HomeworkSummaryProps {
  role: "STUDENT" | "PARENT";
}

export function HomeworkSummary({ role }: HomeworkSummaryProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Use the student's class. For students, user.id is the student id; we need classId.
    // Fetch classes for the school and pick the first (simplified for demo).
    setLoading(true);
    fetch(`/api/users/schools/${user.schoolId}/classes`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("sms_access_token")}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const cls = data.data || [];
        if (cls.length > 0) {
          return getHomeworkByClass(cls[0].id).then((res) => {
            setHomeworkList(res.data || []);
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) return null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueToday = homeworkList.filter((hw) => {
    const due = new Date(hw.dueDate);
    return due >= todayStart && due < new Date(todayStart.getTime() + 86400000);
  });

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{t("dashboard.homework")}</h3>
        <Link
          href={
            role === "STUDENT" ? "/dashboard/student/homework" : "/dashboard/parent/homework"
          }
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View all <FileText size={14} />
        </Link>
      </div>
      {dueToday.length === 0 ? (
        <p className="text-sm text-muted-foreground">No homework due today.</p>
      ) : (
        <div className="space-y-2">
          {dueToday.slice(0, 3).map((hw) => (
            <div key={hw.id} className="flex items-start gap-2 p-3 rounded-lg border bg-muted/50">
              <div className="flex-shrink-0 mt-1">
                <FileText size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{hw.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {hw.subject?.name || hw.subjectId} • {hw.class?.name || hw.classId}
                </p>
              </div>
            </div>
          ))}
          {dueToday.length > 3 && (
            <div className="pt-2 text-center">
              <Link
                href={
                  role === "STUDENT" ? "/dashboard/student/homework" : "/dashboard/parent/homework"
                }
                className="text-xs text-primary hover:underline"
              >
                View all {dueToday.length} assignments
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
