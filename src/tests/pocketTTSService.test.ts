import { describe, expect, it, mock } from "bun:test"
import { PocketTTSService } from "../lib/pocket-tts"

describe("PocketTTSService", () => {
  it("notifies status listeners immediately and supports unsubscribe", () => {
    const service = new PocketTTSService()
    const listener = mock(() => {})
    const unsubscribe = service.subscribeStatus(listener)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0][0]).toBe("idle")

    unsubscribe()
  })
})
