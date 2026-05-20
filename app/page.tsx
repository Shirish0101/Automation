import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  redirect(user.role === "ADMIN" ? "/admin" : "/owner");
}
