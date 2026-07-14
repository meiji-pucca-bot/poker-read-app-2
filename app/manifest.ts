import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Poker Read",
    short_name: "Poker Read",
    description: "AIでポーカーハンドを振り返る学習アプリ",
    start_url: "/",
    display: "standalone",
    background_color: "#07150f",
    theme_color: "#0b6b3a",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}