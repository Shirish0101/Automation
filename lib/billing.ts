import { BillStatus, Prisma } from "@prisma/client";
import { decimal, toNumber } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

export function calculateBill(flat: {
  sqft: Prisma.Decimal;
  ratePerSqft: Prisma.Decimal;
  carParkingCount: number;
  carParkingRate: Prisma.Decimal;
  twoWheelerCount: number;
  twoWheelerRate: Prisma.Decimal;
  waterBill: Prisma.Decimal;
  lightBill: Prisma.Decimal;
  otherCharges: Prisma.Decimal;
}, lateFees = 0, interest = 0) {
  const maintenanceAmount = toNumber(flat.sqft) * toNumber(flat.ratePerSqft);
  const carParkingAmount = flat.carParkingCount * toNumber(flat.carParkingRate);
  const twoWheelerParkingAmount = flat.twoWheelerCount * toNumber(flat.twoWheelerRate);
  const totalAmount =
    maintenanceAmount +
    carParkingAmount +
    twoWheelerParkingAmount +
    toNumber(flat.waterBill) +
    toNumber(flat.lightBill) +
    toNumber(flat.otherCharges) +
    Number(lateFees || 0) +
    Number(interest || 0);

  return {
    maintenanceAmount,
    carParkingAmount,
    twoWheelerParkingAmount,
    totalAmount,
    outstandingAmount: totalAmount
  };
}

export async function refreshBillStatus(billId: string) {
  const bill = await prisma.bill.findUnique({ where: { id: billId } });
  if (!bill) return;

  const paid = toNumber(bill.paidAmount);
  const total = toNumber(bill.totalAmount);
  const outstanding = Math.max(total - paid, 0);
  let status: BillStatus = BillStatus.UNPAID;
  if (paid >= total) status = BillStatus.PAID;
  else if (paid > 0) status = BillStatus.PARTIAL;

  await prisma.bill.update({
    where: { id: billId },
    data: {
      outstandingAmount: decimal(outstanding),
      status
    }
  });
}

export async function addPayment(input: {
  userId: string;
  billId: string;
  amount: number;
  mode: "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE" | "CARD" | "OTHER";
  referenceNo?: string;
  remarks?: string;
}) {
  const before = await prisma.bill.findUnique({ where: { id: input.billId } });
  if (!before) throw new Error("Bill not found");

  await prisma.payment.create({
    data: {
      billId: input.billId,
      amount: decimal(input.amount),
      mode: input.mode,
      referenceNo: input.referenceNo,
      remarks: input.remarks
    }
  });

  await prisma.bill.update({
    where: { id: input.billId },
    data: {
      paidAmount: decimal(toNumber(before.paidAmount) + input.amount)
    }
  });
  await refreshBillStatus(input.billId);

  const after = await prisma.bill.findUnique({ where: { id: input.billId } });
  await auditLog({
    userId: input.userId,
    action: "PAYMENT_ADDED",
    entity: "Bill",
    entityId: input.billId,
    before,
    after,
    message: `Payment ${input.amount} added`
  });
}
