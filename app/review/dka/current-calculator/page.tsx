import { ArrowLeft } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { JbdsCalculatorReview } from "@/components/pathways/dka/jbds-calculator-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "JBDS DKA technical calculator" };

export default function CurrentDkaCalculatorPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="danger">Not for patient care</Badge>
              <Badge variant="info">JBDS 02 March 2023</Badge>
            </div>
            <h1 className="text-foreground mt-4 text-2xl font-bold">Connected DKA calculator</h1>
          </div>
          <Button asChild variant="secondary">
            <Link href={"/assessment/new" as Route}>
              <ArrowLeft aria-hidden="true" /> All workflows
            </Link>
          </Button>
        </header>
        <JbdsCalculatorReview />
      </div>
    </AppShell>
  );
}
