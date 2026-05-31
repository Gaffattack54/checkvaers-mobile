import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CheckVAERS — private VAERS search";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #0B1B3B 0%, #142A56 60%, #0B1B3B 100%)",
          padding: "70px 90px",
          color: "white",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Top brand row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "rgba(41, 197, 246, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
            }}
          >
            🛡
          </div>
          <span
            style={{
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: -0.5,
            }}
          >
            CheckVAERS
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#29C5F6",
            }}
          >
            Private VAERS Search
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 900,
              lineHeight: 1.04,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            Was your vaccine adverse event reported to VAERS?
          </div>
          <div
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.8)",
              maxWidth: 920,
              lineHeight: 1.35,
            }}
          >
            Search 889,000+ public COVID-19 reports — matching runs on your
            device.
          </div>
        </div>

        {/* Bottom stats */}
        <div
          style={{
            marginTop: 50,
            display: "flex",
            gap: 56,
            paddingTop: 30,
            borderTop: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <Stat label="VAERS reports" value="889K+" />
          <Stat label="States" value="56" />
          <Stat label="Trackers" value="0" />
          <Stat label="On-device" value="100%" />
        </div>
      </div>
    ),
    { ...size }
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontSize: 38,
          fontWeight: 900,
          color: "#29C5F6",
          letterSpacing: -1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 16,
          color: "rgba(255,255,255,0.6)",
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        {label}
      </span>
    </div>
  );
}
