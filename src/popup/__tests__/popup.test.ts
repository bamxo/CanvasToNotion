import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signInWithEmail } from '../../services/auth.service';

// Mock the auth service
vi.mock('../../services/auth.service', () => ({
  signInWithEmail: vi.fn(),
}));

describe('Popup Script', () => {
  let emailInput: HTMLInputElement;
  let passwordInput: HTMLInputElement;
  let loginButton: HTMLButtonElement;
  let statusElement: HTMLElement;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset modules to ensure fresh imports
    vi.resetModules();
    
    // Clear the document body
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  const setupDOM = () => {
    // Setup DOM elements
    document.body.innerHTML = `
      <input id="email" type="email" />
      <input id="password" type="password" />
      <button id="loginEmailBtn">Login</button>
      <div id="status"></div>
    `;

    emailInput = document.getElementById('email') as HTMLInputElement;
    passwordInput = document.getElementById('password') as HTMLInputElement;
    loginButton = document.getElementById('loginEmailBtn') as HTMLButtonElement;
    statusElement = document.getElementById('status') as HTMLElement;
  };

  it('should have DOM elements available for testing', () => {
    setupDOM();
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(loginButton).toBeTruthy();
    expect(statusElement).toBeTruthy();
    expect(signInWithEmail).toBeDefined();
  });

  it('should successfully login with valid credentials', async () => {
    setupDOM();
    
    // Mock successful login
    const mockUser = { email: 'test@example.com', uid: '123' } as any;
    vi.mocked(signInWithEmail).mockResolvedValue(mockUser);

    // Set input values
    emailInput.value = 'test@example.com';
    passwordInput.value = 'password123';

    // Import and execute the popup script to set up event listeners
    await import('../popup');

    // Trigger the login button click
    loginButton.click();

    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(statusElement.textContent).toBe('Logged in as test@example.com');
  });

  it('should handle login errors gracefully', async () => {
    setupDOM();
    
    // Mock failed login
    const mockError = new Error('Invalid credentials');
    vi.mocked(signInWithEmail).mockRejectedValue(mockError);

    // Set input values
    emailInput.value = 'test@example.com';
    passwordInput.value = 'wrongpassword';

    // Import and execute the popup script to set up event listeners
    await import('../popup');

    // Trigger the login button click
    loginButton.click();

    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    expect(statusElement.textContent).toBe('Error: Invalid credentials');
  });

  it('should handle empty email and password', async () => {
    setupDOM();
    
    // Mock failed login due to empty credentials
    const mockError = new Error('Email and password are required');
    vi.mocked(signInWithEmail).mockRejectedValue(mockError);

    // Leave inputs empty
    emailInput.value = '';
    passwordInput.value = '';

    // Import and execute the popup script to set up event listeners
    await import('../popup');

    // Trigger the login button click
    loginButton.click();

    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(signInWithEmail).toHaveBeenCalledWith('', '');
    expect(statusElement.textContent).toBe('Error: Email and password are required');
  });

  it('should handle network errors during login', async () => {
    setupDOM();
    
    // Mock network error
    const mockError = new Error('Network error');
    vi.mocked(signInWithEmail).mockRejectedValue(mockError);

    // Set input values
    emailInput.value = 'test@example.com';
    passwordInput.value = 'password123';

    // Import and execute the popup script to set up event listeners
    await import('../popup');

    // Trigger the login button click
    loginButton.click();

    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(statusElement.textContent).toBe('Error: Network error');
  });

  it('should handle user object without email property', async () => {
    setupDOM();
    
    // Mock user without email
    const mockUser = { uid: '123' } as any;
    vi.mocked(signInWithEmail).mockResolvedValue(mockUser);

    // Set input values
    emailInput.value = 'test@example.com';
    passwordInput.value = 'password123';

    // Import and execute the popup script to set up event listeners
    await import('../popup');

    // Trigger the login button click
    loginButton.click();

    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(statusElement.textContent).toBe('Logged in as undefined');
  });
}); 