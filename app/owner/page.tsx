import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

export default async function OwnerPage() {
  const user = await requireUser();
  const bills = user.flatId ? await prisma.bill.findMany({
    where: { flatId: user.flatId },
    include: { flat: true, payments: true },
    orderBy: { billMonth: "desc" }
  }) : [];
  const outstanding = bills.reduce((sum, bill) => sum + Number(bill.outstandingAmount), 0);
  const paid = bills.reduce((sum, bill) => sum + Number(bill.paidAmount), 0);

  return (
    <>
      <div className="topbar"><div className="title"><h1>My Payment Details</h1><p>View bills, payment history, pending bills, and outstanding balance.</p></div></div>
      <section className="grid grid-3">
        <div className="card metric"><span>Room</span><strong>{user.flat?.roomNo || "-"}</strong></div>
        <div className="card metric"><span>Total Paid</span><strong>{formatMoney(paid)}</strong></div>
        <div className="card metric"><span>Outstanding</span><strong>{formatMoney(outstanding)}</strong></div>
      </section>
      <section className="card" style={{ marginTop: 16 }}>
        <h2>My Bills</h2>
        <div className="table-wrap"><table><thead><tr><th>Month</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th><th>Payment History</th></tr></thead><tbody>
          {bills.map((bill) => <tr key={bill.id}><td>{bill.billMonth}</td><td>{formatMoney(bill.totalAmount)}</td><td>{formatMoney(bill.paidAmount)}</td><td>{formatMoney(bill.outstandingAmount)}</td><td><span className={`badge ${bill.status.toLowerCase()}`}>{bill.status}</span></td><td>{bill.payments.map((p) => `${p.paidAt.toLocaleDateString()} ${formatMoney(p.amount)} ${p.mode}`).join(" | ") || "-"}</td></tr>)}
        </tbody></table></div>
      </section>
    </>
  );
}
