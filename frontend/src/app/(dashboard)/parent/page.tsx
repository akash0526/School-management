"use client";

import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { TodayAttendance } from "@/components/layout/today-attendance";
import { NoticeFeed } from "@/components/layout/notice-feed";
import { HomeworkSummary } from "@/components/layout/homework-summary";

export default function ParentPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.welcome", { name: user?.name || "Parent" })}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.roleLabel", { role: t("dashboard.parent") })}
        </p>
      </div>

      <TodayAttendance />
      <HomeworkSummary role="PARENT" />
      <NoticeFeed />
    </div>
  );
}
