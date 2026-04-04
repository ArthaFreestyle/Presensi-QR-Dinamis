import { NextRequest, NextResponse } from "next/server";

function resolveTargetUrl(request: NextRequest): URL {
  const sourceUrl = new URL(request.url);
  const overrideGasApiUrl = sourceUrl.searchParams.get("gas_api_url");
  const gasApiUrl = overrideGasApiUrl || process.env.GAS_API_URL;

  if (!gasApiUrl) {
    throw new Error("GAS_API_URL is not set");
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(gasApiUrl);
  } catch {
    throw new Error("invalid_target_url");
  }

  if (!["http:", "https:"].includes(targetUrl.protocol)) {
    throw new Error("invalid_target_protocol");
  }

  sourceUrl.searchParams.forEach((value, key) => {
    if (key === "gas_api_url") return;
    targetUrl.searchParams.set(key, value);
  });

  return targetUrl;
}

async function forward(request: NextRequest) {
  const isPost = request.method === "POST";
  let targetUrl: URL;

  try {
    targetUrl = resolveTargetUrl(request);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "invalid_target_url" },
      { status: 500 }
    );
  }

  const body = isPost ? await request.text() : undefined;
  const headers = new Headers();
  const requestContentType = request.headers.get("Content-Type");
  if (requestContentType) {
    headers.set("Content-Type", requestContentType);
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: isPost ? headers : undefined,
      body: isPost ? body : undefined,
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
