"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setReady(true);
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setReady(true);
      }

      if (session) {
        setReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSuccess(true);

    setTimeout(() => {
      router.push("/admin/login");
    }, 1500);
  }

  return (
    <main
      className="min-h-screen bg-[#090806] text-[#ead5b8]"
      style={{
        backgroundImage: `
          radial-gradient(circle at 15% 18%, rgba(116, 67, 25, 0.12), transparent 28%),
          radial-gradient(circle at 82% 14%, rgba(91, 54, 26, 0.08), transparent 24%)
        `,
      }}
    >
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
        <div className="w-full">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b77a45] transition hover:text-[#e5b27c]"
          >
            ← Back to the index
          </Link>

          <div className="mt-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#cd7b35]">
              Admin
            </p>

            <h1
              className="mt-3 text-5xl leading-none text-[#efd9bb]"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
              }}
            >
              Reset Password
            </h1>

            <p className="mt-5 text-lg leading-8 text-[#bfa382]">
              Choose a new password for your admin account.
            </p>
          </div>

          <section className="mt-10 rounded-[18px] border border-[#4b3524] bg-[#14100c]/95 p-7 shadow-[0_20px_55px_rgba(0,0,0,0.32)]">
            {!ready ? (
              <p className="text-[#bfa382]">
                Waiting for a valid password recovery session...
              </p>
            ) : success ? (
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d5853c]">
                  Password updated
                </p>

                <h2
                  className="mt-4 text-3xl text-[#eed6b5]"
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                  }}
                >
                  You&apos;re all set.
                </h2>

                <p className="mt-4 text-[#bea07d]">
                  Redirecting you to the admin login...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-6">
                <label className="grid gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#c27b40]">
                    New password
                  </span>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="new-password"
                    className="rounded-lg border border-[#4b382a] bg-[#0d0a08] px-4 py-3.5 text-base text-[#ead4b7] outline-none transition focus:border-[#9f6334] focus:ring-1 focus:ring-[#9f6334]"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#c27b40]">
                    Confirm new password
                  </span>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    required
                    autoComplete="new-password"
                    className="rounded-lg border border-[#4b382a] bg-[#0d0a08] px-4 py-3.5 text-base text-[#ead4b7] outline-none transition focus:border-[#9f6334] focus:ring-1 focus:ring-[#9f6334]"
                  />
                </label>

                {errorMessage && (
                  <div className="rounded-lg border border-[#774338] bg-[#26120f] px-4 py-3 text-sm text-[#e1a595]">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg border border-[#a86934] bg-[#28170d] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-[#e5b980] transition hover:-translate-y-1 hover:border-[#d38a43] hover:bg-[#341d10] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Updating..." : "Update Password"}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}