// src/constants/themes.ts
export const CYBERPUNK_THEME = {
  colors: ["#00FFFF", "#FF00FF", "#FFFF00", "#111111", "#FFFFFF"],
  symbols: ["<", ">", "/", "{", "}", "[", "]", "_", "\\", "*"],
  patterns: [
    { backgroundImage: "linear-gradient(90deg, #00FFFF 50%, #FF00FF 50%)" },
    { backgroundImage: "repeating-linear-gradient(0deg, #FFFF00, #FFFF00 2px, #111 2px, #111 4px)" },
    { backgroundImage: "linear-gradient(#00FFFF 1px, transparent 1px), linear-gradient(90deg, #FF00FF 1px, transparent 1px)", backgroundSize: "4px 4px", backgroundColor: "#111" }
  ]
};