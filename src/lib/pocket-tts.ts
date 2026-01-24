/**
 * Pocket TTS client for in-browser Web/WASM implementation.
 * Uses a Web Worker + ONNX Runtime Web (no Python, no torch).
 */

type PocketTTSStatus = "idle" | "loading" | "ready" | "running" | "error"

export interface PocketVoice {
  id: string
  name: string
  description: string
  language: string
}

export interface PocketTTSResponse {
  audio_base64: string
  sample_rate: number
  duration: number
}

const POCKET_TTS_SAMPLE_RATE = 24000
const DEFAULT_MODEL_BASE_URL = "/pocket-tts"
const DEFAULT_LSD = 2
const nowMs = () => (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now())

export const POCKET_VOICES: PocketVoice[] = [
  {
    id: "alba",
    name: "Alba",
    description: "Clear female voice, casual style",
    language: "English",
  },
  {
    id: "marius",
    name: "Marius",
    description: "Male voice with natural tone",
    language: "English",
  },
  {
    id: "javert",
    name: "Javert",
    description: "Deep authoritative male voice",
    language: "English",
  },
  { id: "jean", name: "Jean", description: "Warm male voice", language: "English" },
  { id: "fantine", name: "Fantine", description: "Gentle female voice", language: "English" },
  { id: "cosette", name: "Cosette", description: "Young female voice", language: "English" },
  { id: "eponine", name: "Eponine", description: "Expressive female voice", language: "English" },
  { id: "azelma", name: "Azelma", description: "Soft female voice", language: "English" },
]

type WorkerMessage =
  | { type: "status"; status?: string; state?: string }
  | { type: "model_status"; status?: string; text?: string }
  | { type: "loaded" }
  | { type: "voices_loaded"; voices: string[]; defaultVoice?: string }
  | { type: "voice_registered"; voiceName: string }
  | { type: "voice_set"; voiceName: string }
  | { type: "voice_encoded"; voiceName: string }
  | { type: "audio_chunk"; data: Float32Array; metrics?: { isLast?: boolean } }
  | { type: "stream_ended" }
  | { type: "boot_ready" }
  | { type: "log"; level: "info" | "warn" | "error"; message: string }
  | { type: "error"; error: string }

function toTitleCase(text: string) {
  return text
    .split(/[_-]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function mergeVoices(voiceNames: string[]): PocketVoice[] {
  if (!voiceNames.length) return POCKET_VOICES
  const byId = new Map(POCKET_VOICES.map((voice) => [voice.id, voice]))
  return voiceNames.map((id) => {
    const existing = byId.get(id)
    if (existing) return existing
    return {
      id,
      name: toTitleCase(id),
      description: "",
      language: "English",
    }
  })
}

function float32ToWavBase64(samples: Float32Array, sampleRate: number): string {
  const bytesPerSample = 2
  const blockAlign = bytesPerSample
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
  const view = new DataView(buffer)

  // RIFF header
  writeString(view, 0, "RIFF")
  view.setUint32(4, 36 + samples.length * bytesPerSample, true)
  writeString(view, 8, "WAVE")

  // fmt chunk
  writeString(view, 12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true) // 16-bit

  // data chunk
  writeString(view, 36, "data")
  view.setUint32(40, samples.length * bytesPerSample, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    let s = samples[i]
    s = Math.max(-1, Math.min(1, s))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    offset += 2
  }

  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i))
  }
}

export class PocketTTSService {
  private worker: Worker | null = null
  private readyPromise: Promise<void> | null = null
  private readyResolve: (() => void) | null = null
  private readyReject: ((err: Error) => void) | null = null
  private status: PocketTTSStatus = "idle"
  private statusMessage: string | null = null
  private statusListeners = new Set<(status: PocketTTSStatus, message?: string) => void>()
  private voices: PocketVoice[] = []
  private voiceNames: string[] = []
  private modelBaseUrl: string
  private workerReady = false
  private pendingLoad = false
  private pendingGeneration:
    | {
        resolve: (response: PocketTTSResponse) => void
        reject: (err: Error) => void
        chunks: Float32Array[]
        startedAt: number
      }
    | null = null
  private pendingVoice:
    | { resolve: () => void; reject: (err: Error) => void }
    | null = null
  private pendingVoiceRegisters = new Map<string, { resolve: () => void; reject: (err: Error) => void }>()
  private voiceRegisterPromise: Promise<void> | null = null
  private voiceLock: Promise<void> = Promise.resolve()
  private lsd: number = DEFAULT_LSD
  private loadAttempt = 0
  private loadStartAt: number | null = null
  private voiceRegisterStartAt: number | null = null

  constructor(baseUrl: string = DEFAULT_MODEL_BASE_URL) {
    this.modelBaseUrl = baseUrl.replace(/\/$/, "")
  }

  getLsd(): number {
    return this.lsd
  }

  setLsd(lsd: number) {
    const next = Math.max(1, Math.min(10, Math.round(lsd)))
    this.lsd = next
    console.log(`[PocketTTS] LSD set to ${next}`)
    if (this.worker) {
      this.worker.postMessage({ type: "set_lsd", data: { lsd: next } })
    }
  }

  getStatus(): { status: PocketTTSStatus; message: string | null } {
    return { status: this.status, message: this.statusMessage }
  }

  subscribeStatus(listener: (status: PocketTTSStatus, message?: string) => void): () => void {
    this.statusListeners.add(listener)
    listener(this.status, this.statusMessage || undefined)
    return () => this.statusListeners.delete(listener)
  }

  private setStatus(status: PocketTTSStatus, message?: string) {
    this.status = status
    this.statusMessage = message ?? null
    if (message) {
      console.log(`[PocketTTS] ${status}: ${message}`)
    } else {
      console.log(`[PocketTTS] ${status}`)
    }
    this.statusListeners.forEach((listener) => listener(status, message))
  }

  private ensureWorker() {
    if (this.worker) return

    const workerUrl = new URL("/pocket-tts/worker/boot-worker.js", window.location.origin).toString()
    console.log(`[PocketTTS] Spawning worker: ${workerUrl}`)
    if (!workerUrl.startsWith("blob:")) {
      fetch(workerUrl)
        .then(async (res) => {
          const contentType = res.headers.get("content-type") || "unknown"
          console.log(`[PocketTTS] Worker fetch ${res.status} (${contentType}): ${workerUrl}`)
          let snippet = ""
          try {
            const text = await res.text()
            snippet = text.slice(0, 200).replace(/\n/g, "\\n")
          } catch (err) {
            console.error("[PocketTTS] Worker fetch read failed:", err)
          }
          if (snippet) {
            console.log(`[PocketTTS] Worker body snippet: ${snippet}`)
          }
        })
        .catch((err) => {
          console.error("[PocketTTS] Worker fetch failed:", err)
        })
    } else {
      console.log("[PocketTTS] Worker URL is blob; skipping fetch check")
    }

    this.worker = new Worker(workerUrl, {
      type: "module",
    })

    this.worker.postMessage({ type: "set_lsd", data: { lsd: this.lsd } })

    this.worker.onmessage = (event) => {
      const message = event.data as WorkerMessage
      console.log("[PocketTTS] Worker message:", message)

      if ((message as { type?: string }).type === "boot_ready") {
        this.workerReady = true
        if (this.pendingLoad) {
          this.pendingLoad = false
          this.worker?.postMessage({ type: "set_model_base_url", data: { baseUrl: this.modelBaseUrl } })
          this.worker?.postMessage({ type: "load" })
        }
      }

      if (message.type === "status") {
        if (message.state === "loading") this.setStatus("loading", message.status)
        else if (message.state === "running") this.setStatus("running", message.status)
        else if (message.state === "idle" && this.status === "running")
          this.setStatus("ready", message.status)
        else this.setStatus(this.status, message.status)
      }

      if (message.type === "log") {
        const prefix = `[PocketTTS Worker]`
        if (message.level === "error") console.error(`${prefix} ${message.message}`)
        else if (message.level === "warn") console.warn(`${prefix} ${message.message}`)
        else console.log(`${prefix} ${message.message}`)
      }

      if (message.type === "model_status" && message.status === "ready") {
        this.setStatus("ready", message.text)
      }

      if (message.type === "loaded") {
        this.setStatus("ready", "Ready")
        if (this.loadStartAt !== null) {
          const elapsed = nowMs() - this.loadStartAt
          console.log(`[PocketTTS] Load complete in ${elapsed.toFixed(0)}ms (attempt ${this.loadAttempt})`)
          this.loadStartAt = null
        }
        this.readyResolve?.()
        this.readyResolve = null
        this.readyReject = null
        this.readyPromise = null
      }

      if (message.type === "voices_loaded") {
        this.voiceNames = message.voices
        this.voices = mergeVoices(message.voices)
        if (message.defaultVoice && !this.voiceNames.includes(message.defaultVoice)) {
          this.voiceNames.unshift(message.defaultVoice)
        }
      }

      if (message.type === "voice_registered") {
        if (!this.voiceNames.includes(message.voiceName)) {
          this.voiceNames.push(message.voiceName)
          this.voices = mergeVoices(this.voiceNames)
        }
        const pending = this.pendingVoiceRegisters.get(message.voiceName)
        if (pending) {
          pending.resolve()
          this.pendingVoiceRegisters.delete(message.voiceName)
        }
      }

      if (message.type === "voice_set" || message.type === "voice_encoded") {
        this.pendingVoice?.resolve()
        this.pendingVoice = null
      }

      if (message.type === "audio_chunk" && this.pendingGeneration) {
        this.pendingGeneration.chunks.push(new Float32Array(message.data))
      }

      if (message.type === "stream_ended" && this.pendingGeneration) {
        const combined = combineFloat32(this.pendingGeneration.chunks)
        const audio_base64 = float32ToWavBase64(combined, POCKET_TTS_SAMPLE_RATE)
        const duration = combined.length / POCKET_TTS_SAMPLE_RATE
        const elapsed = nowMs() - this.pendingGeneration.startedAt
        console.log(`[PocketTTS] Generation complete in ${elapsed.toFixed(0)}ms, duration=${duration.toFixed(2)}s`)
        this.pendingGeneration.resolve({
          audio_base64,
          sample_rate: POCKET_TTS_SAMPLE_RATE,
          duration,
        })
        this.pendingGeneration = null
        if (this.status !== "error") this.setStatus("ready")
      }

      if (message.type === "error") {
        const err = new Error(message.error)
        if (this.loadStartAt !== null) {
          const elapsed = nowMs() - this.loadStartAt
          console.warn(`[PocketTTS] Load failed after ${elapsed.toFixed(0)}ms: ${message.error}`)
          this.loadStartAt = null
        }
        for (const pending of this.pendingVoiceRegisters.values()) {
          pending.reject(err)
        }
        this.pendingVoiceRegisters.clear()
        if (this.pendingVoice) {
          this.pendingVoice.reject(err)
          this.pendingVoice = null
        }
        if (this.pendingGeneration) {
          this.pendingGeneration.reject(err)
          this.pendingGeneration = null
        }
        if (this.readyReject) {
          this.readyReject(err)
          this.readyReject = null
          this.readyResolve = null
          this.readyPromise = null
        }
        this.setStatus("error", message.error)
      }
    }

    this.worker.onerror = (err) => {
      const error = err instanceof ErrorEvent ? err.error || new Error(err.message) : new Error("Worker error")
      console.error("[PocketTTS] Worker error event:", err)
      if (this.readyReject) this.readyReject(error)
      this.setStatus("error", error.message)
    }

    this.worker.onmessageerror = (event) => {
      console.error("[PocketTTS] Worker message error:", event)
    }

    this.worker.postMessage({ type: "ping" })
  }

  private async ensureReady(): Promise<void> {
    if (this.status === "ready") return
    if (this.readyPromise) return this.readyPromise

    this.loadAttempt += 1
    this.loadStartAt = nowMs()
    console.log(`[PocketTTS] ensureReady start (attempt ${this.loadAttempt})`)
    this.setStatus("loading", "Loading models")
    this.ensureWorker()

    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolve = resolve
      this.readyReject = reject
    })

    if (this.workerReady) {
      this.worker?.postMessage({ type: "set_model_base_url", data: { baseUrl: this.modelBaseUrl } })
      this.worker?.postMessage({ type: "load" })
    } else {
      this.pendingLoad = true
    }

    return this.readyPromise
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureReady()
      return true
    } catch {
      return false
    }
  }

  async reload(): Promise<boolean> {
    this.worker?.terminate()
    this.worker = null
    this.readyPromise = null
    this.readyResolve = null
    this.readyReject = null
    this.setStatus("idle")
    return this.healthCheck()
  }

  private resolveVoicePromptUrl(voiceId: string): string | null {
    const promptPath = LOCAL_VOICE_PROMPTS[voiceId]
    if (!promptPath) return null
    if (promptPath.startsWith("http://") || promptPath.startsWith("https://")) return promptPath
    if (promptPath.startsWith("/")) return new URL(promptPath, window.location.origin).toString()
    return `${this.modelBaseUrl}/${promptPath}`
  }

  private async registerVoicePrompt(voiceId: string): Promise<void> {
    const url = this.resolveVoicePromptUrl(voiceId)
    if (!url) return
    console.log(`[PocketTTS] Registering voice "${voiceId}" from ${url}`)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch voice prompt for ${voiceId}: ${response.status}`)
    }
    const bytes = await response.arrayBuffer()
    const audio = await decodeAndResampleAudio(bytes, POCKET_TTS_SAMPLE_RATE)
    await new Promise<void>((resolve, reject) => {
      this.pendingVoiceRegisters.set(voiceId, { resolve, reject })
      this.worker?.postMessage(
        { type: "register_voice", data: { voiceName: voiceId, audio } },
        [audio.buffer],
      )
    })
  }

  private async ensureVoicePrompts(): Promise<void> {
    await this.ensureReady()
    const missing = POCKET_VOICES.map((voice) => voice.id).filter(
      (id) => !this.voiceNames.includes(id),
    )
    if (!missing.length) return
    console.log(`[PocketTTS] Missing voices: ${missing.join(", ")}`)
    if (this.voiceRegisterPromise) return this.voiceRegisterPromise
    this.voiceRegisterStartAt = nowMs()
    this.voiceRegisterPromise = (async () => {
      for (const voiceId of missing) {
        try {
          await this.registerVoicePrompt(voiceId)
        } catch (err) {
          console.warn(`[PocketTTS] Failed to register voice "${voiceId}":`, err)
        }
      }
    })().finally(() => {
      if (this.voiceRegisterStartAt !== null) {
        const elapsed = nowMs() - this.voiceRegisterStartAt
        console.log(`[PocketTTS] Voice registration finished in ${elapsed.toFixed(0)}ms`)
        this.voiceRegisterStartAt = null
      }
      this.voiceRegisterPromise = null
    })
    return this.voiceRegisterPromise
  }

  async getVoices(): Promise<PocketVoice[]> {
    try {
      await this.ensureReady()
      await this.ensureVoicePrompts()
      if (!this.voices.length && this.voiceNames.length) {
        this.voices = mergeVoices(this.voiceNames)
      }
      return this.voices.length ? this.voices : POCKET_VOICES
    } catch {
      return POCKET_VOICES
    }
  }

  private async setVoice(voiceName: string) {
    await this.ensureVoicePrompts()
    let resolvedVoice = voiceName
    if (this.voiceNames.length > 0 && !this.voiceNames.includes(resolvedVoice)) {
      resolvedVoice = this.voiceNames[0]
      console.warn(`[PocketTTS] Voice "${voiceName}" not found, falling back to "${resolvedVoice}"`)
    }
    const next = this.voiceLock.then(
      () =>
        new Promise<void>((resolve, reject) => {
          this.pendingVoice = { resolve, reject }
          this.worker?.postMessage({ type: "set_voice", data: { voiceName: resolvedVoice } })
        }),
    )
    this.voiceLock = next.catch(() => {})
    return next
  }

  async textToSpeech(text: string, speaker?: string): Promise<PocketTTSResponse> {
    await this.ensureReady()

    const voice = mapLegacySpeaker(speaker ?? "alba")
    await this.setVoice(voice)

    if (this.pendingGeneration) {
      throw new Error("Pocket TTS is already generating audio")
    }

    console.log(`[PocketTTS] Generation start (chars=${text.length}, voice=${voice})`)
    return new Promise<PocketTTSResponse>((resolve, reject) => {
      this.pendingGeneration = { resolve, reject, chunks: [], startedAt: nowMs() }
      this.worker?.postMessage({ type: "generate", data: { text, voice } })
    })
  }

  async *streamTextToSpeech(text: string, speaker?: string): AsyncGenerator<PocketTTSResponse> {
    const response = await this.textToSpeech(text, speaker)
    yield response
  }
}

export const pocketTTSService = new PocketTTSService()
export type { PocketTTSStatus }

function mapLegacySpeaker(speaker: string): string {
  const normalized = speaker.trim().toLowerCase()
  const legacyMap: Record<string, string> = {
    aiden: "alba",
    ryan: "marius",
    vivian: "cosette",
    serena: "fantine",
    ono_anna: "eponine",
    sohee: "azelma",
  }
  return legacyMap[normalized] ?? normalized
}

function combineFloat32(chunks: Float32Array[]): Float32Array {
  if (chunks.length === 1) return chunks[0]
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const combined = new Float32Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.length
  }
  return combined
}

const LOCAL_VOICE_PROMPTS: Record<string, string> = {
  alba: "voices/alba.wav",
  marius: "voices/marius.wav",
  javert: "voices/javert.wav",
  jean: "voices/jean.wav",
  fantine: "voices/fantine.wav",
  cosette: "voices/cosette.wav",
  eponine: "voices/eponine.wav",
  azelma: "voices/azelma.wav",
}

async function decodeAndResampleAudio(bytes: ArrayBuffer, targetRate: number): Promise<Float32Array> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  try {
    const buffer = await audioContext.decodeAudioData(bytes.slice(0))
    const channelData = buffer.numberOfChannels > 0 ? buffer.getChannelData(0) : new Float32Array()
    const needsResample = buffer.sampleRate !== targetRate || buffer.numberOfChannels !== 1
    if (!needsResample) {
      return new Float32Array(channelData)
    }
    const duration = buffer.duration
    const frameCount = Math.ceil(duration * targetRate)
    const offline = new OfflineAudioContext(1, Math.max(1, frameCount), targetRate)
    const source = offline.createBufferSource()
    source.buffer = buffer
    source.connect(offline.destination)
    source.start(0)
    const rendered = await offline.startRendering()
    return new Float32Array(rendered.getChannelData(0))
  } finally {
    await audioContext.close().catch(() => {})
  }
}
