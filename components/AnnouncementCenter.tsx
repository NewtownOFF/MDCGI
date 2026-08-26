"use client";

import { useState, useTransition } from "react";
import {
  createAnnouncement,
  toggleAnnouncementPin,
  deleteAnnouncement,
  markAnnouncementRead,
  markAllAnnouncementsRead,
} from "@/lib/actions";

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
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    await createAnnouncement(title, body, pinned);
    setTitle("");
    setBody("");
    setPinned(false);
    setShowForm(false);
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
          {isAdmin && (
            <button className="pill-btn" onClick={() => setShowForm((s) => !s)} type="button">
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

      {showForm && (
        <form className="ann-new-form" onSubmit={handleCreate}>
          <label>Titre</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Mission interne" required />
          <label>Contenu</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Détails de l'annonce..." required />
          <label className="ann-checkbox">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Épingler cette annonce
          </label>
          <button type="submit">Publier</button>
        </form>
      )}

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
                <div className="ann-body">{a.body}</div>
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
