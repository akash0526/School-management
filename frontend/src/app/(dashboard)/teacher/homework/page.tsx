"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { ButtonComponent } from "@/components/ui/button";
import { InputComponent } from "@/components/ui/input";
import { createHomework, getHomeworkByClass, uploadFile, type Homework } from "@/lib/api";
import { Loader2, AlertCircle, CheckCircle2, FileText, Image, Clock } from "@/lib/lucide";
import { twMerge } from "tailwind-merge";

export default function TeacherHomeworkPage() {
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();

  const [classes, setClasses] = useState<Array<{ id: string; name: string; section: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 16);

  useEffect(() => {
    if (!user) return;
    loadClasses();
    loadSubjects();
  }, [user]);

  const loadClasses = async () => {
    try {
      const res = await fetch(`/api/users/schools/${user!.schoolId}/classes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("sms_access_token")}` },
      });
      const data = await res.json();
      setClasses(data.data || []);
      if (data.data && data.data.length > 0) {
        setSelectedClassId(data.data[0].id);
        loadHomework(data.data[0].id);
      }
    } catch {
      setError(t("common.error"));
    }
  };

  const loadSubjects = async () => {
    try {
      const res = await fetch("/api/users/subjects", {
        headers: { Authorization: `Bearer ${localStorage.getItem("sms_access_token")}` },
      });
      const data = await res.json();
      setSubjects(data.data || []);
      if (data.data && data.data.length > 0) {
        setSelectedSubjectId(data.data[0].id);
      }
    } catch {
      setError(t("common.error"));
    }
  };

  const loadHomework = useCallback(async (classId: string) => {
    setLoading(true);
    try {
      const res = await getHomeworkByClass(classId);
      setHomeworkList(res.data || []);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) loadHomework(selectedClassId);
  }, [selectedClassId, loadHomework]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      // Preview URL
      setAttachmentUrl(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let finalAttachmentUrl = attachmentUrl;

      // Upload file if selected
      if (file) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await uploadFile(formData);
        setUploading(false);
        if (uploadRes.success && uploadRes.data) {
          finalAttachmentUrl = uploadRes.data.url;
        } else {
          throw new Error(uploadRes.error?.message || "File upload failed");
        }
      }

      await createHomework({
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        title,
        description,
        dueDate,
        attachmentUrl: finalAttachmentUrl || undefined,
      });

      setSuccessMsg(t("common.success"));
      setTitle("");
      setDescription("");
      setAttachmentUrl(null);
      setFile(null);
      loadHomework(selectedClassId);
    } catch (err: any) {
      setError(err?.message || t("common.error"));
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.homework")}</h1>
          <p className="text-muted-foreground text-sm">
            Post homework for your class
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

      {/* Post homework form */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Post New Homework</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("dashboard.myClasses")}</label>
            <InputComponent
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={submitting || uploading}
            />
            {classes.find((c) => c.id === selectedClassId) && (
              <p className="text-xs text-muted-foreground">
                {classes.find((c) => c.id === selectedClassId)!.name} {classes.find((c) => c.id === selectedClassId)!.section}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <InputComponent
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={submitting || uploading}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <InputComponent
              placeholder="Homework title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting || uploading}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              placeholder="Homework instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={submitting || uploading}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Due Date & Time</label>
            <InputComponent
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={submitting || uploading}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Attachment (Photo/PDF, optional)</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFileChange}
              disabled={submitting || uploading}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
            {attachmentUrl && !file && (
              <p className="text-xs text-green-600">Attachment ready to upload</p>
            )}
          </div>
          <ButtonComponent
            variant="default"
            type="submit"
            disabled={submitting || uploading || !title || !description || !dueDate || !selectedClassId || !selectedSubjectId}
            className="w-full"
          >
            {submitting || uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploading ? "Uploading attachment…" : t("common.loading")}
              </>
            ) : (
              <>
                <FileText size={16} className="mr-2" />
                {t("common.submit")}
              </>
            )}
          </ButtonComponent>
        </form>
      </div>

      {/* Homework list */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Posted Homework</h3>
        {homeworkList.length === 0 ? (
          <p className="text-muted-foreground text-sm">No homework posted yet for this class.</p>
        ) : (
          <div className="space-y-3">
            {homeworkList.map((hw) => (
              <div key={hw.id} className="p-4 rounded-lg border bg-muted/50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{hw.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    {new Date(hw.dueDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{hw.description}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Subject: {hw.subject?.name || hw.subjectId}</span>
                  <span>•</span>
                  <span>Class: {hw.class?.name || hw.classId}</span>
                  {hw.attachmentUrl && (
                    <>
                      <span>•</span>
                      <a href={hw.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        <Image size={12} className="text-primary" /> Attachment
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
