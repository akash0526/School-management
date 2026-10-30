"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { getStudentAttendance } from "@/lib/api";
import { AttendanceBadge } from "@/components/ui/attendance-badge";
import { twMerge } from "tailwind-merge";
import { FileCheck, AlertCircle, Clock, Calendar } from "@/lib/lucide";

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [todayData, setTodayData] = useState<any[]>([]);
  const [monthData, setMonthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const studentId = user?.id || "";

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    Promise.all([
      getStudentAttendance(studentId), // today
      getStudentAttendance(studentId, month), // monthly
    ])
      .then(([todayRes, monthRes]) => {
        setTodayData(todayRes.data || []);
        setMonthData(monthRes.data || []);
      })
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, [studentId, month, t]);

  const today = new Date().toISOString().split("T")[0];
  const todayRecord = todayData.find(
    (d) => new Date(d.date).toISOString().split("T")[0] === today
  );
  const status = todayRecord?.status || "PRESENT";
  const isPresent = status === "PRESENT";

  // Build calendar dots for the month
  const attendanceMap = new Map(
    monthData.map((d) => [new Date(d.date).toISOString().split("T")[0], d.status])
  );

  const year = Number(month.slice(0, 4));
  const monthNum = Number(month.slice(5, 7));
  const firstDay = new Date(year, monthNum - 1, 1);
  const lastDay = new Date(year, monthNum, 0);
  const days: Array<{ day: number; status?: string }> = [];
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ day: d, status: attendanceMap.get(dateStr) });
  }

  const statusColor = (s?: string) => {
    switch (s) {
      case "PRESENT": return "bg-green-500";
      case "ABSENT": return "bg-red-500";
      case "LATE": return "bg-yellow-500";
      default: return "bg-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.attendance")}</h1>
          <p className="text-muted-foreground text-sm">
            Your attendance status and monthly history
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Today's status card */}
      <div className={`rounded-xl p-5 border shadow-sm flex items-center gap-4 ${
        isPresent ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
      }`}>
        <div className="flex-shrink-0">
          {isPresent ? (
            <FileCheck className="w-10 h-10 text-green-600" />
          ) : status === "ABSENT" ? (
            <AlertCircle className="w-10 h-10 text-red-600" />
          ) : (
            <Clock className="w-10 h-10 text-yellow-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{t("dashboard.attendance")}</h3>
          <p className="text-sm text-muted-foreground">{t("common.today")}</p>
        </div>
        <div className="text-right">
          <AttendanceBadge status={status as any} />
          <p className="text-sm font-medium">
            {isPresent ? t("common.present") : status === "ABSENT" ? t("common.absent") : t("common.late")}
          </p>
        </div>
      </div>

      {/* Monthly calendar */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Monthly Attendance</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const [y, m] = month.split("-").map(Number);
                const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
                setMonth(`${prev.y}-${String(prev.m).padStart(2, "0")}`);
              }}
              className="p-2 rounded hover:bg-accent text-muted-foreground"
            >
              <Calendar size={18} />
            </button>
            <span className="font-medium text-sm">
              {new Date(year, monthNum - 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="font-medium">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 mt-2">
          {/* Leading blanks */}
          {Array.from({ length: firstDay.getDay() }).map((_, i) => (
            <div key={`blank-${i}`} className="aspect-square" />
          ))}
          {/* Days */}
          {days.map((d) => (
            <div
              key={d.day}
              className={twMerge(
                "aspect-square rounded-full flex items-center justify-center text-[10px] transition-colors",
                d.status ? statusColor(d.status) : "bg-transparent",
                d.status ? "text-white" : "text-muted-foreground"
              )}
            >
              {d.day}
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" /> <span>Present</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> <span>Absent</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500" /> <span>Late</span>
          </div>
        </div>
      </div>
    </div>
  );
}
