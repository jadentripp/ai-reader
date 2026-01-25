import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { act, renderHook } from '@testing-library/react'
import { audioPlayer } from '@/lib/tts'
import * as readerUtils from '@/lib/readerUtils'
import * as tauri from '@/lib/tauri'
import { useTTS } from '../lib/reader/hooks/useTTS'

describe('useTTS', () => {
  const mockGetDoc = mock(() => document)
  const mockGetPageMetrics = mock(() => ({}) as any)
  const mockOnPageTurnNeeded = mock(() => {})
  const spies: any[] = []

  beforeEach(() => {
    mock.restore()

    spies.push(spyOn(audioPlayer, 'play').mockResolvedValue(undefined as any))
    spies.push(spyOn(audioPlayer, 'pause').mockImplementation(() => {}))
    spies.push(spyOn(audioPlayer, 'resume').mockImplementation(() => {}))
    spies.push(spyOn(audioPlayer, 'stop').mockImplementation(() => {}))
    spies.push(spyOn(audioPlayer, 'getState').mockReturnValue('idle'))
    spies.push(spyOn(audioPlayer, 'subscribe').mockReturnValue(() => {}))

    spies.push(
      spyOn(readerUtils, 'getPageContent').mockReturnValue({
        text: 'Mocked page text',
        charMap: [],
      } as any),
    )
    spies.push(spyOn(tauri, 'getSetting').mockResolvedValue(null))

    mockGetDoc.mockClear()
    mockGetPageMetrics.mockClear()
    mockOnPageTurnNeeded.mockClear()
  })

  afterEach(() => {
    spies.forEach((s) => s.mockRestore())
    spies.length = 0
  })

  it('should initialize with idle state', () => {
    const { result } = renderHook(() =>
      useTTS({
        getDoc: mockGetDoc,
        getPageMetrics: mockGetPageMetrics,
        currentPage: 1,
      }),
    )
    expect(result.current.state).toBe('idle')
  })

  it('should call audioPlayer.play with page text', async () => {
    const { result } = renderHook(() =>
      useTTS({
        getDoc: mockGetDoc,
        getPageMetrics: mockGetPageMetrics,
        currentPage: 1,
      }),
    )

    await act(async () => {
      await result.current.playCurrentPage()
    })

    expect(audioPlayer.play).toHaveBeenCalledWith('Mocked page text', undefined)
  })

  it('should not call audioPlayer.play while buffering', async () => {
    const stateSpy = spyOn(audioPlayer, 'getState').mockReturnValue('buffering')
    const { result } = renderHook(() =>
      useTTS({
        getDoc: mockGetDoc,
        getPageMetrics: mockGetPageMetrics,
        currentPage: 1,
      }),
    )

    await act(async () => {
      await result.current.playCurrentPage()
    })

    expect(audioPlayer.play).not.toHaveBeenCalled()
    stateSpy.mockRestore()
  })
})
