"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { getTeacherTimetable, type TimetablePeriod } from "@/lib/api";
import { Loader2, AlertCircle, Clock, Calendar } from "@/lib/lucide";
import { twMerge } from "tailwind-merge";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const PERIODS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];

export default function TeacherTimetablePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const teacherId = (user as any)?.teacherId || user?.id || "";

  useEffect(() => {
    if (!teacherId) return;
    setLoading(true);
    getTeacherTimetable(teacherId)
      .then((res) => setPeriods(res.data || []))
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, [teacherId, t]);

  // Build a grid: day -> startTime -> period
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
          <h1 className="text-2xl font-bold">My Timetable</h1>
          <p className="text-muted-foreground text-sm">
            Your weekly teaching schedule
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
          No timetable assigned yet.
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
                              isNow ? "bg-blue-50 border-blue-200" : "",
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
            Current period is highlighted if in session today ({today.charAt(0) + today.slice(1).toLowerCase()}).
          </div>
        </div>
      )}
    </div>
  );
}
