import Link from "next/link";

import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { href: "/", label: "Playground" },
  { href: "/rules", label: "Rules" },
  { href: "/docs", label: "Docs" },
];

/**
 * Site header.
 *
 * A server component apart from the toggle, so the navigation is in the initial
 * HTML and works with scripting off.
 */
export default function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-3">
        <Link href="/" className="font-semibold tracking-tight text-ink">
          soroban-lint
        </Link>
        <nav aria-label="Main">
          <ul className="flex items-center gap-4 text-sm">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-ink-muted hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-ink-subtle">Runs locally in your browser</span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}