# Game Boy Display Simulator

Upload a photo or a short video clip and see it through seven authentic Game
Boy screens — from the pea-soup green of the original 1989 DMG to the backlit
brilliance of the AGS-101 — rendered inside a faithful, fully interactive CSS
recreation of the original hardware.

Built with **Vue 3**, **Vite**, and **Tailwind CSS 4**.

## Features

### Seven authentic screen simulations

| Screen | Year | Character |
|---|---|---|
| DMG (Game Boy) | 1989 | 4 shades of green, ordered dithering, no light |
| Pocket | 1996 | True grayscale, sharper panel |
| Light | 1998 | EL backlit, pale cyan glow (Japan only) |
| Color | 1998 | 15-bit colour, reflective unlit TFT |
| GBA | 2001 | 15-bit colour, infamously dim |
| SP·001 | 2003 | Frontlit — even but washed-out blue haze |
| SP·101 | 2005 | Backlit — bright, vivid, two brightness levels |

All screens render at a unified 160×144 for easy comparison.

### A working replica of the hardware

- **Power switch** — boots the unit: Nintendo logo sweep + the classic
  two-note chime (Web Audio), then your image fades in
- **D-pad** — pans the image across the screen, clamped so it can never
  reveal blank space (arrow keys work too)
- **A / B buttons** — cycle through the seven screen types
- **SELECT** — opens the display-notes panel: hardware traits of the real
  panel plus exactly how the app reproduces it (ESC or × dismisses)
- **START** — plays / pauses a loaded video clip (spacebar works too); with a
  photo loaded, scrolls to the configuration panel on mobile
- **Contrast wheel** — a half-buried thumbwheel on the left edge; drag it or
  hover and scroll to bias brightness/contrast, just like the LCD voltage dial
- **Battery LED** — red or green depending on the model, dark when powered off

### Play It Loud! shell colours

Six shells: Original gray, Red, Yellow, Green, Blue, and Black — each with
matching label ink and button colours.

### Photo & video handling

- Load via the **Insert cartridge** button or drag-and-drop anywhere
- Short video clips play live through the same pixel pipeline — every screen
  type, the d-pad, and the contrast wheel all work on moving footage; clips
  loop muted (sound design is planned for a later phase)
- **Save screenshot** — download the current screen as a 4× PNG (grabs the
  current frame when a clip is loaded)
- **Save all × 7** — download all seven screens as one labeled PNG, laid out
  horizontally (→) or stacked vertically (↓)
- Toggles for Bayer ordered dithering (mono models) and the LCD pixel-gap grid

## Getting started

```bash
npm install
npm run dev      # dev server with HMR
```

```bash
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

## Project structure

```
app/
├── index.html            Entry point
├── vite.config.js        Vue + Tailwind plugins
└── src/
    ├── main.js           App bootstrap
    ├── App.vue           Template + all component logic
    ├── styles.css        Tailwind import + hardware CSS
    ├── utils.js          Bayer matrix, clamp
    └── data/
        └── models.js     Screen definitions + shell themes
```

## How the simulation works

Every frame runs through a four-step pipeline:

1. **Cover-fit & downscale** — the source image is scaled to the panel's
   native 160×144 with high-quality smoothing, honouring the current pan
   offset (clamped to the image edges)
2. **Per-pixel transform** —
   - *Mono models*: luminance → 4×4 Bayer ordered dither → snap to the
     model's 4-shade palette
   - *Colour models*: each channel crushed from 8-bit to 5-bit (32 steps,
     matching the real 15-bit hardware depth), then a per-model grade for
     brightness/contrast/saturation — plus a bluish wash for the frontlit
     SP·001
3. **Contrast dial pre-pass** — the wheel applies an LCD-voltage-style
   brightness/contrast bias before the model transform
4. **Nearest-neighbour upscale ×4** via `image-rendering: pixelated`, with
   the LCD pixel-gap grid (and EL bloom for the Light) drawn on top

The same `paintScreen(canvas, model)` routine drives both the live display
and the filmstrip export.

## Controls summary

| Input | Action |
|---|---|
| D-pad / arrow keys | Pan the image (edge-clamped) |
| A / B buttons | Next / previous screen type |
| SELECT | Toggle display-notes panel |
| ESC | Dismiss notes panel |
| START / spacebar | Play/pause clip; scroll to config (mobile, photo mode) |
| Contrast wheel | Drag or hover-scroll to adjust |
| Power switch | Boot animation + chime / power off |

---

Not affiliated with Nintendo. Game Boy is a trademark of Nintendo; this is a
non-commercial hardware appreciation project.
