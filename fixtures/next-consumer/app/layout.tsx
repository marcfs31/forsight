// Server Component root layout — mirrors the README's Next.js recipe.
// styles.css is imported from JS (not from globals.css) on purpose: that is
// the path a bundler can drop if the package mis-declares `sideEffects`.
import "@marcfs31/fors-observability-design-system/styles.css";
import "./globals.css";
import { forsAntiFlashScript } from "@marcfs31/fors-observability-design-system/theme";

export const metadata = { title: "Fors design-system consumer fixture" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: forsAntiFlashScript() }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
