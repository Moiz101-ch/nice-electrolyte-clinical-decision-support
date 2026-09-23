export interface DkaCalculatorField {
  readonly kind: "number" | "boolean" | "nullable-boolean" | "regimen";
  readonly label: string;
  readonly max?: number;
  readonly min?: number;
  readonly path: readonly string[];
  readonly step?: string;
  readonly unit?: string;
}

const numberField = (
  label: string,
  path: readonly string[],
  unit?: string,
  options: Pick<DkaCalculatorField, "max" | "min" | "step"> = {},
): DkaCalculatorField => ({ kind: "number", label, path, ...(unit ? { unit } : {}), ...options });

const checkField = (label: string, path: readonly string[]): DkaCalculatorField => ({
  kind: "boolean",
  label,
  path,
});

const nullableCheck = (label: string, path: readonly string[]): DkaCalculatorField => ({
  kind: "nullable-boolean",
  label,
  path,
});

export const dkaCalculatorFields: readonly (readonly DkaCalculatorField[])[] = [
  [
    numberField("Age", ["initial", "ageYears"], "years", { min: 0, step: "1" }),
    numberField("Weight", ["initial", "weightKg"], "kg", { min: 0 }),
    numberField("Initial blood glucose", ["initial", "bloodGlucoseMmolL"], "mmol/L", {
      min: 0,
    }),
    numberField("Initial blood ketones", ["initial", "bloodKetonesMmolL"], "mmol/L", {
      min: 0,
    }),
    checkField("ABCDE assessment complete", ["initial", "assessment", "abcdeComplete"]),
    checkField("GCS assessment complete", ["initial", "assessment", "gcsComplete"]),
    checkField("Early warning score complete", [
      "initial",
      "assessment",
      "earlyWarningScoreComplete",
    ]),
    checkField("IV access obtained", ["initial", "assessment", "ivAccessObtained"]),
    checkField("Full blood count obtained", ["initial", "assessment", "fbcObtained"]),
    checkField("Urea and electrolytes obtained", ["initial", "assessment", "uAndEObtained"]),
    checkField("Laboratory glucose obtained", [
      "initial",
      "assessment",
      "laboratoryGlucoseObtained",
    ]),
    checkField("Venous blood gas obtained", ["initial", "assessment", "venousBloodGasObtained"]),
  ],
  [
    numberField("Venous pH", ["initial", "venousPh"], undefined, { min: 0, max: 14 }),
    numberField("Bicarbonate", ["initial", "bicarbonateMmolL"], "mmol/L", { min: 0 }),
  ],
  [
    numberField("Initial systolic blood pressure", ["initial", "systolicBpMmhg"], "mmHg", {
      min: 0,
    }),
    numberField("Repeat systolic blood pressure", ["initial", "repeatSystolicBpMmhg"], "mmHg", {
      min: 0,
    }),
  ],
  [
    nullableCheck("Long-acting insulin normally taken", [
      "initial",
      "longActingInsulinNormallyTaken",
    ]),
  ],
  [
    checkField("Full examination complete", ["further", "fullExaminationComplete"]),
    checkField("Precipitating factors considered", ["further", "precipitatingFactorsConsidered"]),
    checkField("Investigations considered", ["further", "investigationsConsidered"]),
    checkField("Diabetes team referred", ["further", "diabetesTeamReferred"]),
    numberField("Blood ketones", ["further", "bloodKetonesMmolL"], "mmol/L", { min: 0 }),
    numberField("Bicarbonate", ["further", "bicarbonateMmolL"], "mmol/L", { min: 0 }),
    numberField("Venous pH", ["further", "ph"], undefined, { min: 0, max: 14 }),
    numberField("Admission potassium", ["further", "admissionPotassiumMmolL"], "mmol/L", {
      min: 0,
    }),
    numberField("GCS", ["further", "gcs"], undefined, { min: 3, max: 15, step: "1" }),
    numberField("Oxygen saturation", ["further", "oxygenSaturationPercent"], "%", {
      min: 0,
      max: 100,
    }),
    nullableCheck("Normal baseline respiratory function", [
      "further",
      "normalBaselineRespiratoryFunction",
    ]),
    numberField("Systolic blood pressure", ["further", "systolicBpMmhg"], "mmHg", { min: 0 }),
    numberField("Pulse", ["further", "pulseBpm"], "bpm", { min: 0 }),
  ],
  [
    checkField("Older age clinically confirmed", ["fluid", "elderlyClinicallyConfirmed"]),
    checkField("Pregnancy", ["fluid", "pregnant"]),
    checkField("Heart failure", ["fluid", "heartFailure"]),
    checkField("Renal failure", ["fluid", "renalFailure"]),
    checkField("First replacement bag started", ["fluid", "firstReplacementBagStarted"]),
    checkField("Fluid chart complete", ["fluid", "fluidChartCompleted"]),
  ],
  [
    numberField("Current blood glucose", ["monitoring", "bloodGlucoseMmolL"], "mmol/L", {
      min: 0,
    }),
    numberField("Current blood ketones", ["monitoring", "bloodKetonesMmolL"], "mmol/L", {
      min: 0,
    }),
    numberField("Current venous pH", ["monitoring", "venousPh"], undefined, {
      min: 0,
      max: 14,
    }),
    numberField("Current potassium", ["monitoring", "potassiumMmolL"], "mmol/L", { min: 0 }),
    numberField("Recorded insulin rate", ["monitoring", "insulinRateUnitsPerHour"], "units/hour", {
      min: 0,
    }),
    numberField("Urine output", ["monitoring", "urineOutputMlPerHour"], "mL/hour", {
      min: 0,
    }),
    numberField("Oxygen saturation", ["monitoring", "oxygenSaturationPercent"], "%", {
      min: 0,
      max: 100,
    }),
    checkField("Incontinent", ["monitoring", "incontinent"]),
    checkField("Persistent vomiting", ["monitoring", "persistentVomiting"]),
    checkField("Reduced consciousness", ["monitoring", "reducedConsciousness"]),
  ],
  [
    numberField("Previous blood ketones", ["response", "previousBloodKetonesMmolL"], "mmol/L", {
      min: 0,
    }),
    numberField("Current blood ketones", ["response", "currentBloodKetonesMmolL"], "mmol/L", {
      min: 0,
    }),
    numberField("Previous bicarbonate", ["response", "previousBicarbonateMmolL"], "mmol/L", {
      min: 0,
    }),
    numberField("Current bicarbonate", ["response", "currentBicarbonateMmolL"], "mmol/L", {
      min: 0,
    }),
    numberField("Previous blood glucose", ["response", "previousBloodGlucoseMmolL"], "mmol/L", {
      min: 0,
    }),
    numberField("Current blood glucose", ["response", "currentBloodGlucoseMmolL"], "mmol/L", {
      min: 0,
    }),
    numberField("Observation interval", ["response", "intervalMinutes"], "minutes", {
      min: 1,
      step: "1",
    }),
    nullableCheck("Delivery-system checks confirmed", ["response", "deliveryChecksConfirmed"]),
  ],
  [
    numberField("Blood ketones", ["resolution", "bloodKetonesMmolL"], "mmol/L", { min: 0 }),
    numberField("Venous pH", ["resolution", "venousPh"], undefined, { min: 0, max: 14 }),
    numberField("Bicarbonate", ["resolution", "bicarbonateMmolL"], "mmol/L", { min: 0 }),
  ],
  [
    checkField("Eating", ["conversion", "eating"]),
    checkField("Drinking", ["conversion", "drinking"]),
    checkField("Metabolically stable", ["conversion", "metabolicallyStable"]),
    { kind: "regimen", label: "Usual insulin regimen", path: ["conversion", "regimen"] },
  ],
];
