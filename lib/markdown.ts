// Rendu "markdown léger" pour le corps des annonces.
// Le texte est d'abord échappé (anti-XSS), puis seules les balises que l'on
// introduit nous-mêmes (strong/em/u/del) sont ajoutées — jamais de HTML brut
// venant de l'utilisateur.

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderAnnouncementBody(raw: string): string {
  let text = escapeHtml(raw);

  // Ordre important : strike/underline (marqueurs à 2 caractères) avant le
  // gras (**), puis l'italique (*) en dernier pour ne pas capturer les
  // astérisques déjà consommés par le gras.
  text = text.replace(/~~(.+?)~~/g, "<del>$1</del>");
  text = text.replace(/__(.+?)__/g, "<u>$1</u>");
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");

  return text;
}
