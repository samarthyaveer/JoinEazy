import MoonStar from "lucide-react/dist/esm/icons/moon-star";
import SunMedium from "lucide-react/dist/esm/icons/sun-medium";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle({
  compact = false,
  className = "",
  showLabel = true,
}) {
  const { isDark, toggleTheme } = useTheme();

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface-raised/85 text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary ${className}`.trim()}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <SunMedium size={17} /> : <MoonStar size={17} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`flex items-center justify-between gap-3 rounded-[20px] border border-border bg-surface-raised/80 px-4 py-3 text-left transition-colors hover:bg-surface-overlay ${className}`.trim()}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="flex items-center gap-3 min-w-0">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-overlay text-text-primary">
          {isDark ? <SunMedium size={17} /> : <MoonStar size={17} />}
        </span>
        {showLabel ? (
          <span className="min-w-0">
            <span className="block text-meta font-medium text-text-primary">
              {isDark ? "Light appearance" : "Dark appearance"}
            </span>
            <span className="block text-label text-text-tertiary mt-1">
              {isDark ? "Switch to the brighter view" : "Switch to the dimmer view"}
            </span>
          </span>
        ) : null}
      </span>

      <span
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border transition-colors ${
          isDark
            ? "border-accent/20 bg-accent/80"
            : "border-border-strong bg-surface-overlay"
        }`}
      >
        <span
          className={`absolute top-0.5 h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform ${
            isDark ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
