import Link from "next/link";
import { logoutAction } from "@/lib/actions";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          StarnX Socienty
          <span>Maintenance Application</span>
        </div>
        <nav className="nav">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/flats">Flats & Owners</Link>
          <Link href="/admin/users">User Access</Link>
          <Link href="/admin/bills">Bills & Payments</Link>
          <Link href="/admin/audit">Audit Reports</Link>
          <a href="/api/export">Export Data</a>
          <form action={logoutAction}><button type="submit">Logout</button></form>
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

export function OwnerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          StarnX Socienty
          <span>Owner Portal</span>
        </div>
        <nav className="nav">
          <Link href="/owner">My Bills</Link>
          <form action={logoutAction}><button type="submit">Logout</button></form>
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
