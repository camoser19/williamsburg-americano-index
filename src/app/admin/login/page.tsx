"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "error" | "success" | ""
  >("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setMessage("");
    setMessageType("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(error);
      setMessage(error.message);
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    router.push("/admin/submissions");
    router.refresh();
  }

  async function handlePasswordReset() {
    setMessage("");
    setMessageType("");

    if (!email.trim()) {
      setMessage("Enter your email address first.");
      setMessageType("error");
      return;
    }

    setResetting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: "http://localhost:3000/admin/reset-password",
      }
    );

    if (error) {
      console.error(error);
      setMessage(error.message);
      setMessageType("error");
      setResetting(false);
      return;
    }

    setMessage(
      "Password reset email sent. Check your inbox and use the newest recovery email."
    );
    setMessageType("success");
    setResetting(false);
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
              Sign In
            </h1>

            <p className="mt-5 text-lg leading-8 text-[#bfa382]">
              Review and manage submitted Williamsburg iced Americano prices.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-10 rounded-[18px] border border-[#4b3524] bg-[#14100c]/95 p-7 shadow-[0_20px_55px_rgba(0,0,0,0.32)]"
          >
            <div className="grid gap-6">
              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#c27b40]">
                  Email
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="rounded-lg border border-[#4b382a] bg-[#0d0a08] px-4 py-3.5 text-base text-[#ead4b7] outline-none transition focus:border-[#9f6334] focus:ring-1 focus:ring-[#9f6334]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#c27b40]">
                  Password
                </span>

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="rounded-lg border border-[#4b382a] bg-[#0d0a08] px-4 py-3.5 text-base text-[#ead4b7] outline-none transition focus:border-[#9f6334] focus:ring-1 focus:ring-[#9f6334]"
                />
              </label>

              {message && (
                <div
                  className={
                    messageType === "success"
                      ? "rounded-lg border border-[#4d6b3f] bg-[#14210f] px-4 py-3 text-sm text-[#b9d8a5]"
                      : "rounded-lg border border-[#774338] bg-[#26120f] px-4 py-3 text-sm text-[#e1a595]"
                  }
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg border border-[#a86934] bg-[#28170d] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-[#e5b980] transition hover:-translate-y-1 hover:border-[#d38a43] hover:bg-[#341d10] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Signing in..." : "Sign In"}
              </button>

              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={resetting}
                className="text-sm text-[#b77a45] transition hover:text-[#e5b27c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resetting ? "Sending reset email..." : "Forgot password?"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}