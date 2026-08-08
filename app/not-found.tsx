import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";

export default function NotFound() {
  return (
    <AppShell>
      <Card>
        <EmptyState
          action={
            <Button asChild variant="secondary">
              <Link href="/">Return home</Link>
            </Button>
          }
          description="The requested page is not available in this clinical support application."
          title="Page not found"
        />
      </Card>
    </AppShell>
  );
}
