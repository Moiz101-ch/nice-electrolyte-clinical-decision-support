import { AppShell } from "@/components/layout/app-shell";
import { LoadingState } from "@/components/ui/states";

export default function Loading() {
  return (
    <AppShell>
      <LoadingState />
    </AppShell>
  );
}
