"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import {
  getClassTimetable,
  getNextPeriodForClass,
  type TimetablePeriod,
} from "@/lib/api";
import { Loader2, AlertCircle, Clock, Calendar, User, ChevronRight } from "@/lib/lucide";
import { ButtonComponent } from "@/components/ui/button";
import { twMerge } from "tailwind-merge";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const PERIODS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];

export default function ParentTimetablePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [children, setChildren] = useState<Array<{ id: string; name: string; classId: string; className?: string }>>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
  const [nextPeriod, setNextPeriod] = useState<TimetablePeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // Load parent's children
    fetch("/api/parents/children", {
      headers: { Authorization: `Bearer ${localStorage.getItem("sms_access_token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const kids = (data.data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          classId: c.classId,
          className: c.class?.name || "",
        }));
        setChildren(kids);
        if (kids.length > 0) {
          setSelectedChildId(kids[0].id);
        }
      })
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, [user, t]);

  const child = children.find((c) => c.id === selectedChildId);

  useEffect(() => {
    if (!child?.classId) return;
    setLoading(true);
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    const now = new Date().toTimeString().slice(0, 5);
    Promise.all([getClassTimetable(child.classId), getNextPeriodForClass(child.classId, today, now)])
      .then(([classRes, nextRes]) => {
        setPeriods(classRes.data || []);
        setNextPeriod(nextRes.data || null);
      })
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, [child?.classId, t]);

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
  const now = new Date().toTimeString().slice(0, 5);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Child Timetable</h1>
          <p className="text-muted-foreground text-sm">
            View your child's class routine
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Child selector */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Child</label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="flex h-9 w-64 items-center rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.className ? `(${c.className})` : ""}
                </option>
              ))}
            </select>
          </div>
          {child && (
            <div className="flex items-center gap-2">
              <User size={18} />
              <span className="text-sm font-medium">{child.name}</span>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> {t("common.loading")}
        </div>
      )}

      {!loading && !child && (
        <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
          No children linked to your account.
        </div>
      )}

      {!loading && child && periods.length === 0 && (
        <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
          No timetable published for {child.name}'s class yet.
        </div>
      )}

      {!loading && child && nextPeriod && (
        <div className="rounded-xl border border-primary bg-primary/50 p-4 flex items-center gap-3">
          <Clock size={32} className="text-primary" />
          <div className="flex-1">
            <h3 className="font-semibold text-primary">Next Class for {child.name}</h3>
            <p className="text-sm text-primary-foreground">
              {nextPeriod.subject?.name || "Subject"} — {nextPeriod.startTime} to {nextPeriod.endTime}
            </p>
            <p className="text-xs text-primary-foreground/70 mt-1">
              {nextPeriod.day.charAt(0) + nextPeriod.day.slice(1).toLowerCase()}
            </p>
          </div>
        </div>
      )}

      {!loading && child && periods.length > 0 && (
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
        </div>
      )}
    </div>
  );
}
