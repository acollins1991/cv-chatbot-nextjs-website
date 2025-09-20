import { type NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map();

function rateLimit(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for");
  const limit = 10; // Limiting requests to 10 per minute per IP
  const windowMs = 60 * 1000; // 1 minute

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, {
      count: 0,
      lastReset: Date.now(),
    });
  }

  const ipData = rateLimitMap.get(ip);

  if (Date.now() - ipData.lastReset > windowMs) {
    ipData.count = 0;
    ipData.lastReset = Date.now();
  }

  if (ipData.count >= limit) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  ipData.count += 1;
}

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  return rateLimit(request);
}

export const config = {
  matcher: "/api/:path*",
};
