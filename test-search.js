const q4 = 'is:issue is:open stars:>=100 label:"good first issue"';
const q5 = 'is:issue is:open stars:>=100 forks:>=50';
Promise.all([
  fetch(new URL('https://api.github.com/search/issues?q=' + encodeURIComponent(q4))).then(r=>r.json()),
  fetch(new URL('https://api.github.com/search/issues?q=' + encodeURIComponent(q5))).then(r=>r.json()),
]).then(res => {
  console.log("Q4:", res[0].total_count);
  console.log("Q5:", res[1].total_count);
});
