# Video Reel Maker – Plan

## Goal
User uploads trip photos and videos with notes (place, when, description). AI plans a 30–40s vertical (9:16) reel. Remotion renders it from the user's real media. User previews, edits, downloads/shares.

## Roles
- **AI (Copilot SDK, Node backend) = director.** Looks at images + notes (+ audio signals), outputs a storyboard JSON. It never generates video.
- **Remotion = editor.** Renders the storyboard JSON + original media into the MP4.
- **FFmpeg = helper.** Converts, shrinks, extracts frames and audio, measures loudness.
- **Whisper (optional, later) = transcriber.** Speech to text for clips with talking.

## Plain Flow
1. User uploads photos/videos and adds notes, then clicks "Make my reel".
2. Server prepares files:
   - Photos: used as is.
   - Videos: FFmpeg converts to standard H.264 MP4 (kept for final render) and extracts still frames (e.g. 1 every 3s, small JPGs, only for the AI).
   - Long videos (e.g. 5 min): extra signals – loudness per second (free, FFmpeg), optional transcript.
3. Server sends photos + frames (base64 / file attachments, with timestamps and notes in the prompt) to the AI via Copilot SDK. Prompt asks for JSON only.
4. Server validates JSON (Zod), fixes durations to total 30–40s.
5. Remotion renders the reel from the JSON using the **original** media. Videos use only the chosen segment (`trimStart`/`trimEnd`).
6. User previews (Remotion Player), edits captions/order/clips, regenerates if needed, then downloads/shares.
7. Uploads and renders are auto-deleted after expiry.

```
Upload → prepare (FFmpeg) → AI storyboard JSON → validate → Remotion render → preview → download
```

## Key Facts and Decisions
- Copilot SDK accepts **images only** (file path or base64 blob), no video/audio. Model must have `capabilities.supports.vision`; check `max_prompt_images` and `max_prompt_image_size` at runtime and batch if needed. SDK runs on the backend only.
- AI never watches a video: it sees sampled frames + text signals. Never send every frame.
- Audio is separate from frames. MVP mutes clip audio and uses music. Later: per-clip "keep sound" toggle with music ducking.
- FFmpeg is free (extract audio, loudness peaks). Speech-to-text is not FFmpeg: run Whisper self-hosted (free per use, costs compute) or a hosted API (pay per minute).
- Remotion: FE holds the composition + `@remotion/player` preview; backend holds the final render (`@remotion/renderer`, `@remotion/bundler`, needs Node + headless Chrome). Check Remotion license terms.
- Photos-only MVP needs no FFmpeg.
- VidPipe (htekdev/vidpipe) confirms the pattern: Copilot SDK agents decide, FFmpeg executes, transcripts guide highlights, cost tracking, review step before publish. Difference: it works from speech transcripts; we need vision for photo/clip content.

## Storyboard Schema (AI output)
```json
{
  "title": "Goa Weekend",
  "music_mood": "upbeat",
  "total_duration": 36,
  "scenes": [
    {
      "media_id": "a1",
      "type": "image",
      "duration": 3,
      "caption": "Sunrise at Baga Beach",
      "motion": "zoom_in",
      "transition": "fade",
      "focus": {"x": 0.5, "y": 0.4}
    },
    {
      "media_id": "v1",
      "type": "video",
      "trimStart": 74.0,
      "trimEnd": 77.5,
      "keepAudio": false,
      "caption": "Wave crashing",
      "reason": "Wave crashing, group laughing"
    }
  ]
}
```
Rules: total 30–40s, 2–4s per scene, strongest shot first, drop blurry/duplicate items, captions ≤ 8 words, use only user-provided facts (no invented places).

## Phases

### Phase 1 – Remotion reel in FE (no AI, no backend)
- [ ] Check FE framework; install `remotion`, `@remotion/player`
- [ ] `ReelComposition` 1080x1920, 30fps
- [ ] Scene component: image, Ken Burns motion, caption overlay, transitions
- [ ] Hard-coded `storyboard.sample.json` (5 photos)
- [ ] Preview with Player; render test MP4 via Remotion CLI
- [ ] Background music track
- Done when: sample reel plays in browser and exports.

### Phase 2 – AI storyboard (Node + Copilot SDK)
- [ ] Zod schema for storyboard
- [ ] Check model vision support and image limits
- [ ] Prompt: photos + notes → storyboard JSON only
- [ ] Validate, auto-fix durations, retry on invalid JSON
- [ ] Feed output into Phase 1 composition
- Done when: real photos produce a good reel.

### Phase 3 – Backend API
- [ ] `POST /api/reel` (files + notes) → job ID
- [ ] `GET /api/reel/:id` (status, progress, result URL)
- [ ] Background worker: analyze → plan → render
- [ ] Server-side Remotion render
- [ ] Storage with presigned uploads; cache by media+notes hash
- Done when: photos-only flow works end to end.

### Phase 4 – FE upload UI (MVP complete)
- [ ] Upload form (drag/drop, per-item notes, style picker)
- [ ] Upload progress/retry, job status screen
- [ ] Preview with Player; edit captions, reorder, remove, regenerate
- [ ] Download and share
- Done when: a user makes a reel without touching code.

### Phase 5 – Video clips
- [ ] Accept `video/*` (limits e.g. 10 min / size cap, validate server-side)
- [ ] FFmpeg: transcode to H.264, downscale, extract frames (1 per 2–3s)
- [ ] Filter blurry/dark/duplicate frames; send best 15–30 with timestamps
- [ ] Scene-change detection to find cut points
- [ ] Loudness peaks per second (FFmpeg) as highlight signal
- [ ] AI returns `trimStart`/`trimEnd`; Remotion trims at render
- [ ] Timeline UI for user to accept/adjust suggested clips
- [ ] Per-clip keep-sound toggle with music ducking

### Phase 6 – Extras and hardening
- [ ] Optional Whisper transcript (self-hosted or API) for clips with speech
- [ ] Mood-tagged royalty-free music library; AI picks mood
- [ ] Optional TTS voiceover; optional blog text from same storyboard
- [ ] Extra aspect ratios (square, landscape)
- [ ] Rate limits, auto-delete uploads/renders, retries, error states
- [ ] Strip GPS/EXIF from outputs
- [ ] Cost tracking (LLM, transcription, render)
- [ ] Remotion license and music licensing check

## Risks
- Render time/CPU/RAM (Chrome-based): use job queue, preview in browser, render on download.
- iPhone HEVC/MOV compatibility: FFmpeg transcode.
- Model image limits: batch frames, read limits at runtime.
- LLM hallucinating places: restrict to user-provided facts.
- Personal media privacy: expiry, deletion, strip GPS.
- Long-video highlights missed by frames alone: add loudness (and later transcript) signals.

## MVP Definition
Photos + notes → AI storyboard → Remotion render → preview and download a 30–40s MP4 with captions and music. Video clips and audio signals come after.

## Next Step
Start Phase 1: inspect the FE project, install Remotion, build the sample reel.
