import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

export async function GET() {
  const env = getEnv();
  return NextResponse.json({
    ok: true,
    app: "spm-pipeline",
    mode: env.APP_MODE,
    hubspot: env.HUBSPOT_MODE,
  });
}
