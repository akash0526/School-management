"use client";

import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";

export default function StudentPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.welcome", { name: user?.name || "Student" })}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.roleLabel", { role: t("dashboard.student") })}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">{t("dashboard.myClasses")}</h2>
        <p className="text-muted-foreground text-sm">
          View your homework, attendance, routine, and results.
        </p>
      </div>
    </div>
  );
}
