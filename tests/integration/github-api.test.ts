import { describe, it, expect } from 'vitest';
import { buildIssueSearchQuery } from '../../src/lib/github/search';

/**
 * INTEGRATION TEST: Real GitHub API Verification
 * 
 * This test hits the ACTUAL GitHub REST API using the exact search
 * string compiled by our query builder. 
 * 
 * If this test fails, it means GitHub has changed their API schema 
 * or the query builder syntax is no longer supported by GitHub.
 */
describe('Live GitHub Search API Integration', () => {
  it('successfully fetches issues from GitHub using our compiled query', async () => {
    // 1. Build a very specific query that is guaranteed to return results
    const queryResult = buildIssueSearchQuery({
      text: '',
      languages: ['Python'],
      labels: ['good first issue'],
      zeroComments: false,
      noAssignee: true,
      issueAgeDays: 365, // Look back a full year
      minStars: null,
      maxStars: null,
      minForks: null,
      maxForks: null,
      repoPushedDays: null,
      hasContributing: false,
      org: '',
      onlyOrgs: false,
    });

    // 2. Fetch directly from GitHub REST API (No auth needed for basic search)
    const url = new URL('https://api.github.com/search/issues');
    url.searchParams.set('q', queryResult.query);
    url.searchParams.set('per_page', '5');
    url.searchParams.set('page', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitTrek-CI-Tests'
      }
    });

    // 3. Verify GitHub accepts the query
    expect(response.status).toBe(200);

    const data = await response.json();
    
    // 4. Verify the structure matches our expectations
    expect(data.total_count).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(data.items)).toBe(true);
    
    if (data.items.length > 0) {
      const issue = data.items[0];
      expect(issue).toHaveProperty('id');
      expect(issue).toHaveProperty('title');
      expect(issue).toHaveProperty('html_url');
      expect(issue).toHaveProperty('repository_url');
    }
  });
});
