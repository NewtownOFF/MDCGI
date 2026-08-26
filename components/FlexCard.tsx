type FlexCardProps = {
  imageUrl: string;
  username: string;
  reanimations: number;
  soins: number;
  createdAt: string;
  status?: "pending" | "approved" | "rejected";
  actions?: React.ReactNode;
};

export default function FlexCard({
  imageUrl,
  username,
  reanimations,
  soins,
  createdAt,
  status,
  actions,
}: FlexCardProps) {
  return (
    <div className="card">
      <img src={imageUrl} alt="Screen Flex" className="flex-img" />
      <div style={{ marginTop: 10 }}>
        <strong>{username}</strong>
        {status && status !== "approved" && (
          <span className={`badge`} style={{ marginLeft: 8, background: status === "pending" ? "#3a3320" : "#3a2020", color: status === "pending" ? "#e0c467" : "#e58787" }}>
            {status === "pending" ? "En attente" : "Rejeté"}
          </span>
        )}
      </div>
      <div className="stat-row">
        <div className="stat">
          <div className="n">{reanimations}</div>
          <div className="l">Réanimations</div>
        </div>
        <div className="stat">
          <div className="n">{soins}</div>
          <div className="l">Soins</div>
        </div>
      </div>
      <div className="muted">{new Date(createdAt).toLocaleString("fr-FR")}</div>
      {actions && <div style={{ marginTop: 10, display: "flex", gap: 8 }}>{actions}</div>}
    </div>
  );
}
