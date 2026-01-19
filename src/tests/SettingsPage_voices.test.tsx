// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import SettingsPage from '../routes/SettingsPage';

expect.extend(matchers);

// Mock tauri functions
vi.mock('../lib/tauri', () => ({
  getSetting: vi.fn().mockImplementation((key) => {
      if (key === 'elevenlabs_api_key') return Promise.resolve('fake-key');
      return Promise.resolve(null);
  }),
  setSetting: vi.fn().mockResolvedValue(undefined),
  openAiKeyStatus: vi.fn().mockResolvedValue({ has_env_key: false, has_saved_key: false }),
}));

// Mock elevenlabs functions
vi.mock('@/lib/elevenlabs', () => ({
  elevenLabsService: {
    testSpeech: vi.fn().mockResolvedValue(undefined),
    getVoices: vi.fn().mockResolvedValue([
        { voice_id: 'v1', name: 'Rachel' },
        { voice_id: 'v2', name: 'Clyde' }
    ]),
  },
}));

describe('SettingsPage Voice Selection', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the Voice selection dropdown', async () => {
    render(<SettingsPage />);
    // @ts-ignore
    expect(await screen.findByText(/Narrator Voice/i)).toBeInTheDocument();
  });
});
