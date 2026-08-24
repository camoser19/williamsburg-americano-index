"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Submission = {
  id: number;
  shop_name: string;
  address: string | null;
  price: number;
  observed_date: string | null;
  tax_status: string | null;
  notes: string | null;
  submitter_name: string | null;
  submitter_email: string | null;
  status: string;
  created_at: string;
};

function formatDate(date: string | null) {
  if (!date) {
    return "Date not provided";
  }

  return new Date(
    `${date}T12:00:00`
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSubmittedAt(date: string) {
  return new Date(date).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

export default function AdminSubmissionsPage() {
  const router = useRouter();

  const [submissions, setSubmissions] =
    useState<Submission[]>([]);

  const [highlightedSubmissionId, setHighlightedSubmissionId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  const [workingId, setWorkingId] =
    useState<number | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const hasScrolledToHighlighted = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const submissionParam =
      params.get("submission");

    if (!submissionParam) {
      return;
    }

    const parsedId = Number(submissionParam);

    if (
      Number.isFinite(parsedId) &&
      parsedId > 0
    ) {
      setHighlightedSubmissionId(
        parsedId
      );
    }
  }, []);

  const loadSubmissions = useCallback(
    async () => {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        const currentUrl =
          window.location.pathname +
          window.location.search;

        router.push(
          `/admin/login?redirect=${encodeURIComponent(
            currentUrl
          )}`
        );

        return;
      }

      const { data, error } =
        await supabase
          .from("price_submissions")
          .select("*")
          .eq("status", "pending")
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        console.error(error);

        setErrorMessage(
          error.message
        );

        setLoading(false);

        return;
      }

      setSubmissions(
        (data ?? []) as Submission[]
      );

      setLoading(false);
    },
    [router]
  );

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    if (
      loading ||
      !highlightedSubmissionId ||
      hasScrolledToHighlighted.current
    ) {
      return;
    }

    const element =
      document.getElementById(
        `submission-${highlightedSubmissionId}`
      );

    if (!element) {
      return;
    }

    hasScrolledToHighlighted.current =
      true;

    window.setTimeout(() => {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);
  }, [
    highlightedSubmissionId,
    loading,
    submissions,
  ]);

  async function approveSubmission(
    id: number
  ) {
    setWorkingId(id);
    setErrorMessage("");

    const { error } =
      await supabase.rpc(
        "approve_price_submission",
        {
          submission_id: id,
        }
      );

    if (error) {
      console.error(error);

      setErrorMessage(
        error.message
      );

      setWorkingId(null);

      return;
    }

    setSubmissions((current) =>
      current.filter(
        (submission) =>
          submission.id !== id
      )
    );

    setWorkingId(null);
  }

  async function rejectSubmission(
    id: number
  ) {
    const confirmed =
      window.confirm(
        "Reject this submission? It will not be added to the index."
      );

    if (!confirmed) {
      return;
    }

    setWorkingId(id);
    setErrorMessage("");

    const { error } =
      await supabase.rpc(
        "reject_price_submission",
        {
          submission_id: id,
        }
      );

    if (error) {
      console.error(error);

      setErrorMessage(
        error.message
      );

      setWorkingId(null);

      return;
    }

    setSubmissions((current) =>
      current.filter(
        (submission) =>
          submission.id !== id
      )
    );

    setWorkingId(null);
  }

  async function signOut() {
    await supabase.auth.signOut();

    router.push(
      "/admin/login"
    );

    router.refresh();
  }

  return (
    <main
      className="min-h-screen bg-[#090806] text-[#ead5b8]"
      style={{
        backgroundImage: `
          radial-gradient(circle at 16% 18%, rgba(116, 67, 25, 0.11), transparent 28%),
          radial-gradient(circle at 82% 14%, rgba(91, 54, 26, 0.07), transparent 24%)
        `,
      }}
    >
      <div className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">

        <header className="flex items-start justify-between gap-6">
          <div>
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b77a45] transition hover:text-[#e5b27c]"
            >
              ← View public index
            </Link>

            <p className="mt-9 text-sm font-bold uppercase tracking-[0.18em] text-[#cd7b35]">
              Admin
            </p>

            <h1
              className="mt-3 text-5xl leading-none text-[#efd9bb] md:text-6xl"
              style={{
                fontFamily:
                  'Georgia, "Times New Roman", serif',
              }}
            >
              Pending Submissions
            </h1>

            <p className="mt-5 text-lg leading-8 text-[#bfa382]">
              Review community-submitted
              iced Americano prices before
              they enter the index.
            </p>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="mt-2 shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f6d51] transition hover:text-[#d4a87c]"
          >
            Sign out
          </button>
        </header>

        {errorMessage && (
          <div className="mt-8 rounded-xl border border-[#774338] bg-[#26120f] px-5 py-4 text-sm text-[#e1a595]">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="mt-12 text-[#a9896b]">
            Loading submissions...
          </div>
        ) : submissions.length === 0 ? (
          <section className="mt-12 rounded-[18px] border border-[#463326] bg-[#14100c] p-8">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#c77b3a]">
              All caught up
            </p>

            <h2
              className="mt-4 text-3xl text-[#ead3b4]"
              style={{
                fontFamily:
                  'Georgia, "Times New Roman", serif',
              }}
            >
              No pending prices.
            </h2>

            <p className="mt-4 text-[#a9896b]">
              New community submissions
              will appear here for review.
            </p>
          </section>
        ) : (
          <section className="mt-12 grid gap-6">

            {submissions.map(
              (submission) => {
                const isHighlighted =
                  highlightedSubmissionId ===
                  submission.id;

                return (
                  <article
                    key={submission.id}
                    id={`submission-${submission.id}`}
                    className={
                      isHighlighted
                        ? "rounded-[18px] border border-[#c77b3a] bg-[#19120d] p-6 shadow-[0_0_0_2px_rgba(199,123,58,0.22),0_20px_50px_rgba(139,72,24,0.32)] transition-all duration-500 md:p-8"
                        : "rounded-[18px] border border-[#4b3524] bg-[#14100c]/95 p-6 shadow-[0_16px_40px_rgba(0,0,0,0.26)] transition-all duration-500 md:p-8"
                    }
                  >
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

                      <div>
                        <div className="flex flex-wrap items-center gap-3">

                          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#be7438]">
                            Pending submission
                          </p>

                          {isHighlighted && (
                            <span className="rounded-full border border-[#8f592f] bg-[#28170d] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#e4ad72]">
                              From email
                            </span>
                          )}

                        </div>

                        <h2
                          className="mt-3 text-3xl text-[#efd7b7]"
                          style={{
                            fontFamily:
                              'Georgia, "Times New Roman", serif',
                          }}
                        >
                          {
                            submission.shop_name
                          }
                        </h2>

                        {submission.address && (
                          <p className="mt-2 text-[#9f8063]">
                            {
                              submission.address
                            }
                          </p>
                        )}
                      </div>

                      <div className="md:text-right">
                        <p
                          className="text-5xl leading-none text-[#ead3b4]"
                          style={{
                            fontFamily:
                              'Georgia, "Times New Roman", serif',
                          }}
                        >
                          $
                          {Number(
                            submission.price
                          ).toFixed(2)}
                        </p>

                        <p className="mt-2 text-sm italic text-[#9d7655]">
                          {formatDate(
                            submission.observed_date
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-7 grid gap-4 border-y border-[#37291f] py-5 text-sm sm:grid-cols-2">

                      <div>
                        <span className="text-[#745945]">
                          Tax status
                        </span>

                        <p className="mt-1 capitalize text-[#c3a381]">
                          {submission.tax_status ===
                          "excluded"
                            ? "Not included"
                            : submission.tax_status ===
                                "included"
                              ? "Included"
                              : "Unknown"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[#745945]">
                          Submitted
                        </span>

                        <p className="mt-1 text-[#c3a381]">
                          {formatSubmittedAt(
                            submission.created_at
                          )}
                        </p>
                      </div>

                      {submission.notes && (
                        <div className="sm:col-span-2">
                          <span className="text-[#745945]">
                            Notes
                          </span>

                          <p className="mt-1 leading-6 text-[#c3a381]">
                            {
                              submission.notes
                            }
                          </p>
                        </div>
                      )}

                      {(submission.submitter_name ||
                        submission.submitter_email) && (
                        <div className="sm:col-span-2">

                          <span className="text-[#745945]">
                            Submitted by
                          </span>

                          <p className="mt-1 text-[#c3a381]">
                            {submission.submitter_name ||
                              "Anonymous"}

                            {submission.submitter_email &&
                              ` · ${submission.submitter_email}`}
                          </p>

                        </div>
                      )}

                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">

                      <button
                        type="button"
                        disabled={
                          workingId ===
                          submission.id
                        }
                        onClick={() =>
                          approveSubmission(
                            submission.id
                          )
                        }
                        className="rounded-lg border border-[#aa6b34] bg-[#2a180e] px-6 py-3 text-sm font-bold uppercase tracking-[0.13em] text-[#e4b47d] transition hover:-translate-y-0.5 hover:border-[#d28a43] hover:bg-[#351e10] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {workingId ===
                        submission.id
                          ? "Working..."
                          : "Approve"}
                      </button>

                      <button
                        type="button"
                        disabled={
                          workingId ===
                          submission.id
                        }
                        onClick={() =>
                          rejectSubmission(
                            submission.id
                          )
                        }
                        className="rounded-lg border border-[#4d392d] px-6 py-3 text-sm font-bold uppercase tracking-[0.13em] text-[#93745b] transition hover:border-[#8c5445] hover:bg-[#21120f] hover:text-[#cf9483] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>

                    </div>

                  </article>
                );
              }
            )}

          </section>
        )}
      </div>
    </main>
  );
}