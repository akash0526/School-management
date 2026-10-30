"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import {
  getClassTimetable,
  getNextPeriodForClass,
  type TimetablePeriod,
} from "@/lib/api";
import { ButtonComponent } from "@/components/ui/button";
import { Loader2, AlertCircle, Clock, Calendar, ChevronRight } from "@/lib/lucide";
import { twMerge } from "tailwind-merge";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const PERIODS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];

export default function StudentTimetablePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
  const [nextPeriod, setNextPeriod] = useState<TimetablePeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const classId = (user as any)?.classId || "";

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    const now = new Date().toTimeString().slice(0, 5);
    Promise.all([
      getClassTimetable(classId),
      getNextPeriodForClass(classId, today, now),
    ])
      .then(([classRes, nextRes]) => {
        setPeriods(classRes.data || []);
        setNextPeriod(nextRes.data || null);
      })
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, [classId, t]);

  const grid: Record<string, Record<string, TimetablePeriod>> = {};
  DAYS.forEach((d) => {
    grid[d] = {};
  });
  periods.forEach((p) => {
    if (grid[p.day]) {
      grid[p.day][p.startTime] = p;
    }
  });

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase() as keyof typeof grid;
  const now = new Date().toTimeString().slice(0, 5); // HH:MM

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Class Timetable</h1>
          <p className="text-muted-foreground text-sm">
            Your weekly class routine
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> {t("common.loading")}
        </div>
      )}

      {!loading && periods.length === 0 && (
        <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
          No timetable published yet. Please contact your school.
        </div>
      )}

      {/* Next period card */}
      {!loading && nextPeriod && (
        <div className="rounded-xl border border-primary bg-primary/50 p-4 flex items-center gap-3">
          <Clock size={32} className="text-primary" />
          <div className="flex-1">
            <h3 className="font-semibold text-primary">Next Class</h3>
            <p className="text-sm text-primary-foreground">
              {nextPeriod.subject?.name || "Subject"} — {nextPeriod.startTime} to {nextPeriod.endTime}
            </p>
            <p className="text-xs text-primary-foreground/70 mt-1">
              {nextPeriod.day.charAt(0) + nextPeriod.day.slice(1).toLowerCase()} &middot; {nextPeriod.class?.name}
            </p>
          </div>
          <ButtonComponent variant="outline" size="sm">
            View Details <ChevronRight size={14} />
          </ButtonComponent>
        </div>
      )}

      {!loading && periods.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border border-input bg-muted p-3 text-left font-semibold">Time / Day</th>
                  {DAYS.map((day) => (
                    <th key={day} className="border border-input bg-muted p-3 text-center font-semibold uppercase">
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((startTime) => {
                  const endTime = PERIODS[PERIODS.indexOf(startTime) + 1] || "16:00";
                  return (
                    <tr key={startTime} className="border-b">
                      <th className="border border-input bg-muted p-3 text-left font-medium">
                        {startTime} - {endTime}
                      </th>
                      {DAYS.map((day) => {
                        const period = grid[day]?.[startTime];
                        const isToday = day === today;
                        const isNow = isToday && period && period.startTime <= now && period.endTime > now;
                        return (
                          <td
                            key={day}
                            className={twMerge(
                              "border border-input p-2 h-20 bg-card/50",
                              isNow ? "bg-green-50 border-green-200" : "",
                              isToday ? "border-r-2 border-primary" : ""
                            )}
                          >
                            {period ? (
                              <div className="flex flex-col gap-1 h-full">
                                <div className="font-semibold text-sm">{period.subject?.name || "Subject"}</div>
                                <div className="text-xs text-muted-foreground">
                                  {period.teacher?.user?.name || "Teacher"}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-1">
                                  {period.class?.name} {period.class?.section}
                                </div>
                              </div>
                            ) : (
                              <div className="h-full" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 text-xs text-muted-foreground border-t">
            Current period highlighted (if in session today).
          </div>
        </div>
      )}
    </div>
  );
}
