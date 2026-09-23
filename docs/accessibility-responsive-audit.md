# Accessibility and Responsive Audit

Audit date: 23 September 2026. This audit covers the active application shell, assessment chooser,
three connected electrolyte workflows, the current DKA calculator, Hypomagnesaemia supporting
guidance and the shared pathway UI. It targets WCAG 2.1 AA principles and the project's explicit
keyboard, focus, touch-target, reduced-motion and responsive-layout requirements.

Automated checks support accessibility review but do not establish WCAG conformance or replace
testing with disabled users and assistive technologies.

## Automated route matrix

`tests/e2e/accessibility-responsive-audit.spec.ts` checks these surfaces:

- `/`
- `/assessment/new`
- `/review/hyponatraemia/assessment`
- `/review/hyperkalaemia/assessment`
- `/review/hypocalcaemia/assessment`
- `/review/dka/current-calculator`
- `/review/hypomagnesaemia/supporting-guidance`
- `/review/pathway-ui`

Each surface is tested at:

| Profile      | Viewport     | Purpose                                      |
| ------------ | ------------ | -------------------------------------------- |
| 320px reflow | `320 x 800`  | Narrow WCAG reflow and content-fit check     |
| Mobile       | `390 x 844`  | Phone layout and touch interaction           |
| Tablet       | `768 x 1024` | Intermediate layout and navigation behaviour |
| Desktop      | `1440 x 900` | Full navigation and multi-column layouts     |

At every size, the suite verifies:

- the page has a visible, named level-one heading;
- the document has no horizontal overflow;
- visible primary links, buttons, selects and inputs meet a minimum `24 x 24` CSS-pixel target;
- axe-core reports no automatically detectable violations in the initial page state.

Existing pathway-specific browser tests also run axe after representative branches and verify
mobile fit after dynamic content appears.

## Keyboard and focus

The audit verifies that:

- `Tab` exposes and focuses the skip link;
- activating the skip link moves focus to the main content landmark;
- route loading does not duplicate the application shell or main landmark;
- visible focus styling is present on the skip link and workflow links;
- a workflow can be reached and opened with `Tab` and `Enter` only;
- major decision cards retain native radio semantics and respond to `Space`;
- the mobile navigation dialog opens and closes from the keyboard, supports `Escape`, and restores
  focus to its trigger through the existing migration tests;
- native buttons, links, inputs and selects preserve browser keyboard behaviour.

## Screen-reader semantics

The implementation and tests confirm:

- semantic `main`, `nav`, `section`, heading and form elements;
- programmatic labels for numeric inputs, selects, radio groups and checkboxes;
- required fields have visible and screen-reader-only indicators;
- pathway progress uses a named navigation landmark, `aria-current="step"` and text status;
- critical safety messages use alert semantics while supporting information uses notes;
- calculated and progressively revealed results use polite live regions;
- icon-only controls have accessible names and decorative icons are hidden;
- the mobile dialog has an accessible title and description.

## Motion and visual behaviour

- Focus is never communicated by colour alone.
- Text and controls use the shared design tokens checked by axe contrast rules.
- Motion does not resize fixed-format controls or introduce document overflow.
- `prefers-reduced-motion: reduce` disables decorative entry, hover and drawer motion; this is
  covered by `tests/e2e/motion.spec.ts`.

## Result

The repeatable audit passed for all eight surfaces at all four viewport profiles. No horizontal
overflow, undersized tested primary controls or axe-core violations were detected. Keyboard skip
navigation, workflow activation, decision selection and live-result semantics passed.

## Remaining manual checks

Before any public clinical-use decision, complete and record:

- NVDA with Firefox and Chrome on Windows;
- VoiceOver with Safari on macOS and iOS;
- TalkBack with Chrome on Android;
- browser zoom at 200% and 400% with representative completed workflows;
- Windows High Contrast and forced-colour review;
- comprehension review of focus order and live announcements with assistive-technology users;
- accessibility review of externally opened source PDFs, which is outside the HTML application.

## Re-run

```powershell
npm.cmd run test:a11y
```

The command creates a production build, starts an isolated local server, runs the audit and stops
the server. The full E2E suite also includes this specification.

**STOP HERE FOR ACCESSIBILITY AND RESPONSIVE REVIEW.**
