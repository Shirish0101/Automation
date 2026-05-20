import { OwnerShell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <OwnerShell>{children}</OwnerShell>;
}
