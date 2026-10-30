"use client";

import { FileCheck, BookOpen, Bell } from "@/lib/lucide";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { NoticeFeed } from "@/components/layout/notice-feed";

export default function AdminPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.welcome", { name: user?.name || "Admin" })}</h1>
          <p className="text-muted-foreground">
            {t("dashboard.roleLabel", { role: t(`dashboard.${user?.role?.toLowerCase()}`) || "Admin" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={t("dashboard.attendance")} value="—" icon={<FileCheck />} />
        <StatCard title={t("dashboard.homework")} value="—" icon={<BookOpen />} />
        <StatCard title={t("dashboard.notices")} value="—" icon={<Bell />} />
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">{t("common.schoolName")} Management</h2>
        <p className="text-muted-foreground text-sm">
          Admin panel: create classes, add teachers & students, link parents, post notices.
        </p>
      </div>

      <NoticeFeed />
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-sm">
          {icon}
        </div>
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}
