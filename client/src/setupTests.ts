import '@testing-library/jest-dom';

// We remove jest.requireActual to prevent Jest from looking for the physical module
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: any) => children,
  MemoryRouter: ({ children }: any) => children,
  Routes: ({ children }: any) => children,
  Route: ({ children }: any) => children,
  Navigate: () => null,
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  Link: ({ to, children }: any) => children,
}));