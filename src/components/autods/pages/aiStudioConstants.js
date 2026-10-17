export const MAX_INPUT_IMAGES = 20;
export const MAX_PROMPTS = 6;

export const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1", sub: "Square" },
  { value: "16:9", label: "16:9", sub: "Landscape" },
  { value: "9:16", label: "9:16", sub: "Portrait" },
  { value: "4:3", label: "4:3", sub: "Landscape" },
  { value: "3:4", label: "3:4", sub: "Portrait" },
  { value: "custom", label: "Custom", sub: "" },
];

export const OUTPUT_FORMATS = ["PNG", "JPG", "WEBP"];

export const TEMPLATE_BADGES = ["Popular", "New", "Premium"];

export const POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

export const POSITION_LABELS = {
  "top-left": "Top Left",
  "top-center": "Top Center",
  "top-right": "Top Right",
  "middle-left": "Middle Left",
  center: "Center",
  "middle-right": "Middle Right",
  "bottom-left": "Bottom Left",
  "bottom-center": "Bottom Center",
  "bottom-right": "Bottom Right",
};
