# Runtime Clinical Data

The reviewed source catalogue is maintained in
`project-input/nice_electrolyte_rule_catalogue.json`. The matching management CSV and project
workbook are synchronized distribution formats. The application consumes validated generated
copies in `data/runtime/`.

Run the following after an approved update to either the NICE rule catalogue or resource-search
configuration:

```bash
npm run data:build
npm run data:check
```

`data:build` validates the source files with Zod and creates camel-cased, typed runtime JSON. It
also turns delimited lists into arrays, converts automation flags to booleans, and converts resource
limits to numbers. `data:check` validates the sources and fails when the committed generated files
are absent or stale; CI runs this command before the normal test suite.

Validation enforces the NICE-only management policy, NICE URL/source-ID consistency, valid source
references, section references for management rules, the protected role of additional resources,
unique configuration conditions, and exact JSON-to-management-CSV parity. It does not approve
clinical content; qualified clinical review remains a separate release requirement.
