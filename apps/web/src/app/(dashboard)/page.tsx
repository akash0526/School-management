"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function DashboardRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [isAuthenticated, isLoading, user, router]);

  return null;
}
