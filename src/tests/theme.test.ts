// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
// @ts-ignore
import fs from 'fs';
// @ts-ignore
import path from 'path';

describe('Global Theme Variables', () => {
  it('should define classic academic typography variables in App.css', () => {
    // @ts-ignore
    const cssPath = path.resolve(process.cwd(), 'src/App.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    expect(cssContent).toContain("--font-serif: 'EB Garamond', serif;");
    expect(cssContent).toContain("--font-sans: 'Inter', sans-serif;");
  });

  it('should define classic academic color palette variables in App.css', () => {
    // @ts-ignore
    const cssPath = path.resolve(process.cwd(), 'src/App.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    expect(cssContent).toContain('--color-bg-light: #f8f5f2;');
    expect(cssContent).toContain('--color-text-light: #2d3748;');
    expect(cssContent).toContain('--color-bg-dark: #1a202c;');
    expect(cssContent).toContain('--color-text-dark: #cbd5e0;');
    expect(cssContent).toContain('--color-accent: #c0392b;');
  });

  it('should apply the new variables to global selectors', () => {
    // @ts-ignore
    const cssPath = path.resolve(process.cwd(), 'src/App.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    // Check application of variables
    // We expect the default font to be sans-serif (UI)
    // and the background/color to use the light mode variables by default
    expect(cssContent).toContain('font-family: var(--font-sans)');
    expect(cssContent).toContain('background-color: var(--color-bg-light)');
    expect(cssContent).toContain('color: var(--color-text-light)');
  });
});