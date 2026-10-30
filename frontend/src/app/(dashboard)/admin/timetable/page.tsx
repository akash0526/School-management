"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { setTimetable, getClassTimetable, type TimetablePeriod } from "@/lib/api";
import { ButtonComponent } from "@/components/ui/button";
import { InputComponent } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle2, Clock, Calendar, Trash2 } from "@/lib/lucide";
import { twMerge } from "tailwind-merge";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const PERIODS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];

export default function AdminTimetablePage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [classes, setClasses] = useState<Array<{ id: string; name: string; section: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [timetable, setTimetableData] = useState<TimetablePeriod[]>([]);
  const [grid, setGrid] = useState<Record<string, { subjectId: string; teacherId: string }>>({});
  const [activeCell, setActiveCell] = useState<{ day: string; startTime: string } | null>(null);
  const [cellEdit, setCellEdit] = useState<{ subjectId: string; teacherId: string }>({ subjectId: "", teacherId: "" });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadClasses();
    loadSubjects();
    loadTeachers();
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
    } catch {
      setError(t("common.error"));
    }
  };

  const loadTeachers = async () => {
    try {
      const res = await fetch(`/api/users/schools/${user!.schoolId}/teachers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("sms_access_token")}` },
      });
      const data = await res.json();
      setTeachers(data.data || []);
    } catch {
      setError(t("common.error"));
    }
  };

  const loadTimetable = useCallback(async (classId: string) => {
    setLoading(true);
    try {
      const res = await getClassTimetable(classId);
      const periods = (res.data || []) as TimetablePeriod[];
      setTimetableData(periods);
      const grid: Record<string, { subjectId: string; teacherId: string }> = {};
      periods.forEach((p) => {
        const key = `${p.day}-${p.startTime}`;
        grid[key] = { subjectId: p.subjectId, teacherId: p.teacherId };
      });
      setGrid(grid);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) loadTimetable(selectedClassId);
  }, [selectedClassId, loadTimetable]);

  const getCell = (day: string, startTime: string) => grid[`${day}-${startTime}`] || { subjectId: "", teacherId: "" };

  const handleCellClick = (day: string, startTime: string) => {
    setActiveCell({ day, startTime });
    const cell = getCell(day, startTime);
    setCellEdit({ subjectId: cell.subjectId, teacherId: cell.teacherId });
  };

  const handleCellSave = () => {
    if (!activeCell) return;
    const key = `${activeCell.day}-${activeCell.startTime}`;
    setGrid((prev) => ({
      ...prev,
      [key]: { subjectId: cellEdit.subjectId, teacherId: cellEdit.teacherId },
    }));
    setActiveCell(null);
  };

  const handleCellClear = () => {
    if (!activeCell) return;
    const key = `${activeCell.day}-${activeCell.startTime}`;
    setGrid((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setActiveCell(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const periods: Array<{
        day: string;
        startTime: string;
        endTime: string;
        subjectId: string;
        teacherId: string;
      }> = [];

      for (const day of DAYS) {
        for (let i = 0; i < PERIODS.length; i++) {
          const startTime = PERIODS[i];
          const endTime = PERIODS[i + 1] || "16:00";
          const cell = grid[`${day}-${startTime}`];
          if (cell && cell.subjectId && cell.teacherId) {
            periods.push({ day, startTime, endTime, subjectId: cell.subjectId, teacherId: cell.teacherId });
          }
        }
      }

      if (periods.length === 0) {
        setError("Please add at least one period");
        return;
      }

      await setTimetable({ classId: selectedClassId, periods });
      setSuccessMsg("Timetable saved successfully");
      loadTimetable(selectedClassId);
    } catch (err: any) {
      setError(err?.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const getSubjectName = (subjectId: string) => subjects.find((s) => s.id === subjectId)?.name || "—";
  const getTeacherName = (teacherId: string) => teachers.find((t) => t.id === teacherId)?.name || "—";

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Timetable / Routine</h1>
          <p className="text-muted-foreground text-sm">
            Build weekly class schedule (admin)
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

      {/* Class selector */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Class</label>
            <InputComponent
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={loading || submitting}
            />
            {classes.find((c) => c.id === selectedClassId) && (
              <p className="text-xs text-muted-foreground">
                {classes.find((c) => c.id === selectedClassId)!.name} {classes.find((c) => c.id === selectedClassId)!.section}
              </p>
            )}
          </div>
        </div>
      </div>

      {selectedClassId && (
        <>
          {/* Weekly grid */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="border border-input bg-muted p-2 text-left font-semibold">Time / Day</th>
                    {DAYS.map((day) => (
                      <th key={day} className="border border-input bg-muted p-2 text-center font-semibold uppercase">
                        {day.charAt(0) + day.slice(1).toLowerCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((startTime, i) => {
                    const endTime = PERIODS[i + 1] || "16:00";
                    return (
                      <tr key={startTime} className="border-b">
                        <th className="border border-input bg-muted p-2 text-left font-medium">
                          {startTime} - {endTime}
                        </th>
                        {DAYS.map((day) => {
                          const key = `${day}-${startTime}`;
                          const cell = getCell(day, startTime);
                          const isActive = activeCell?.day === day && activeCell?.startTime === startTime;
                          const hasClass = cell.subjectId && cell.teacherId;
                          return (
                            <td
                              key={key}
                              className={twMerge(
                                "border border-input p-1 h-16 bg-card/50 cursor-pointer select-none transition-colors",
                                isActive ? "ring-2 ring-primary ring-offset-1" : "",
                                hasClass ? "bg-accent" : ""
                              )}
                              onClick={() => handleCellClick(day, startTime)}
                            >
                              <div className="flex flex-col items-center justify-center h-full gap-1">
                                {hasClass ? (
                                  <>
                                    <div className="font-bold text-xs leading-tight">{getSubjectName(cell.subjectId)}</div>
                                    <div className="text-[9px] text-muted-foreground">{getTeacherName(cell.teacherId)}</div>
                                  </>
                                ) : (
                                  <div className="text-[9px] text-muted-foreground/50">Tap to add</div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cell editor */}
          {activeCell && (
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-muted-foreground" />
                <h4 className="text-sm font-medium">
                  Edit: {activeCell.day.charAt(0) + activeCell.day.slice(1).toLowerCase()},{" "}
                  {activeCell.startTime} - {PERIODS[PERIODS.indexOf(activeCell.startTime) + 1] || "16:00"}
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Subject</label>
                  <select
                    value={cellEdit.subjectId}
                    onChange={(e) => setCellEdit({ ...cellEdit, subjectId: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="">— Select subject —</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Teacher</label>
                  <select
                    value={cellEdit.teacherId}
                    onChange={(e) => setCellEdit({ ...cellEdit, teacherId: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="">— Select teacher —</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <ButtonComponent
                  onClick={handleCellSave}
                  disabled={!cellEdit.subjectId || !cellEdit.teacherId}
                  className="flex-1"
                >
                  Set Cell
                </ButtonComponent>
                <ButtonComponent variant="outline" onClick={handleCellClear} className="flex-1">
                  Clear
                </ButtonComponent>
                <ButtonComponent variant="ghost" size="sm" onClick={() => setActiveCell(null)}>
                  Cancel
                </ButtonComponent>
              </div>
            </div>
          )}

          {/* Save all */}
          <div className="p-4 border-t bg-muted/20">
            <ButtonComponent
              variant="default"
              onClick={handleSave}
              disabled={submitting || !selectedClassId}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} className="mr-2" />
                  Save Timetable
                </>
              )}
            </ButtonComponent>
            <p className="text-xs text-muted-foreground mt-2">
              Tap any cell to add/edit a period. Changes save when you click Save Timetable.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
