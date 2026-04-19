import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const imgBuffer = readFileSync(join(process.cwd(), "src/app/setthetable_nobg.png"));
  const dataUrl = `data:image/png;base64,${imgBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          backgroundColor: "#1e3a6e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} width={22} height={22} alt="" />
      </div>
    ),
    { ...size }
  );
}
