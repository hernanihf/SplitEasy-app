// The install prompt only applies to the installable web (PWA) build. On
// native there is nothing to install, so this is a no-op. The real
// implementation lives in install-prompt.web.tsx.
export function InstallPrompt() {
  return null;
}
