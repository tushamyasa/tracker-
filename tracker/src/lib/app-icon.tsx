import { ImageResponse } from "next/og";

/**
 * Иконка приложения: гантель на индиго-фоне. Рисуется без внешних шрифтов и файлов.
 * maskable — с запасом по краям, чтобы маска Android не обрезала рисунок.
 */
export function renderAppIcon(size: number, maskable = false) {
  const s = size;
  const pad = maskable ? 0.2 : 0.1;
  const inner = s * (1 - 2 * pad);
  const unit = inner / 10;
  const plate = (h: number) => ({
    width: unit * 1.6,
    height: unit * h,
    background: "#fff",
    borderRadius: unit * 0.4,
  });
  return new ImageResponse(
    <div
      style={{
        width: s,
        height: s,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#4f46e5",
        borderRadius: maskable ? 0 : s * 0.22,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", width: inner }}>
        <div style={{ ...plate(6) }} />
        <div style={{ ...plate(4), marginLeft: unit * 0.3 }} />
        <div
          style={{ flex: 1, height: unit * 1, background: "#fff", margin: `0 ${unit * 0.3}px` }}
        />
        <div style={{ ...plate(4), marginRight: unit * 0.3 }} />
        <div style={{ ...plate(6) }} />
      </div>
    </div>,
    { width: s, height: s },
  );
}
