"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { getStudentAttendance } from "@/lib/api";
import { AttendanceBadge } from "@/components/ui/attendance-badge";
import { FileCheck, AlertCircle, Clock } from "@/lib/lucide";

export function TodayAttendance() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // For students/parents, we need the student id. This is a simplified version
    // that shows today's attendance for the student linked to the user.
    setLoading(true);
    getStudentAttendance(user.id)
      .then((r) => setData(r.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return null;

  const today = new Date().toISOString().split("T")[0];
  const todayRecord = data.find(
    (d) => new Date(d.date).toISOString().split("T")[0] === today
  );
  const status = todayRecord?.status || "PRESENT";

  const isPresent = status === "PRESENT";

  return (
    <div className={`rounded-xl p-4 border ${
      isPresent
        ? "bg-green-50 border-green-200"
        : "bg-red-50 border-red-200"
    }`}>
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-semibold">{t("dashboard.attendance")}</h3>
        <p className="text-xs text-muted-foreground">{t("common.today")}</p>
      </div>
      <div className="text-right">
        <AttendanceBadge status={status} className="mb-1" />
        <p className="text-xs font-medium">
          {isPresent ? t("common.present") : t("common.absent")}
        </p>
      </div>
    </div>
  </div>
  );
}
