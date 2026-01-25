import { pocketTTSService } from './pocket-tts'
import { getSetting } from './tauri/settings'

export interface Voice {
  voice_id: string
  name: string
  description?: string
  language?: string
}

export interface WordTiming {
  word: string
  start: number
  end: number
  startChar: number
  endChar: number
}

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'buffering' | 'error'
export type EndReason = 'ended' | 'stopped' | 'replaced' | 'error' | 'unknown'

export interface AudioProgress {
  currentTime: number
  duration: number
  isBuffering: boolean
}

export class AudioPlayer {
  private context: AudioContext | null = null
  private state: PlaybackState = 'idle'
  private currentSource: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private currentBuffer: AudioBuffer | null = null
  private listeners = new Set<(state: PlaybackState) => void>()
  private progressListeners = new Set<(progress: AudioProgress) => void>()
  private wordTimingListeners = new Set<(wordIndex: number, word: WordTiming | null) => void>()

  // Playback state tracking
  private _playbackRate: number = 1
  private _volume: number = 1
  private _startTime: number = 0
  private _startOffset: number = 0
  private _pausedAt: number = 0
  private progressInterval: ReturnType<typeof setInterval> | null = null
  private _lastEndReason: EndReason = 'unknown'
  private _wordTimings: WordTiming[] = []
  private _currentWordIndex: number = -1

  private initContext() {
    if (!this.context) {
      console.log(`[AudioPlayer] Initializing AudioContext`)
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)()
      console.log(`[AudioPlayer] AudioContext state: ${this.context.state}`)
    }
    if (!this.gainNode && this.context) {
      this.gainNode = this.context.createGain()
      this.gainNode.gain.value = this._volume
      this.gainNode.connect(this.context.destination)
    }
    return this.context
  }

  getState(): PlaybackState {
    return this.state
  }

  getLastEndReason(): EndReason {
    return this._lastEndReason
  }

  private setState(state: PlaybackState) {
    console.log(`[AudioPlayer] State transition: ${this.state} -> ${state}`)
    this.state = state
    this.updateProgressCache()
    this.listeners.forEach((l) => l(state))

    if (state === 'playing') {
      this.startProgressUpdates()
    } else {
      this.stopProgressUpdates()
    }
  }

  private startProgressUpdates() {
    this.stopProgressUpdates()
    this.progressInterval = setInterval(() => {
      this.notifyProgressListeners()
    }, 100)
  }

  private stopProgressUpdates() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }
  }

  private notifyProgressListeners() {
    this.updateProgressCache()
    const progress = this.getProgress()
    this.progressListeners.forEach((l) => l(progress))
    if (Math.floor(progress.currentTime * 10) % 10 === 0 && progress.currentTime > 0) {
      console.log(
        `[AudioPlayer] Progress: ${progress.currentTime.toFixed(2)}s, wordTimings: ${this._wordTimings.length}`,
      )
    }
    this.updateCurrentWord(progress.currentTime)
  }

  private updateCurrentWord(currentTime: number) {
    if (this._wordTimings.length === 0) return

    let newIndex = -1
    for (let i = 0; i < this._wordTimings.length; i++) {
      const w = this._wordTimings[i]
      if (w && currentTime >= w.start && currentTime < w.end) {
        newIndex = i
        break
      }
      const nextWord = this._wordTimings[i + 1]
      if (
        w &&
        currentTime >= w.end &&
        (i === this._wordTimings.length - 1 || (nextWord && currentTime < nextWord.start))
      ) {
        newIndex = i
        break
      }
    }

    if (newIndex !== this._currentWordIndex) {
      this._currentWordIndex = newIndex
      const word = newIndex >= 0 ? this._wordTimings[newIndex] : null
      console.log(
        `[AudioPlayer] Word changed: index=${newIndex}, word="${word?.word}", time=${currentTime.toFixed(2)}s`,
      )
      this.wordTimingListeners.forEach((l) => l(newIndex, word || null))
    }
  }

  subscribeWordTiming(listener: (wordIndex: number, word: WordTiming | null) => void): () => void {
    this.wordTimingListeners.add(listener)
    return () => {
      this.wordTimingListeners.delete(listener)
    }
  }

  getCurrentWordIndex(): number {
    return this._currentWordIndex
  }

  getCurrentWord(): WordTiming | null {
    return this._currentWordIndex >= 0 ? this._wordTimings[this._currentWordIndex] || null : null
  }

  getWordTimings(): WordTiming[] {
    return this._wordTimings
  }

  async play(text: string, voiceId?: string) {
    console.log(`[AudioPlayer] play requested for text length: ${text.length}`)
    if (this.state === 'buffering' || this.state === 'playing') {
      console.log(`[AudioPlayer] Ignoring play request while state=${this.state}`)
      return
    }
    const ctx = this.initContext()
    if (ctx.state === 'suspended') {
      console.log(`[AudioPlayer] Resuming suspended AudioContext`)
      await ctx.resume()
    }

    this.setState('buffering')

    try {
      let finalVoiceId = voiceId
      if (!finalVoiceId) {
        finalVoiceId = (await getSetting('pocket_voice_id')) || undefined
        console.log(`[AudioPlayer] Resolved voiceId from database: ${finalVoiceId}`)
      }

      if (!finalVoiceId) {
        finalVoiceId = 'alba'
        console.log(`[AudioPlayer] No voiceId found, falling back to: ${finalVoiceId}`)
      }

      console.log(`[AudioPlayer] Calling Pocket TTS service with voiceId: ${finalVoiceId}`)
      const response = await pocketTTSService.textToSpeech(text, finalVoiceId)

      const binaryString = atob(response.audio_base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      console.log(`[AudioPlayer] Decoding Pocket audio, ${bytes.length} bytes`)
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0))
      console.log(
        `[AudioPlayer] Pocket audio decoded, duration: ${audioBuffer.duration.toFixed(2)}s`,
      )

      this._lastEndReason = 'replaced'
      this.stopInternal()

      this.currentBuffer = audioBuffer
      this._startOffset = 0
      this._pausedAt = 0
      this._wordTimings = []
      this._currentWordIndex = -1
      this.startPlayback(audioBuffer, 0)
      this.setState('playing')
    } catch (e) {
      console.error('[AudioPlayer] Audio playback error:', e)
      this._lastEndReason = 'error'
      this.setState('error')
    }
  }

  async playWithTimestamps(text: string, voiceId?: string) {
    return this.play(text, voiceId)
  }

  private startPlayback(buffer: AudioBuffer, offset: number) {
    const ctx = this.initContext()

    if (this.currentSource) {
      this.currentSource.onended = null
      try {
        this.currentSource.stop()
      } catch (e) {
        // ignore
      }
      this.currentSource = null
    }

    this.currentSource = ctx.createBufferSource()
    this.currentSource.buffer = buffer
    this.currentSource.playbackRate.value = this._playbackRate

    if (this.gainNode) {
      this.currentSource.connect(this.gainNode)
    } else {
      this.currentSource.connect(ctx.destination)
    }

    this.currentSource.onended = () => {
      const currentTime = this.getCurrentTime()
      const duration = buffer.duration
      const percentPlayed = duration > 0 ? ((currentTime / duration) * 100).toFixed(1) : 'N/A'
      console.log(
        `[AudioPlayer] onended fired. State: ${this.state}, CurrentTime: ${currentTime.toFixed(2)}s, Duration: ${duration.toFixed(2)}s, Played: ${percentPlayed}%`,
      )
      if (this.state === 'playing') {
        this._lastEndReason = 'ended'
        console.log(`[AudioPlayer] Setting EndReason to 'ended' and transitioning to idle`)
        this._pausedAt = 0
        this._startOffset = 0
        this.setState('idle')
      }
    }

    this._startTime = ctx.currentTime
    this._startOffset = offset

    console.log(`[AudioPlayer] Starting playback at offset: ${offset.toFixed(2)}s`)
    this.currentSource.start(0, offset)
  }

  pause() {
    console.log(`[AudioPlayer] Pause requested`)
    if (this.state === 'playing') {
      this._pausedAt = this.getCurrentTime()
      this.context?.suspend()
      this.setState('paused')
    }
  }

  resume() {
    console.log(`[AudioPlayer] Resume requested`)
    if (this.state === 'paused') {
      this.context?.resume()
      this.setState('playing')
    }
  }

  private stopInternal() {
    this.stopProgressUpdates()
    if (this.currentSource) {
      console.log(`[AudioPlayer] Stopping current source`)
      this.currentSource.onended = null
      try {
        this.currentSource.stop()
      } catch (e) {
        // ignore
      }
      this.currentSource = null
    }
    this._startOffset = 0
    this._pausedAt = 0
    this.setState('idle')
  }

  stop() {
    this._lastEndReason = 'stopped'
    this.stopInternal()
  }

  seek(position: number) {
    if (!this.currentBuffer || !this.context) {
      console.log(`[AudioPlayer] Cannot seek: no audio loaded`)
      return
    }

    const duration = this.currentBuffer.duration
    const clampedPosition = Math.max(0, Math.min(position, duration))

    console.log(`[AudioPlayer] Seeking to position: ${clampedPosition.toFixed(2)}s`)

    if (this.state === 'playing') {
      this.startPlayback(this.currentBuffer, clampedPosition)
    } else if (this.state === 'paused') {
      this._pausedAt = clampedPosition
      this._startOffset = clampedPosition
    }

    this.notifyProgressListeners()
  }

  setPlaybackRate(rate: number) {
    const clampedRate = Math.max(0.5, Math.min(2, rate))
    console.log(`[AudioPlayer] Setting playback rate to: ${clampedRate}x`)
    this._playbackRate = clampedRate

    if (this.currentSource) {
      this.currentSource.playbackRate.value = clampedRate
    }
  }

  getPlaybackRate(): number {
    return this._playbackRate
  }

  setVolume(level: number) {
    const clampedLevel = Math.max(0, Math.min(1, level))
    console.log(`[AudioPlayer] Setting volume to: ${clampedLevel}`)
    this._volume = clampedLevel

    if (this.gainNode) {
      this.gainNode.gain.value = clampedLevel
    }
  }

  getVolume(): number {
    return this._volume
  }

  getCurrentTime(): number {
    if (!this.context || !this.currentBuffer) return 0

    if (this.state === 'paused') {
      return this._pausedAt
    }

    if (this.state === 'playing') {
      const elapsed = (this.context.currentTime - this._startTime) * this._playbackRate
      return Math.min(this._startOffset + elapsed, this.currentBuffer.duration)
    }

    return 0
  }

  getDuration(): number {
    return this.currentBuffer?.duration ?? 0
  }

  private _cachedProgress: AudioProgress = { currentTime: 0, duration: 0, isBuffering: false }

  private updateProgressCache() {
    const currentTime = this.getCurrentTime()
    const duration = this.getDuration()
    const isBuffering = this.state === 'buffering'

    if (
      currentTime !== this._cachedProgress.currentTime ||
      duration !== this._cachedProgress.duration ||
      isBuffering !== this._cachedProgress.isBuffering
    ) {
      this._cachedProgress = { currentTime, duration, isBuffering }
    }
  }

  getProgress(): AudioProgress {
    return this._cachedProgress
  }

  subscribe(callback: (state: PlaybackState) => void) {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  subscribeProgress(callback: (progress: AudioProgress) => void) {
    this.progressListeners.add(callback)
    return () => {
      this.progressListeners.delete(callback)
    }
  }
}

export const audioPlayer = new AudioPlayer()
