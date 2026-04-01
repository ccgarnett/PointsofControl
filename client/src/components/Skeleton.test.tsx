import { render } from '@testing-library/react';
import Skeleton, { SkeletonPage } from './Skeleton';

describe('Skeleton component', () => {
  it('renders with default style props', () => {
    const { container } = render(<Skeleton />);
    const el = container.querySelector('.skeleton') as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.style.height).toBe('1rem');
    expect(el.style.width).toBe('100%');
    expect(el.style.borderRadius).toBe('6px');
  });

  it('renders with custom height, width, and borderRadius', () => {
    const { container } = render(<Skeleton height="3rem" width="50%" borderRadius="12px" />);
    const el = container.querySelector('.skeleton') as HTMLElement;
    expect(el.style.height).toBe('3rem');
    expect(el.style.width).toBe('50%');
    expect(el.style.borderRadius).toBe('12px');
  });
});

describe('SkeletonPage component', () => {
  it('renders the default 3 skeleton cards', () => {
    const { container } = render(<SkeletonPage />);
    expect(container.querySelectorAll('.skeleton-card').length).toBe(3);
  });

  it('renders the specified number of cards', () => {
    const { container } = render(<SkeletonPage cards={6} />);
    expect(container.querySelectorAll('.skeleton-card').length).toBe(6);
  });

  it('renders a sidebar and content area', () => {
    const { container } = render(<SkeletonPage />);
    expect(container.querySelector('.skeleton-sidebar')).toBeInTheDocument();
    expect(container.querySelector('.skeleton-content')).toBeInTheDocument();
  });

  it('renders multiple skeleton elements inside each card', () => {
    const { container } = render(<SkeletonPage cards={1} />);
    const card = container.querySelector('.skeleton-card') as HTMLElement;
    expect(card.querySelectorAll('.skeleton').length).toBeGreaterThan(1);
  });
});
