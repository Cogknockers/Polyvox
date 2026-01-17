import type { ReactElement } from "react";

type EntityTagImmediateProps = {
  entityName: string;
  jurisdictionLabel?: string | null;
  contentTitle?: string | null;
  contentExcerpt?: string | null;
  contentUrl: string;
  createdBy?: string | null;
  unsubscribeUrl: string;
};

export function EntityTagImmediateEmail({
  entityName,
  jurisdictionLabel,
  contentTitle,
  contentExcerpt,
  contentUrl,
  createdBy,
  unsubscribeUrl,
}: EntityTagImmediateProps): ReactElement {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#0f172a" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "12px" }}>
        Polyvox: You were mentioned
      </h1>
      <p style={{ fontSize: "14px", marginBottom: "16px" }}>
        {entityName}
        {jurisdictionLabel ? ` - ${jurisdictionLabel}` : ""} was mentioned
        {createdBy ? ` by ${createdBy}` : ""}.
      </p>
      {contentTitle ? (
        <p style={{ fontSize: "14px", marginBottom: "6px" }}>
          <strong>{contentTitle}</strong>
        </p>
      ) : null}
      {contentExcerpt ? (
        <p style={{ fontSize: "13px", marginBottom: "12px", color: "#475569" }}>
          {contentExcerpt}
        </p>
      ) : null}
      <a
        href={contentUrl}
        style={{
          display: "inline-block",
          padding: "10px 16px",
          backgroundColor: "#1f2937",
          color: "#ffffff",
          borderRadius: "8px",
          textDecoration: "none",
          fontSize: "14px",
        }}
      >
        View context
      </a>
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