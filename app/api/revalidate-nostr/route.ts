import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Secret-gated revalidation hook for Nostr-sourced cached data.
 *
 * Usage:
 *   curl -X POST $URL/api/revalidate-nostr \
 *     -H "x-revalidate-secret: $REVALIDATE_SECRET" \
 *     -d '{"tag":"nostr:hackathon-submissions"}'
 *
 * Defaults to the global submissions tag when no body is provided.
 * Stale-while-revalidate ('max') keeps perceived speed while a fresh
 * relay round-trip completes in the background.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let tag = "nostr:hackathon-submissions";
  try {
    const body = (await req.json()) as { tag?: unknown };
    if (typeof body.tag === "string" && body.tag.length > 0) {
      tag = body.tag;
    }
  } catch {
    /* no body, use default */
  }

  revalidateTag(tag, "max");
  return NextResponse.json({ ok: true, tag });
}
