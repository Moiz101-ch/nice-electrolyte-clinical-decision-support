import { LoadingState } from "@/components/ui/states";

export default function Loading() {
  return (
    <div className="bg-background min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-[90rem]">
        <LoadingState />
      </div>
    </div>
  );
}
