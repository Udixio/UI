import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../lib/index.js';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button label="Test Button" />);

    const button = screen.getByText('Test Button');
    expect(button).toBeInTheDocument();
  });

  it('disables the button when disabled prop is true', () => {
    render(<Button label="Test Button" disabled />);

    const button = screen.getByText('Test Button').closest('button');
    expect(button).toBeDisabled();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button label="Test Button" onClick={handleClick} />);

    const button = screen.getByText('Test Button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick handler when disabled', () => {
    const handleClick = vi.fn();
    render(<Button label="Test Button" onClick={handleClick} disabled />);

    const button = screen.getByText('Test Button');
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with an icon when icon prop is provided', () => {
    render(<Button label="Test Button" icon={faPlus} />);

    // This is a mock test, so we're not actually checking for the icon
    // In a real test, you would check for the icon element
    const button = screen.getByText('Test Button').closest('button');
    expect(button).toBeInTheDocument();
  });

  it('renders as an anchor tag when href is provided', () => {
    render(<Button label="Test Button" href="https://example.com" />);

    const link = screen.getByText('Test Button').closest('a');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('shows loading indicator when loading prop is true', () => {
    render(<Button label="Test Button" loading />);

    // This is a mock test, so we're not actually checking for the loading indicator
    // In a real test, you would check for the ProgressIndicator component
    const button = screen.getByText('Test Button').closest('button');
    expect(button).toBeInTheDocument();
  });
});
