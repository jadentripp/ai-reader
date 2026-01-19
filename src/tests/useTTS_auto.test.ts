// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTTS } from '../lib/reader/hooks/useTTS';

// Mock audioPlayer
let subscribeCallback: ((state: any) => void) | null = null;
vi.mock('@/lib/elevenlabs', () => ({
  audioPlayer: {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    subscribe: vi.fn((cb) => {
      subscribeCallback = cb;
      return () => {};
    }),
  },
}));

// Mock readerUtils
vi.mock('@/lib/readerUtils', () => ({
  getPageContent: vi.fn().mockReturnValue({ text: 'Mocked page text' }),
}));

describe('useTTS auto-advance', () => {
  const mockGetDoc = vi.fn().mockReturnValue({});
  const mockGetPageMetrics = vi.fn().mockReturnValue({});
  const mockOnPageTurnNeeded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    subscribeCallback = null;
    vi.useFakeTimers();
  });

  it('triggers onPageTurnNeeded when audio ends naturally and autoNext is true', async () => {
    const { result } = renderHook(() => useTTS({
      getDoc: mockGetDoc,
      getPageMetrics: mockGetPageMetrics,
      currentPage: 1,
      onPageTurnNeeded: mockOnPageTurnNeeded,
    }));

    // Start playing to set autoNext to true
    await act(async () => {
        await result.current.playCurrentPage();
    });

    // Manually trigger 'playing' then 'idle'
    await act(async () => {
      subscribeCallback!('playing');
    });
    
    await act(async () => {
      subscribeCallback!('idle');
    });

    await act(async () => {
        vi.runAllTimers();
    });

    expect(mockOnPageTurnNeeded).toHaveBeenCalled();
  });
});