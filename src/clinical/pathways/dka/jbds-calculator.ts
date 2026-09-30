export const JBDS_DKA_SOURCE_ID = "JBDS-02-DKA-MARCH-2023";

export interface JbdsDkaInput {
  readonly ageYears: number | null;
  readonly adultTeamFor16To17: boolean | null;
  readonly knownDiabetes: boolean | null;
  readonly diagnosticGlucose: number | null;
  readonly diagnosticKetones: number | null;
  readonly urineKetonesPlus: number | null;
  readonly diagnosticPh: number | null;
  readonly diagnosticBicarbonate: number | null;
  readonly weightKg: number | null;
  readonly systolicBp: number | null;
  readonly repeatSystolicBp: number | null;
  readonly potassium: number | null;
  readonly ivAccess: boolean | null;
  readonly fluidsStarted: boolean | null;
  readonly pregnant: boolean | null;
  readonly heartFailure: boolean | null;
  readonly kidneyFailure: boolean | null;
  readonly elderly: boolean | null;
  readonly pulse: number | null;
  readonly gcs: number | null;
  readonly oxygenSaturation: number | null;
  readonly normalOxygenBaseline: boolean | null;
  readonly anionGap: number | null;
  readonly takesLongActingInsulin: boolean | null;
  readonly currentGlucose: number | null;
  readonly previousGlucose: number | null;
  readonly currentKetones: number | null;
  readonly previousKetones: number | null;
  readonly currentPh: number | null;
  readonly currentBicarbonate: number | null;
  readonly previousBicarbonate: number | null;
  readonly intervalMinutes: number | null;
  readonly urineOutputMlPerHour: number | null;
  readonly eatingAndDrinking: boolean | null;
  readonly scPlanConfirmed: boolean | null;
  readonly scShortActingGiven: boolean | null;
  readonly overlapMinutes: number | null;
}

interface NumericConstraint {
  readonly integer?: boolean;
  readonly maximum: number;
  readonly minimum: number;
  readonly minimumExclusive?: boolean;
}

interface JbdsInputIssue {
  readonly message: string;
  readonly path: string;
}

type NumericInputKey = {
  [Key in keyof JbdsDkaInput]: JbdsDkaInput[Key] extends number | null ? Key : never;
}[keyof JbdsDkaInput];

const numericConstraints: Record<NumericInputKey, NumericConstraint> = {
  ageYears: { maximum: 120, minimum: 0 },
  diagnosticGlucose: { maximum: 100, minimum: 0 },
  diagnosticKetones: { maximum: 20, minimum: 0 },
  urineKetonesPlus: { maximum: 4, minimum: 0 },
  diagnosticPh: { maximum: 8, minimum: 6 },
  diagnosticBicarbonate: { maximum: 60, minimum: 0 },
  weightKg: { maximum: 500, minimum: 1 },
  systolicBp: { maximum: 300, minimum: 0 },
  repeatSystolicBp: { maximum: 300, minimum: 0 },
  potassium: { maximum: 15, minimum: 0 },
  pulse: { maximum: 250, minimum: 0 },
  gcs: { integer: true, maximum: 15, minimum: 3 },
  oxygenSaturation: { maximum: 100, minimum: 0 },
  anionGap: { maximum: 60, minimum: 0 },
  currentGlucose: { maximum: 100, minimum: 0 },
  previousGlucose: { maximum: 100, minimum: 0 },
  currentKetones: { maximum: 20, minimum: 0 },
  previousKetones: { maximum: 20, minimum: 0 },
  currentPh: { maximum: 8, minimum: 6 },
  currentBicarbonate: { maximum: 60, minimum: 0 },
  previousBicarbonate: { maximum: 60, minimum: 0 },
  intervalMinutes: { maximum: 1440, minimum: 0, minimumExclusive: true },
  urineOutputMlPerHour: { maximum: 2000, minimum: 0 },
  overlapMinutes: { maximum: 1440, minimum: 0 },
};

const booleanKeys = [
  "adultTeamFor16To17",
  "knownDiabetes",
  "ivAccess",
  "fluidsStarted",
  "pregnant",
  "heartFailure",
  "kidneyFailure",
  "elderly",
  "normalOxygenBaseline",
  "takesLongActingInsulin",
  "eatingAndDrinking",
  "scPlanConfirmed",
  "scShortActingGiven",
] as const satisfies readonly {
  [Key in keyof JbdsDkaInput]: JbdsDkaInput[Key] extends boolean | null ? Key : never;
}[keyof JbdsDkaInput][];

const allowedInputKeys = new Set<string>([...Object.keys(numericConstraints), ...booleanKeys]);

function parseJbdsDkaInput(
  input: unknown,
):
  | { readonly data: JbdsDkaInput; readonly success: true }
  | { readonly issues: readonly JbdsInputIssue[]; readonly success: false } {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return {
      issues: [{ path: "root", message: "Expected a DKA calculator input object." }],
      success: false,
    };
  }

  const record = input as Record<string, unknown>;
  const issues: JbdsInputIssue[] = [];

  for (const key of Object.keys(record)) {
    if (!allowedInputKeys.has(key)) {
      issues.push({ path: key, message: "Unexpected input field." });
    }
  }

  for (const [key, constraint] of Object.entries(numericConstraints)) {
    const value = record[key];
    if (value === null) continue;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      issues.push({ path: key, message: "Expected a finite number or null." });
      continue;
    }
    if (
      value > constraint.maximum ||
      (constraint.minimumExclusive ? value <= constraint.minimum : value < constraint.minimum)
    ) {
      issues.push({ path: key, message: "Measurement is outside the accepted range." });
    } else if (constraint.integer && !Number.isInteger(value)) {
      issues.push({ path: key, message: "Expected a whole number." });
    }
  }

  for (const key of booleanKeys) {
    const value = record[key];
    if (value !== null && typeof value !== "boolean") {
      issues.push({ path: key, message: "Expected yes, no, or unanswered." });
    }
  }

  return issues.length > 0
    ? { issues, success: false }
    : { data: record as unknown as JbdsDkaInput, success: true };
}

export type JbdsStageId = "diagnosis" | "risk" | "fluids" | "insulin" | "monitoring" | "transition";
export type JbdsStageStatus = "complete" | "needs-input" | "review" | "not-applicable";

export interface JbdsSourceReference {
  readonly location: string;
  readonly sourceId: typeof JBDS_DKA_SOURCE_ID;
}

export interface JbdsStage {
  readonly id: JbdsStageId;
  readonly title: string;
  readonly status: JbdsStageStatus;
  readonly summary: string;
  readonly details: readonly string[];
  readonly metrics?: readonly (readonly [string, string])[];
  readonly sourceReferences: readonly JbdsSourceReference[];
}

export interface JbdsDkaEvaluation {
  readonly valid: boolean;
  readonly issues: readonly { readonly path: string; readonly message: string }[];
  readonly stages: readonly JbdsStage[];
  readonly diagnosis: boolean | null;
  readonly resolved: boolean | null;
  readonly initialInsulinUnitsPerHour: number | null;
  readonly reducedInsulinUnitsPerHour: number | null;
  readonly ketoneFallPerHour: number | null;
}

export const emptyJbdsDkaInput: JbdsDkaInput = {
  ageYears: null,
  adultTeamFor16To17: null,
  knownDiabetes: null,
  diagnosticGlucose: null,
  diagnosticKetones: null,
  urineKetonesPlus: null,
  diagnosticPh: null,
  diagnosticBicarbonate: null,
  weightKg: null,
  systolicBp: null,
  repeatSystolicBp: null,
  potassium: null,
  ivAccess: null,
  fluidsStarted: null,
  pregnant: null,
  heartFailure: null,
  kidneyFailure: null,
  elderly: null,
  pulse: null,
  gcs: null,
  oxygenSaturation: null,
  normalOxygenBaseline: null,
  anionGap: null,
  takesLongActingInsulin: null,
  currentGlucose: null,
  previousGlucose: null,
  currentKetones: null,
  previousKetones: null,
  currentPh: null,
  currentBicarbonate: null,
  previousBicarbonate: null,
  intervalMinutes: null,
  urineOutputMlPerHour: null,
  eatingAndDrinking: null,
  scPlanConfirmed: null,
  scShortActingGiven: null,
  overlapMinutes: null,
};

const titles: readonly [JbdsStageId, string][] = [
  ["diagnosis", "Diagnosis"],
  ["risk", "Risk review"],
  ["fluids", "Fluids and potassium"],
  ["insulin", "Insulin and glucose"],
  ["monitoring", "Response monitoring"],
  ["transition", "Resolution and transition"],
];

const sourceReference = (location: string): JbdsSourceReference =>
  Object.freeze({ location, sourceId: JBDS_DKA_SOURCE_ID });

export const JBDS_DKA_STAGE_SOURCE_REFERENCES: Readonly<
  Record<JbdsStageId, readonly JbdsSourceReference[]>
> = Object.freeze({
  diagnosis: Object.freeze([sourceReference("Full guideline section 3, PDF page 10")]),
  risk: Object.freeze([sourceReference("Full guideline severe DKA criteria, PDF page 23")]),
  fluids: Object.freeze([
    sourceReference("Full guideline immediate management and updated single-page pathway Box 2"),
  ]),
  insulin: Object.freeze([
    sourceReference("Full guideline insulin section and updated single-page pathway Boxes 1 and 3"),
  ]),
  monitoring: Object.freeze([
    sourceReference(
      "Full guideline monitoring section and updated single-page pathway Boxes 1 and 3",
    ),
  ]),
  transition: Object.freeze([
    sourceReference("Full guideline sections D and E and updated single-page pathway Boxes 4 to 6"),
  ]),
});

function stage(
  id: JbdsStageId,
  status: JbdsStageStatus,
  summary: string,
  details: string[] = [],
  metrics?: (readonly [string, string])[],
): JbdsStage {
  return {
    id,
    title: titles.find(([key]) => key === id)![1],
    status,
    summary,
    details,
    sourceReferences: JBDS_DKA_STAGE_SOURCE_REFERENCES[id],
    ...(metrics ? { metrics } : {}),
  };
}

function orResult(...values: readonly (boolean | null)[]): boolean | null {
  if (values.includes(true)) return true;
  if (values.every((value) => value === false)) return false;
  return null;
}

function gt(value: number | null, limit: number): boolean | null {
  return value === null ? null : value > limit;
}

function lt(value: number | null, limit: number): boolean | null {
  return value === null ? null : value < limit;
}

function display(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function displayRateMagnitude(value: number): string {
  const magnitude = Math.abs(value);
  return magnitude > 0 && Number(magnitude.toFixed(2)) === 0
    ? "less than 0.01"
    : display(magnitude);
}

export function evaluateJbdsDka(input: unknown): JbdsDkaEvaluation {
  const parsed = parseJbdsDkaInput(input);
  if (!parsed.success) {
    return {
      valid: false,
      issues: parsed.issues,
      stages: titles.map(([id]) =>
        stage(id, "needs-input", "Correct the invalid measurement before calculating."),
      ),
      diagnosis: null,
      resolved: null,
      initialInsulinUnitsPerHour: null,
      reducedInsulinUnitsPerHour: null,
      ketoneFallPerHour: null,
    };
  }

  const d = parsed.data;
  const adultScope =
    d.ageYears === null
      ? null
      : d.ageYears >= 18
        ? true
        : d.ageYears >= 16
          ? d.adultTeamFor16To17
          : false;
  const diabetes = orResult(gt(d.diagnosticGlucose, 11), d.knownDiabetes);
  const ketosis = orResult(
    gt(d.diagnosticKetones, 3),
    d.urineKetonesPlus === null ? null : d.urineKetonesPlus >= 2,
  );
  const acidosis = orResult(lt(d.diagnosticPh, 7.3), lt(d.diagnosticBicarbonate, 15));
  const diagnosis =
    adultScope === false || [diabetes, ketosis, acidosis].includes(false)
      ? false
      : [adultScope, diabetes, ketosis, acidosis].every((value) => value === true)
        ? true
        : null;
  const stages: JbdsStage[] = [];

  if (diagnosis === false) {
    stages.push(
      stage("diagnosis", "review", "DKA criteria or adult-team scope are not met.", [
        "This calculator must not generate a DKA management branch. Reassess clinically and use the appropriate pathway.",
      ]),
    );
    for (const [id] of titles.slice(1))
      stages.push(stage(id, "not-applicable", "No DKA management branch."));
    return {
      valid: true,
      issues: [],
      stages,
      diagnosis,
      resolved: null,
      initialInsulinUnitsPerHour: null,
      reducedInsulinUnitsPerHour: null,
      ketoneFallPerHour: null,
    };
  }
  if (diagnosis === null) {
    stages.push(
      stage(
        "diagnosis",
        "needs-input",
        "Confirm the three diagnostic criteria and adult-team scope.",
        [
          "Glucose >11 mmol/L or known diabetes; blood ketones >3 mmol/L or urine ketones 2+; pH <7.3 or bicarbonate <15 mmol/L.",
        ],
      ),
    );
    for (const [id] of titles.slice(1))
      stages.push(stage(id, "not-applicable", "Confirm diagnosis first."));
    return {
      valid: true,
      issues: [],
      stages,
      diagnosis,
      resolved: null,
      initialInsulinUnitsPerHour: null,
      reducedInsulinUnitsPerHour: null,
      ketoneFallPerHour: null,
    };
  }

  stages.push(
    stage("diagnosis", "complete", "All three JBDS diagnostic criteria are met.", [
      d.diagnosticGlucose !== null && d.diagnosticGlucose <= 11 && d.knownDiabetes
        ? "Known diabetes meets the glucose/diabetes criterion despite glucose at or below 11 mmol/L."
        : "The glucose/diabetes criterion is confirmed.",
      "Ketosis and acidosis are confirmed by at least one permitted measurement each.",
    ]),
  );

  const severeFlags: string[] = [];
  if (d.diagnosticKetones !== null && d.diagnosticKetones > 6)
    severeFlags.push("Ketones >6 mmol/L");
  if (d.diagnosticBicarbonate !== null && d.diagnosticBicarbonate < 5)
    severeFlags.push("Bicarbonate <5 mmol/L");
  if (d.diagnosticPh !== null && d.diagnosticPh < 7) severeFlags.push("pH <7.0");
  if (d.potassium !== null && d.potassium < 3.5) severeFlags.push("Potassium <3.5 mmol/L");
  if (d.systolicBp !== null && d.systolicBp < 90) severeFlags.push("Systolic BP <90 mmHg");
  if (d.gcs !== null && d.gcs < 12) severeFlags.push("GCS <12");
  if (d.pulse !== null && (d.pulse > 100 || d.pulse < 60))
    severeFlags.push("Pulse outside 60-100/min");
  if (d.oxygenSaturation !== null && d.oxygenSaturation < 92 && d.normalOxygenBaseline)
    severeFlags.push("Oxygen saturation <92% with normal baseline");
  if (d.anionGap !== null && d.anionGap > 16) severeFlags.push("Anion gap >16");
  const cautionFlags = [
    d.ageYears !== null && d.ageYears <= 25 ? "age 16-25" : null,
    d.elderly ? "clinically elderly" : null,
    d.pregnant ? "pregnancy" : null,
    d.heartFailure ? "heart failure" : null,
    d.kidneyFailure ? "renal failure" : null,
  ].filter((value): value is string => value !== null);
  const incompleteRisk = [d.pregnant, d.heartFailure, d.kidneyFailure, d.elderly].includes(null);
  stages.push(
    stage(
      "risk",
      severeFlags.length > 0 ? "review" : incompleteRisk ? "needs-input" : "complete",
      severeFlags.length > 0
        ? "At least one severe-DKA review criterion is present."
        : incompleteRisk
          ? "Confirm special-population risks before relying on the standard fluid schedule."
          : "No entered severe criterion is positive; unentered observations remain unknown.",
      [
        ...severeFlags.map((flag) => `Severe criterion: ${flag}. Seek senior/HDU review.`),
        ...(cautionFlags.length
          ? [`Use cautious individualised fluids for ${cautionFlags.join(", ")}.`]
          : []),
        "Record vital signs and GCS; obtain glucose, venous blood gas, U&Es, full blood count and ECG, and assess for precipitating causes. Add cultures, chest imaging or urine testing as indicated.",
        "Unentered GCS, pulse, oxygen saturation and anion gap are not inferred as normal.",
      ],
    ),
  );

  const fluidDetails: string[] = [];
  let fluidStatus: JbdsStageStatus = "complete";
  let fluidSummary = "Initial fluid and potassium branches calculated.";
  if (d.ivAccess === false) {
    fluidStatus = "review";
    fluidSummary = "IV access unavailable: request critical care support immediately.";
  } else if (d.ivAccess === null || d.systolicBp === null) {
    fluidStatus = "needs-input";
    fluidSummary = "Confirm IV access and initial systolic BP.";
  } else if (d.systolicBp < 90) {
    fluidDetails.push(
      "Initial SBP <90: 500 mL 0.9% sodium chloride over 10-15 minutes, with immediate senior review and reassessment.",
    );
    if (d.repeatSystolicBp === null) {
      fluidStatus = "needs-input";
      fluidSummary = "Record the repeat BP after the initial 500 mL bolus.";
    } else if (d.repeatSystolicBp < 90) {
      fluidStatus = "review";
      fluidSummary =
        "SBP remains <90: repeat bolus while awaiting senior input; consider critical care.";
    } else if (d.repeatSystolicBp === 90) {
      fluidStatus = "review";
      fluidSummary =
        "Repeat SBP is exactly 90: the source's post-bolus branch requires >90; seek review.";
    } else {
      fluidDetails.push(
        "After SBP rises above 90: 1 L 0.9% sodium chloride over the next 60 minutes.",
      );
    }
  } else {
    fluidDetails.push("Initial SBP >=90: 1 L 0.9% sodium chloride over the first 60 minutes.");
  }
  if (d.potassium === null) {
    if (fluidStatus !== "review") fluidStatus = "needs-input";
    fluidDetails.push("Measure potassium before selecting a potassium replacement branch.");
  } else if (d.potassium < 3.5) {
    fluidStatus = "review";
    fluidDetails.push(
      "Potassium <3.5 mmol/L: urgent senior review; additional potassium is required. No automatic potassium or insulin adjustment is supplied.",
    );
  } else if (d.potassium <= 5.5) {
    fluidDetails.push(
      "Potassium 3.5-5.5 mmol/L: 40 mmol potassium chloride per litre of infusion solution, subject to local preparation policy.",
    );
  } else {
    fluidDetails.push(
      "Potassium >5.5 mmol/L: no potassium added to infusion solution; continue monitoring.",
    );
  }
  if (d.ivAccess === true && d.systolicBp !== null) {
    fluidDetails.push(
      "If stable and appropriate: subsequent 0.9% sodium chloride litres over 2 h, 2 h, 4 h, then 4 h and 6 h; reassess fluid balance and cardiovascular status throughout.",
    );
  }
  if (cautionFlags.length > 0 || incompleteRisk) {
    if (fluidStatus === "complete") fluidStatus = "review";
    fluidDetails.push(
      "Standard fluid timing is not personalised for special populations; obtain senior individualised fluid review.",
    );
  }
  stages.push(stage("fluids", fluidStatus, fluidSummary, fluidDetails));

  const initialInsulinUnitsPerHour =
    d.weightKg === null ? null : Number((d.weightKg * 0.1).toFixed(2));
  const reducedInsulinUnitsPerHour =
    d.weightKg === null ? null : Number((d.weightKg * 0.05).toFixed(2));
  const insulinDetails: string[] = [];
  let insulinStatus: JbdsStageStatus = "complete";
  let insulinSummary = "Weight-based FRIII and glucose support calculated.";
  if (
    d.ivAccess === false ||
    d.fluidsStarted === false ||
    (d.potassium !== null && d.potassium < 3.5)
  ) {
    insulinStatus = "review";
    insulinSummary = "FRIII start requires IV access, started fluids and safe potassium review.";
  } else if (
    d.weightKg === null ||
    d.fluidsStarted === null ||
    d.currentGlucose === null ||
    d.ivAccess === null ||
    d.potassium === null
  ) {
    insulinStatus = "needs-input";
    insulinSummary = "Confirm weight, started fluids, IV access, potassium and current glucose.";
  } else {
    insulinDetails.push(
      `FRIII at 0.1 units/kg/hour: ${display(initialInsulinUnitsPerHour!)} units/hour using ${display(d.weightKg)} kg.`,
    );
    if (d.weightKg > 150) {
      insulinStatus = "review";
      insulinDetails.push(
        "Weight >150 kg: the JBDS dose table calls for diabetes specialist advice above 15 units/hour. Do not interpret the uncapped calculation as an authorised starting rate.",
      );
    }
    if (d.currentGlucose < 14) {
      insulinDetails.push(
        "Glucose <14 mmol/L: add 10% glucose at 125 mL/hour alongside saline; consider reducing FRIII to 0.05 units/kg/hour after clinical review.",
      );
    } else {
      insulinDetails.push(
        "Current glucose has not crossed the <14 mmol/L glucose-support threshold.",
      );
    }
    if (d.takesLongActingInsulin === true)
      insulinDetails.push(
        "Continue the person's usual long-acting insulin at the usual dose and time.",
      );
  }
  stages.push(
    stage(
      "insulin",
      insulinStatus,
      insulinSummary,
      insulinDetails,
      initialInsulinUnitsPerHour === null
        ? undefined
        : [
            ["Weight-based FRIII", `${display(initialInsulinUnitsPerHour)} units/hour`],
            [
              "Reduced rate for consideration",
              `${display(reducedInsulinUnitsPerHour!)} units/hour`,
            ],
            ["Glucose support threshold", "Below 14 mmol/L"],
          ],
    ),
  );

  const monitoringDetails = [
    "Check capillary glucose and ketones hourly; check venous pH, bicarbonate and potassium at 60 minutes, 2 hours and every 2 hours thereafter; check plasma electrolytes every 4 hours.",
    "Track fluid balance and urine output. Review potassium at least hourly when outside the normal range and seek senior advice if still abnormal after another hour.",
    "At 6 and 12 hours, reassess pH, bicarbonate, potassium, ketones and glucose; review fluid overload, cerebral oedema and precipitating causes.",
  ];
  if (d.weightKg !== null) {
    const urineThreshold = d.weightKg * 0.5;
    monitoringDetails.push(
      `Minimum urine-output target: ${display(urineThreshold)} mL/hour (0.5 mL/kg/hour).`,
    );
    if (d.urineOutputMlPerHour !== null && d.urineOutputMlPerHour < urineThreshold)
      monitoringDetails.push(
        "Recorded urine output is below the source target; review fluid balance and seek clinical assessment.",
      );
  }
  let ketoneFallPerHour: number | null = null;
  let responseMet: boolean | null = null;
  let monitoringSummary = "Enter two timed measurements to assess response.";
  let monitoringStatus: JbdsStageStatus = "needs-input";
  const hours = d.intervalMinutes === null ? null : d.intervalMinutes / 60;
  if (hours !== null && d.previousKetones !== null && d.currentKetones !== null) {
    const exactFallPerHour = (d.previousKetones - d.currentKetones) / hours;
    ketoneFallPerHour = Number(exactFallPerHour.toFixed(2));
    responseMet = exactFallPerHour >= 0.5;
    if (exactFallPerHour > 0) {
      const rateLabel =
        ketoneFallPerHour === 0.5 && exactFallPerHour !== 0.5
          ? exactFallPerHour < 0.5
            ? "less than 0.5"
            : "more than 0.5"
          : displayRateMagnitude(exactFallPerHour);
      monitoringDetails.push(
        `Ketones fell by ${rateLabel} mmol/L/hour; target is a fall of at least 0.5 mmol/L/hour.`,
      );
    } else if (exactFallPerHour < 0) {
      monitoringDetails.push(
        `Ketones increased by ${displayRateMagnitude(exactFallPerHour)} mmol/L/hour; target is a fall of at least 0.5 mmol/L/hour.`,
      );
    } else {
      monitoringDetails.push(
        "Ketones were unchanged; target is a fall of at least 0.5 mmol/L/hour.",
      );
    }
  } else if (
    hours !== null &&
    d.previousKetones === null &&
    d.currentKetones === null &&
    d.previousBicarbonate !== null &&
    d.currentBicarbonate !== null &&
    d.previousGlucose !== null &&
    d.currentGlucose !== null
  ) {
    const bicarbonateRise = (d.currentBicarbonate - d.previousBicarbonate) / hours;
    const glucoseFall = (d.previousGlucose - d.currentGlucose) / hours;
    responseMet = bicarbonateRise >= 3 && glucoseFall >= 3;
    monitoringDetails.push(
      `Without blood ketones: bicarbonate rise ${display(bicarbonateRise)} and glucose fall ${display(glucoseFall)} mmol/L/hour; both targets are at least 3.`,
    );
  }
  if (responseMet !== null) {
    monitoringStatus = responseMet ? "complete" : "review";
    monitoringSummary = responseMet
      ? "Measured response meets the source target."
      : "Measured response is below the source target.";
    if (!responseMet)
      monitoringDetails.push(
        "Check the insulin infusion pump, lines and residual volume first. If the equipment is working but response remains inadequate, increase the insulin infusion rate by 1 unit/hour increments until targets are achieved and seek senior review.",
      );
  }
  if (
    d.weightKg !== null &&
    d.urineOutputMlPerHour !== null &&
    d.urineOutputMlPerHour < d.weightKg * 0.5
  ) {
    monitoringStatus = "review";
    monitoringSummary = "Recorded urine output is below the source target; review fluid balance.";
  }
  stages.push(stage("monitoring", monitoringStatus, monitoringSummary, monitoringDetails));

  const resolved =
    d.currentKetones === null || d.currentPh === null
      ? null
      : d.currentKetones < 0.6 && d.currentPh > 7.3;
  const transitionDetails: string[] = [];
  let transitionStatus: JbdsStageStatus = "needs-input";
  let transitionSummary = "Record current blood ketones and venous pH to assess resolution.";
  if (resolved === false) {
    transitionStatus = "review";
    transitionSummary = "DKA has not resolved: continue monitored treatment and reassess.";
    transitionDetails.push(
      "Resolution requires blood ketones <0.6 mmol/L AND venous pH >7.3. Bicarbonate alone is not a resolution marker.",
    );
    transitionDetails.push(
      "If the expected response has not occurred, review infusion, fluids, precipitating causes and seek senior specialist input.",
    );
  } else if (resolved === true) {
    transitionDetails.push(
      "Resolution confirmed by both required measurements. Bicarbonate is not used as a substitute.",
    );
    if (d.eatingAndDrinking === null) {
      transitionSummary = "Confirm whether the person is ready and able to eat and drink.";
    } else if (d.eatingAndDrinking === false) {
      transitionStatus = "review";
      transitionSummary = "Resolved but not eating/drinking: use a local VRIII transition pathway.";
      transitionDetails.push(
        "Continue appropriate IV fluids; switch to a variable-rate insulin infusion under local policy. Do not stop IV insulin without an alternative plan.",
      );
    } else if (
      d.scPlanConfirmed !== true ||
      d.scShortActingGiven !== true ||
      d.overlapMinutes === null
    ) {
      transitionSummary =
        "Confirm specialist/local subcutaneous plan, first short-acting dose and overlap.";
      transitionDetails.push(
        "Use the specialist diabetes team or approved local regimen. Do not calculate an unverified subcutaneous dose.",
      );
    } else if (d.overlapMinutes < 30) {
      transitionStatus = "review";
      transitionSummary = "IV-to-subcutaneous overlap is shorter than the required 30 minutes.";
      transitionDetails.push(
        "Continue IV insulin until at least 30 minutes after the short-acting subcutaneous dose with a meal.",
      );
    } else {
      transitionStatus = "complete";
      transitionSummary = "Resolution and minimum IV-to-subcutaneous overlap are confirmed.";
      transitionDetails.push(
        "The documented specialist/local subcutaneous plan and meal-associated dose are in place; IV insulin overlap is at least 30 minutes.",
      );
    }
  }
  if (
    transitionStatus === "complete" &&
    stages.some(
      (item) => ["risk", "fluids", "insulin"].includes(item.id) && item.status !== "complete",
    )
  ) {
    transitionStatus = "review";
    transitionSummary =
      "Biochemical resolution is confirmed, but an earlier management stage needs review.";
    transitionDetails.push(
      "Resolve the earlier risk, fluid or insulin concern before treating the transition as complete.",
    );
  }
  stages.push(
    stage(
      "transition",
      transitionStatus,
      transitionSummary,
      transitionDetails,
      resolved === null
        ? undefined
        : [
            ["Resolution", resolved ? "Ketones <0.6 AND pH >7.3" : "Not met"],
            [
              "IV/SC overlap",
              d.overlapMinutes === null ? "Not recorded" : `${display(d.overlapMinutes)} minutes`,
            ],
          ],
    ),
  );

  return {
    valid: true,
    issues: [],
    stages,
    diagnosis,
    resolved,
    initialInsulinUnitsPerHour,
    reducedInsulinUnitsPerHour,
    ketoneFallPerHour,
  };
}
