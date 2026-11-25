# AI Reel Generation – Approach

## Goal
Generate a reel from trip photos, videos and music that feels edited by a person, not like a slideshow.

## Core principle
**Code does the editing. The LLM only makes small, structured creative decisions.**
A vision model understands meaning; conventional tools (FFmpeg, Sharp, math) do measurements.

| Job | Who | How |
|---|---|---|
| Understand photos/videos | Vision LLM | Photo + video analysis pipelines (done) |
| Music beats, BPM, energy | Code | FFmpeg decode -> RMS/onsets -> tempo -> beat grid |
| Music mood | Curated library | 50-100 royalty-free tracks tagged by hand (romantic, fun, chill, epic) |
| Pick best moments | Code | `reelScore`, `storyRoles`, dedupe |
| Story order, title, reasons | LLM (text only) | Reads analysis JSON, output validated with Zod |
| Timing | Code | Cuts snapped to beats, best memory on the peak |
| Render | Remotion | Reads the edit plan JSON |

The LLM cannot hear music, so music is measured by code and mood comes from tags.

## Pipeline
1. **Create Reel click** -> `reelQueue` job `{ memoryId }`.
2. **Fan-out** (BullMQ FlowProducer): one batch job per media tag/place, storyboard job as parent.
3. **Photo analysis**: download from CDN, Sharp quality signals, duplicate hash, vision model (batches of 10).
4. **Video analysis**: FFprobe, FFmpeg frames + scene changes, optional Whisper, two-pass vision model (contact sheets for one-image models), save segments.
5. **Music analysis** (cached per track): BPM, `beats[]`, `energyCurve[]`, mood tags.
6. **Storyboard worker**: load analysed media, build the edit plan (below).
7. **Review loop** with the user, then final render.

## Music analysis (per track, stored once)
```ts
type MusicAnalysis = {
  trackId: number;
  durationSec: number;
  bpm: number;
  beats: number[];
  energyCurve: { startSec: number; endSec: number; energy: number }[]; // 0..1
};
```
Steps: FFmpeg to mono PCM -> frames (1024 samples, hop 512) -> RMS per frame -> onset envelope -> autocorrelation for BPM -> beat grid -> energy per bar (normalised).
Libraries: `essentia.js` or Python `librosa` as a child process.

### Current uploaded-song window selection

The backend uses FFmpeg to analyse the upload and `WHISPER_URL` (`/asr`) to transcribe vocals. Copilot compares beat-aligned excerpts with their energy, timestamped transcript snippets, available clips, and the user's suggestion. It picks a window ID and a shot sequence; the backend validates the choice against that window's beat grid. An explicit `musicStartSec` limits the director to that starting window. If transcription is unavailable, the director uses the audio measurements without text. If AI direction fails, the existing code picker and energy-based music start are used.

## Matching clips to the song

The reel director reviews all candidates with saved visual analysis for the selected places, with no photo score cutoff or 60-clip cap. It receives one labeled contact sheet per preview request: thumbnails for photos and timestamped stills from analysed video segments, not full videos. The final request carries the full candidate list and music analysis; the director uses the earlier visual reviews to select a subset. Failed previews are reported, and their saved analysis remains eligible.

- Each clip gets a **motion** value 0..1 (many scene changes = high; photos = low).
- Each song slot has **energy** 0..1 and a section (intro, build, peak, outro).
- Fill highest-energy slots first. Score = `reelScore/10 - |motion - energy|`, with a bonus for the best clip on the peak, `opener` roles in the intro and `ending` roles in the outro.
- Calm scenes hold 4 beats; energetic scenes cut every 1-2 beats.

## What avoids the slideshow look
- Hook in the first 1-2 seconds using the best shot, then build, peak, ending.
- Mix video clips and photos.
- Motion on every photo (slow zoom/pan toward `focalPoint`, alternating direction).
- Varied clip lengths, cuts on beats.
- 3-4 consistent transition types.
- Minimal text (e.g. place name).

## User input flow
Order: **template -> emotion message -> music slot -> make reel**.

1. **Template** (main path). The user picks a story shape; a default (e.g. "Place by Place") is used if none is chosen. Each step is a rule matched against analysis fields (`scene`, `subjects`, `storyRoles`, `shotType`).
   ```ts
   type Template = {
     name: string;
     steps: {
       label: string;
       match: { scenes?: string[]; roles?: string[]; keywords?: string[] };
       weight: number;      // share of the song
       onPeak?: boolean;    // best memory goes here
     }[];
   };
   ```
   Example templates: Morning to Sunset (bed/sunrise -> journey -> arrival -> enjoying/dancing -> sunset), Journey Story, Hype Montage, Place by Place, Chill Vlog.
2. **Emotion message** (e.g. "I felt peaceful and free"). The LLM converts it to a fixed-vocabulary value validated with Zod, e.g. `{ mood: "peaceful", pace: "slow", energy: "low" }`. Moods: peaceful, happy, romantic, adventurous, nostalgic, fun (same vocabulary as photo `ai.mood` and music tags).
3. **Music slot**. Tracks are filtered by the chosen mood; the user picks a track and a time range. Mismatched picks are allowed.
4. **Make the reel**. Pace sets beats per clip (slow = 4, fast = 1-2); mood nudges clip ranking; template steps are filled and snapped to the beat grid.

Optional extras:
- **Pin a clip** to a step (`{ type: "media", mediaId }`); revisions never touch pinned items.
- **Short note** (e.g. "end with the sunset") is converted by the LLM into a template change (swap a step, change weights), validated by Zod.

```ts
type ReelRequest = {
  templateId: string;
  emotion: { mood: string; pace: "slow" | "medium" | "fast"; energy: "low" | "medium" | "high" };
  music: { trackId: number; startSec: number; endSec: number };
  pins?: { stepIndex: number; mediaId: number }[];
  note?: string;
};
```
If a step has no matching media (e.g. no sunset found), tell the user and offer to skip or choose an alternative; never fill it with a random clip silently.

### Current reel chat storage

`room:createReel` accepts optional `roomId` and `userName`, and uses `userSuggestion` as the user message. It creates a `MemoriesChats` row before generation, then stores the generated script as JSON in that row's `botMessage`. Send `roomId` to retrieve the row through `room:fetchRoomChats`; without it, the row is saved without a room. If generation fails, `botMessage` remains null. A success event is emitted only after the script is saved.

## User workflow (iterate until happy)
1. **Input**: the `ReelRequest` above (template, emotion, music slot, optional pins and note).
2. **Plan v1 ("script")**: code builds the edit plan; the LLM turns the prompt into constraints and writes one-line reasons. Example:
   ```
   0:00-0:03  Intro (calm)     Video: Manali valley wide   "Sets the place"
   0:03-0:08  Build            Photos: coffee, fort        "Cuts every 2 beats"
   0:08-0:16  Peak             Video: friends jumping      "Best moment on the drop"
   0:16-0:24  Outro (slow)     Photo: sunset               "Calm ending"
   ```
3. **Draft preview**: play live in Remotion (instant, free).
4. **Feedback**: edit the reel, edit the script, or tell the chat what to change.
5. **Revise**: feedback becomes a patch to the edit plan JSON (v2, v3, ...). Code re-snaps to beats and re-validates.
6. Loop until approved, then **final render once**.

## Rules for the loop
- **Edit plan JSON is the single source of truth**, with a version number. Script view, preview and render all read it.
- Keep every version (undo, debugging).
- Keep edits local: "end with the sunset" changes only the last slot.
- Let the user pin clips/slots; revisions never touch pinned items.
- Re-run beat snapping and duration checks after every change so the LLM cannot create an invalid timeline.
- Cap AI revisions per reel (e.g. 5) to control cost.
- Reasons shown to the user must come from real data (slot energy, clip score, roles), never invented.
- Keep the plan short (4-6 rows).

## Decisions still open
- Draft preview: live Remotion (recommended start) vs rendered draft.
- Revision cap per reel.
- Music slot: user picks a range, or user picks the track and the system picks the peak section (easier).

## Next steps
1. Fix `reelWorker` to build batches from actual media tags; make batch creation safe on retry.
2. Define the edit plan JSON schema (Zod).
3. Music analysis + curated track library.
4. Storyboard worker: load results, build plan v1.
5. Chat-driven plan patching and versioning.
6. Socket.IO progress events for the frontend.
7. Remotion composition that renders the plan.
