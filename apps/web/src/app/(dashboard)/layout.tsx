"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { ButtonComponent } from "@/components/ui/button";
import { twMerge } from "tailwind-merge";
import {
  LayoutDashboard,
  School,
  BookOpen,
  FileCheck,
  Bell,
  MessageCircle,
  Clock,
  LogOut,
  User,
  Menu,
  ChevronRight,
} from "lucide-react";

// Role-based navigation config (max 3 taps to any core feature)
const NAV: Record<string, Array<{ key: string; label: string; href: string; icon: any }>> = {
  ADMIN: [
    { key: "dashboard", label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { key: "attendance", label: "Attendance", href: "/dashboard/admin/attendance", icon: FileCheck },
    { key: "homework", label: "Homework", href: "/dashboard/admin/homework", icon: BookOpen },
    { key: "notices", label: "Notices", href: "/dashboard/admin/notices", icon: Bell },
    { key: "users", label: "Users", href: "/dashboard/admin/users", icon: User },
  ],
  TEACHER: [
    { key: "dashboard", label: "Dashboard", href: "/dashboard/teacher", icon: LayoutDashboard },
    { key: "attendance", label: "Attendance", href: "/dashboard/teacher/attendance", icon: FileCheck },
    { key: "homework", label: "Homework", href: "/dashboard/teacher/homework", icon: BookOpen },
    { key: "exams", label: "Exams", href: "/dashboard/teacher/exams", icon: School },
    { key: "messages", label: "Messages", href: "/dashboard/teacher/messages", icon: MessageCircle },
  ],
  STUDENT: [
    { key: "dashboard", label: "Dashboard", href: "/dashboard/student", icon: LayoutDashboard },
    { key: "attendance", label: "Attendance", href: "/dashboard/student/attendance", icon: FileCheck },
    { key: "homework", label: "Homework", href: "/dashboard/student/homework", icon: BookOpen },
    { key: "results", label: "Results", href: "/dashboard/student/results", icon: Clock },
  ],
  PARENT: [
    { key: "dashboard", label: "Dashboard", href: "/dashboard/parent", icon: LayoutDashboard },
    { key: "attendance", label: "Attendance", href: "/dashboard/parent/attendance", icon: FileCheck },
    { key: "homework", label: "Homework", href: "/dashboard/parent/homework", icon: BookOpen },
    { key: "results", label: "Results", href: "/dashboard/parent/results", icon: Clock },
    { key: "messages", label: "Messages", href: "/dashboard/parent/messages", icon: MessageCircle },
  ],
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { t, locale, setLocale } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const role = user?.role || "ADMIN";
  const items = NAV[role] || NAV.ADMIN;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <span className="text-sm">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const activeKey = items.find((i) => pathname.startsWith(i.href))?.key || "dashboard";

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent"
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 text-sm font-medium">
            {user?.name}
            <span className="text-xs px-2 py-0.5 rounded border border-input/50 text-muted-foreground ml-2">
              {user?.role}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocale(locale === "ne" ? "en" : "ne")}
              className="rounded-md p-2 text-muted-foreground hover:bg-accent"
              aria-label="Language"
            >
              {locale === "ne" ? t("common.english") : t("common.nepali")}
            </button>
            <ButtonComponent variant="ghost" size="sm" onClick={logout} className="min-w-[auto]">
              <LogOut size={16} />
            </ButtonComponent>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex lg:w-64 border-r flex-col">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-6">
              <School size={22} className="text-primary" />
              <span className="font-semibold text-sm">{t("common.appName")}</span>
            </div>
            <nav className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => router.push(item.href)}
                  className={twMerge(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                    activeKey === item.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon size={18} />
                  {t(`nav.${item.key}`)}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur z-20">
        <div className="flex justify-around px-2 py-2">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => router.push(item.href)}
              className={twMerge(
                "flex flex-col items-center justify-center gap-1 px-2 py-1.5 text-xs transition",
                activeKey === item.key
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
              aria-label={item.label}
            >
              <item.icon size={20} />
              <span className={twMerge("font-medium", activeKey === item.key ? "" : "opacity-80")}>
                {t(`nav.${item.key}`)}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
      )}
      {menuOpen && (
        <aside className="fixed inset-y-0 left-0 z-30 w-72 bg-card border-r shadow-xl flex flex-col">
          <div className="p-4 flex items-center justify-between">
            <button onClick={() => setMenuOpen(false)} className="text-muted-foreground">
              <ChevronRight size={20} />
            </button>
          </div>
          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            {items.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  router.push(item.href);
                  setMenuOpen(false);
                }}
                className={twMerge(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition",
                  activeKey === item.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                <item.icon size={18} />
                {t(`nav.${item.key}`)}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t">
            <button onClick={logout} className="w-full flex items-center gap-2 text-destructive text-sm py-2">
              <LogOut size={18} /> {t("common.logOut")}
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
