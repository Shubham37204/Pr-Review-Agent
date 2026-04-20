interface PRData {
  title: string;
  description: string;
  diff: string;
  filesChanged: number;
  additions: number;
  deletions: number;
}

function parsePRUrl(url: string): { owner: string; repo: string; number: number } {
  const match = url.match(
    /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/
  );
  if (!match) throw new Error("Invalid GitHub PR URL");
  return { owner: match[1], repo: match[2], number: parseInt(match[3]) };
}

export async function fetchPRData(prUrl: string): Promise<PRData> {
  const { owner, repo, number } = parsePRUrl(prUrl);
  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
  };

  // Fetch PR metadata
  const prRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`,
    { headers }
  );
  if (!prRes.ok) throw new Error(`GitHub API error: ${prRes.status}`);
  const pr = await prRes.json();

  // Fetch diff
  const diffRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`,
    {
      headers: {
        ...headers,
        Accept: "application/vnd.github.v3.diff",
      },
    }
  );
  if (!diffRes.ok) throw new Error("Failed to fetch PR diff");
  const diff = await diffRes.text();

  return {
    title: pr.title,
    description: pr.body ?? "",
    diff,
    filesChanged: pr.changed_files,
    additions: pr.additions,
    deletions: pr.deletions,
  };
}
