import { createRuleEngine } from "../src/rule-engine/engine.ts";

const engine = createRuleEngine();
const outcome = engine.evaluate({
  ageYears: 49,
  clinicalContext: "general-adult-presentation",
  condition: "hypermagnesaemia",
  context: {
    dialysis: false,
  },
  electrolyte: "magnesium",
  measuredValue: 3.02,
  unit: "mmol/L",
});

console.log(JSON.stringify(outcome, null, 2));
