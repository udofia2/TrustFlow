import type { Config } from "tailwindcss";

/**
 * Tailwind CSS v4 Configuration
 * 
 * In Tailwind v4, most configuration is done via CSS using @theme and @source directives
 * in globals.css. This config file is kept minimal for compatibility and potential future
 * plugin usage.
 * 
 * Content paths are defined in app/globals.css using @source directives.
 * Theme customizations (colors, etc.) are defined in app/globals.css using @theme inline.
 */
const config: Config = {
  // Content paths are now defined in globals.css using @source directives
  // This empty config maintains compatibility with tools that expect a config file
  plugins: [],
};

export default config;

