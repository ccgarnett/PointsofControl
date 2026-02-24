import { render, screen } from '@testing-library/react';
import VideoEmbed from './VideoEmbed';

describe('VideoEmbed Component (A6)', () => {
  it('renders an iframe with the provided video URL', () => {
    const testUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ";
    render(<VideoEmbed videoUrl={testUrl} />);
    
    const iframe = screen.getByTitle(/course video/i);
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', testUrl);
  });
});