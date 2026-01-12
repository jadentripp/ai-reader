# Tech Stack - Shakespeare Reader

## Frontend
*   **React (v19):** Core UI library for building a responsive and interactive reader.
*   **TypeScript:** Ensures type safety and improves developer experience across the frontend.
*   **TanStack Router:** Handles complex navigation within the desktop application.
*   **TanStack Query:** Manages asynchronous data fetching, caching, and state synchronization with the Rust backend.
*   **Vite:** High-performance build tool and dev server.

## Backend (Tauri)
*   **Rust:** Provides the robust, high-performance foundation for system-level operations and the application core.
*   **Tauri (v2):** Framework for building cross-platform desktop apps with web technologies and a Rust backend.
*   **SQLite (via rusqlite):** Local relational database for storing book metadata, user settings, and offline content.
*   **reqwest:** Async HTTP client for interacting with external APIs like Gutendex and OpenAI.
*   **serde / serde_json:** Efficient serialization and deserialization of data between Rust and the frontend.

## Project Management & Tooling
*   **Bun:** Fast JavaScript runtime, package manager, and bundler.
