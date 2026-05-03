const q = 'is:issue is:open label:"good first issue" sort:created-desc';
const body = JSON.stringify({
  query: `query SearchIssues($q: String!) {
    search(query: $q, type: ISSUE, first: 10) {
      issueCount
      nodes {
        ... on Issue {
          repository { stargazerCount }
        }
      }
    }
  }`,
  variables: { q }
});
fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: {
    'Authorization': 'bearer ' + process.env.GITHUB_TOKEN,
    'Content-Type': 'application/json'
  },
  body
}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d, null, 2)));
