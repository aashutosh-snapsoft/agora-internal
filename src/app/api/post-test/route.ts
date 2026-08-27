import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("[POST Test] Request received", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(
    { message: "OK", postTested: true },
    { status: 200 }
  );
}

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { message: "OK", getTested: true },
    { status: 200 }
  );
}
