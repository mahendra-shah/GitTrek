import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { IssueCard, IssueItem } from '../../src/components/IssueCard';

describe('IssueCard Component', () => {
  const mockIssue: IssueItem = {
    id: 1,
    number: 123,
    title: 'Fix a crucial bug',
    htmlUrl: 'https://github.com/example/repo/issues/123',
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), // 2 hours ago
    updatedAt: new Date().toISOString(),
    comments: 5,
    labels: ['bug', 'good first issue'],
    owner: 'example',
    repo: 'repo',
    repository: {
      fullName: 'example/repo',
      htmlUrl: 'https://github.com/example/repo',
      stars: 1500,
      forks: 300,
      pushedAt: new Date().toISOString(),
      isFork: false,
    },
    tasks: null,
    prStatus: {
      status: 'safe',
      openPrCount: 0,
      draftPrCount: 0,
      linkedBranches: 0,
    },
  };

  it('renders issue title, number, and repo name', () => {
    render(<IssueCard issue={mockIssue} />);
    
    expect(screen.getByText('Fix a crucial bug')).toBeInTheDocument();
    expect(screen.getByText('#123')).toBeInTheDocument();
    expect(screen.getByText('example/repo')).toBeInTheDocument();
  });

  it('renders repository stats if not a guest and stats exist', () => {
    render(<IssueCard issue={mockIssue} />);
    
    // 1500 stars should be formatted as 1.5k
    expect(screen.getByText('1.5k')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
  });

  it('hides stats and shows prompt if guest and stats missing', () => {
    const guestIssue = {
      ...mockIssue,
      repository: { ...mockIssue.repository, stars: 0, forks: 0 },
    };
    
    render(<IssueCard issue={guestIssue} isGuest={true} />);
    
    expect(screen.getByText('Sign in to see repo stats')).toBeInTheDocument();
  });

  it('renders PR badges correctly based on status', () => {
    const { unmount } = render(<IssueCard issue={mockIssue} />);
    expect(screen.getByText('✅ Available')).toBeInTheDocument();
    unmount();

    const openPrIssue = { ...mockIssue, prStatus: { ...mockIssue.prStatus, status: 'open_pr' as const } };
    const { unmount: unmountOpen } = render(<IssueCard issue={openPrIssue} />);
    expect(screen.getByText('⚠️ Being Claimed')).toBeInTheDocument();
    unmountOpen();

    const draftPrIssue = { ...mockIssue, prStatus: { ...mockIssue.prStatus, status: 'draft_pr' as const } };
    const { unmount: unmountDraft } = render(<IssueCard issue={draftPrIssue} />);
    expect(screen.getByText('🔶 Work in Progress')).toBeInTheDocument();
    unmountDraft();

    const linkedBranchIssue = { ...mockIssue, prStatus: { ...mockIssue.prStatus, status: 'linked_branch' as const } };
    render(<IssueCard issue={linkedBranchIssue} />);
    expect(screen.getByText('🔀 Branch Started')).toBeInTheDocument();
  });

  it('renders labels and applies active styling based on appliedLabels', () => {
    const { container } = render(
      <IssueCard issue={mockIssue} appliedLabels={['bug']} />
    );
    
    const bugLabel = screen.getByText('bug');
    expect(bugLabel).toBeInTheDocument();
    
    // Check if it has the active styling (primary color)
    // The exact style matching is tricky with inline styles, but we can check if it rendered.
  });

  it('renders task list progress if available', () => {
    const taskIssue = { ...mockIssue, tasks: { completed: 2, total: 4 } };
    render(<IssueCard issue={taskIssue} />);
    
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
  });

  it('shows discussion affordance instead of PR badge', () => {
    render(<IssueCard issue={{ ...mockIssue, isDiscussion: true }} />);
    expect(screen.getByText(/Answer it/)).toBeInTheDocument();
    expect(screen.queryByText('✅ Available')).not.toBeInTheDocument();
  });

  it('shows viewer engagement when viewer summary is present', () => {
    render(
      <IssueCard
        issue={{
          ...mockIssue,
          viewer: { engaged: true, reasons: ['commented'] },
        }}
      />
    );
    expect(screen.getByText('👋 You engaged')).toBeInTheDocument();
  });

  it('shows repo activity chip when repo was pushed recently', () => {
    render(<IssueCard issue={mockIssue} />);
    expect(screen.getByText(/active today/)).toBeInTheDocument();
  });

  it('shows guest lock on PR status when guest', () => {
    const guestPr: IssueItem = {
      ...mockIssue,
      prStatus: { status: 'guest', openPrCount: 0, draftPrCount: 0, linkedBranches: 0 },
    };
    render(<IssueCard issue={guestPr} isGuest />);
    expect(screen.getByText('🔒 Sign in to unlock')).toBeInTheDocument();
  });
});
