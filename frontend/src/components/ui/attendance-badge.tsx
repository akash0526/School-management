"use client";

import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function AttendanceBadge({
  status,
  className,
}: {
  status: "PRESENT" | "ABSENT" | "LATE";
  className?: string;
}) {
  const variants = {
    PRESENT: "bg-green-100 text-green-700 border-green-200",
    ABSENT: "bg-red-100 text-red-700 border-red-200",
    LATE: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };
  const labels: Record<string, string> = {
    PRESENT: "Present",
    ABSENT: "Absent",
    LATE: "Late",
  };
  return (
    <span
      className={twMerge(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
}
