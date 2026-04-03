import { NextRequest, NextResponse } from "next/server";

function resolveTargetUrl(requestUrl: string): URL {
  const gasApiUrl = process.env.GAS_API_URL;

  if (!gasApiUrl) {
    throw new Error("GAS_API_URL is not set");
  }

  const sourceUrl = new URL(requestUrl);
  const targetUrl = new URL(gasApiUrl);

  sourceUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  return targetUrl;
}

async function forward(request: NextRequest) {
  let targetUrl: URL;

  try {
    targetUrl = resolveTargetUrl(request.url);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "invalid_target_url" },
      { status: 500 }
    );
  }

  const body = request.method === "POST" ? await request.text() : undefined;

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(targetUrl.toString(), {
      method: request.method,
      headers:
        request.method === "POST"
          ? {
              "Content-Type": request.headers.get("content-type") ?? "application/json",
            }
          : undefined,
      body: request.method === "POST" && body ? body : undefined,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "upstream_unreachable" }, { status: 502 });
  }

  const contentType = upstreamResponse.headers.get("content-type") ?? "application/json";
  const payload = await upstreamResponse.text();

  return new NextResponse(payload, {
    status: upstreamResponse.status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  return forward(request);
}

export async function POST(request: NextRequest) {
  return forward(request);
}
