const rgb = (v) => `rgb(var(${v}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: rgb("--bg-canvas"),
        surface: { DEFAULT: rgb("--bg-surface"), raised: rgb("--bg-surface-raised") },
        muted: rgb("--bg-muted"),
        overlay: rgb("--bg-overlay"),
        primary: rgb("--text-primary"),
        secondary: rgb("--text-secondary"),
        subtle: rgb("--text-muted"),
        "on-accent": rgb("--text-on-accent"),
        accent: { DEFAULT: rgb("--accent"), hover: rgb("--accent-hover"), soft: rgb("--accent-soft") },
        line: { DEFAULT: rgb("--border-subtle"), strong: rgb("--border-strong") },
        status: {
          client: rgb("--status-client"), "client-soft": rgb("--status-client-soft"),
          assistant: rgb("--status-assistant"), "assistant-soft": rgb("--status-assistant-soft"),
          waiting: rgb("--status-waiting"), "waiting-soft": rgb("--status-waiting-soft"),
          fyi: rgb("--status-fyi"), "fyi-soft": rgb("--status-fyi-soft"),
          success: rgb("--status-success"), "success-soft": rgb("--status-success-soft"),
          review: rgb("--status-review"), "review-soft": rgb("--status-review-soft"),
        },
      },
      borderRadius: { card: "var(--radius-card)", control: "var(--radius-control)", pill: "var(--radius-pill)" },
      boxShadow: { card: "var(--shadow-card)", pop: "var(--shadow-pop)" },
      spacing: { card: "var(--space-card)", row: "var(--space-row)", section: "var(--space-section)" },
      fontFamily: { sans: "var(--font-sans)", display: "var(--font-display)" },
      letterSpacing: { display: "var(--tracking-display)" },
      fontWeight: { heading: "var(--weight-heading)" },
    },
  },
  plugins: [],
};
