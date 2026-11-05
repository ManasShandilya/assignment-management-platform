import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";

export const GET = apiHandler(async () => NextResponse.json({ user: await requireUser() }));
