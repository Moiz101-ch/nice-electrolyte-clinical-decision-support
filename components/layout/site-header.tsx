import { Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Brand } from "./brand";
import { MobileNavigation } from "./mobile-navigation";

export function SiteHeader() {
  return (
    <header className="border-border bg-surface/95 sticky top-0 z-40 h-[4.5rem] border-b backdrop-blur-sm">
      <div className="flex h-full items-center gap-2 px-3 sm:px-5 lg:px-7">
        <div className="lg:hidden">
          <MobileNavigation />
        </div>
        <Brand />
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <Link
            className="text-muted-strong hover:bg-surface-subtle hover:text-foreground hidden min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold sm:inline-flex"
            href="/#safety-notice"
          >
            <ShieldCheck aria-hidden="true" className="size-4" />
            Safety
          </Link>
          <Badge className="hidden md:inline-flex" variant="review">
            Educational prototype
          </Badge>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/assessment/new">
              <Plus aria-hidden="true" />
              New assessment
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
