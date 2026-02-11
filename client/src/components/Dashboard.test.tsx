import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

// Mock axios to avoid actual API calls
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockCourses = [
  { _id: '1', title: 'Course 1', description: 'Description 1', progress: 50 },
  { _id: '2', title: 'Course 2', description: 'Description 2', progress: 10 }
];

describe('Dashboard Component', () => {
  test('renders courses fetched from API', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockCourses });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Verify loading state or wait for titles to appear
    await waitFor(() => {
      expect(screen.getByText('Course 1')).toBeInTheDocument();
      expect(screen.getByText('Course 2')).toBeInTheDocument();
    });
  });
});