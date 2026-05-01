import { ImageResponse } from "next/og";

export const alt = "La Crypta Dev — Bitcoin, Lightning y Nostr";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "radial-gradient(ellipse 80% 60% at 30% 0%, rgba(247,147,26,0.18), transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(168,85,247,0.18), transparent 60%), #05070e",
          color: "#f4f4f5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 22,
            letterSpacing: 4,
            color: "#a1a1aa",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#f7931a",
              boxShadow: "0 0 24px #f7931a",
            }}
          />
          La Crypta Dev
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.05,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Bitcoin · Lightning</span>
            <span style={{ color: "#a855f7" }}>· Nostr.</span>
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#a1a1aa",
              maxWidth: 920,
              lineHeight: 1.4,
            }}
          >
            Investigación, prototipos y productos open source de la comunidad
            La Crypta.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 20,
            color: "#71717a",
            letterSpacing: 2,
            textTransform: "uppercase",
            fontFamily: "monospace",
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ color: "#f7931a" }}>● Bitcoin</span>
            <span style={{ color: "#ffd700" }}>● Lightning</span>
            <span style={{ color: "#a855f7" }}>● Nostr</span>
          </div>
          <div>lacrypta.dev</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
