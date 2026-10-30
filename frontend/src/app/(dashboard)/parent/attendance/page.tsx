"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { getStudentAttendance } from "@/lib/api";
import { AttendanceBadge } from "@/components/ui/attendance-badge";
import { FileCheck, AlertCircle, Clock, Calendar } from "@/lib/lucide";
import { twMerge } from "tailwind-merge";

export default function ParentAttendancePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [children, setChildren] = useState<Array<{ id: string; name: string; rollNumber: string }>>([]);
  const [todayData, setTodayData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthData, setMonthData] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");

  useEffect(() => {
    if (!user) return;
    // Parent's children come from their profile; for now fetch students linked to parent
    // We'll use the students endpoint. Simplified: try to get children via parent profile.
    setLoading(true);
    // Try today's attendance for each child
    const loadChildren = async () => {
      try {
        const res = await fetch(`/api/users/schools/${user.schoolId}/students`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("sms_access_token")}`,
          },
        });
        const data = await res.json();
        const allStudents = data.data || [];
        // Filter students linked to this parent (we don't have parentId here, so show all in school for demo)
        // In production, filter by parentId
        setChildren(allStudents.slice(0, 5));
        if (allStudents.length > 0) {
          setSelectedChildId(allStudents[0].id);
          loadToday(allStudents[0].id);
          loadMonth(allStudents[0].id);
        }
      } catch {
        setError(t("common.error"));
      } finally {
        setLoading(false);
      }
    };
    loadChildren();
  }, [user, t]);

  const loadToday = async (studentId: string) => {
    try {
      const res = await getStudentAttendance(studentId);
      setTodayData(res.data || []);
    } catch {
      // ignore
    }
  };

  const loadMonth = async (studentId: string) => {
    try {
      const res = await getStudentAttendance(studentId, month);
      setMonthData(res.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (selectedChildId) {
      loadToday(selectedChildId);
      loadMonth(selectedChildId);
    }
  }, [selectedChildId, month]);

  const today = new Date().toISOString().split("T")[0];
  const todayRecord = todayData.find(
    (d) => new Date(d.date).toISOString().split("T")[0] === today
  );
  const status = todayRecord?.status || "PRESENT";
  const isPresent = status === "PRESENT";
  const child = children.find((c) => c.id === selectedChildId);

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
            Your child's attendance status and monthly history
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Child selector */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">{t("dashboard.myChildren")}</label>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.rollNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

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
          <h3 className="font-semibold">{child?.name || "Child"}</h3>
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
          {Array.from({ length: firstDay.getDay() }).map((_, i) => (
            <div key={`blank-${i}`} className="aspect-square" />
          ))}
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
