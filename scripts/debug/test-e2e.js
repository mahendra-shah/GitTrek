

async function run() {
  const q = 'is:issue is:open archived:false no:assignee comments:0 created:>=2026-04-20 label:"good first issue" language:Python';
  console.log("=== Querying GitHub REST API directly ===");
  console.log(`Query: ${q}`);
  
  const githubRes = await fetch('https://api.github.com/search/issues?q=' + encodeURIComponent(q) + '&per_page=5', {
    headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "GitTrek-Test" }
  });
  const githubData = await githubRes.json();
  
  console.log(`Total count from GitHub: ${githubData.total_count}`);
  if (githubData.items && githubData.items.length > 0) {
    console.log("Top 3 results from GitHub:");
    githubData.items.slice(0, 3).forEach(item => {
      console.log(`- #${item.number} ${item.title} (${item.repository_url})`);
    });
  } else {
    console.log("No items returned from GitHub.");
  }

  console.log("\n=== Querying GitTrek Local API ===");
  const payload = {
    text: "",
    languages: ["Python"],
    labels: ["good first issue"],
    zeroComments: true,
    noAssignee: true,
    issueAgeDays: 13,
    minStars: 100,
    maxStars: null,
    minForks: 50,
    maxForks: null,
    repoPushedDays: 90,
    hasContributing: false,
    org: "",
    onlyOrgs: false,
    perPage: 5,
    page: 1
  };
  
  const gitTrekRes = await fetch('https://gittrek.vercel.app/api/github/search', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  const gitTrekData = await gitTrekRes.json();
  
  console.log(`Total count from GitTrek: ${gitTrekData.total_count}`);
  console.log(`Filtered out locally: ${gitTrekData.filtered_out}`);
  if (gitTrekData.items && gitTrekData.items.length > 0) {
    console.log("Top 3 results from GitTrek:");
    gitTrekData.items.slice(0, 3).forEach(item => {
      console.log(`- #${item.number} ${item.title} (${item.repository?.fullName || item.htmlUrl})`);
    });
  } else {
    console.log("No items returned from GitTrek.", gitTrekData.error || "");
  }
}

run();
