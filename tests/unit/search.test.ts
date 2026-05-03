import { describe, it, expect } from 'vitest';
import { buildIssueSearchQuery } from '../../src/lib/github/search';

describe('buildIssueSearchQuery', () => {
  const defaultFilters = {
    text: '',
    languages: [],
    labels: [],
    zeroComments: false,
    noAssignee: false,
    issueAgeDays: 30,
    minStars: null,
    maxStars: null,
    minForks: null,
    maxForks: null,
    repoPushedDays: null,
    hasContributing: false,
    org: '',
    onlyOrgs: false,
  };

  it('builds a basic query with default age', () => {
    const result = buildIssueSearchQuery(defaultFilters);
    expect(result.query).toContain('is:issue is:open archived:false');
    expect(result.query).toContain('created:>='); // dynamically generated based on current date
    expect(result.warnings).toHaveLength(0);
  });

  it('includes text search if provided', () => {
    const result = buildIssueSearchQuery({ ...defaultFilters, text: 'react performance' });
    expect(result.query).toContain('react performance');
  });

  it('adds zero comments flag', () => {
    const result = buildIssueSearchQuery({ ...defaultFilters, zeroComments: true });
    expect(result.query).toContain('comments:0');
  });

  it('adds no assignee flag', () => {
    const result = buildIssueSearchQuery({ ...defaultFilters, noAssignee: true });
    expect(result.query).toContain('no:assignee');
  });

  it('adds language filters properly', () => {
    const result = buildIssueSearchQuery({ ...defaultFilters, languages: ['TypeScript', 'Python'] });
    expect(result.query).toContain('(language:TypeScript OR language:Python)');
  });

  it('adds label filters properly with quotes', () => {
    const result = buildIssueSearchQuery({ ...defaultFilters, labels: ['good first issue', 'bug'] });
    expect(result.query).toContain('(label:"good first issue" OR label:"bug")');
  });

  it('adds organization filter', () => {
    const result = buildIssueSearchQuery({ ...defaultFilters, org: 'vercel' });
    expect(result.query).toContain('org:vercel');
  });

  it('warns if too many languages are selected and limits them', () => {
    const result = buildIssueSearchQuery({ 
      ...defaultFilters, 
      languages: ['1', '2', '3', '4', '5', '6', '7'] 
    });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('Limited language filters');
    expect(result.query).toContain('language:1');
    expect(result.query).not.toContain('language:7');
  });

  it('warns if too many labels are selected and limits them', () => {
    const result = buildIssueSearchQuery({ 
      ...defaultFilters, 
      labels: ['1', '2', '3', '4', '5', '6', '7'] 
    });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('Limited label filters');
    expect(result.query).toContain('label:"1"');
    expect(result.query).not.toContain('label:"7"');
  });
});
