---
"@marcfs31/forsight": patch
---

Give the `Combobox`, `MultiSelect` and `FilterBar` popovers an accessible name.

All three compose a Radix popover internally, which renders as `role="dialog"`.
None named it, so screen readers announced an unnamed dialog when the control
opened — axe's `aria-dialog-name`. The inner `Command` listbox was already
named in each, which is why this went unnoticed: the interactive part read
correctly, the wrapper around it did not.

The dialog now mirrors whatever names the trigger. For `Combobox` and
`MultiSelect` that is `aria-labelledby` when the consumer passes one (so the
name tracks the referenced element's text), otherwise the trigger's
`aria-label`, otherwise the `placeholder`, which always has a value. Nothing
changes for consumers who already pass `aria-label` — the dialog simply
inherits that name instead of having none. `FilterBar`'s popover is internal
and single-purpose, so it takes the trigger's own visible name, "Add filter".

This was caught by moving the Storybook accessibility gate to
`@storybook/addon-vitest`. The previous test runner scoped axe to
`#storybook-root`, and Radix renders these popovers into a portal on
`document.body` — outside that root — so no overlay content was ever checked.
