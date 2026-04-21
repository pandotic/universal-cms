// Client-only theme surface. `ThemeInjector` is a server component and
// lives at `@pandotic/universal-cms/components/theme/server` so server
// consumers don't drag createContext into their module graph.
export { ThemeProvider, useTheme } from "./ThemeContext";
export { ThemeToggle } from "./ThemeToggle";
