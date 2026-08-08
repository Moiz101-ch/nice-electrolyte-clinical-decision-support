import {
  clinicalContextTerms,
  conditionTerms,
  electrolyteTerms,
  medicineDictionary,
  type MedicineEntry,
  type TerminologyEntry,
} from "./dictionaries.ts";
import type {
  CkdStage,
  DeterministicExtraction,
  Electrolyte,
  ExtractedField,
  ExtractedList,
  ExtractionConflict,
  ExtractionEvidence,
  RecognisedMedicine,
} from "./types.ts";

interface Candidate<T> {
  evidence: ExtractionEvidence;
  value: T;
}

interface NumericCandidate {
  evidence: ExtractionEvidence;
  rawUnit: string | null;
  value: number;
}

const electrolyteUnitPattern = String.raw`((?:m?mol|mEq)(?:\s*(?:\/|\u00b7)\s*[A-Za-z0-9]+|\s+[A-Za-z]+[-\u2212]?\d*)?)`;
const egfrUnitPattern = String.raw`(mL\s*\/\s*min\s*\/\s*1\.73\s*m(?:2|\^2|\u00b2))`;

export function extractClinicalNote(noteText: string): DeterministicExtraction {
  const conflicts: ExtractionConflict[] = [];
  const measurements = extractElectrolyteMeasurements(noteText);
  const baselineMeasurements = extractBaselineMeasurements(noteText);
  const egfrMeasurements = extractEgfrMeasurements(noteText);

  const electrolyteCandidates = [
    ...measurements.map((measurement) => ({
      evidence: measurement.evidence,
      value: measurement.electrolyte,
    })),
    ...findTerminologyCandidates(noteText, electrolyteTerms),
  ];

  const extraction: DeterministicExtraction = {
    age: resolveField("age", extractAges(noteText), conflicts, String),
    baselineUnit: resolveUnit("baselineUnit", baselineMeasurements, conflicts),
    baselineValue: resolveField(
      "baselineValue",
      baselineMeasurements.map(({ evidence, value }) => ({ evidence, value })),
      conflicts,
      String,
    ),
    ckdStage: resolveField("ckdStage", extractCkdStages(noteText), conflicts, String),
    clinicalContext: resolveField(
      "clinicalContext",
      findTerminologyCandidates(noteText, clinicalContextTerms),
      conflicts,
      String,
    ),
    conflicts,
    dialysis: resolveField("dialysis", extractDialysis(noteText), conflicts, String),
    egfr: resolveField(
      "egfr",
      egfrMeasurements.map(({ evidence, value }) => ({ evidence, value })),
      conflicts,
      String,
    ),
    egfrUnit: resolveEgfrUnit(egfrMeasurements, conflicts),
    electrolyte: resolveField("electrolyte", electrolyteCandidates, conflicts, String),
    ivFluidContainsSaline: resolveField(
      "ivFluidContainsSaline",
      extractSalineStatus(noteText),
      conflicts,
      String,
    ),
    onIvFluids: resolveField("onIvFluids", extractIvFluidStatus(noteText), conflicts, String),
    raasAntagonistUse: resolveField(
      "raasAntagonistUse",
      extractRaasAntagonistUse(noteText),
      conflicts,
      String,
    ),
    recognisedMedicines: extractMedicines(noteText),
    statedCondition: resolveField(
      "statedCondition",
      findTerminologyCandidates(noteText, conditionTerms),
      conflicts,
      String,
    ),
    unit: resolveUnit("unit", measurements, conflicts),
    value: resolveField(
      "value",
      measurements.map(({ evidence, value }) => ({ evidence, value })),
      conflicts,
      String,
    ),
  };

  return extraction;
}

function extractElectrolyteMeasurements(
  noteText: string,
): Array<NumericCandidate & { electrolyte: Electrolyte }> {
  return electrolyteTerms.flatMap((entry) => {
    const aliases = entry.aliases.map(escapeRegularExpression).join("|");
    const pattern = new RegExp(
      String.raw`\b(?:${aliases})\b\s*(?:is|was|=|:)?\s*(-?\d+(?:[.,]\d+)?)(?:\s*${electrolyteUnitPattern})?`,
      "giu",
    );

    return Array.from(noteText.matchAll(pattern)).flatMap((match) => {
      const value = parseNumber(match[1]);

      if (value === null || match.index === undefined) {
        return [];
      }

      return [
        {
          electrolyte: entry.value,
          evidence: createEvidence(noteText, match.index, match[0].length),
          rawUnit: match[2] ?? null,
          value,
        },
      ];
    });
  });
}

function extractBaselineMeasurements(noteText: string): NumericCandidate[] {
  const pattern = new RegExp(
    String.raw`\bbaseline(?:\s+(?:sodium|potassium|adjusted\s+calcium|calcium|magnesium))?\s*(?:is|was|=|:)?\s*(-?\d+(?:[.,]\d+)?)(?:\s*${electrolyteUnitPattern})?`,
    "giu",
  );

  return Array.from(noteText.matchAll(pattern)).flatMap((match) => {
    const value = parseNumber(match[1]);

    if (value === null || match.index === undefined) {
      return [];
    }

    return [
      {
        evidence: createEvidence(noteText, match.index, match[0].length),
        rawUnit: match[2] ?? null,
        value,
      },
    ];
  });
}

function extractEgfrMeasurements(noteText: string): NumericCandidate[] {
  const pattern = new RegExp(
    String.raw`\beGFR\s*(?:is|was|=|:)?\s*(-?\d+(?:[.,]\d+)?)(?:\s*${egfrUnitPattern})?`,
    "giu",
  );

  return Array.from(noteText.matchAll(pattern)).flatMap((match) => {
    const value = parseNumber(match[1]);

    if (value === null || match.index === undefined) {
      return [];
    }

    return [
      {
        evidence: createEvidence(noteText, match.index, match[0].length),
        rawUnit: match[2] ?? null,
        value,
      },
    ];
  });
}

function extractAges(noteText: string): Candidate<number>[] {
  const pattern = /\b(\d{1,3})\s*(?:-\s*)?(?:year[- ]old|years? old|yo)\b/giu;

  return Array.from(noteText.matchAll(pattern)).flatMap((match) => {
    const value = parseNumber(match[1]);

    if (value === null || value > 130 || match.index === undefined) {
      return [];
    }

    return [{ evidence: createEvidence(noteText, match.index, match[0].length), value }];
  });
}

function extractCkdStages(noteText: string): Candidate<CkdStage>[] {
  const explicitStages = findMatches(
    noteText,
    /\bCKD\s*(?:stage)?\s*[:=]?\s*(none|[1-5](?:a|b)?|g[1-5](?:a|b)?)\b/giu,
  ).flatMap((evidence) => {
    const stageMatch = /(?:none|[1-5](?:a|b)?|g[1-5](?:a|b)?)/iu.exec(evidence.text);
    const value = normaliseCkdStage(stageMatch?.[0]);

    return value === null ? [] : [{ evidence, value }];
  });
  const noCkdMatches: Candidate<CkdStage>[] = findMatches(noteText, /\bno\s+CKD\b/giu).map(
    (evidence) => ({ evidence, value: "none" }),
  );

  return [...explicitStages, ...noCkdMatches];
}

function extractIvFluidStatus(noteText: string): Candidate<boolean>[] {
  return extractBooleanCandidates(noteText, {
    no: [
      /\bIV\s*fluids?\s*:\s*no\b/giu,
      /\b(?:not on|not receiving|no)\s+(?:an?\s+)?IV(?:[- ]?fluids?)?\b/giu,
    ],
    yes: [
      /\bIV\s*fluids?\s*:\s*yes\b/giu,
      /\b(?:on|receiving|given)\s+(?:an?\s+)?IV(?:[- ]?fluids?)?\b/giu,
    ],
  });
}

function extractSalineStatus(noteText: string): Candidate<boolean>[] {
  return extractBooleanCandidates(noteText, {
    no: [/\b(?:without|no)\s+(?:0\.9%\s*(?:sodium chloride|saline)|normal saline)\b/giu],
    yes: [/\b(?:0\.9%\s*(?:sodium chloride|saline)|normal saline)\b/giu],
  });
}

function extractDialysis(noteText: string): Candidate<boolean>[] {
  return extractBooleanCandidates(noteText, {
    no: [/\bdialysis\s*:\s*no\b/giu, /\b(?:not on|not receiving|no)\s+(?:haemo)?dialysis\b/giu],
    yes: [/\bdialysis\s*:\s*yes\b/giu, /\b(?:on|receiving)\s+(?:haemo)?dialysis\b/giu],
  });
}

function extractRaasAntagonistUse(noteText: string): Candidate<boolean>[] {
  const aliases = medicineDictionary
    .filter((medicine) => medicine.category === "raas-antagonist")
    .flatMap((medicine) => medicine.aliases)
    .map(escapeRegularExpression)
    .join("|");
  const pattern = new RegExp(`\\b(?:${aliases})\\b`, "giu");
  const candidates: Candidate<boolean>[] = [];

  for (const match of noteText.matchAll(pattern)) {
    if (match.index === undefined) {
      continue;
    }

    const evidence = createEvidence(noteText, match.index, match[0].length);
    const contextBefore = noteText.slice(Math.max(0, match.index - 32), match.index);
    const contextAfter = noteText.slice(
      match.index + match[0].length,
      match.index + match[0].length + 40,
    );

    if (isNegated(contextBefore, contextAfter)) {
      candidates.push({ evidence, value: false });
      continue;
    }

    if (isExplicitlyActive(contextBefore, contextAfter)) {
      candidates.push({ evidence, value: true });
    }
  }

  return candidates;
}

function extractMedicines(noteText: string): ExtractedList<RecognisedMedicine> {
  const matches = medicineDictionary.flatMap((entry) => extractMedicineEntry(noteText, entry));
  const values = uniqueBy(
    matches.map((match) => match.value),
    (medicine) => `${medicine.category}:${medicine.name}:${medicine.negated}`,
  );

  return {
    evidence: matches.map((match) => match.evidence),
    status: values.length === 0 ? "missing" : "confirmed",
    values,
  };
}

function extractMedicineEntry(
  noteText: string,
  entry: MedicineEntry,
): Candidate<RecognisedMedicine>[] {
  return entry.aliases.flatMap((alias) => {
    const pattern = new RegExp(`\\b${escapeRegularExpression(alias)}\\b`, "giu");

    return Array.from(noteText.matchAll(pattern)).flatMap((match) => {
      if (match.index === undefined) {
        return [];
      }

      const contextBefore = noteText.slice(Math.max(0, match.index - 32), match.index);
      const contextAfter = noteText.slice(
        match.index + match[0].length,
        match.index + match[0].length + 40,
      );

      return [
        {
          evidence: createEvidence(noteText, match.index, match[0].length),
          value: {
            category: entry.category,
            name: entry.name,
            negated: isNegated(contextBefore, contextAfter),
          },
        },
      ];
    });
  });
}

function extractBooleanCandidates(
  noteText: string,
  patterns: { no: RegExp[]; yes: RegExp[] },
): Candidate<boolean>[] {
  const negativeMatches: Candidate<boolean>[] = patterns.no.flatMap((pattern) =>
    findMatches(noteText, pattern).map((evidence) => ({ evidence, value: false })),
  );
  const positiveMatches: Candidate<boolean>[] = patterns.yes
    .flatMap((pattern) =>
      findMatches(noteText, pattern).map((evidence) => ({ evidence, value: true })),
    )
    .filter(
      (positive) =>
        !negativeMatches.some(
          (negative) =>
            positive.evidence.start >= negative.evidence.start &&
            positive.evidence.end <= negative.evidence.end,
        ),
    );

  return [...positiveMatches, ...negativeMatches];
}

function findTerminologyCandidates<T>(
  noteText: string,
  entries: TerminologyEntry<T>[],
): Candidate<T>[] {
  return entries.flatMap((entry) =>
    entry.aliases.flatMap((alias) => {
      const pattern = new RegExp(`\\b${escapeRegularExpression(alias)}\\b`, "giu");

      return findMatches(noteText, pattern).map((evidence) => ({ evidence, value: entry.value }));
    }),
  );
}

function resolveField<T>(
  field: string,
  candidates: Candidate<T>[],
  conflicts: ExtractionConflict[],
  key: (value: T) => string,
): ExtractedField<T> {
  const values = uniqueBy(
    candidates.map((candidate) => candidate.value),
    key,
  );
  const evidence = candidates.map((candidate) => candidate.evidence);

  if (values.length === 0) {
    return { candidates: [], evidence: [], status: "missing", value: null };
  }

  if (values.length === 1) {
    return { candidates: values, evidence, status: "confirmed", value: values[0] ?? null };
  }

  conflicts.push({ candidates: values.map(key), evidence, field });

  return { candidates: values, evidence, status: "conflicting", value: null };
}

function resolveUnit(
  field: string,
  candidates: NumericCandidate[],
  conflicts: ExtractionConflict[],
): ExtractedField<"mmol/L"> {
  return resolveExpectedUnit(field, candidates, conflicts, normaliseElectrolyteUnit, "mmol/L");
}

function resolveEgfrUnit(
  candidates: NumericCandidate[],
  conflicts: ExtractionConflict[],
): ExtractedField<"mL/min/1.73m2"> {
  return resolveExpectedUnit("egfrUnit", candidates, conflicts, normaliseEgfrUnit, "mL/min/1.73m2");
}

function resolveExpectedUnit<T extends string>(
  field: string,
  candidates: NumericCandidate[],
  conflicts: ExtractionConflict[],
  normalise: (value: string) => T | null,
  expectedUnit: T,
): ExtractedField<T> {
  const unitCandidates = candidates.filter((candidate) => candidate.rawUnit !== null);
  const evidence = unitCandidates.map((candidate) => candidate.evidence);
  const normalisedUnits = uniqueBy(
    unitCandidates.flatMap((candidate) => {
      const unit = normalise(candidate.rawUnit ?? "");
      return unit === null ? [] : [unit];
    }),
    String,
  );
  const containsUnsupportedUnit = unitCandidates.some(
    (candidate) => normalise(candidate.rawUnit ?? "") === null,
  );

  if (unitCandidates.length === 0) {
    return { candidates: [], evidence: [], status: "missing", value: null };
  }

  if (
    containsUnsupportedUnit ||
    normalisedUnits.length !== 1 ||
    normalisedUnits[0] !== expectedUnit
  ) {
    if (normalisedUnits.length > 1) {
      conflicts.push({ candidates: normalisedUnits, evidence, field });
      return { candidates: normalisedUnits, evidence, status: "conflicting", value: null };
    }

    return { candidates: normalisedUnits, evidence, status: "uncertain", value: null };
  }

  return { candidates: normalisedUnits, evidence, status: "confirmed", value: expectedUnit };
}

function findMatches(noteText: string, pattern: RegExp): ExtractionEvidence[] {
  return Array.from(noteText.matchAll(pattern)).flatMap((match) => {
    return match.index === undefined
      ? []
      : [createEvidence(noteText, match.index, match[0].length)];
  });
}

function createEvidence(noteText: string, start: number, length: number): ExtractionEvidence {
  return { end: start + length, start, text: noteText.slice(start, start + length) };
}

function normaliseCkdStage(value: string | undefined): CkdStage | null {
  const stage = value?.toLowerCase().replace(/^g/, "");

  return stage === "none" ||
    stage === "1" ||
    stage === "2" ||
    stage === "3a" ||
    stage === "3b" ||
    stage === "4" ||
    stage === "5"
    ? stage
    : null;
}

function normaliseElectrolyteUnit(value: string): "mmol/L" | null {
  const compact = value
    .toLowerCase()
    .replace(/[\s\u00b7]/g, "")
    .replaceAll("\u2212", "-");

  return /^mmol(?:\/l|l-?1)$/.test(compact) ? "mmol/L" : null;
}

function normaliseEgfrUnit(value: string): "mL/min/1.73m2" | null {
  const compact = value
    .toLowerCase()
    .replace(/[\s\u00b7]/g, "")
    .replaceAll("\u00b2", "2");

  return compact === "ml/min/1.73m2" || compact === "ml/min/1.73m^2" ? "mL/min/1.73m2" : null;
}

function isNegated(contextBefore: string, contextAfter: string): boolean {
  return (
    /\b(?:not taking|not on|stopped|discontinued|withheld|ceased|without)\s*$/iu.test(
      contextBefore,
    ) ||
    /^\s*(?:was|has been|had been)?\s*(?:stopped|discontinued|withheld|ceased)\b/iu.test(
      contextAfter,
    )
  );
}

function isExplicitlyActive(contextBefore: string, contextAfter: string): boolean {
  return (
    /\b(?:taking|on|started|starting|commenced|prescribed|increased)\s*$/iu.test(contextBefore) ||
    /^\s*(?:is|was)?\s*(?:started|increased|continued)\b/iu.test(contextAfter)
  );
}

function parseNumber(value: string | undefined): number | null {
  if (value === undefined) {
    return null;
  }

  const parsed = Number(value.replace(",", "."));

  return Number.isFinite(parsed) ? parsed : null;
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uniqueBy<T>(values: T[], key: (value: T) => string): T[] {
  const uniqueValues = new Map<string, T>();

  for (const value of values) {
    uniqueValues.set(key(value), value);
  }

  return [...uniqueValues.values()];
}
