"use client";

import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";

export default function TeacherPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.welcome", { name: user?.name || "Teacher" })}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.roleLabel", { role: t("dashboard.teacher") })}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Teacher Dashboard</h2>
        <p className="text-muted-foreground text-sm">
          Mark attendance, post homework, enter exam marks, and chat with parents.
        </p>
      </div>
    </div>
  );
}
