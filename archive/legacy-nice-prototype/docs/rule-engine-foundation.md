# Rule-Engine Foundation

The rule engine is a synchronous, deterministic TypeScript module. It validates confirmed
assessment input, selects only evaluators registered for the confirmed clinical context, and runs
those evaluators in explicit order. A higher-priority evaluator that reports missing required data
blocks evaluation before lower-priority rules can run.

The engine has three outcomes:

- `matched`: one active evaluator selected a validated catalogue rule.
- `unsupported`: no approved rule matched, so `NICE-UNSUPPORTED-001` was returned without a
  treatment source.
- `blocked`: input was invalid, a required confirmed field was missing, or rule configuration was
  unsafe.

All result text, limitations, priorities and sources are copied from the validated runtime NICE
catalogue. The explanation builder uses a fixed template and evaluator-supplied confirmed facts.
It does not call AI or generate new clinical advice.

Run the foundation example with:

```bash
npm run rule-engine:demo
```

The example intentionally uses a general hypermagnesaemia assessment. Because condition-specific
evaluators are introduced in later subtasks, the expected result is `NICE-UNSUPPORTED-001` with no
sources and explicit confirmation that treatment instructions were omitted.
