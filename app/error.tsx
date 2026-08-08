"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/states";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <AppShell>
      <Card>
        <ErrorState
          action={
            <Button onClick={reset} type="button">
              Try again
            </Button>
          }
          description="The workspace could not be loaded. No assessment information was changed."
          title="Unable to load the workspace"
        />
      </Card>
    </AppShell>
  );
}
