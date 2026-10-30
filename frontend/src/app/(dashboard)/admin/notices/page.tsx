"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { ButtonComponent } from "@/components/ui/button";
import { InputComponent } from "@/components/ui/input";
import { createNotice, getAllNotices, type Notice } from "@/lib/api";
import { Loader2, AlertCircle, CheckCircle2 } from "@/lib/lucide";

const TARGET_OPTIONS: Array<{ value: string | null; labelKey: string }> = [
  { value: null, labelKey: "common.all" },
  { value: "TEACHER", labelKey: "dashboard.teacher" },
  { value: "STUDENT", labelKey: "dashboard.student" },
  { value: "PARENT", labelKey: "dashboard.parent" },
];

export default function AdminNoticesPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState<string | null>(null);
  const [targetClassId, setTargetClassId] = useState("");
  const [sendSms, setSendSms] = useState(false);
  const [classes, setClasses] = useState<Array<{ id: string; name: string; section: string }>>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadNotices();
    loadClasses();
  }, [user]);

  const loadNotices = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notices/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sms_access_token")}`,
        },
      });
      const data = await res.json();
      setNotices(data.data || []);
    } catch {
      setError(t("common.error"));
    }
  }, [user, t]);

  const loadClasses = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/schools/${user.schoolId}/classes`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sms_access_token")}`,
        },
      });
      const data = await res.json();
      setClasses(data.data || []);
    } catch {
      // ignore
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await createNotice({
        title,
        content,
        targetRole: targetRole || undefined,
        targetClassId: targetClassId || undefined,
        sendSms,
      });
      setSuccessMsg(t("common.success"));
      setTitle("");
      setContent("");
      setTargetRole(null);
      setTargetClassId("");
      setSendSms(false);
      loadNotices();
    } catch (err: any) {
      setError(err?.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notices</h1>
          <p className="text-muted-foreground text-sm">
            Post notices for teachers, students, and parents
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {successMsg && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Notice form */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Post New Notice</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <InputComponent
              placeholder="Notice title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <textarea
              placeholder="Notice details..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              disabled={submitting}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Audience</label>
            <select
              value={targetRole ?? ""}
              onChange={(e) => setTargetRole(e.target.value || null)}
              disabled={submitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
            >
              {TARGET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value ?? ""}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>
          {targetRole === null && classes.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Specific Class (optional)</label>
              <select
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                disabled={submitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
              >
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              id="sendSms"
              type="checkbox"
              checked={sendSms}
              onChange={(e) => setSendSms(e.target.checked)}
              disabled={submitting}
              className="rounded border-input bg-background text-primary focus:ring-primary min-h-[44px] min-w-[44px]"
            />
            <label htmlFor="sendSms" className="text-sm">
              Also send as SMS
            </label>
          </div>
          <ButtonComponent
            variant="default"
            type="submit"
            disabled={submitting || !title || !content}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("common.loading")}
              </>
            ) : (
              <>
                <CheckCircle2 size={16} className="mr-2" />
                {t("common.submit")}
              </>
            )}
          </ButtonComponent>
        </form>
      </div>

      {/* Notices list */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">All Notices</h3>
        {notices.length === 0 ? (
          <p className="text-muted-foreground text-sm">No notices posted yet.</p>
        ) : (
          <div className="space-y-3">
            {notices.map((n) => (
              <div key={n.id} className="p-4 rounded-lg border bg-muted/50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{n.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{n.content}</p>
                {n.sendSms && (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    <CheckCircle2 size={12} /> SMS sent
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
