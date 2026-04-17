import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          backgroundColor: "#162D5A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: "bold",
            fontStyle: "italic",
            color: "#e8e8e8",
            lineHeight: 1,
            marginTop: 8,
          }}
        >
          S
        </div>
      </div>
    ),
    { ...size }
  );
}
