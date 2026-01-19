import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateThreadTitle } from '../lib/openai';

// Hoist mocks
const { mockCreateResponse } = vi.hoisted(() => {
  return {
    mockCreateResponse: vi.fn(),
  };
});

vi.mock('openai', () => {
  return {
    default: class OpenAI {
      responses = {
        create: mockCreateResponse,
      };
    },
    OpenAI: class OpenAI {
      responses = {
        create: mockCreateResponse,
      };
    },
  };
});

vi.mock('../lib/tauri/settings', () => ({
  getSetting: vi.fn(async (key) => {
    if (key === 'openai_api_key') return 'api-key';
    return null;
  }),
}));

describe('AI Thread Title Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate a concise title from the first interaction', async () => {
    mockCreateResponse.mockResolvedValue({
      output: [
        {
          type: 'message',
          content: [{ type: 'output_text', text: 'Summary of Hamlet' }],
        },
      ],
    });

    const messages = [
      { role: 'user', content: 'What is Hamlet about?' },
      { role: 'assistant', content: 'Hamlet is a tragedy by William Shakespeare...' },
    ];

    const title = await generateThreadTitle(messages);

    expect(title).toBe('Summary of Hamlet');
    expect(mockCreateResponse).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-4o-mini',
      input: expect.arrayContaining([
        expect.objectContaining({ role: 'system' }),
        expect.objectContaining({ role: 'user', content: 'What is Hamlet about?' }),
      ]),
    }));
  });

  it('should clean up quotes from the generated title', async () => {
    mockCreateResponse.mockResolvedValue({
      output: [
        {
          type: 'message',
          content: [{ type: 'output_text', text: '"The Ghost of Hamlet"' }],
        },
      ],
    });

    const title = await generateThreadTitle([{ role: 'user', content: '...' }]);
    expect(title).toBe('The Ghost of Hamlet');
  });
});
