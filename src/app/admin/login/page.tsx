export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabase } from "@/lib/supabase";

type RelatedShop = {
  id: number;
  name: string;
};

type ShopRow = {
  id: number;
  price: number | string;
  tax_status: string | null;
  observed_date: string | null;
  created_at: string;
  shops: RelatedShop | RelatedShop[] | null;
};

type CurrentShop = {
  id: number;
  name: string;
  price: number;
  observedDate: string | null;
  note: string;
};

function AmericanoDrawing({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 118 150"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M78 9 68 55" strokeWidth="2.1" />
        <path d="m77 9 5-3" strokeWidth="1.2" />

        <path d="M25 34c13-5 48-6 68 0" strokeWidth="1.8" />
        <path
          d="M27 38c16 3 48 3 64-1"
          strokeWidth="1.1"
          opacity=".75"
        />

        <path
          d="M28 36 35 126c14 5 34 5 50 0l6-90"
          strokeWidth="1.8"
        />

        <path
          d="M32 60c17 4 38 4 55 0"
          strokeWidth="1.2"
          opacity=".8"
        />

        <path
          d="M34 75c15 3 35 3 51 0"
          strokeWidth=".9"
          opacity=".35"
        />

        <path d="m40 53 12-7 11 10-10 12-14-5Z" strokeWidth="1.4" />
        <path d="m61 49 13-5 10 10-6 12-14-3Z" strokeWidth="1.4" />
        <path d="m43 72 13-4 10 11-9 12-13-7Z" strokeWidth="1.3" />
        <path d="m65 70 13-3 7 12-9 10-12-7Z" strokeWidth="1.3" />

        <circle cx="45" cy="99" r="2.4" strokeWidth=".9" />
        <circle cx="68" cy="104" r="1.8" strokeWidth=".9" />
        <circle cx="53" cy="114" r="1.5" strokeWidth=".8" />
        <circle cx="76" cy="94" r="1.2" strokeWidth=".8" />

        <path
          d="M38 119c10 3 30 4 44 0"
          strokeWidth=".7"
          opacity=".45"
        />
        <path d="M20 132c19 4 55 5 79 0" strokeWidth="1.3" />
        <path
          d="M28 137c14 2 45 3 61 0"
          strokeWidth=".7"
          opacity=".55"
        />
      </g>
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none">
      <path
        d="m6 22 6-7 5 4 8-10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 9h5v5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none">
      <path
        d="M6 9v9l9 9 11-11-9-9H8a2 2 0 0 0-2 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle
        cx="11"
        cy="12"
        r="1.6"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none">
      <path
        d="m16 5 3.2 6.6 7.3 1-5.3 5.1 1.3 7.3-6.5-3.4L9.5 25l1.3-7.3-5.3-5.1 7.3-1L16 5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatObservedDate(date: string | null) {
  if (!date) return null;

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getRelatedShop(
  value: RelatedShop | RelatedShop[] | null
): RelatedShop | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export default async function Home() {
  const { data, error } = await supabase
    .from("price_observations")
    .select(`
      id,
      price,
      tax_status,
      observed_date,
      created_at,
      shops (
        id,
        name
      )
    `)
    .eq("approved", true)
    .order("observed_date", {
      ascending: false,
      nullsFirst: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(`Unable to load price data: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as ShopRow[];
  const latestByShop = new Map<number, CurrentShop>();

  for (const row of rows) {
    const shop = getRelatedShop(row.shops);

    if (!shop || latestByShop.has(shop.id)) {
      continue;
    }

    latestByShop.set(shop.id, {
      id: shop.id,
      name: shop.name,
      price: Number(row.price),
      observedDate: row.observed_date,
      note:
        row.tax_status === "included"
          ? "Tax included"
          : row.tax_status === "excluded"
            ? "Before tax"
            : "",
    });
  }

  const shops = Array.from(latestByShop.values());

  const sortedShops = [...shops].sort(
    (a, b) => a.price - b.price
  );

  const average =
    shops.length > 0
      ? shops.reduce((sum, shop) => sum + shop.price, 0) /
        shops.length
      : 0;

  const cheapest = sortedShops[0];
  const mostExpensive = sortedShops[sortedShops.length - 1];

  return (
    <main
      className="min-h-screen overflow-hidden bg-[#090806] text-[#e9d4b5]"
      style={{
        backgroundImage: `
          radial-gradient(circle at 16% 26%, rgba(115, 65, 24, 0.10), transparent 29%),
          radial-gradient(circle at 77% 19%, rgba(92, 54, 24, 0.07), transparent 24%),
          radial-gradient(circle at 50% 75%, rgba(101, 55, 20, 0.04), transparent 34%)
        `,
      }}
    >
      <div className="mx-auto w-full max-w-[1360px] px-5 pb-28 pt-6 sm:px-9 sm:pb-10 sm:pt-8 lg:px-14 xl:px-16">

        <header>
          <div className="flex items-start justify-between gap-8">
            <a href="#" className="flex items-start gap-4 sm:gap-5">
              <AmericanoDrawing className="h-[90px] w-[68px] shrink-0 text-[#dcc19d] sm:h-[115px] sm:w-[88px]" />

              <div className="pt-1 sm:pt-2">
                <div
                  className="text-[14px] font-semibold uppercase leading-[1.45] tracking-[0.14em] text-[#e5c69f] sm:text-[17px] sm:tracking-[0.16em]"
                  style={{
                    fontFamily:
                      '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive',
                  }}
                >
                  Williamsburg
                  <br />
                  Iced Americano
                  <br />
                  Index
                </div>

                <div className="mt-3 h-px w-[165px] bg-[#84603e] sm:mt-4 sm:w-[205px]" />
              </div>
            </a>

            <nav className="hidden items-center gap-11 pt-6 text-[13px] uppercase tracking-[0.08em] text-[#c9a77f] md:flex">
              <a
                href="#about"
                className="transition-colors duration-200 hover:text-[#f1d4ab]"
              >
                About
              </a>

              <a
                href="/submit"
                className="transition-colors duration-200 hover:text-[#f1d4ab]"
              >
                Submit a Price
              </a>

              <a
                href="#methodology"
                className="transition-colors duration-200 hover:text-[#f1d4ab]"
              >
                Methodology
              </a>

              <a
                href="/admin/login"
                className="text-[#75583f] transition-colors duration-200 hover:text-[#c99b70]"
              >
                Admin
              </a>
            </nav>
          </div>

          <div className="mt-7 md:hidden">
            <a
              href="/submit"
              className="flex w-full items-center justify-center rounded-[10px] border border-[#a86934] bg-[#29180e] px-5 py-4 text-[13px] font-bold uppercase tracking-[0.15em] text-[#e6b981] shadow-[0_10px_25px_rgba(0,0,0,0.22)] transition active:scale-[0.99]"
            >
              + Submit a Price
            </a>

            <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-[9px] border border-[#3e2d20] bg-[#100c09]">
              <a
                href="#about"
                className="border-r border-[#3e2d20] px-2 py-3 text-center text-[11px] uppercase tracking-[0.1em] text-[#a98767]"
              >
                About
              </a>

              <a
                href="#methodology"
                className="border-r border-[#3e2d20] px-2 py-3 text-center text-[11px] uppercase tracking-[0.1em] text-[#a98767]"
              >
                Method
              </a>

              <a
                href="/admin/login"
                className="px-2 py-3 text-center text-[11px] uppercase tracking-[0.1em] text-[#705642]"
              >
                Admin
              </a>
            </div>
          </div>
        </header>

        <section className="mt-10 grid gap-9 sm:mt-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[#cb7631] sm:mb-4 sm:text-[14px]">
              Williamsburg, Brooklyn
            </p>

            <h1
              className="max-w-[680px] text-[49px] leading-[0.94] tracking-[-0.035em] text-[#ead6bb] sm:text-[72px] lg:text-[76px]"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
              }}
            >
              Iced Americano
              <br />
              Index
            </h1>

            <p className="mt-5 max-w-[560px] text-[18px] leading-[1.5] text-[#ccb18d] sm:mt-6 sm:text-[20px]">
              Tracking the price of an iced Americano across the
              neighborhood.
            </p>
          </div>

          <div
            id="about"
            className="justify-self-stretch rounded-[18px] border border-[#4e3825] bg-[#17120d]/95 px-6 py-6 shadow-[0_16px_45px_rgba(0,0,0,0.26)] sm:px-8 sm:py-7"
          >
            <h2
              className="text-[14px] font-semibold uppercase tracking-[0.13em] text-[#e0c29b] sm:text-[16px] sm:tracking-[0.15em]"
              style={{
                fontFamily:
                  '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive',
              }}
            >
              What is an iced Americano?
            </h2>

            <div className="mt-4 h-px w-[190px] bg-[#61462f] sm:w-[205px]" />

            <div className="mt-5 grid grid-cols-[76px_1fr] items-center gap-4 sm:grid-cols-[112px_1fr] sm:gap-7">
              <AmericanoDrawing className="h-[105px] w-[76px] text-[#d6b992] sm:h-[142px] sm:w-[104px]" />

              <div className="text-[15px] leading-[1.6] text-[#cdb18d] sm:text-[17px] sm:leading-[1.65]">
                <p>
                  Espresso shots diluted with cold water and poured
                  over ice.
                </p>

                <p className="mt-2">
                  No milk. No foam. Just coffee, water, and ice.
                </p>
              </div>
            </div>
          </div>
        </section>

        {cheapest && mostExpensive && (
          <section className="mt-9 grid gap-4 sm:mt-10 md:grid-cols-3 md:gap-5">
            <div
              className="
                group relative rounded-[15px] border border-[#76502d]
                bg-[linear-gradient(135deg,#21170f_0%,#18110c_100%)]
                px-6 py-6 sm:px-8 sm:py-7
                shadow-[0_10px_34px_rgba(0,0,0,0.28)]
                transition-all duration-300 ease-out
                hover:-translate-y-1.5
                hover:border-[#b87132]
                hover:shadow-[0_0_0_1px_rgba(190,111,43,0.35),0_18px_42px_rgba(133,69,23,0.28)]
              "
            >
              <div className="flex items-start justify-between">
                <p className="text-[13px] font-bold uppercase tracking-[0.13em] text-[#d68439] sm:text-[14px]">
                  Average
                </p>

                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#9b632f] text-[#c47a35] sm:h-12 sm:w-12">
                  <TrendIcon />
                </div>
              </div>

              <p
                className="mt-2 text-[53px] leading-none tracking-[-0.035em] text-[#ead4b5] sm:text-[58px]"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                ${average.toFixed(2)}
              </p>

              <p className="mt-4 text-[15px] text-[#c4a681] sm:mt-5 sm:text-[16px]">
                Based on {shops.length} locations
              </p>
            </div>

            <div
              className="
                group rounded-[15px] border border-[#4e3927]
                bg-[linear-gradient(135deg,#19120d_0%,#15100c_100%)]
                px-6 py-6 sm:px-8 sm:py-7
                shadow-[0_10px_30px_rgba(0,0,0,0.25)]
                transition-all duration-300 ease-out
                hover:-translate-y-1.5
                hover:border-[#8a5a31]
                hover:shadow-[0_0_0_1px_rgba(150,91,44,0.22),0_18px_38px_rgba(104,57,24,0.22)]
              "
            >
              <div className="flex items-start justify-between">
                <p className="text-[13px] font-bold uppercase tracking-[0.13em] text-[#d68439] sm:text-[14px]">
                  Cheapest
                </p>

                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#80522d] text-[#bc7333] sm:h-12 sm:w-12">
                  <TagIcon />
                </div>
              </div>

              <p
                className="mt-2 text-[53px] leading-none tracking-[-0.035em] text-[#ead4b5] sm:text-[58px]"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                ${cheapest.price.toFixed(2)}
              </p>

              <p className="mt-4 text-[15px] text-[#c4a681] sm:mt-5 sm:text-[16px]">
                {cheapest.name}
              </p>
            </div>

            <div
              className="
                group rounded-[15px] border border-[#4e3927]
                bg-[linear-gradient(135deg,#19120d_0%,#15100c_100%)]
                px-6 py-6 sm:px-8 sm:py-7
                shadow-[0_10px_30px_rgba(0,0,0,0.25)]
                transition-all duration-300 ease-out
                hover:-translate-y-1.5
                hover:border-[#8a5a31]
                hover:shadow-[0_0_0_1px_rgba(150,91,44,0.22),0_18px_38px_rgba(104,57,24,0.22)]
              "
            >
              <div className="flex items-start justify-between">
                <p className="text-[13px] font-bold uppercase tracking-[0.13em] text-[#d68439] sm:text-[14px]">
                  Most Expensive
                </p>

                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#80522d] text-[#bc7333] sm:h-12 sm:w-12">
                  <StarIcon />
                </div>
              </div>

              <p
                className="mt-2 text-[53px] leading-none tracking-[-0.035em] text-[#ead4b5] sm:text-[58px]"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                }}
              >
                ${mostExpensive.price.toFixed(2)}
              </p>

              <p className="mt-4 text-[15px] text-[#c4a681] sm:mt-5 sm:text-[16px]">
                {mostExpensive.name}
              </p>
            </div>
          </section>
        )}

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-[14px] font-bold uppercase tracking-[0.15em] text-[#d07a32]">
                Current Prices
              </h2>

              <p
                className="mt-1 text-[16px] italic text-[#9d7450] sm:text-[17px]"
                style={{
                  fontFamily:
                    '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive',
                }}
              >
                Ranked from lowest to highest
              </p>
            </div>

            <div className="hidden items-center gap-3 pb-1 text-[14px] text-[#946d4a] sm:flex">
              {shops.length} locations tracked
            </div>
          </div>

          <div className="overflow-hidden rounded-[7px] border border-[#30251c] bg-[#100c09]/85">
            <div className="grid grid-cols-[42px_minmax(0,1fr)_80px] border-b border-[#34271d] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#9c7959] sm:grid-cols-[76px_minmax(0,1fr)_170px] sm:px-7 sm:py-4 sm:text-[12px] sm:tracking-[0.13em]">
              <div>#</div>
              <div>Coffee Shop</div>
              <div className="text-right">Price</div>
            </div>

            {sortedShops.map((shop, index) => {
              const formattedDate = formatObservedDate(
                shop.observedDate
              );

              return (
                <div
                  key={shop.id}
                  className="group grid grid-cols-[42px_minmax(0,1fr)_80px] items-center border-b border-[#302319] px-4 py-4 last:border-b-0 transition-colors duration-200 hover:bg-[#17100b] sm:grid-cols-[76px_minmax(0,1fr)_170px] sm:px-7"
                >
                  <div
                    className="text-[16px] italic text-[#af7c4b] sm:text-[22px]"
                    style={{
                      fontFamily:
                        '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive',
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="min-w-0 pr-2">
                    <p
                      className="text-[17px] leading-tight text-[#dfc7a8] sm:text-[22px]"
                      style={{
                        fontFamily:
                          'Georgia, "Times New Roman", serif',
                      }}
                    >
                      {shop.name}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {shop.note && (
                        <span className="text-[11px] italic text-[#9e7048] sm:text-[13px]">
                          {shop.note}
                        </span>
                      )}

                      {formattedDate && (
                        <span className="text-[10px] text-[#69513d] sm:text-[11px]">
                          Checked {formattedDate}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="text-right text-[18px] tracking-[0.02em] text-[#e6cfaf] sm:text-[22px]"
                    style={{
                      fontFamily:
                        'Georgia, "Times New Roman", serif',
                    }}
                  >
                    ${shop.price.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <footer
          id="methodology"
          className="mt-7 flex items-start gap-4 border-t border-[#392a1e] pt-5 text-[#8b684a]"
        >
          <svg
            viewBox="0 0 38 38"
            className="mt-0.5 h-8 w-8 shrink-0"
            fill="none"
          >
            <path
              d="M8 12h17l-2 18H11L8 12Z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M25 16h3a5 5 0 0 1 0 10h-4"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M6 32h23"
              stroke="currentColor"
              strokeWidth="1"
              opacity=".6"
            />
          </svg>

          <p
            className="max-w-[720px] text-[12px] italic leading-[1.55] sm:text-[13px]"
            style={{
              fontFamily:
                '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive',
            }}
          >
            Prices are manually collected and may include or exclude
            sales tax.
            <br />
            Prices and availability may change.
          </p>
        </footer>
      </div>

      {/* STICKY MOBILE CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#4a3323] bg-[#0d0907]/95 px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.35)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <a
            href="/submit"
            className="flex flex-1 items-center justify-center rounded-[10px] border border-[#b87438] bg-[#2c190e] px-5 py-3.5 text-[13px] font-bold uppercase tracking-[0.14em] text-[#e9bc84] shadow-[0_8px_20px_rgba(0,0,0,0.25)] active:scale-[0.99]"
          >
            + Submit a Price
          </a>

          <a
            href="/admin/login"
            className="rounded-[10px] border border-[#3d2b20] bg-[#120d09] px-4 py-3.5 text-[11px] uppercase tracking-[0.1em] text-[#7f624d]"
          >
            Admin
          </a>
        </div>
      </div>
    </main>
  );
}