/**
 * Tente d'ouvrir l'app native via son schéma personnalisé (whatspay://) avant de retomber sur
 * `fallback` (store, ou web sur desktop). Pas d'Universal Links iOS configurés — ce schéma est
 * le seul mécanisme disponible pour détecter "app déjà installée" sur cette plateforme ; sur
 * Android, les App Links interceptent déjà la plupart des cas avant même que cette page charge,
 * ceci couvre le reste (navigateurs in-app, vérification non propagée).
 *
 * Principe : si l'app s'ouvre, l'onglet passe en arrière-plan et le minuteur de secours ne
 * s'exécute jamais (comportement standard des navigateurs mobiles). S'il se déclenche, l'app
 * n'a pas répondu → on bascule sur `fallback`.
 */
export function openAppOrFallback(path: string, fallback: () => void, timeoutMs = 1500) {
  let fired = false;
  const run = () => {
    if (fired) return;
    fired = true;
    fallback();
  };

  const onHide = () => {
    if (document.hidden) {
      fired = true;
      document.removeEventListener("visibilitychange", onHide);
    }
  };
  document.addEventListener("visibilitychange", onHide);

  setTimeout(run, timeoutMs);
  window.location.href = `whatspay://${path}`;
}
