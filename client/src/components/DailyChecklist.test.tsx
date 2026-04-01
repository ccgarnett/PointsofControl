import { render } from '@testing-library/react';
import DailyChecklist from './DailyChecklist';

describe('DailyChecklist component', () => {
  it('renders without crashing', () => {
    const { container } = render(<DailyChecklist />);
    expect(container).toBeDefined();
  });

  it('renders nothing visible (returns null)', () => {
    const { container } = render(<DailyChecklist />);
    expect(container.firstChild).toBeNull();
  });
});
