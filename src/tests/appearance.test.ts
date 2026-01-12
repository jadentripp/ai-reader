// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReaderAppearance } from '../lib/appearance';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useReaderAppearance', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should return default values when no data in localStorage', () => {
    const { result } = renderHook(() => useReaderAppearance('test-book'));
    expect(result.current.fontFamily).toContain('EB Garamond');
    expect(result.current.lineHeight).toBe(1.65);
    expect(result.current.margin).toBe(40);
  });

  it('should persist changes to localStorage', () => {
    const { result } = renderHook(() => useReaderAppearance('test-book'));
    
    act(() => {
      result.current.setFontFamily('sans-serif');
    });
    expect(result.current.fontFamily).toBe('sans-serif');
    
    const stored = JSON.parse(localStorage.getItem('reader-appearance-test-book') || '{}');
    expect(stored.fontFamily).toBe('sans-serif');
  });

  it('should load data from localStorage on initialization', () => {
    localStorage.setItem('reader-appearance-test-book', JSON.stringify({
      fontFamily: 'Georgia',
      lineHeight: 2.0,
      margin: 100
    }));

    const { result } = renderHook(() => useReaderAppearance('test-book'));
    expect(result.current.fontFamily).toBe('Georgia');
    expect(result.current.lineHeight).toBe(2.0);
    expect(result.current.margin).toBe(100);
  });
});
