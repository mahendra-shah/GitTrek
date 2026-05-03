import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from '../../src/components/Pagination';

describe('Pagination Component', () => {
  it('renders nothing if totalPages is 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correct page numbers', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    
    // Should render prev, next, and 1 to 5
    expect(screen.getByText('Prev')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it('disables Prev button on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    const prevButton = screen.getByText('Prev');
    expect(prevButton).toBeDisabled();
  });

  it('disables Next button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />);
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageChange with correct page number when clicked', () => {
    const onPageChangeMock = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChangeMock} />);
    
    const page2Button = screen.getByText('2');
    fireEvent.click(page2Button);
    
    expect(onPageChangeMock).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when Prev/Next is clicked', () => {
    const onPageChangeMock = vi.fn();
    render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChangeMock} />);
    
    fireEvent.click(screen.getByText('Prev'));
    expect(onPageChangeMock).toHaveBeenCalledWith(1);
    
    fireEvent.click(screen.getByText('Next'));
    expect(onPageChangeMock).toHaveBeenCalledWith(3);
  });

  it('shows First button if currentPage > 3', () => {
    render(<Pagination currentPage={4} totalPages={10} onPageChange={vi.fn()} />);
    expect(screen.getByText('First')).toBeInTheDocument();
  });

  it('disables pages greater than maxAllowedPage', () => {
    render(<Pagination currentPage={2} totalPages={5} maxAllowedPage={3} onPageChange={vi.fn()} />);
    
    expect(screen.getByText('3')).not.toBeDisabled();
    expect(screen.getByText('4')).toBeDisabled();
    expect(screen.getByText('5')).toBeDisabled();
  });
});
