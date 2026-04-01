import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import About from './About';

jest.mock('./Sidebar', () => () => null);

describe('About component', () => {
  it('renders the About heading', () => {
    render(<MemoryRouter><About /></MemoryRouter>);
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders the Points Of Control branding', () => {
    render(<MemoryRouter><About /></MemoryRouter>);
    expect(screen.getByText('Points Of Control')).toBeInTheDocument();
  });

  it('renders the founder name and title', () => {
    render(<MemoryRouter><About /></MemoryRouter>);
    expect(screen.getByText('Jordan Dahl')).toBeInTheDocument();
    expect(screen.getByText('Founder & CEO')).toBeInTheDocument();
  });

  it('renders the Meet the Founder section heading', () => {
    render(<MemoryRouter><About /></MemoryRouter>);
    expect(screen.getByText('Meet the Founder')).toBeInTheDocument();
  });

  it('renders story paragraphs', () => {
    render(<MemoryRouter><About /></MemoryRouter>);
    expect(screen.getByText(/entrepreneurship/i)).toBeInTheDocument();
    expect(screen.getAllByText(/trading/i).length).toBeGreaterThan(0);
  });

  it('renders the founder avatar initials', () => {
    render(<MemoryRouter><About /></MemoryRouter>);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
