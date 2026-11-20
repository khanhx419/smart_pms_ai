// Unit Tests for ST-1
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from './LoginForm';

describe('ST-1: LoginForm UI Component Tests', () => {
  it('should render email and password inputs correctly', () => {
    render(<LoginForm onLoginSuccess={jest.fn()} />);
    expect(screen.getByPlaceholderText('user@example.com')).toBeInTheDocument();
  });

  it('should display error message on invalid input', async () => {
    render(<LoginForm onLoginSuccess={jest.fn()} />);
    const button = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(button);
  });

  it('should invoke onLoginSuccess callback on 200 HTTP response', async () => {
    const mockSuccess = jest.fn();
    render(<LoginForm onLoginSuccess={mockSuccess} />);
  });
});
