"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  symbol: string;
};

const cashNavItems: NavItem[] = [
  {
    href: "/",
    label: "ホーム",
    shortLabel: "HOME",
    symbol: "♠",
  },
  {
    href: "/new-hand",
    label: "新規ハンド",
    shortLabel: "NEW",
    symbol: "♥",
  },
  {
    href: "/history",
    label: "履歴",
    shortLabel: "HISTORY",
    symbol: "♣",
  },
  {
    href: "/review",
    label: "AIレビュー",
    shortLabel: "AI",
    symbol: "♦",
  },
];

const tournamentNavItems: NavItem[] = [
  {
    href: "/",
    label: "ホーム",
    shortLabel: "HOME",
    symbol: "♠",
  },
  {
    href: "/tournament/new-hand?start=new",
    label: "新規ハンド",
    shortLabel: "NEW",
    symbol: "♥",
  },
  {
    href: "/tournament/history",
    label: "履歴",
    shortLabel: "HISTORY",
    symbol: "♣",
  },
  {
    href: "/tournament/review",
    label: "AIレビュー",
    shortLabel: "AI",
    symbol: "♦",
  },
];

function getPathOnly(href: string) {
  return href.split("?")[0];
}

function isActivePath(pathname: string, href: string) {
  const targetPath = getPathOnly(href);

  if (targetPath === "/") {
    return pathname === "/";
  }

  if (targetPath === "/tournament") {
    return pathname === "/tournament";
  }

  return (
    pathname === targetPath ||
    pathname.startsWith(`${targetPath}/`)
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const isTournament = pathname.startsWith("/tournament");
  const navItems = isTournament
    ? tournamentNavItems
    : cashNavItems;

  return (
    <>
      <div className="h-24" />

      <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-[26px] border border-emerald-700/60 bg-[#06110d]/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl">
          {navItems.map((item) => {
            const active = isActivePath(
              pathname,
              item.href,
            );

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`relative flex min-h-16 flex-col items-center justify-center rounded-2xl px-1 py-2 transition active:scale-95 ${
                  active
                    ? "bg-gradient-to-b from-emerald-300 to-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/50"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                {active && (
                  <span className="absolute -top-1 h-1.5 w-8 rounded-full bg-amber-300" />
                )}

                <span
                  className={`text-2xl font-black ${
                    item.symbol === "♥" ||
                    item.symbol === "♦"
                      ? active
                        ? "text-red-700"
                        : "text-red-400"
                      : ""
                  }`}
                >
                  {item.symbol}
                </span>

                <span className="mt-1 text-[10px] font-black tracking-wide">
                  {item.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
