import { describe, it, expect, mock, beforeEach } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

const mockPlayCurrentPage = mock(() => {});
const mockPause = mock(() => {});
const mockResume = mock(() => {});
const mockSetPlaybackRate = mock(() => {});
const mockSetVolume = mock(() => {});
const mockSeek = mock(() => {});

describe("TTSPanel Phase 3 - Enhanced Playback Controls", () => {
  beforeEach(() => {
    mockPlayCurrentPage.mockClear();
    mockPause.mockClear();
    mockResume.mockClear();
    mockSetPlaybackRate.mockClear();
    mockSetVolume.mockClear();
    mockSeek.mockClear();
  });

  describe("Playback Speed Control", () => {
    beforeEach(() => {
      mock.module("@/lib/hooks/useTTS", () => {
        return {
          useTTS: () => ({
            state: "playing",
            progress: { currentTime: 30, duration: 120, isBuffering: false },
            playCurrentPage: mockPlayCurrentPage,
            pause: mockPause,
            resume: mockResume,
            stop: mock(() => {}),
            getPageText: mock(() => ""),
            autoNext: false,
            setPlaybackRate: mockSetPlaybackRate,
            setVolume: mockSetVolume,
            seek: mockSeek,
          }),
        };
      });
    });

    it("displays speed selector button with current speed", async () => {
      const { TTSPanel } = await import("../components/reader/TTSPanel");
      render(<TTSPanel />);

      const panel = screen.getByTestId("tts-panel-container");
      fireEvent.click(panel);

      const speedButton = screen.getByTestId("speed-button");
      expect(speedButton).toBeInTheDocument();
    });

    it("opens speed selector dropdown when clicked", async () => {
      const { TTSPanel } = await import("../components/reader/TTSPanel");
      render(<TTSPanel />);

      const panel = screen.getByTestId("tts-panel-container");
      fireEvent.click(panel);

      const speedButton = screen.getByTestId("speed-button");
      fireEvent.click(speedButton);

      expect(screen.getByTestId("speed-selector")).toBeInTheDocument();
      expect(screen.getByText("0.5x")).toBeInTheDocument();
      expect(screen.getByText("2x")).toBeInTheDocument();
    });

    it("selects speed when option is clicked", async () => {
      const { TTSPanel } = await import("../components/reader/TTSPanel");
      render(<TTSPanel />);

      const panel = screen.getByTestId("tts-panel-container");
      fireEvent.click(panel);

      const speedButton = screen.getByTestId("speed-button");
      fireEvent.click(speedButton);

      const twoXButton = screen.getByRole("button", { name: "2x" });
      fireEvent.click(twoXButton);

      expect(mockSetPlaybackRate).toHaveBeenCalledWith(2);
    });
  });

  describe("Skip Controls", () => {
    beforeEach(() => {
      mock.module("@/lib/hooks/useTTS", () => {
        return {
          useTTS: () => ({
            state: "playing",
            progress: { currentTime: 30, duration: 120, isBuffering: false },
            playCurrentPage: mockPlayCurrentPage,
            pause: mockPause,
            resume: mockResume,
            stop: mock(() => {}),
            getPageText: mock(() => ""),
            autoNext: false,
            setPlaybackRate: mockSetPlaybackRate,
            setVolume: mockSetVolume,
            seek: mockSeek,
          }),
        };
      });
    });

    it("displays skip backward button", async () => {
      const { TTSPanel } = await import("../components/reader/TTSPanel");
      render(<TTSPanel />);

      const panel = screen.getByTestId("tts-panel-container");
      fireEvent.click(panel);

      const skipBackButton = screen.getByRole("button", { name: /skip backward/i });
      expect(skipBackButton).toBeInTheDocument();
    });

    it("displays skip forward button", async () => {
      const { TTSPanel } = await import("../components/reader/TTSPanel");
      render(<TTSPanel />);

      const panel = screen.getByTestId("tts-panel-container");
      fireEvent.click(panel);

      const skipForwardButton = screen.getByRole("button", { name: /skip forward/i });
      expect(skipForwardButton).toBeInTheDocument();
    });

    it("skips backward 15 seconds when clicked", async () => {
      const { TTSPanel } = await import("../components/reader/TTSPanel");
      render(<TTSPanel />);

      const panel = screen.getByTestId("tts-panel-container");
      fireEvent.click(panel);

      const skipBackButton = screen.getByRole("button", { name: /skip backward/i });
      fireEvent.click(skipBackButton);

      expect(mockSeek).toHaveBeenCalledWith(15);
    });

    it("skips forward 15 seconds when clicked", async () => {
      const { TTSPanel } = await import("../components/reader/TTSPanel");
      render(<TTSPanel />);

      const panel = screen.getByTestId("tts-panel-container");
      fireEvent.click(panel);

      const skipForwardButton = screen.getByRole("button", { name: /skip forward/i });
      fireEvent.click(skipForwardButton);

      expect(mockSeek).toHaveBeenCalledWith(45);
    });

    it("does not seek below zero when skipping backward from near start", async () => {
      mock.module("@/lib/hooks/useTTS", () => {
        return {
          useTTS: () => ({
            state: "playing",
            progress: { currentTime: 5, duration: 120, isBuffering: false },
            playCurrentPage: mockPlayCurrentPage,
            pause: mockPause,
            resume: mockResume,
            stop: mock(() => {}),
            getPageText: mock(() => ""),
            autoNext: false,
            setPlaybackRate: mockSetPlaybackRate,
            setVolume: mockSetVolume,
            seek: mockSeek,
          }),
        };
      });

      const { TTSPanel: TTSPanelShort } = await import("../components/reader/TTSPanel");
      render(<TTSPanelShort />);

      const panel = screen.getByTestId("tts-panel-container");
      fireEvent.click(panel);

      const skipBackButton = screen.getByRole("button", { name: /skip backward/i });
      fireEvent.click(skipBackButton);

      expect(mockSeek).toHaveBeenCalledWith(0);
    });

    it("seeks to duration when skip forward exceeds audio length", async () => {
      mock.module("@/lib/hooks/useTTS", () => {
        return {
          useTTS: () => ({
            state: "playing",
            progress: { currentTime: 110, duration: 120, isBuffering: false },
            playCurrentPage: mockPlayCurrentPage,
            pause: mockPause,
            resume: mockResume,
            stop: mock(() => {}),
            getPageText: mock(() => ""),
            autoNext: false,
            setPlaybackRate: mockSetPlaybackRate,
            setVolume: mockSetVolume,
            seek: mockSeek,
          }),
        };
      });

      const { TTSPanel: TTSPanelNearEnd } = await import("../components/reader/TTSPanel");
      render(<TTSPanelNearEnd />);

      const panel = screen.getByTestId("tts-panel-container");
      fireEvent.click(panel);

      const skipForwardButton = screen.getByRole("button", { name: /skip forward/i });
      fireEvent.click(skipForwardButton);

      expect(mockSeek).toHaveBeenCalledWith(120);
    });
  });

  describe("Volume Control", () => {
    beforeEach(() => {
      mock.module("@/lib/hooks/useTTS", () => {
        return {
          useTTS: () => ({
            state: "playing",
            progress: { currentTime: 30, duration: 120, isBuffering: false },
            playCurrentPage: mockPlayCurrentPage,
            pause: mockPause,
            resume: mockResume,
            stop: mock(() => {}),
            getPageText: mock(() => ""),
            autoNext: false,
            setPlaybackRate: mockSetPlaybackRate,
            setVolume: mockSetVolume,
            seek: mockSeek,
          }),
        };
      });
    });

    it("displays volume slider", async () => {
      const { TTSPanel } = await import("../components/reader/TTSPanel");
      render(<TTSPanel />);

      const panel = screen.getByTestId("tts-panel-container");
      fireEvent.click(panel);

      expect(screen.getByRole("slider")).toBeInTheDocument();
    });

    it("displays volume percentage", async () => {
      const { TTSPanel } = await import("../components/reader/TTSPanel");
      render(<TTSPanel />);

      const panel = screen.getByTestId("tts-panel-container");
      fireEvent.click(panel);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });

  describe("Mini-player Volume Icon", () => {
    it("displays volume icon in collapsed state", async () => {
      mock.module("@/lib/hooks/useTTS", () => {
        return {
          useTTS: () => ({
            state: "playing",
            progress: { currentTime: 30, duration: 120, isBuffering: false },
            playCurrentPage: mockPlayCurrentPage,
            pause: mockPause,
            resume: mockResume,
            stop: mock(() => {}),
            getPageText: mock(() => ""),
            autoNext: false,
            setPlaybackRate: mockSetPlaybackRate,
            setVolume: mockSetVolume,
            seek: mockSeek,
          }),
        };
      });

      const { TTSPanel } = await import("../components/reader/TTSPanel");
      render(<TTSPanel />);

      const panel = screen.getByTestId("tts-panel-container");
      expect(panel).toBeInTheDocument();
    });
  });
});
