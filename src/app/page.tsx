import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function HomePage() {
  try {
    const user = await getCurrentUser();
    if (user) redirect("/dashboard");
  } catch {
    // DB not ready yet, show login
  }
  redirect("/login");
}
