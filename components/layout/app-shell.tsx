import type { ReactNode } from "react";

import { Alert } from "@/components/ui/alert";

import { NavigationContent } from "./navigation";
import { SiteHeader } from "./site-header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background min-h-screen">
      <a
        className="bg-foreground fixed top-3 left-3 z-[100] -translate-y-20 rounded-md px-4 py-2 text-sm font-semibold text-white transition-transform focus:translate-y-0"
        href="#main-content"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <div className="flex min-h-[calc(100vh-4.5rem)]">
        <aside className="border-border bg-surface sticky top-[4.5rem] hidden h-[calc(100vh-4.5rem)] w-64 shrink-0 flex-col border-r lg:flex">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <NavigationContent />
          </div>
          <div className="p-4 pt-0">
            <Alert className="p-3 text-xs" title="Pathways inactive" variant="warning">
              No clinical pathway is currently available for assessment or management output.
            </Alert>
          </div>
        </aside>
        <main className="min-w-0 flex-1" id="main-content" tabIndex={-1}>
          <div className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
