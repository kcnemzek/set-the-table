import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { type, message, name } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const title = `[${type}] ${message.trim().slice(0, 72)}`;
  const body = [
    `**Type:** ${type}`,
    `**From:** ${name?.trim() || "Anonymous"}`,
    ``,
    `**Details:**`,
    message.trim(),
  ].join("\n");

  const res = await fetch("https://api.github.com/repos/kcnemzek/whats-for-dinner/issues", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_FEEDBACK_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, body, labels: [type.toLowerCase()] }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to create issue" }, { status: 500 });
  }

  const issue = await res.json();
  return NextResponse.json({ url: issue.html_url });
}
