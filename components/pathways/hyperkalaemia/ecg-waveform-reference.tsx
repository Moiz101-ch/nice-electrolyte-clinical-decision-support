import type { HyperkalaemiaEcgChange } from "@/src/clinical/pathways/hyperkalaemia";

type IllustratedEcgChange = Exclude<
  HyperkalaemiaEcgChange,
  "none-confirmed" | "unable-to-determine"
>;

const waveformPaths = {
  bradycardia:
    "M2 30 L12 30 C15 30 17 25 20 25 C23 25 25 30 28 30 L34 30 L38 35 L42 8 L46 44 L50 30 L60 30 C65 30 68 18 75 18 C82 18 85 30 90 30 L124 30 C127 30 129 25 132 25 C135 25 137 30 140 30 L146 30 L150 35 L154 8 L158 44 L162 30 L178 30",
  "broad-qrs":
    "M2 30 L18 30 C21 30 23 25 26 25 C29 25 31 30 34 30 L44 30 C49 30 51 10 59 10 L82 44 L104 17 L116 30 L132 30 C138 30 142 21 148 21 C154 21 158 30 164 30 L178 30",
  "flat-absent-p-waves":
    "M2 30 L42 30 L46 35 L50 8 L54 44 L58 30 L82 30 C88 30 92 18 100 18 C108 18 112 30 118 30 L178 30",
  "peaked-t-waves":
    "M2 30 L18 30 C21 30 23 25 26 25 C29 25 31 30 34 30 L43 30 L47 35 L51 8 L55 44 L59 30 L78 30 C84 30 88 4 96 4 C104 4 108 30 114 30 L178 30",
  "sine-wave": "M2 30 C14 3 30 3 42 30 S70 57 84 30 S112 3 126 30 S154 57 178 30",
  "ventricular-tachycardia":
    "M2 30 L8 30 L14 8 L28 46 L42 10 L56 44 L70 8 L84 46 L98 10 L112 44 L126 8 L140 46 L154 10 L168 44 L178 30",
} as const satisfies Record<IllustratedEcgChange, string>;

interface HyperkalaemiaEcgWaveformProps {
  variant: IllustratedEcgChange;
}

export function HyperkalaemiaEcgWaveform({ variant }: HyperkalaemiaEcgWaveformProps) {
  return (
    <span
      className="border-border bg-surface-subtle text-danger block h-14 w-full overflow-hidden rounded-sm border px-1"
      data-ecg-waveform={variant}
      data-testid={`ecg-waveform-${variant}`}
    >
      <svg
        aria-hidden="true"
        className="h-full w-full"
        focusable="false"
        preserveAspectRatio="none"
        viewBox="0 0 180 56"
      >
        <path d="M2 30 H178" fill="none" opacity="0.18" stroke="currentColor" strokeWidth="1" />
        <path
          d={waveformPaths[variant]}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  );
}
