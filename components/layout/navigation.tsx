"use client";

import {
  CircleHelp,
  ClipboardPlus,
  History,
  Home,
  Layers3,
  LibraryBig,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface NavigationItem {
  activePath?: string;
  href?: Route;
  icon: LucideIcon;
  label: string;
}

interface NavigationSection {
  items: NavigationItem[];
  label?: string;
}

const navigationSections: NavigationSection[] = [
  {
    items: [{ activePath: "/", href: "/", icon: Home, label: "Home" }],
  },
  {
    label: "Assessment",
    items: [
      {
        activePath: "/assessment/new",
        href: "/assessment/new",
        icon: ClipboardPlus,
        label: "New assessment",
      },
      { icon: History, label: "My assessments" },
    ],
  },
  {
    label: "Evidence & resources",
    items: [
      { href: "/#nice-coverage", icon: LibraryBig, label: "NICE evidence library" },
      { icon: Layers3, label: "Additional resources" },
    ],
  },
  {
    label: "About",
    items: [
      { icon: CircleHelp, label: "About this app" },
      { href: "/#safety-notice", icon: ShieldCheck, label: "Safety & disclaimer" },
    ],
  },
];

function NavigationItem({
  active = false,
  href,
  icon: Icon,
  label,
}: NavigationItem & { active?: boolean }) {
  const className = cn(
    "flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
    active && "bg-info-subtle text-primary shadow-[inset_3px_0_0_var(--color-primary)]",
    !active && href && "text-muted-strong hover:bg-surface-subtle hover:text-foreground",
    !href && "cursor-not-allowed text-muted/60",
  );

  const content = (
    <>
      <Icon aria-hidden="true" className="size-[18px] shrink-0" strokeWidth={1.8} />
      <span className="min-w-0 truncate">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link aria-current={active ? "page" : undefined} className={className} href={href}>
        {content}
      </Link>
    );
  }

  return (
    <span aria-disabled="true" className={className} title="Not available in this project stage">
      {content}
    </span>
  );
}

export function NavigationContent() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="space-y-6">
      {navigationSections.map((section, sectionIndex) => (
        <div key={section.label ?? `primary-${sectionIndex}`}>
          {section.label ? (
            <p className="text-muted mb-2 px-3 text-[11px] font-bold uppercase">{section.label}</p>
          ) : null}
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.label}>
                <NavigationItem {...item} active={item.activePath === pathname} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
