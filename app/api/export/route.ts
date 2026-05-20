import * as XLSX from "xlsx";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireAdmin();
  const [flats, users, bills, payments, audit] = await Promise.all([
    prisma.flat.findMany({ orderBy: { roomNo: "asc" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.bill.findMany({ include: { flat: true }, orderBy: { createdAt: "desc" } }),
    prisma.payment.findMany({ include: { bill: { include: { flat: true } } }, orderBy: { paidAt: "desc" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 1000 })
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flats), "Flats");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(users), "Users");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bills.map((b) => ({ ...b, flat: b.flat.roomNo }))), "Bills");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payments.map((p) => ({ ...p, roomNo: p.bill.flat.roomNo }))), "Payments");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(audit), "Audit");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=starnx-society-export.xlsx"
    }
  });
}
