import { addPaymentAction, generateBillsAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

export default async function BillsPage({ searchParams }: { searchParams: { month?: string; status?: string; q?: string } }) {
  const month = searchParams.month || "";
  const status = searchParams.status || "";
  const q = searchParams.q || "";
  const bills = await prisma.bill.findMany({
    where: {
      ...(month ? { billMonth: month } : {}),
      ...(status ? { status: status as "UNPAID" | "PARTIAL" | "PAID" } : {}),
      ...(q ? { flat: { OR: [{ roomNo: { contains: q, mode: "insensitive" } }, { ownerName: { contains: q, mode: "insensitive" } }] } } : {})
    },
    include: { flat: true, payments: true },
    orderBy: [{ billMonth: "desc" }, { flat: { roomNo: "asc" } }]
  });

  return (
    <>
      <div className="topbar"><div className="title"><h1>Bills & Payments</h1><p>Generate monthly bills, record payments, and track outstanding balances.</p></div></div>

      <section className="grid grid-2">
        <div className="card">
          <h2>Generate Bills</h2>
          <form action={generateBillsAction} className="form-grid">
            <div className="field"><label>Bill Month</label><input name="billMonth" type="month" required /></div>
            <div className="field"><label>Late Fees</label><input name="lateFees" defaultValue="0" /></div>
            <div className="field"><label>Interest</label><input name="interest" defaultValue="0" /></div>
            <div className="field"><label>Due Date</label><input name="dueDate" type="date" /></div>
            <button className="btn" type="submit">Generate</button>
          </form>
        </div>

        <div className="card">
          <h2>Add Payment</h2>
          <form action={addPaymentAction} className="form-grid">
            <div className="field"><label>Bill ID</label><input name="billId" required /></div>
            <div className="field"><label>Amount</label><input name="amount" required /></div>
            <div className="field"><label>Mode</label><select name="mode"><option>UPI</option><option>CASH</option><option>BANK_TRANSFER</option><option>CHEQUE</option><option>CARD</option><option>OTHER</option></select></div>
            <div className="field"><label>Reference</label><input name="referenceNo" /></div>
            <div className="field" style={{ gridColumn: "1 / -1" }}><label>Remarks</label><input name="remarks" /></div>
            <button className="btn" type="submit">Record Payment</button>
          </form>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <form className="actions" action="/admin/bills">
          <input name="q" placeholder="Search room / owner" defaultValue={q} />
          <input name="month" type="month" defaultValue={month} />
          <select name="status" defaultValue={status}><option value="">All</option><option value="UNPAID">Unpaid</option><option value="PARTIAL">Partial</option><option value="PAID">Paid</option></select>
          <button className="btn secondary" type="submit">Filter</button>
        </form>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead><tr><th>Bill ID</th><th>Room</th><th>Owner</th><th>Month</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th><th>Payments</th><th>WhatsApp</th></tr></thead>
            <tbody>
              {bills.map((bill) => {
                const message = encodeURIComponent(`Maintenance bill for room ${bill.flat.roomNo}: total ${formatMoney(bill.totalAmount)}, outstanding ${formatMoney(bill.outstandingAmount)}.`);
                return (
                  <tr key={bill.id}>
                    <td>{bill.id}</td><td>{bill.flat.roomNo}</td><td>{bill.flat.ownerName}</td><td>{bill.billMonth}</td>
                    <td>{formatMoney(bill.totalAmount)}</td><td>{formatMoney(bill.paidAmount)}</td><td>{formatMoney(bill.outstandingAmount)}</td>
                    <td><span className={`badge ${bill.status.toLowerCase()}`}>{bill.status}</span></td>
                    <td>{bill.payments.length}</td>
                    <td><a className="btn soft" href={`https://wa.me/${bill.flat.ownerPhone || ""}?text=${message}`} target="_blank">Share</a></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
