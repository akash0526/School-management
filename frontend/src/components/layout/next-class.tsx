"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { getNextPeriodForClass, type TimetablePeriod } from "@/lib/api";
import { Clock, Loader2, ChevronRight } from "@/lib/lucide";
import Link from "next/link";

export function NextClass() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [period, setPeriod] = useState<TimetablePeriod | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const classId = (user as any)?.classId;
    if (!classId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    const now = new Date().toTimeString().slice(0, 5);
    getNextPeriodForClass(classId, today, now)
      .then((res) => setPeriod(res.data || null))
      .catch(() => setPeriod(null))
      .finally(() => setLoading(false));
  }, [user, t]);

  if (loading) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/50 p-5 flex items-center gap-4">
      <div className="flex-shrink-0">
        <Clock className="w-8 h-8 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        {!period ? (
          <div className="text-sm text-primary-foreground">
            {t("dashboard.noUpcomingClass") || "No upcoming class"}
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-primary-foreground">Next Class</h3>
            <p className="text-sm text-primary-foreground/80 truncate">
              {period.subject?.name || "Subject"} — {period.startTime} to {period.endTime}
            </p>
            <p className="text-xs text-primary-foreground/60 mt-1">
              {period.day.charAt(0) + period.day.slice(1).toLowerCase()} &middot; {period.class?.name}
            </p>
          </>
        )}
      </div>
      <Link
        href="/dashboard/student/timetable"
        className="text-xs text-primary-foreground hover:underline flex items-center gap-1"
      >
        View Timetable <ChevronRight size={14} />
      </Link>
    </div>
  );
}
