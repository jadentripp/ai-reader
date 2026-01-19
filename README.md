# AI Reader

AI Reader is an AI-powered desktop application for reading and interacting with public-domain literature. Browse Project Gutenberg's vast catalog, download books locally, and enjoy a modern reading experience with AI-assisted analysis, text-to-speech narration, and an immersive 3D library interface.

[DeepWiki](https://deepwiki.com/jadentripp/ai-reader)

## Quickstart

1) Download the latest macOS build from the [GitHub Releases](https://github.com/jadentripp/ai-reader/releases) page.  
2) Open the `.dmg` file and drag **AI Reader** into **Applications**.  
3) Open **Applications** and launch **AI Reader**.  
4) If macOS says it "can't be opened," right‑click **AI Reader** → **Open** → **Open**.  
   If you don't see that, go to **System Settings → Privacy & Security** and click **Open Anyway**.  
5) In the app, search for a book or pick a featured collection, download it, and start reading.  
6) Optional: open **Settings** to configure your OpenAI API key (for AI Assistant) and ElevenLabs API key (for text-to-speech).

## Features

### 3D Library
- Immersive 3D bookshelf visualization
- Drag-and-drop book organization
- Visual book covers rendered on 3D models
- Smooth animations and transitions

### Library & Discovery
- Search Project Gutenberg (via Gutendex) with curated collections and categories
- Download queue with progress tracking
- Local library management with cover art and metadata
- Popularity sorting and filtering

### Reading Experience
- Paginated reader with single or two-column spreads
- Appearance controls for font family, size, line height, and margins
- Table of contents generated from document headings
- Reading progress saved per book
- Dark mode support

### Highlights & Notes
- Highlight passages with customizable colors
- Attach notes to highlights
- Browse all highlights with page references

### AI Assistant
- Chat about the current page or selected highlights
- One-click summaries in modern English
- Model selection from your OpenAI account
- Context-aware responses based on book content

### Text-to-Speech
- ElevenLabs integration for natural narration
- Voice selection and customization
- Playback controls with auto-advance

## Tech Stack

| Layer | Technology |
| --- | --- |
| Desktop Shell | Tauri 2 (Rust) |
| Frontend | React 19, TypeScript |
| Build Tool | Bun (native bundler & dev server) |
| Routing & Data | TanStack Router, TanStack Query |
| Styling | Tailwind CSS 4, Radix UI |
| 3D Graphics | Three.js, React Three Fiber, @react-three/drei |
| Database | SQLite (via Tauri/rusqlite) |
| AI | OpenAI API |
| TTS | ElevenLabs API |
| Testing | Bun Test, React Testing Library |

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (v1.0+)
- [Rust toolchain](https://rustup.rs/) (for Tauri)
- OpenAI API key (optional, for AI features)
- ElevenLabs API key (optional, for TTS features)

### Install

```bash
git clone https://github.com/jadentripp/ai-reader.git
cd ai-reader
bun install
```

### Development

```bash
# Web-only dev server (browser preview)
bun run dev

# Full desktop app in dev mode (recommended)
bun run tauri dev
```

### Development Modes

| Mode | Command | Description |
| --- | --- | --- |
| **Web Preview** | `bun run dev` | Quick browser preview for UI development. Limited functionality. |
| **Desktop App** | `bun run tauri dev` | Full Tauri desktop app with all features. Requires Rust. |

#### Feature Comparison

| Feature | Web Preview (`bun dev`) | Desktop App (`tauri dev`) |
| --- | :---: | :---: |
| Browse Gutenberg catalog | ✅ | ✅ |
| 3D Library visualization | ✅ | ✅ |
| Real book downloads | ❌ (mocked) | ✅ |
| MOBI file parsing | ❌ | ✅ |
| SQLite database | ❌ (localStorage) | ✅ |
| Offline reading | ❌ | ✅ |
| AI Assistant | ✅ | ✅ |
| Text-to-Speech | ✅ | ✅ |

> **Note**: The web preview mode uses CORS proxies and localStorage as fallbacks. For the full reading experience with real book downloads and offline access, use `bun run tauri dev` or download the production release.

### Production Build

```bash
# Build web assets
bun run build

# Build the desktop app
bun run tauri build
```

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the Bun dev server |
| `bun run tauri dev` | Run Tauri desktop app (dev mode) |
| `bun run build` | Build web assets |
| `bun run tauri build` | Build the production desktop app |
| `bun run test` | Run the test suite |
| `bun run db:reset` | Clear local database and downloaded books |

## Configuration

### API Keys

Configure your API keys in **Settings** within the app:
- **OpenAI API Key**: Enables the AI Assistant for chat, summaries, and analysis
- **ElevenLabs API Key**: Enables text-to-speech narration

### Data Storage

- SQLite database: `tmp/ai-reader.sqlite` (development)
- Downloaded books: `tmp/books/`
- Run `bun run db:reset` to clear all local data

## Project Structure

```
ai-reader/
├── src/                      # React frontend
│   ├── components/           # UI components
│   │   ├── library/          # Library & catalog UI
│   │   ├── reader/           # Reading experience
│   │   ├── three/            # 3D library components
│   │   └── ui/               # Shared UI primitives (Radix)
│   ├── routes/               # Page components
│   ├── lib/                  # Utilities, hooks, API clients
│   │   ├── reader/           # Reader logic & state
│   │   └── tauri/            # Tauri command wrappers
│   └── tests/                # Test suite
├── src-tauri/                # Tauri desktop shell (Rust)
│   ├── src/                  # Rust backend logic
│   └── capabilities/         # App permissions
├── conductor/                # Project specs & tracks
├── dev-server.ts             # Bun dev server config
├── build.ts                  # Bun build config
└── bunfig.toml               # Bun configuration
```

## Acknowledgments

This project is built to read and explore works from [Project Gutenberg](https://www.gutenberg.org/), the digital library that makes tens of thousands of free eBooks available to the public.

## License

MIT
