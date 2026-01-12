# Track Spec: Refine the Reader UI and Library Management

## Overview
This track aims to transform the current basic implementation of the Shakespeare Reader into a polished, "Classic Academic" application. We will focus on typography, layout refinement, and enhancing the library management experience to align with the product guidelines.

## Objectives
- Implement the "Classic Academic" visual identity (serif fonts for reading, sans-serif for UI).
- Enhance the Library Page to display more metadata (author, publication year, etc.).
- Refine the Reader UI for a distraction-free experience.
- Ensure seamless and responsive navigation between the Library and Reader.

## Key Features

### 1. Typography & Styling (Classic Academic)
- Integrate serif fonts (e.g., EB Garamond) for the book content.
- Integrate sans-serif fonts (e.g., Inter) for the UI elements.
- Implement the defined color palette (cream/off-white for light mode, slate/charcoal for dark mode).

### 2. Library Management Enhancements
- Update the book list view to include author names and publication years.
- Improve the visual layout of the book cards/list items.
- Ensure the library correctly reflects the state of the local SQLite database.

### 3. Reader UI Polishing
- Implement a distraction-free reading mode (hiding non-essential UI).
- Add basic font size and theme controls within the reader.
- Ensure smooth scrolling and page navigation.

## Success Criteria
- The application follows the visual identity defined in `product-guidelines.md`.
- All books in the library display at least Author and Title metadata.
- Navigation between the Library and Reader is fast and intuitive.
- At least 80% test coverage for all new frontend components and logic.
