"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type TaxStatus = "unknown" | "included" | "excluded";

export default function SubmitPricePage() {
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [observedDate, setObservedDate] = useState("");
  const [taxStatus, setTaxStatus] = useState<TaxStatus>("unknown");
  const [notes, setNotes] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    const numericPrice = Number(price);

    if (!shopName.trim()) {
      setErrorMessage("Please enter the coffee shop.");
      setSubmitting(false);
      return;
    }

    if (!numericPrice || numericPrice <= 0) {
      setErrorMessage("Please enter a valid price.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("price_submissions").insert({
      shop_name: shopName.trim(),
      address: address.trim() || null,
      price: numericPrice,
      observed_date: observedDate || null,
      tax_status: taxStatus,
      notes: notes.trim() || null,
      submitter_name: submitterName.trim() || null,
      submitter_email: submitterEmail.trim() || null,
      status: "pending",
    });

    if (error) {
      console.error(error);
      setErrorMessage(
        "Something went wrong while submitting the price. Please try again."
      );
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);

    setShopName("");
    setAddress("");
    setPrice("");
    setObservedDate("");
    setTaxStatus("unknown");
    setNotes("");
    setSubmitterName("");
    setSubmitterEmail("");
  }

  return (
    <main
      className="min-h-screen bg-[#090806] text-[#ead5b8]"
      style={{
        backgroundImage: `
          radial-gradient(circle at 16% 20%, rgba(113, 65, 25, 0.12), transparent 28%),
          radial-gradient(circle at 82% 15%, rgba(91, 54, 26, 0.08), transparent 25%)
        `,
      }}
    >
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8 md:py-16">
        <header className="mb-12">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b77a45] transition hover:text-[#e5b27c]"
          >
            ← Back to the index
          </Link>

          <p className="mt-10 text-sm font-bold uppercase tracking-[0.18em] text-[#cd7b35]">
            Community price check
          </p>

          <h1
            className="mt-3 text-5xl leading-none text-[#efd9bb] sm:text-6xl"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          >
            Submit a Price
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-[#bfa382]">
            Bought an iced Americano in Williamsburg? Tell us what you paid.
            Submissions are reviewed before they appear in the index.
          </p>
        </header>

        {success ? (
          <section className="rounded-[18px] border border-[#71502e] bg-[#18110c] p-8 shadow-[0_18px_50px_rgba(0,0,0,0.32)]">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d5853c]">
              Price received
            </p>

            <h2
              className="mt-4 text-4xl text-[#eed6b5]"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
              }}
            >
              Thank you.
            </h2>

            <p className="mt-4 text-lg leading-8 text-[#bea07d]">
              Your submission is waiting for review. Once verified, it can be
              added to the Williamsburg Iced Americano Index.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="rounded-lg border border-[#88572e] bg-[#24160d] px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#e0b17e] transition hover:-translate-y-0.5 hover:border-[#bb7538] hover:bg-[#2d1b10]"
              >
                Submit another
              </button>

              <Link
                href="/"
                className="rounded-lg border border-[#3f3024] px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#9f8061] transition hover:border-[#775437] hover:text-[#d5b38f]"
              >
                Return to index
              </Link>
            </div>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-[18px] border border-[#4b3524] bg-[#14100c]/95 p-6 shadow-[0_20px_55px_rgba(0,0,0,0.32)] sm:p-8"
          >
            <div className="grid gap-7">

              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#c27b40]">
                  Coffee shop *
                </span>

                <input
                  type="text"
                  value={shopName}
                  onChange={(event) => setShopName(event.target.value)}
                  placeholder="e.g. Devoción"
                  required
                  className="rounded-lg border border-[#4b382a] bg-[#0d0a08] px-4 py-3.5 text-base text-[#ead4b7] outline-none transition placeholder:text-[#654f3d] focus:border-[#9f6334] focus:ring-1 focus:ring-[#9f6334]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#c27b40]">
                  Address
                </span>

                <input
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Useful if the shop has multiple locations"
                  className="rounded-lg border border-[#4b382a] bg-[#0d0a08] px-4 py-3.5 text-base text-[#ead4b7] outline-none transition placeholder:text-[#654f3d] focus:border-[#9f6334] focus:ring-1 focus:ring-[#9f6334]"
                />
              </label>

              <div className="grid gap-7 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#c27b40]">
                    Price paid *
                  </span>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#997453]">
                      $
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      placeholder="5.00"
                      required
                      className="w-full rounded-lg border border-[#4b382a] bg-[#0d0a08] py-3.5 pl-8 pr-4 text-base text-[#ead4b7] outline-none transition placeholder:text-[#654f3d] focus:border-[#9f6334] focus:ring-1 focus:ring-[#9f6334]"
                    />
                  </div>
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#c27b40]">
                    Date observed
                  </span>

                  <input
                    type="date"
                    value={observedDate}
                    onChange={(event) => setObservedDate(event.target.value)}
                    className="rounded-lg border border-[#4b382a] bg-[#0d0a08] px-4 py-3.5 text-base text-[#ead4b7] outline-none transition focus:border-[#9f6334] focus:ring-1 focus:ring-[#9f6334]"
                  />
                </label>
              </div>

              <fieldset>
                <legend className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#c27b40]">
                  Sales tax
                </legend>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["unknown", "Not sure"],
                    ["included", "Included"],
                    ["excluded", "Not included"],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className={`cursor-pointer rounded-lg border px-4 py-3 text-center text-sm transition ${
                        taxStatus === value
                          ? "border-[#aa6935] bg-[#27180f] text-[#e5bd91]"
                          : "border-[#453429] bg-[#0f0b09] text-[#9c7c61] hover:border-[#745137]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tax-status"
                        value={value}
                        checked={taxStatus === value}
                        onChange={() => setTaxStatus(value as TaxStatus)}
                        className="sr-only"
                      />

                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#c27b40]">
                  Notes
                </span>

                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Anything useful: size, menu price, receipt details, etc."
                  rows={4}
                  className="resize-none rounded-lg border border-[#4b382a] bg-[#0d0a08] px-4 py-3.5 text-base text-[#ead4b7] outline-none transition placeholder:text-[#654f3d] focus:border-[#9f6334] focus:ring-1 focus:ring-[#9f6334]"
                />
              </label>

              <div className="border-t border-[#38291f] pt-7">
                <p className="mb-5 text-sm leading-6 text-[#80644f]">
                  Optional — leave your name or email if you're okay with us
                  contacting you about the submission.
                </p>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#9c704b]">
                      Your name
                    </span>

                    <input
                      type="text"
                      value={submitterName}
                      onChange={(event) =>
                        setSubmitterName(event.target.value)
                      }
                      className="rounded-lg border border-[#413127] bg-[#0d0a08] px-4 py-3.5 text-base text-[#ead4b7] outline-none transition focus:border-[#805333]"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#9c704b]">
                      Email
                    </span>

                    <input
                      type="email"
                      value={submitterEmail}
                      onChange={(event) =>
                        setSubmitterEmail(event.target.value)
                      }
                      className="rounded-lg border border-[#413127] bg-[#0d0a08] px-4 py-3.5 text-base text-[#ead4b7] outline-none transition focus:border-[#805333]"
                    />
                  </label>
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-lg border border-[#774338] bg-[#26120f] px-4 py-3 text-sm text-[#e1a595]">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 rounded-lg border border-[#a86934] bg-[#28170d] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-[#e5b980] shadow-[0_10px_25px_rgba(0,0,0,0.24)] transition hover:-translate-y-1 hover:border-[#d38a43] hover:bg-[#341d10] hover:shadow-[0_15px_30px_rgba(118,59,22,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Price"}
              </button>
            </div>
          </form>
        )}

        <footer className="mt-8 text-center text-xs italic leading-6 text-[#715640]">
          Submitted prices do not automatically change the index.
          <br />
          Every submission is reviewed first.
        </footer>
      </div>
    </main>
  );
}