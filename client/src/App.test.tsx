import { render } from '@testing-library/react';
import App from './App';

jest.mock('./components/DailyChecklist', () => () => null);

test('renders app without crashing', () => {
  render(<App />);
  expect(document.body).toBeDefined();
});
