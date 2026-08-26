"use client";

import { useRef, useState, useTransition } from "react";
import {
  createAnnouncement,
  toggleAnnouncementPin,
  deleteAnnouncement,
  markAnnouncementRead,
  markAllAnnouncementsRead,
} from "@/lib/actions";
import { renderAnnouncementBody } from "@/lib/markdown";

type Announcement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
  author: string;
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

const TOOLBAR_ACTIONS = [
  { label: "Gras", mark: "**", icon: "B", style: { fontWeight: 800 } },
  { label: "Italique", mark: "*", icon: "I", style: { fontStyle: "italic" } },
  { label: "Souligné", mark: "__", icon: "U", style: { textDecoration: "underline" } },
  { label: "Barré", mark: "~~", icon: "S", style: { textDecoration: "line-through" } },
] as const;

function ComposerModal({
  onClose,
  onPublish,
}: {
  onClose: () => void;
  onPublish: (title: string, body: string, pinned: boolean) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function applyMark(mark: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = body.slice(start, end) || "texte";
    const next = body.slice(0, start) + mark + selected + mark + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + mark.length;
      ta.selectionEnd = start + mark.length + selected.length;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setPublishing(true);
    await onPublish(title, body, pinned);
    setPublishing(false);
  }

  return (
    <div className="ann-modal-backdrop" onClick={onClose}>
      <div className="ann-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ann-modal-header">
          <h2>Nouvelle annonce</h2>
          <button type="button" className="ann-modal-close" onClick={onClose} aria-label="Fermer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="ann-modal-body" onSubmit={handleSubmit}>
          <input
            type="text"
            className="ann-title-input"
            placeholder="Titre de l'annonce"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="ann-toolbar">
            {TOOLBAR_ACTIONS.map((a) => (
              <button
                key={a.label}
                type="button"
                title={a.label}
                style={a.style}
                onClick={() => applyMark(a.mark)}
              >
                {a.icon}
              </button>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            className="ann-body-input"
            placeholder="Écrivez votre annonce... (sélectionnez du texte puis cliquez B/I/U/S pour le mettre en forme)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />

          <label className="ann-checkbox">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Épingler cette annonce
          </label>

          <div className="ann-modal-footer">
            <button type="button" className="btn-muted" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" disabled={publishing}>
              {publishing ? "Publication..." : "Publier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AnnouncementCenter({
  announcements,
  initialUnreadIds,
  isAdmin,
}: {
  announcements: Announcement[];
  initialUnreadIds: string[];
  isAdmin: boolean;
}) {
  const [unread, setUnread] = useState(new Set(initialUnreadIds));
  const [expanded, setExpanded] = useState(new Set<string>());
  const [showComposer, setShowComposer] = useState(false);
  const [pending, startTransition] = useTransition();

  const sorted = [...announcements].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  function handleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    if (unread.has(id)) {
      setUnread((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      startTransition(() => markAnnouncementRead(id));
    }
  }

  function handleMarkAllRead() {
    const ids = announcements.map((a) => a.id);
    setUnread(new Set());
    startTransition(() => markAllAnnouncementsRead(ids));
  }

  function handlePin(id: string, current: boolean) {
    startTransition(() => toggleAnnouncementPin(id, !current));
  }

  function handleDelete(id: string) {
    if (!confirm("Supprimer cette annonce ?")) return;
    startTransition(() => deleteAnnouncement(id));
  }

  async function handlePublish(title: string, body: string, pinned: boolean) {
    await createAnnouncement(title, body, pinned);
    setShowComposer(false);
  }

  return (
    <section>
      <div className="ann-header">
        <div>
          <div className="eyebrow">Centre d'annonces</div>
          <div className="ann-title-row">
            <h3 className="ann-title">Informations importantes</h3>
            {unread.size > 0 && <span className="badge-dot">{unread.size}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {/* Réservé aux Gérants et Co-Gérants : contrôlé ici pour l'UI, et
              imposé côté base par la policy RLS "announcements_write_admins"
              (donc infalsifiable même via un appel API bricolé). */}
          {isAdmin && (
            <button className="pill-btn" onClick={() => setShowComposer(true)} type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nouvelle annonce
            </button>
          )}
          {unread.size > 0 && (
            <button className="pill-btn" onClick={handleMarkAllRead} type="button" disabled={pending}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Tout est lu
            </button>
          )}
        </div>
      </div>

      {showComposer && <ComposerModal onClose={() => setShowComposer(false)} onPublish={handlePublish} />}

      <div className="ann-list">
        {sorted.length === 0 && <div className="ann-empty">Aucune annonce pour l'instant.</div>}
        {sorted.map((a) => {
          const isUnread = unread.has(a.id);
          const isExpanded = expanded.has(a.id);
          return (
            <article key={a.id} className={`ann-card ${a.pinned ? "pinned" : ""} ${isUnread ? "unread" : ""}`}>
              <div className="ann-tagrow">
                {a.pinned ? (
                  <span className="ann-tag">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M12 17v5" />
                      <path d="M9 10.5V4h6v6.5l2 3.5H7l2-3.5Z" />
                    </svg>
                    Épinglée
                  </span>
                ) : (
                  <span className="ann-tag" style={{ color: "var(--text-low)" }}>{a.author}</span>
                )}
                {isUnread && <span className="ann-unread-dot" title="Non lu" />}
                <span className="ann-time">{timeAgo(a.created_at)}</span>
              </div>
              <h4 className="ann-name">{a.title}</h4>
              <div className={`ann-collapse ${isExpanded ? "expanded" : ""}`}>
                <div className="ann-body" dangerouslySetInnerHTML={{ __html: renderAnnouncementBody(a.body) }} />
                <div className="ann-fade" />
              </div>
              <div className="ann-footer">
                <button className="ann-more-btn" onClick={() => handleExpand(a.id)} type="button">
                  {isExpanded ? "Réduire" : "Lire la suite"}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {isAdmin && (
                  <>
                    <button
                      className={`ann-pin-btn ${a.pinned ? "active" : ""}`}
                      onClick={() => handlePin(a.id, a.pinned)}
                      type="button"
                      disabled={pending}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M12 17v5" />
                        <path d="M9 10.5V4h6v6.5l2 3.5H7l2-3.5Z" />
                      </svg>
                      {a.pinned ? "Désépingler" : "Épingler"}
                    </button>
                    <button className="ann-del-btn" onClick={() => handleDelete(a.id)} type="button" disabled={pending}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                      </svg>
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
