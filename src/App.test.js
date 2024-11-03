import { render, screen } from '@testing-library/react';
import App from './App';

test('renders mint title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Mint egg0/i);
  expect(titleElement).toBeInTheDocument();
});
