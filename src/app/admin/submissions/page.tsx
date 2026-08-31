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

type LiveShop = {
  id: number;
  name: string;
  address: string | null;
  active: boolean | null;
};

type PriceObservation = {
  id: number;
  shop_id: number;
  price: number;
  observed_date: string | null;
  tax_status: string | null;
  notes: string | null;
  approved: boolean | null;
  created_at: string;
};

type EditableShop = LiveShop & {
  latestObservation: PriceObservation;
};

type EditForm = {
  name: string;
  address: string;
  price: string;
  observedDate: string;
  taxStatus: string;
  notes: string;
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

function taxLabel(status: string | null) {
  if (status === "included") {
    return "Tax included";
  }

  if (status === "excluded") {
    return "Before tax";
  }

  return "Tax unknown";
}

export default function AdminSubmissionsPage() {
  const router = useRouter();

  const [submissions, setSubmissions] =
    useState<Submission[]>([]);

  const [liveShops, setLiveShops] =
    useState<EditableShop[]>([]);

  const [
    highlightedSubmissionId,
    setHighlightedSubmissionId,
  ] = useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [shopsLoading, setShopsLoading] =
    useState(true);

  const [workingId, setWorkingId] =
    useState<number | null>(null);

  const [editingShopId, setEditingShopId] =
    useState<number | null>(null);

  const [editForm, setEditForm] =
    useState<EditForm | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const hasScrolledToHighlighted =
    useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const submissionParam =
      params.get("submission");

    if (!submissionParam) {
      return;
    }

    const parsedId =
      Number(submissionParam);

    if (
      Number.isFinite(parsedId) &&
      parsedId > 0
    ) {
      setHighlightedSubmissionId(
        parsedId
      );
    }
  }, []);

  const checkAdmin = useCallback(
    async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        const currentUrl =
          window.location.pathname +
          window.location.search;

        router.push(
          `/admin/login?redirect=${encodeURIComponent(
            currentUrl
          )}`
        );

        return false;
      }

      return true;
    },
    [router]
  );

  const loadSubmissions =
    useCallback(async () => {
      setLoading(true);
      setErrorMessage("");

      const isAdmin =
        await checkAdmin();

      if (!isAdmin) {
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
    }, [checkAdmin]);

  const loadLiveShops =
    useCallback(async () => {
      setShopsLoading(true);

      const isAdmin =
        await checkAdmin();

      if (!isAdmin) {
        return;
      }

      const {
        data: shopData,
        error: shopError,
      } = await supabase
        .from("shops")
        .select(`
          id,
          name,
          address,
          active
        `)
        .eq("active", true)
        .order("name");

      if (shopError) {
        console.error(shopError);

        setErrorMessage(
          shopError.message
        );

        setShopsLoading(false);

        return;
      }

      const {
        data: observationData,
        error: observationError,
      } = await supabase
        .from("price_observations")
        .select(`
          id,
          shop_id,
          price,
          observed_date,
          tax_status,
          notes,
          approved,
          created_at
        `)
        .eq("approved", true)
        .order("observed_date", {
          ascending: false,
          nullsFirst: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (observationError) {
        console.error(
          observationError
        );

        setErrorMessage(
          observationError.message
        );

        setShopsLoading(false);

        return;
      }

      const shops =
        (shopData ?? []) as LiveShop[];

      const observations =
        (observationData ??
          []) as PriceObservation[];

      const latestByShop =
        new Map<
          number,
          PriceObservation
        >();

      for (const observation of observations) {
        if (
          !latestByShop.has(
            observation.shop_id
          )
        ) {
          latestByShop.set(
            observation.shop_id,
            observation
          );
        }
      }

      const editableShops =
        shops
          .map((shop) => {
            const latestObservation =
              latestByShop.get(
                shop.id
              );

            if (!latestObservation) {
              return null;
            }

            return {
              ...shop,
              latestObservation,
            };
          })
          .filter(
            (
              shop
            ): shop is EditableShop =>
              shop !== null
          );

      setLiveShops(
        editableShops
      );

      setShopsLoading(false);
    }, [checkAdmin]);

  useEffect(() => {
    loadSubmissions();
    loadLiveShops();
  }, [
    loadSubmissions,
    loadLiveShops,
  ]);

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
    setSuccessMessage("");

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

    setSubmissions(
      (current) =>
        current.filter(
          (submission) =>
            submission.id !== id
        )
    );

    setWorkingId(null);

    setSuccessMessage(
      "Submission approved."
    );

    await loadLiveShops();
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
    setSuccessMessage("");

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

    setSubmissions(
      (current) =>
        current.filter(
          (submission) =>
            submission.id !== id
        )
    );

    setWorkingId(null);

    setSuccessMessage(
      "Submission rejected."
    );
  }

  function beginEdit(
    shop: EditableShop
  ) {
    setEditingShopId(shop.id);

    setEditForm({
      name: shop.name,
      address:
        shop.address ?? "",
      price:
        Number(
          shop.latestObservation
            .price
        ).toFixed(2),
      observedDate:
        shop.latestObservation
          .observed_date ?? "",
      taxStatus:
        shop.latestObservation
          .tax_status ??
        "unknown",
      notes:
        shop.latestObservation
          .notes ?? "",
    });

    setErrorMessage("");
    setSuccessMessage("");
  }

  function cancelEdit() {
    setEditingShopId(null);
    setEditForm(null);
  }

  async function saveShop(
    shop: EditableShop
  ) {
    if (!editForm) {
      return;
    }

    const numericPrice =
      Number(editForm.price);

    if (
      !editForm.name.trim()
    ) {
      setErrorMessage(
        "Shop name is required."
      );

      return;
    }

    if (
      !numericPrice ||
      numericPrice <= 0
    ) {
      setErrorMessage(
        "Enter a valid price."
      );

      return;
    }

    setWorkingId(shop.id);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } =
      await supabase.rpc(
        "update_live_shop_entry",
        {
          p_shop_id: shop.id,
          p_observation_id:
            shop.latestObservation.id,
          p_name:
            editForm.name.trim(),
          p_address:
            editForm.address.trim() ||
            null,
          p_price:
            numericPrice,
          p_observed_date:
            editForm.observedDate ||
            null,
          p_tax_status:
            editForm.taxStatus,
          p_notes:
            editForm.notes.trim() ||
            null,
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

    setEditingShopId(null);
    setEditForm(null);
    setWorkingId(null);

    setSuccessMessage(
      "Live entry updated."
    );

    await loadLiveShops();
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
              Index Control Center
            </h1>

            <p className="mt-5 text-lg leading-8 text-[#bfa382]">
              Review new submissions
              and manage live shop
              information.
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

        {successMessage && (
          <div className="mt-8 rounded-xl border border-[#55623d] bg-[#12190e] px-5 py-4 text-sm text-[#bfd09d]">
            {successMessage}
          </div>
        )}

        {/* PENDING SUBMISSIONS */}

        <section className="mt-12">

          <p className="text-sm font-bold uppercase tracking-[0.17em] text-[#c77b3a]">
            Pending Submissions
          </p>

          {loading ? (
            <div className="mt-6 text-[#a9896b]">
              Loading submissions...
            </div>
          ) : submissions.length ===
            0 ? (
            <div className="mt-6 rounded-[18px] border border-[#463326] bg-[#14100c] p-7">

              <p
                className="text-2xl text-[#ead3b4]"
                style={{
                  fontFamily:
                    'Georgia, "Times New Roman", serif',
                }}
              >
                All caught up.
              </p>

              <p className="mt-2 text-[#a9896b]">
                No prices are waiting
                for review.
              </p>

            </div>
          ) : (
            <div className="mt-6 grid gap-6">

              {submissions.map(
                (submission) => {
                  const isHighlighted =
                    highlightedSubmissionId ===
                    submission.id;

                  return (
                    <article
                      key={
                        submission.id
                      }
                      id={`submission-${submission.id}`}
                      className={
                        isHighlighted
                          ? "rounded-[18px] border border-[#c77b3a] bg-[#19120d] p-6 shadow-[0_0_0_2px_rgba(199,123,58,0.22),0_20px_50px_rgba(139,72,24,0.32)] md:p-8"
                          : "rounded-[18px] border border-[#4b3524] bg-[#14100c]/95 p-6 shadow-[0_16px_40px_rgba(0,0,0,0.26)] md:p-8"
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

                          <p className="mt-1 text-[#c3a381]">
                            {taxLabel(
                              submission.tax_status
                            )}
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
                          className="rounded-lg border border-[#aa6b34] bg-[#2a180e] px-6 py-3 text-sm font-bold uppercase tracking-[0.13em] text-[#e4b47d] transition hover:-translate-y-0.5 hover:border-[#d28a43] hover:bg-[#351e10] disabled:opacity-50"
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
                          className="rounded-lg border border-[#4d392d] px-6 py-3 text-sm font-bold uppercase tracking-[0.13em] text-[#93745b] transition hover:border-[#8c5445] hover:bg-[#21120f] hover:text-[#cf9483] disabled:opacity-50"
                        >
                          Reject
                        </button>

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* MANAGE LIVE SHOPS */}

        <section className="mt-16 border-t border-[#39291f] pt-12">

          <p className="text-sm font-bold uppercase tracking-[0.17em] text-[#c77b3a]">
            Manage Live Shops
          </p>

          <h2
            className="mt-3 text-4xl text-[#ead3b4]"
            style={{
              fontFamily:
                'Georgia, "Times New Roman", serif',
            }}
          >
            Current Index
          </h2>

          <p className="mt-3 max-w-2xl text-[#9f8063]">
            Correct a shop name,
            address, or its current
            price observation. Historical
            observations remain intact.
          </p>

          {shopsLoading ? (
            <div className="mt-8 text-[#a9896b]">
              Loading live shops...
            </div>
          ) : (
            <div className="mt-8 grid gap-4">

              {liveShops.map(
                (shop) => {
                  const isEditing =
                    editingShopId ===
                    shop.id;

                  return (
                    <article
                      key={shop.id}
                      className="rounded-[16px] border border-[#443125] bg-[#13100c] p-6"
                    >

                      {!isEditing ||
                      !editForm ? (
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                          <div>

                            <h3
                              className="text-2xl text-[#e7cfae]"
                              style={{
                                fontFamily:
                                  'Georgia, "Times New Roman", serif',
                              }}
                            >
                              {shop.name}
                            </h3>

                            {shop.address && (
                              <p className="mt-1 text-sm text-[#80634d]">
                                {
                                  shop.address
                                }
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">

                              <span className="text-[#d3af84]">
                                $
                                {Number(
                                  shop.latestObservation
                                    .price
                                ).toFixed(
                                  2
                                )}
                              </span>

                              <span className="text-[#80634d]">
                                {formatDate(
                                  shop.latestObservation
                                    .observed_date
                                )}
                              </span>

                              <span className="italic text-[#80634d]">
                                {taxLabel(
                                  shop.latestObservation
                                    .tax_status
                                )}
                              </span>

                            </div>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              beginEdit(
                                shop
                              )
                            }
                            className="self-start rounded-lg border border-[#755137] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.13em] text-[#b88a63] transition hover:border-[#b8753c] hover:text-[#e3b17d] md:self-auto"
                          >
                            Edit
                          </button>

                        </div>
                      ) : (
                        <div>

                          <div className="grid gap-5 sm:grid-cols-2">

                            <label className="grid gap-2">

                              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9d6d47]">
                                Shop Name
                              </span>

                              <input
                                value={
                                  editForm.name
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditForm({
                                    ...editForm,
                                    name:
                                      event
                                        .target
                                        .value,
                                  })
                                }
                                className="rounded-lg border border-[#4b382a] bg-[#0c0907] px-4 py-3 text-[#ead4b7] outline-none focus:border-[#986039]"
                              />

                            </label>

                            <label className="grid gap-2">

                              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9d6d47]">
                                Address
                              </span>

                              <input
                                value={
                                  editForm.address
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditForm({
                                    ...editForm,
                                    address:
                                      event
                                        .target
                                        .value,
                                  })
                                }
                                className="rounded-lg border border-[#4b382a] bg-[#0c0907] px-4 py-3 text-[#ead4b7] outline-none focus:border-[#986039]"
                              />

                            </label>

                            <label className="grid gap-2">

                              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9d6d47]">
                                Current Price
                              </span>

                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={
                                  editForm.price
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditForm({
                                    ...editForm,
                                    price:
                                      event
                                        .target
                                        .value,
                                  })
                                }
                                className="rounded-lg border border-[#4b382a] bg-[#0c0907] px-4 py-3 text-[#ead4b7] outline-none focus:border-[#986039]"
                              />

                            </label>

                            <label className="grid gap-2">

                              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9d6d47]">
                                Observed Date
                              </span>

                              <input
                                type="date"
                                value={
                                  editForm.observedDate
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditForm({
                                    ...editForm,
                                    observedDate:
                                      event
                                        .target
                                        .value,
                                  })
                                }
                                className="rounded-lg border border-[#4b382a] bg-[#0c0907] px-4 py-3 text-[#ead4b7] outline-none focus:border-[#986039]"
                              />

                            </label>

                            <label className="grid gap-2">

                              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9d6d47]">
                                Tax Status
                              </span>

                              <select
                                value={
                                  editForm.taxStatus
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditForm({
                                    ...editForm,
                                    taxStatus:
                                      event
                                        .target
                                        .value,
                                  })
                                }
                                className="rounded-lg border border-[#4b382a] bg-[#0c0907] px-4 py-3 text-[#ead4b7] outline-none focus:border-[#986039]"
                              >
                                <option value="unknown">
                                  Unknown
                                </option>

                                <option value="included">
                                  Included
                                </option>

                                <option value="excluded">
                                  Not included
                                </option>
                              </select>

                            </label>

                            <label className="grid gap-2">

                              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9d6d47]">
                                Notes
                              </span>

                              <input
                                value={
                                  editForm.notes
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditForm({
                                    ...editForm,
                                    notes:
                                      event
                                        .target
                                        .value,
                                  })
                                }
                                className="rounded-lg border border-[#4b382a] bg-[#0c0907] px-4 py-3 text-[#ead4b7] outline-none focus:border-[#986039]"
                              />

                            </label>

                          </div>

                          <div className="mt-6 flex flex-wrap gap-3">

                            <button
                              type="button"
                              disabled={
                                workingId ===
                                shop.id
                              }
                              onClick={() =>
                                saveShop(
                                  shop
                                )
                              }
                              className="rounded-lg border border-[#a86934] bg-[#28170d] px-5 py-3 text-xs font-bold uppercase tracking-[0.13em] text-[#e5b980] transition hover:border-[#cf8843] disabled:opacity-50"
                            >
                              {workingId ===
                              shop.id
                                ? "Saving..."
                                : "Save Changes"}
                            </button>

                            <button
                              type="button"
                              onClick={
                                cancelEdit
                              }
                              className="rounded-lg border border-[#443227] px-5 py-3 text-xs font-bold uppercase tracking-[0.13em] text-[#876a53]"
                            >
                              Cancel
                            </button>

                          </div>

                        </div>
                      )}

                    </article>
                  );
                }
              )}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}