import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

export default async function AdminDashboard() {
  const [flatCount, ownerCount, bills, payments] = await Promise.all([
    prisma.flat.count(),
    prisma.user.count({ where: { role: "OWNER" } }),
    prisma.bill.findMany(),
    prisma.payment.findMany()
  ]);
  const totalBilled = bills.reduce((sum, bill) => sum + Number(bill.totalAmount), 0);
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const outstanding = bills.reduce((sum, bill) => sum + Number(bill.outstandingAmount), 0);

  return (
    <>
      <div className="topbar">
        <div className="title">
          <h1>Admin Dashboard</h1>
          <p>Manage building, flats, owners, bills, payment history, and outstanding balance.</p>
        </div>
      </div>
      <section className="grid grid-4">
        <div className="card metric"><span>Total Flats</span><strong>{flatCount}</strong></div>
        <div className="card metric"><span>Owner Users</span><strong>{ownerCount}</strong></div>
        <div className="card metric"><span>Total Billed</span><strong>{formatMoney(totalBilled)}</strong></div>
        <div className="card metric"><span>Outstanding</span><strong>{formatMoney(outstanding)}</strong></div>
      </section>
      <section className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="card metric"><span>Total Paid</span><strong>{formatMoney(totalPaid)}</strong></div>
        <div className="card">
          <h2>Quick Start</h2>
          <p>1. Bulk upload flats or add flat manually.</p>
          <p>2. Create owner login accounts linked to room numbers.</p>
          <p>3. Generate monthly bills and add payments.</p>
        </div>
      </section>
    </>
  );
}
