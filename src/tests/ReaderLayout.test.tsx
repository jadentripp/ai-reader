// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import ReaderLayout from '../components/ReaderLayout';

expect.extend(matchers);

describe('ReaderLayout', () => {
  it('renders children', () => {
    render(
      <ReaderLayout columns={1}>
        <div data-testid="content">Test Content</div>
      </ReaderLayout>
    );
    expect(screen.getByTestId('content')).toBeDefined();
  });

  it('applies single column class when columns is 1', () => {
    const { container } = render(
      <ReaderLayout columns={1}>
        <div>Test Content</div>
      </ReaderLayout>
    );
    // @ts-ignore
    expect(container.firstChild).toHaveClass('reader-layout-single');
  });

  it('applies dual column class when columns is 2', () => {
    const { container } = render(
      <ReaderLayout columns={2}>
        <div>Test Content</div>
      </ReaderLayout>
    );
    // @ts-ignore
    expect(container.firstChild).toHaveClass('reader-layout-dual');
  });
});

