import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';

describe('Dashboard Component (U1)', () => {
  it('displays courses fetched from API', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue([
        { _id: '1', title: 'Intro to Mindset', description: 'Test', modules: [] }
      ])
    }) as jest.Mock;

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Intro to Mindset/i)).toBeInTheDocument();
    });
  });
});
