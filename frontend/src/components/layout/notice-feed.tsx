"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { getNotices } from "@/lib/api";
import type { Notice } from "@/lib/api";
import { Bell, Clock } from "@/lib/lucide";

export function NoticeFeed() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getNotices(user.role, undefined)
      .then((r) => setNotices(r.data || []))
      .catch(() => setNotices([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return null;
  if (!notices.length) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{t("common.notices")}</h3>
      </div>
      <div className="space-y-2">
        {notices.slice(0, 5).map((n) => (
          <div
            key={n.id}
            className="flex items-start gap-2 p-3 rounded-lg border bg-card text-sm"
          >
            <div className="flex-shrink-0 mt-1">
              <Bell size={14} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{n.title}</p>
              <p className="text-muted-foreground text-xs truncate line-clamp-1">
                {n.content}
              </p>
              <span className="text-[10px] text-muted-foreground mt-1 block">
                {new Date(n.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
