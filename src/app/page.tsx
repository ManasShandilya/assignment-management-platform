import { redirect } from "next/navigation";
import { homeFor } from "@/lib/auth/jwt";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const user = await getSession();
  redirect(user ? homeFor(user.role) : "/login");
}
