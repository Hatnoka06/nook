# Sounds to replace with real files (optional for v1)

White, pink and brown noise are generated in the browser. The six below play a filtered-noise stand-in until you drop a file in `public/sounds/` with **exactly** this name:

| Source | File name |
|---|---|
| Rain | `rain.mp3` |
| Wind | `wind.mp3` |
| Ocean waves | `ocean.mp3` |
| Forest | `forest.mp3` |
| Café | `cafe.mp3` |
| Fireplace | `fireplace.mp3` |

Use CC0 or your own recordings (never files with unclear licences). Format: mp3, 128 kbps, 60–120 s, seamless loop, under 15 MB in total. To add a new source: drop the file and add one line to `SOURCES` in `src/lib/audio.ts` (plus its name in both `locales/*.json`).
