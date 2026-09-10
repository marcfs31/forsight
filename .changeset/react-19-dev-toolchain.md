---
"@marcfs31/forsight": patch
---

Widen `SidebarContextValue.mobileTriggerRef` to `React.RefObject<HTMLButtonElement | null>`.

The dev toolchain moves to React 19, whose `useRef<T>(null)` is typed
`RefObject<T | null>`, so the context's declared type had to match. This is a
type-only widening: nothing changes at runtime, and nothing breaks for
consumers on React 18, where `RefObject<T>.current` was already `T | null`.

The library's `react`/`react-dom` peer range is unchanged (`>=18`) — React 18
and 19 are both still supported.
