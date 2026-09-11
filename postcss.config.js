export default {
  plugins: {
    // v4 moved the PostCSS plugin out of the `tailwindcss` package.
    // Lightning CSS (bundled with `@tailwindcss/postcss`) handles vendor
    // prefixes, so autoprefixer is not part of this pipeline.
    "@tailwindcss/postcss": {},
  },
};
