import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const imgBuffer = readFileSync(join(process.cwd(), "src/app/setthetable_nobg.png"));
  const base64 = imgBuffer.toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} width={120} height={120} alt="" />
      </div>
    ),
    { ...size }
  );
}
