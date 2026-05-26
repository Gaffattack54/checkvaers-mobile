"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FilePlus2, History, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  Icon: typeof Search;
};

const TABS: Tab[] = [
  { href: "/check", label: "Check", Icon: Search },
  { href: "/learn", label: "Learn", Icon: BookOpen },
  { href: "/report", label: "Report", Icon: FilePlus2 },
  { href: "/history", label: "History", Icon: History },
];

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-safe"
    >
      <ul className="mx-auto flex w-full max-w-md items-stretch">
        {TABS.map(({ href, label, Icon }) => {
          // Active when on this tab's route or any nested route under it.
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex min-h-tap flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "text-brand-cyan"
                    : "text-muted-foreground hover:text-brand-navy"
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6 transition-transform",
                    isActive && "scale-110"
                  )}
                  aria-hidden="true"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
