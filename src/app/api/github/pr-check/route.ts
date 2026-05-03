import { NextResponse } from "next/server";
import { z } from "zod";

import { getToken } from "@/lib/auth/adapter";

export const dynamic = "force-dynamic";

const API_VERSION = "2022-11-28";
const GRAPHQL_URL = "https://api.github.com/graphql";

const BodySchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  issueNumber: z.number().int().positive(),
});

type PRStatus = {
  status: "safe" | "open_pr" | "draft_pr" | "linked_branch" | "error";
  openPrCount: number;
  draftPrCount: number;
  linkedBranches: number;
};

const QUERY = `
query CheckLinkedPRs($owner: String!, $repo: String!, $issueNumber: Int!) {
  repository(owner: $owner, name: $repo) {
    issue(number: $issueNumber) {
      timelineItems(first: 25, itemTypes: [CROSS_REFERENCED_EVENT, CONNECTED_EVENT]) {
        nodes {
          __typename
          ... on CrossReferencedEvent {
            source {
              __typename
              ... on PullRequest {
                number
                state
                isDraft
                title
              }
            }
          }
          ... on ConnectedEvent {
            subject {
              __typename
              ... on PullRequest {
                number
                state
                isDraft
                title
              }
            }
          }
        }
      }
      linkedBranches(first: 5) {
        totalCount
      }
    }
  }
}
`;

function classifyPRStatus(
  nodes: Array<Record<string, unknown>>,
  linkedBranches: number
): PRStatus {
  let openPrCount = 0;
  let draftPrCount = 0;

  nodes.forEach((node) => {
    const typename = node.__typename as string | undefined;
    if (typename === "CrossReferencedEvent") {
      const source = node.source as Record<string, unknown> | null | undefined;
      if (source && source.__typename === "PullRequest") {
        const state = source.state as string | undefined;
        const isDraft = Boolean(source.isDraft);
        if (state === "OPEN") {
          if (isDraft) draftPrCount += 1;
          else openPrCount += 1;
        }
      }
    }

    if (typename === "ConnectedEvent") {
      const subject = node.subject as Record<string, unknown> | null | undefined;
      if (subject && subject.__typename === "PullRequest") {
        const state = subject.state as string | undefined;
        const isDraft = Boolean(subject.isDraft);
        if (state === "OPEN") {
          if (isDraft) draftPrCount += 1;
          else openPrCount += 1;
        }
      }
    }
  });

  if (openPrCount > 0) {
    return { status: "open_pr", openPrCount, draftPrCount, linkedBranches };
  }

  if (draftPrCount > 0) {
    return { status: "draft_pr", openPrCount, draftPrCount, linkedBranches };
  }

  if (linkedBranches > 0) {
    return { status: "linked_branch", openPrCount, draftPrCount, linkedBranches };
  }

  return { status: "safe", openPrCount, draftPrCount, linkedBranches };
}

export async function POST(request: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { owner, repo, issueNumber } = parsed.data;

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { owner, repo, issueNumber },
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "graphql_failed" }, { status: response.status });
  }

  const data = await response.json();
  const nodes =
    data?.data?.repository?.issue?.timelineItems?.nodes ?? [];
  const linkedBranches =
    data?.data?.repository?.issue?.linkedBranches?.totalCount ?? 0;

  const status = classifyPRStatus(nodes, linkedBranches);

  return NextResponse.json(status);
}
