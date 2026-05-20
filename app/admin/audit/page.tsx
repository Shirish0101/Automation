import { prisma } from "@/lib/prisma";

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 300 });
  return (
    <>
      <div className="topbar"><div className="title"><h1>Audit Reports</h1><p>Every major admin action is recorded here.</p></div></div>
      <section className="card">
        <div className="table-wrap"><table><thead><tr><th>Date</th><th>User</th><th>Action</th><th>Entity</th><th>Message</th></tr></thead><tbody>
          {logs.map((log) => <tr key={log.id}><td>{log.createdAt.toLocaleString()}</td><td>{log.user?.email || "-"}</td><td>{log.action}</td><td>{log.entity || "-"}</td><td>{log.message || "-"}</td></tr>)}
        </tbody></table></div>
      </section>
    </>
  );
}
