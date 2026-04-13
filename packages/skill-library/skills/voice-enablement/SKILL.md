---
name: voice-enablement
version: "1.0.0"
description: |
  Production-tested voice enablement patterns with Deepgram STT, ElevenLabs TTS, and Silero VAD.
  Use when asked about: voice features, speech-to-text, text-to-speech, voice UI,
  conversation mode, VAD, Deepgram, ElevenLabs, voice-enabled apps, or adding
  voice interaction to any web application.
---

# Voice Enablement — Complete Architecture Reference

## Overview
Production-tested patterns for voice-enabled applications, battle-hardened across two live apps:
- **NFL GameSenseAI** (Next.js) — "Huddle" feature with conversation mode, auto-open FAB, proactive coach
- **Study Partner** (Vite PWA) — Conversation mode chat, VAD + Deepgram STT, ElevenLabs TTS

Stack: Deepgram Nova-3 (STT), ElevenLabs (TTS), Silero VAD (@ricky0123/vad-web), Zustand (state)

---

## Architecture: Full Voice Loop

```
User speaks → VAD detects speech end → Float32Array → encodeWAV → Deepgram STT → transcript
                                                                                     ↓
                                                                               AI processes
                                                                                     ↓
                                              ElevenLabs TTS ← Response text (stripped markdown)
                                                    ↓
                                        HTMLAudio.play() → VAD paused (echo prevention)
                                                    ↓
                                        Audio ends → delay 300-800ms → VAD.start() → listening
```

---

## 1. Conversation Mode Hook (Core Engine)

The `useConversationMode` hook orchestrates VAD → STT → TTS with echo prevention.

### State Machine
```
idle → listening → hearing → processing → speaking → listening (loop)
```

| State | Description | Visual |
|-------|-------------|--------|
| `idle` | Not started | No indicator |
| `listening` | VAD active, waiting for speech | Pulsing mic |
| `hearing` | VAD detected speech start | Animated waveform bars |
| `processing` | STT transcribing or AI responding | Bouncing dots |
| `speaking` | TTS playing response | Speaker icon with pulse |
| `error` | Something went wrong | Error message |

### Critical Guards

**Concurrent start prevention** — `MicVAD.new()` takes 2-5 seconds. Without a guard, button-mashing creates duplicate VAD instances:
```typescript
const startingRef = useRef(false)
const start = useCallback(async () => {
  if (startingRef.current || vadRef.current) return
  startingRef.current = true
  try {
    const vad = await MicVAD.new({ ... })
    vadRef.current = vad
  } finally {
    startingRef.current = false
  }
}, [])
```

**Generation counter for cancellation** — stop() may be called while start() is in-flight:
```typescript
const generationRef = useRef(0)

const start = async () => {
  const gen = generationRef.current
  const vad = await MicVAD.new({ ... })
  if (gen !== generationRef.current) { vad.destroy(); return } // Cancelled
  vadRef.current = vad
}

const stop = () => {
  generationRef.current++ // Invalidates all in-flight ops
  vadRef.current?.destroy()
  vadRef.current = null
}
```

**Mounted ref** — prevent setState after unmount:
```typescript
const mountedRef = useRef(true)
useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])
```

### Echo Prevention — VAD ↔ TTS

**The most critical design issue.** VAD picks up TTS audio output as user speech → feedback loop.

**Pattern A: Zustand subscribe (NFL Huddle — recommended)**
```typescript
useEffect(() => {
  if (!isActive) return
  const unsub = useTTSStore.subscribe((ttsState) => {
    if (!vadRef.current || !mountedRef.current) return
    if (ttsState.speaking || ttsState.loading) {
      if (resumeTimerRef.current) { clearTimeout(resumeTimerRef.current); resumeTimerRef.current = null }
      vadRef.current.pause()
      setState(ttsState.speaking ? 'speaking' : 'processing')
    } else {
      resumeTimerRef.current = setTimeout(() => {
        resumeTimerRef.current = null
        if (vadRef.current && mountedRef.current && isActiveRef.current) {
          vadRef.current.start()
          setState('listening')
        }
      }, 300) // 300ms echo drain delay
    }
  })
  return () => { unsub(); if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current) }
}, [isActive])
```

**Pattern B: React useEffect (Study Partner)**
```typescript
const vadPausedByTTSRef = useRef(false)
useEffect(() => {
  if (!vadRef.current) return
  if (ttsSpeaking || ttsLoading) {
    vadRef.current.pause()
    vadPausedByTTSRef.current = true
    setState(ttsLoading ? 'processing' : 'speaking')
  } else if (vadPausedByTTSRef.current) {
    vadPausedByTTSRef.current = false
    const currentVad = vadRef.current
    setTimeout(() => {
      if (vadRef.current === currentVad && currentVad) {
        currentVad.start()
        setState('listening')
      }
    }, 800) // 800ms echo drain (higher for PWA — no AEC on some mobile browsers)
  }
}, [ttsSpeaking, ttsLoading])
```

**Echo drain delay**: 300ms works on desktop with AEC. 800ms safer for mobile/PWA where AEC may be absent.

### Stop with TTS Cleanup
```typescript
const stop = useCallback(() => {
  generationRef.current++
  startingRef.current = false
  if (resumeTimerRef.current) { clearTimeout(resumeTimerRef.current); resumeTimerRef.current = null }
  if (vadRef.current) { vadRef.current.destroy(); vadRef.current = null }
  useTTSStore.getState().stop() // Kill any playing TTS
  isActiveRef.current = false
  setIsActive(false)
  setState('idle')
}, [])
```

---

## 2. VAD Configuration — @ricky0123/vad-web

### MicVAD.new() Options
```typescript
const vad = await MicVAD.new({
  startOnLoad: true,
  model: 'legacy',                                // Silero VAD v4 legacy — small, fast
  baseAssetPath: `${window.location.origin}/`,     // MUST be absolute URL (see pitfalls)
  onnxWASMBasePath: `${window.location.origin}/`,  // MUST be absolute URL (see pitfalls)

  // CRITICAL for mobile — avoid SharedArrayBuffer/COOP/COEP requirement
  ortConfig: (ort) => {
    const env = ort.env as { wasm: { numThreads?: number } }
    env.wasm.numThreads = 1
  },

  onSpeechStart: () => setState('hearing'),
  onSpeechEnd: (audio: Float32Array) => transcribeAndSend(audio),
  onVADMisfire: () => setState('listening'),
})
```

### Required Static Assets (copy to `public/`)
From `node_modules/@ricky0123/vad-web/dist/`:
- `silero_vad_legacy.onnx` (~1.8MB)
- `vad.worklet.bundle.min.js` (~2KB)

From `node_modules/onnxruntime-web/dist/`:
- `ort-wasm-simd-threaded.wasm` (~12MB)
- `ort-wasm-simd-threaded.mjs` (~24KB) **← CRITICAL**
- `ort-wasm-simd-threaded.jsep.mjs` (~24KB) **← CRITICAL for onnxruntime-web ≥1.24**

**ONNX Runtime ≥1.24 uses JSEP variant.** If missing, you get: `"no available backend found"` or `"SyntaxError: Unexpected token '<'"`.

### Timeout — WASM compile can hang on slow connections
```typescript
const vad = await Promise.race([
  MicVAD.new({ ... }),
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Voice setup timed out')), 15_000)
  ),
])
```

### Why numThreads = 1
Multi-threaded WASM requires `SharedArrayBuffer` which requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers. These headers **break third-party resources** (Supabase, Google OAuth, CDNs). Silero VAD is tiny — single-threaded runs fine.

---

## 3. Service Worker (PWA) — WASM File Serving

### The Problem
The PWA service worker intercepts requests. If WASM/ONNX/MJS files aren't excluded from `navigateFallback`, the SW serves `index.html` instead → `SyntaxError: Unexpected token '<'` (HTML parsed as JS).

### Vite PWA Config
```typescript
// vite.config.ts
VitePWA({
  workbox: {
    navigateFallback: '/index.html',
    // MUST include mjs to prevent ONNX runtime loading failure
    navigateFallbackDenylist: [/\.(?:onnx|wasm|mjs|js|css|json|png|jpg|svg|ico|woff2?|mp3|wav|webm)$/],
    runtimeCaching: [
      {
        urlPattern: /\.mjs$/,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'mjs-modules', expiration: { maxEntries: 20, maxAgeSeconds: 604800 } },
      },
      {
        urlPattern: /\.(?:wasm|onnx)$/,
        handler: 'NetworkFirst',
        options: { cacheName: 'ml-models', expiration: { maxEntries: 5, maxAgeSeconds: 2592000 } },
      },
    ],
  },
})
```

### Netlify MIME Types
```toml
[[headers]]
  for = "/*.mjs"
  [headers.values]
    Content-Type = "application/javascript"

[[headers]]
  for = "/*.onnx"
  [headers.values]
    Content-Type = "application/octet-stream"

[[headers]]
  for = "/*.wasm"
  [headers.values]
    Content-Type = "application/wasm"
```

---

## 4. Deepgram (Speech-to-Text)

### API
- **Endpoint**: `https://api.deepgram.com/v1/listen`
- **Auth**: `Authorization: Token YOUR_API_KEY`
- **Method**: POST with raw audio body
- **Key params**: `model=nova-3&language=en&smart_format=true&punctuate=true`

### Edge Function (Supabase/Deno)
```typescript
const response = await fetch(
  'https://api.deepgram.com/v1/listen?model=nova-3&language=en&smart_format=true&punctuate=true',
  {
    method: 'POST',
    headers: {
      'Authorization': `Token ${Deno.env.get('DEEPGRAM_API_KEY')}`,
      'Content-Type': contentType, // audio/wav from VAD, audio/webm from MediaRecorder
    },
    body: audioBuffer,
  }
)
const result = await response.json()
const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
```

### Next.js API Route
```typescript
// app/api/ai/stt/route.ts
const dgResponse = await fetch(
  'https://api.deepgram.com/v1/listen?model=nova-3&language=en&smart_format=true&punctuate=true',
  { method: 'POST', headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`, 'Content-Type': contentType }, body: audioBody }
)
```

### Client: VAD → WAV → STT
```typescript
// In conversation mode — VAD provides Float32Array
onSpeechEnd: (audio: Float32Array) => {
  const wavBuffer = utils.encodeWAV(audio)
  const blob = new Blob([wavBuffer], { type: 'audio/wav' })
  // POST blob.arrayBuffer() to STT endpoint
}
```

### Client: MediaRecorder → WebM → STT (press-to-talk)
```typescript
const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
const recorder = new MediaRecorder(stream, {
  mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm',
})
const chunks: Blob[] = []
recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
recorder.onstop = async () => {
  stream.getTracks().forEach(t => t.stop()) // Release mic
  const blob = new Blob(chunks, { type: recorder.mimeType })
  const transcript = await transcribeWithDeepgram(blob)
}
```

### Fallback: Web Speech API (free, no API key)
```typescript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
recognition.continuous = false
recognition.interimResults = true // Show live transcript
recognition.lang = 'en-US'
recognition.onresult = (event) => { /* extract transcript */ }
recognition.start()
```

---

## 5. ElevenLabs (Text-to-Speech)

### API
- **Endpoint**: `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
- **Auth**: `xi-api-key: YOUR_API_KEY`
- **Model**: `eleven_flash_v2_5` (Deno Edge Functions) or `eleven_multilingual_v2` (Node/Next.js)
- **Returns**: Audio buffer (mp3_44100_128)

### Model Selection
| Runtime | Model | Why |
|---------|-------|-----|
| Supabase Edge Functions (Deno) | `eleven_flash_v2_5` | Faster response, avoids gesture timeout |
| Next.js API Routes (Node) | `eleven_multilingual_v2` | Full quality, streaming works natively |

### Voice IDs
| Voice ID | Name | Style |
|----------|------|-------|
| `EXAVITQu4vr4xnSDxMaL` | Sarah | Soft, clear |
| `FGY2WhTYpPnrIDTdsKH5` | Laura | Warm, friendly |
| `XB0fDUnXU5powFXDhCwa` | Charlotte | Natural, calm |
| `pFZP5JQG7iQjIQuC4Bku` | Lily | Young, bright |
| `bIHbv24MWmeRgasZH58o` | Will | Male, warm |
| `nPczCjzI2devNBz1zQrb` | Brian | Male, deep |
| `N2lVS1w4EtoT3dr4eOWO` | Callum | Male, natural |
| `JBFqnCBsd6RMkjVDRZzb` | George | Male, British |

### Text Length Limits
The client may send long text (e.g. "Listen All" concatenates all sections). Use a generous validation limit and truncate before ElevenLabs:
```typescript
const MAX_TEXT_LENGTH = 10000  // Generous — real limit is truncation below
if (text.length > MAX_TEXT_LENGTH) return 400
const truncatedText = text.slice(0, 2500)  // ElevenLabs per-request limit
```
**CRITICAL**: Do NOT set `MAX_TEXT_LENGTH` too low (e.g. 3000). "Listen All" routinely sends 3000-5000+ chars. The truncation to 2500 is the real safety net.

### Edge Function Pattern — Supabase/Deno (MUST use buffered response)
```typescript
// CRITICAL: Streaming response.body through Deno Edge Functions is unreliable.
// Use buffered arrayBuffer() — this is battle-tested.
const ttsUrl = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`)
ttsUrl.searchParams.set('output_format', 'mp3_44100_128')
const response = await fetch(ttsUrl.toString(), {
  method: 'POST',
  headers: {
    'xi-api-key': apiKey,
    'Content-Type': 'application/json',
    'Accept': 'audio/mpeg',
  },
  body: JSON.stringify({
    text: truncatedText,
    model_id: 'eleven_flash_v2_5',
    voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
  }),
})
const audioBuffer = await response.arrayBuffer()
return new Response(audioBuffer, {
  headers: {
    'Content-Type': 'audio/mpeg',
    'Content-Length': audioBuffer.byteLength.toString(),
  },
})
```

### Edge Function Pattern — Next.js/Node (streaming OK)
```typescript
const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
  method: 'POST',
  headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
  }),
})
return new Response(response.body, { headers: { 'Content-Type': 'audio/mpeg' } })
```

### Deno vs Node Streaming — Why It Matters
| | Deno Edge Functions | Node/Next.js |
|---|---|---|
| Streaming `response.body` | **Unreliable** — may corrupt/truncate audio | Works fine |
| Buffered `arrayBuffer()` | **Reliable** — battle-tested | Works fine |
| `Content-Length` header | Required for reliable blob creation | Optional |
| `output_format` param | Include explicitly | Optional |
| `Accept: audio/mpeg` header | Include explicitly | Optional |

### Fallback: Browser Speech Synthesis
```typescript
const utterance = new SpeechSynthesisUtterance(text)
utterance.rate = speed
speechSynthesis.speak(utterance)
```
**Safari gotcha**: `speechSynthesis.cancel()` must be called 2-3 times on iOS for reliability.
**Voice loading**: On Safari, voices load asynchronously. Await `voiceschanged` event before creating utterance.

---

## 6. TTS Store (Zustand)

Singleton audio state at module level — prevents multiple simultaneous audio sources.

### Architecture
```typescript
// Module-level (NOT in Zustand state — avoids unnecessary re-renders)
let activeAudio: HTMLAudioElement | null = null
let activeBlobUrl: string | null = null
let speakGeneration = 0 // Prevents stale speak() calls

interface TTSState {
  speaking: boolean
  loading: boolean
  currentElementId: string | null
}

// Sequential: try ElevenLabs → fall back to browser
speak: async (text, elementId) => {
  stop() // Always stop existing audio first
  const gen = ++speakGeneration
  set({ loading: true })
  const success = await tryElevenLabs(text, gen)
  if (gen !== speakGeneration) return // Bail if generation changed
  if (!success) {
    set({ loading: false })
    speakWithBrowser(text, gen)
  }
}
```

### Audio Lifecycle
```typescript
// ElevenLabs path
const blob = await response.blob()
const url = URL.createObjectURL(blob)
const audio = new Audio(url)
audio.playbackRate = speed
activeAudio = audio
activeBlobUrl = url

audio.onended = () => {
  if (gen !== speakGeneration) return
  URL.revokeObjectURL(url)
  activeAudio = null; activeBlobUrl = null
  set({ speaking: false })
}

audio.onerror = () => {
  // Clean up, then fall back to browser
  URL.revokeObjectURL(url)
  fallbackToBrowserTTS()
}

await audio.play()
if (gen !== speakGeneration) { audio.pause(); audio.src = ''; URL.revokeObjectURL(url) }
set({ speaking: true, loading: false })
```

### Stop with Full Cleanup
```typescript
stop: () => {
  speakGeneration++
  if (activeAudio) { activeAudio.pause(); activeAudio.src = ''; activeAudio = null }
  if (activeBlobUrl) { URL.revokeObjectURL(activeBlobUrl); activeBlobUrl = null }
  speechSynthesis.cancel()
  setTimeout(() => speechSynthesis.cancel(), 0)  // iOS reliability
  setTimeout(() => speechSynthesis.cancel(), 50)
  set({ speaking: false, loading: false, currentElementId: null })
}
```

---

## 7. UI Components

### ConversationIndicator — Replaces input area during conversation mode
```tsx
// Shows visual state: listening (pulsing mic), hearing (waveform bars),
// processing (bouncing dots), speaking (volume icon), with "End" stop button
<ConversationIndicator state={conversation.state} teamColor={color} onStop={conversation.stop} />
```

States:
- **listening**: Pulsing mic icon in colored circle + "Listening..." / "Start talking"
- **hearing**: 5 animated bars (waveBar animation, staggered delays) + "Hearing you..." / "Keep going..."
- **processing**: 3 bouncing dots (staggered 150ms delays) + "Processing..." / "Transcribing your message"
- **speaking**: Volume icon with pulsing sound waves + "Speaking..." / "Listening will resume after"

Layout: `flex items-center gap-3` — icon on left, labels in center, "End" button on right.

### SpeakerButton — Per-message TTS toggle
```tsx
// Placed on each assistant message — hover to reveal
<SpeakerButton text={msg.content} elementId={msg.id} size="sm" className="opacity-0 group-hover:opacity-100" />
```
Links to singleton TTS store. Shows active (animated bars) / loading (pulse) / idle (volume icon).

### Voice Toggle (Header)
Controls TTS auto-read independently from conversation mode:
```tsx
<button onClick={() => { setVoiceEnabled(!voiceEnabled); if (!voiceEnabled) ttsStore.stop() }}>
  <VolumeIcon active={voiceEnabled} />
</button>
```

### Conversation Mode Toggle (Header)
```tsx
<button
  onClick={() => {
    if (conversation.starting) return
    if (conversation.isActive) { conversation.stop() }
    else {
      if (!voiceEnabled) setVoiceEnabled(true) // Auto-enable TTS when starting conversation
      conversation.start()
    }
  }}
  disabled={conversation.starting}
  className={conversation.starting ? 'animate-pulse' : conversation.isActive ? 'bg-accent' : ''}
>
  <HeadphonesIcon />
</button>
```

### Huddle FAB (Floating Action Button)
```tsx
<button
  onClick={openHuddle}
  className="fixed right-3 z-40 h-12 rounded-full shadow-lg"
  style={{ bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
>
  <AiAvatar size={36} />
  <span>Ace</span>
</button>
```
Features: safe-area-inset positioning, page-aware context, auto-open on high-value pages (cooldown: 15min).

---

## 8. Chat Integration Patterns

### Auto-Read Prevention During Conversation Mode
When conversation mode is active, the TTS auto-read effect skips new messages (they're played via the conversation loop). But when conversation mode deactivates, those messages are "unread" and the auto-read plays them backward.

**Fix**: Mark all messages as read when conversation mode deactivates:
```tsx
const prevConversationActiveRef = useRef(false)
useEffect(() => {
  if (prevConversationActiveRef.current && !conversation.isActive) {
    messages.forEach((msg) => globalAutoReadIds.add(msg.id))
  }
  prevConversationActiveRef.current = conversation.isActive
}, [conversation.isActive, messages])
```

### Auto-Read Effect (one message at a time, no interruption)
```tsx
useEffect(() => {
  if (conversation.isActive) return // Managed by conversation loop
  if (!autoPlayAudio || sending) return
  if (tts.speaking || tts.loading) return // Don't interrupt

  const unread = [...messages].reverse()
    .find(msg => msg.role === 'assistant' && !globalAutoReadIds.has(msg.id))

  if (unread) {
    globalAutoReadIds.add(unread.id)
    tts.speak(unread.content, unread.id)
  }
}, [autoPlayAudio, messages, sending, tts.speaking, tts.loading, conversation.isActive])
```

### Stagger Delivery (NFL Huddle pattern)
Split multi-paragraph responses into sequential message bubbles with typing dots between:
```typescript
// After AI response completes:
const paragraphs = fullText.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
// First paragraph immediately, subsequent with 400ms typing dots + 50-200ms gap
deliverStaggered(paragraphs)
// TTS fires after all paragraphs delivered (staggerCompleteCallback)
```

### toSpeakableText — Markdown → Natural Speech
```typescript
function toSpeakableText(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')      // fenced code blocks (remove)
    .replace(/`([^`]+)`/g, '$1')         // inline code → plain
    .replace(/\*\*(.*?)\*\*/g, '$1')     // bold
    .replace(/\*(.*?)\*/g, '$1')         // italic
    .replace(/^#{1,6}\s+/gm, '')         // headings
    .replace(/^[-*+]\s+/gm, '')          // bullet lists
    .replace(/^\d+\.\s+/gm, '')          // numbered lists
    .replace(/https?:\/\/\S+/g, '')      // URLs
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
```

---

## 9. Settings Integration

### Settings Store Fields
```typescript
conversationMode: boolean  // Always-on voice loop (default: false for Study Partner, true for NFL Huddle)
ttsEnabled: boolean        // Audio output enabled (default: true)
autoPlayAudio: boolean     // Auto-read new assistant messages (default: true)
ttsVoice: string          // ElevenLabs voice ID or browser voiceURI
ttsSpeed: number          // Playback rate (0.75 - 1.5)
```

### Auto-Stop When Setting Disabled
```tsx
useEffect(() => {
  if (!conversationModeSetting && conversation.isActive) {
    conversation.stopConversation()
  }
}, [conversationModeSetting, conversation.isActive])
```

### Auto-Start on Modal Open (NFL Huddle pattern)
```tsx
const hasAutoStartedConversation = useRef(false)
useEffect(() => {
  if (hasAutoStartedConversation.current) return
  if (huddleVoice && !conversation.isActive && !conversation.starting) {
    hasAutoStartedConversation.current = true
    const timer = setTimeout(() => conversation.start(), 600) // After modal animation
    return () => clearTimeout(timer)
  }
}, [huddleVoice, conversation])
```

---

## 10. Stale Closure Prevention (Critical)

Voice code has many async operations that capture stale closures.

### Problem
```typescript
// BAD — messages captured at hook creation, stale by the time STT returns
const sendMessage = useCallback(async (text) => {
  const history = messages.slice(-8) // STALE!
}, [messages]) // But including messages makes sendMessage unstable
```

### Solution: Refs for Frequently-Changing Data
```typescript
const messagesRef = useRef<Message[]>([])
messagesRef.current = messages // Updated every render

const sendMessage = useCallback(async (text) => {
  const history = messagesRef.current.slice(-8) // Always fresh
}, []) // Stable callback — no dep churn
```

### Rule of Thumb
In voice code, any callback that reads from state AND is used in an effect/subscription must either:
1. Use refs for the state it reads (preferred — keeps callback stable)
2. Be included in the dependency array (only if the callback is genuinely stable)

---

## 11. Required Secrets

| Secret | Service | How to set |
|--------|---------|-----------|
| `DEEPGRAM_API_KEY` | Deepgram Nova-3 STT | `npx supabase secrets set DEEPGRAM_API_KEY=xxx` or `.env.local` |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS | `npx supabase secrets set ELEVENLABS_API_KEY=xxx` or `.env.local` |

---

## 12. Common Pitfalls (Production-Tested)

1. **Echo feedback loop**: Always pause VAD while TTS plays. Resume after a delay (300-800ms).
2. **`.mjs` missing from SW denylist**: ONNX runtime dynamically imports `.mjs` modules. If the service worker catches this and serves `index.html`, you get `SyntaxError: Unexpected token '<'`. Add `mjs` to `navigateFallbackDenylist`.
3. **`baseAssetPath: '/'` fails**: `new URL(filename, '/')` throws because `/` is not a valid absolute URL base. Use `${window.location.origin}/` instead.
4. **SharedArrayBuffer / COOP/COEP**: Multi-threaded WASM needs headers that break third-party resources. Set `numThreads = 1` via `ortConfig`.
5. **Concurrent VAD init**: `MicVAD.new()` is async (2-5s). Gate with `startingRef`. Disable button during init, show loading pulse.
6. **Stale speak() calls**: Use generation counter. Increment on every `stop()` and `speak()`. Check `gen !== speakGeneration` after every await.
7. **Safari speechSynthesis.cancel()**: Call 2-3 times for reliability on iOS. Use microtask delay between calls.
8. **Safari voice loading**: Voices load async. Await `voiceschanged` event before creating `SpeechSynthesisUtterance`, otherwise selected voice is ignored.
9. **getUserMedia requires user gesture**: On mobile browsers, mic access from a `useEffect` silently fails or shows a permissions prompt at the wrong time. Only call from button `onClick`.
10. **Missing `.jsep.mjs` file**: ONNX runtime ≥1.24 uses `ort-wasm-simd-threaded.jsep.mjs` (JSEP variant). If only the non-JSEP `.mjs` is in `public/`, you get `"no available backend found"`.
11. **Audio blob cleanup**: Always `URL.revokeObjectURL()` after `Audio.onended`. Guard against double-revoke when `stop()` races with natural end.
12. **MediaRecorder mimeType**: Check `isTypeSupported('audio/webm;codecs=opus')` — varies by browser.
13. **TTS loops old messages backward**: When conversation mode deactivates, auto-read finds all "unread" messages and reads them in reverse. Fix: mark all messages as read on deactivation transition.
14. **CORS**: Edge Functions need CORS headers for audio blob responses. Include in both success and error paths.
15. **WASM MIME types on hosting**: Ensure `.wasm` serves as `application/wasm`, `.mjs` as `application/javascript`, `.onnx` as `application/octet-stream`. Netlify needs explicit header rules.
16. **Unmount during async voice ops**: Always check `mountedRef.current` after every `await`. Voice hooks have many async paths (MicVAD.new, fetch STT, fetch TTS).
17. **Browser autoplay policy blocks ElevenLabs**: `audio.play()` requires user gesture context. If called from `useEffect` or `setTimeout` (no gesture), it throws `NotAllowedError` which the silent `catch` swallows → falls back to robotic browser speech. **Fix**: Only trigger TTS from click handlers (button onClick, section expand). NEVER from useEffect.
18. **Deno Edge Function streaming corrupts audio**: `return new Response(response.body)` through Supabase Edge Functions (Deno Deploy) silently corrupts or truncates audio. **Fix**: Buffer with `response.arrayBuffer()` and return the buffer with `Content-Length` header. See Section 5 for the correct pattern.
19. **MAX_TEXT_LENGTH too low**: "Listen All" concatenates all section audio_text (routinely 3000-5000+ chars). If `MAX_TEXT_LENGTH` is too low (e.g. 3000), the edge function returns 400 and the client silently falls back to robot voice. **Fix**: Set `MAX_TEXT_LENGTH` generously (10000+) since the real limit is the truncation to 2500 before ElevenLabs.
20. **Silent catch hides TTS failures**: `tryElevenLabs` uses `catch { return false }` — any error (auth, network, validation, autoplay) silently falls back to browser speech. During debugging, temporarily add `console.error('[TTS]', err)` to the catch block to see what's actually failing.

---

## 13. File Inventory (What Goes Where)

### Hooks
| File | Purpose |
|------|---------|
| `useConversationMode.ts` | VAD lifecycle, state machine, echo prevention |
| `useVoiceInput.ts` | Press-to-talk: MediaRecorder → Deepgram, Web Speech fallback |
| `useTTSStore.ts` (or `ttsStore.ts`) | Singleton TTS state, ElevenLabs → browser fallback |
| `useCoachHuddle.ts` | Chat messages, SSE streaming, stagger delivery, voice toggle |

### Components
| File | Purpose |
|------|---------|
| `ConversationIndicator.tsx` | Visual state indicator (listening/hearing/processing/speaking) |
| `SpeakerButton.tsx` | Per-element TTS toggle |
| `HuddleFAB.tsx` | Floating action button, page-aware context, auto-open |
| `CoachHuddleModal.tsx` | Full chat modal with voice controls in header |

### Server
| File | Purpose |
|------|---------|
| `stt/route.ts` or `stt/index.ts` | Deepgram proxy (hides API key) |
| `tts/route.ts` or `tts/index.ts` | ElevenLabs proxy (hides API key) |

### Config
| File | Change Needed |
|------|--------------|
| `vite.config.ts` | SW denylist + `.mjs`/`.wasm` runtimeCaching |
| `netlify.toml` | MIME type headers for `.mjs`, `.onnx`, `.wasm` |
| `public/` | VAD ONNX model + WASM files |
