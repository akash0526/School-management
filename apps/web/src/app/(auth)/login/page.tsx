"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { ButtonComponent } from "@/components/ui/button";
import { InputComponent } from "@/components/ui/input";
import { requestOtp, verifyOtp } from "@/lib/api";
import { Phone, Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phone);
      setStep("otp");
    } catch (err: any) {
      setError(err?.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [phone, t]);

  const handleVerify = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(phone, otp);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || t("auth.invalidOtp"));
    } finally {
      setLoading(false);
    }
  }, [phone, otp, t, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Cardish className="w-full max-w-md bg-card shadow-lg rounded-xl p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">{t("auth.loginHeading")}</h1>
          <p className="text-muted-foreground text-sm">{t("auth.subtitle")}</p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("common.phoneNumber")}</label>
              <InputComponent
                placeholder={t("auth.phonePlaceholder")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            <ButtonComponent variant="default" onClick={handleSendOtp} disabled={loading || !phone}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2" /> {t("common.loading")}
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" /> {t("auth.sendOtpButton")}
                </>
              )}
            </ButtonComponent>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("auth.enterOtp")}</label>
              <InputComponent
                placeholder={t("auth.otpPlaceholder")}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                autoComplete="otp"
              />
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            <ButtonComponent variant="default" onClick={handleVerify} disabled={loading || otp.length !== 6}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2" /> {t("common.loading")}
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" /> {t("auth.verifyButton")}
                </>
              )}
            </ButtonComponent>
            <p className="text-center text-xs text-muted-foreground">
              {t("auth.otpSent")}
            </p>
          </form>
        )}

        {step === "otp" && (
          <button
            onClick={() => setStep("phone")}
            className="mt-6 text-xs text-primary underline w-full"
          >
            {t("common.back")}
          </button>
        )}
      </Cardish>
    </div>
  );
}

function Cardish({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border bg-card text-card-foreground shadow-sm p-6 ${className || ""}`}>
      {children}
    </div>
  );
}
