import type { ReactElement } from "react";

type DigestItem = {
  title: string;
  excerpt?: string | null;
  url: string;
};

type EntityTagDigestProps = {
  entityName: string;
  jurisdictionLabel?: string | null;
  items: DigestItem[];
  unsubscribeUrl: string;
};

export function EntityTagDigestEmail({
  entityName,
  jurisdictionLabel,
  items,
  unsubscribeUrl,
}: EntityTagDigestProps): ReactElement {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#0f172a" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "12px" }}>
        Polyvox: You were mentioned
      </h1>
      <p style={{ fontSize: "14px", marginBottom: "16px" }}>
        Daily digest for {entityName}
        {jurisdictionLabel ? ` - ${jurisdictionLabel}` : ""}.
      </p>
      <div style={{ display: "grid", gap: "12px" }}>
        {items.map((item) => (
          <div key={item.url} style={{ padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
            <p style={{ fontSize: "14px", margin: 0 }}>
              <strong>{item.title}</strong>
            </p>
            {item.excerpt ? (
              <p style={{ fontSize: "13px", color: "#475569", margin: "6px 0 10px" }}>
                {item.excerpt}
              </p>
            ) : null}
            <a href={item.url} style={{ color: "#2563eb", fontSize: "13px" }}>
              View context
            </a>
          </div>
        ))}
      </div>
      <p style={{ fontSize: "12px", marginTop: "20px", color: "#475569" }}>
        Public emails may receive limited notifications. Unsubscribe anytime.
      </p>
      <p style={{ fontSize: "12px", marginTop: "8px" }}>
        <a href={unsubscribeUrl} style={{ color: "#2563eb" }}>
          Unsubscribe
        </a>
      </p>
    </div>
  );
}