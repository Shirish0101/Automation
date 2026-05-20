"use server";

import bcrypt from "bcryptjs";
import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { clearSession, createSession, requireAdmin, requireUser, verifyLogin } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { calculateBill, addPayment as addPaymentService } from "@/lib/billing";
import { decimal } from "@/lib/money";

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function num(formData: FormData, key: string) {
  return Number(value(formData, key) || 0);
}

export async function loginAction(formData: FormData) {
  const user = await verifyLogin(value(formData, "email"), value(formData, "password"));
  if (!user) redirect("/login?error=1");
  await createSession(user);
  redirect(user.role === Role.ADMIN ? "/admin" : "/owner");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function saveFlatAction(formData: FormData) {
  const user = await requireAdmin();
  const id = value(formData, "id");
  const building = await prisma.building.findFirst();
  if (!building) throw new Error("Building not found");

  const data = {
    buildingId: building.id,
    roomNo: value(formData, "roomNo"),
    ownerName: value(formData, "ownerName"),
    ownerEmail: value(formData, "ownerEmail") || null,
    ownerPhone: value(formData, "ownerPhone") || null,
    sqft: decimal(num(formData, "sqft")),
    ratePerSqft: decimal(num(formData, "ratePerSqft")),
    carParkingCount: Math.trunc(num(formData, "carParkingCount")),
    carParkingRate: decimal(num(formData, "carParkingRate")),
    twoWheelerCount: Math.trunc(num(formData, "twoWheelerCount")),
    twoWheelerRate: decimal(num(formData, "twoWheelerRate")),
    waterBill: decimal(num(formData, "waterBill")),
    lightBill: decimal(num(formData, "lightBill")),
    otherCharges: decimal(num(formData, "otherCharges")),
    notes: value(formData, "notes") || null
  };

  if (!data.roomNo || !data.ownerName) throw new Error("Room number and owner name are required");

  if (id) {
    const before = await prisma.flat.findUnique({ where: { id } });
    const after = await prisma.flat.update({ where: { id }, data });
    await auditLog({ userId: user.id, action: "FLAT_UPDATED", entity: "Flat", entityId: id, before, after });
  } else {
    const after = await prisma.flat.create({ data });
    await auditLog({ userId: user.id, action: "FLAT_CREATED", entity: "Flat", entityId: after.id, after });
  }
  revalidatePath("/admin/flats");
}

export async function createUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const role = value(formData, "role") === "ADMIN" ? Role.ADMIN : Role.OWNER;
  const roomNo = value(formData, "roomNo");
  const flat = roomNo ? await prisma.flat.findFirst({ where: { roomNo } }) : null;
  if (role === Role.OWNER && !flat) throw new Error("Owner user must be linked to a valid room number");

  const created = await prisma.user.create({
    data: {
      name: value(formData, "name"),
      email: value(formData, "email"),
      phone: value(formData, "phone") || null,
      role,
      flatId: flat?.id,
      passwordHash: await bcrypt.hash(value(formData, "password"), 12)
    }
  });
  await auditLog({ userId: admin.id, action: "USER_CREATED", entity: "User", entityId: created.id, after: created });
  revalidatePath("/admin/users");
}

export async function generateBillsAction(formData: FormData) {
  const user = await requireAdmin();
  const billMonth = value(formData, "billMonth");
  const lateFees = num(formData, "lateFees");
  const interest = num(formData, "interest");
  const dueDateRaw = value(formData, "dueDate");
  if (!billMonth) throw new Error("Bill month is required");

  const flats = await prisma.flat.findMany({ where: { isActive: true } });
  let count = 0;
  for (const flat of flats) {
    const calc = calculateBill(flat, lateFees, interest);
    await prisma.bill.upsert({
      where: { flatId_billMonth: { flatId: flat.id, billMonth } },
      update: {},
      create: {
        flatId: flat.id,
        billMonth,
        sqft: flat.sqft,
        ratePerSqft: flat.ratePerSqft,
        maintenanceAmount: decimal(calc.maintenanceAmount),
        carParkingAmount: decimal(calc.carParkingAmount),
        twoWheelerParkingAmount: decimal(calc.twoWheelerParkingAmount),
        waterBill: flat.waterBill,
        lightBill: flat.lightBill,
        otherCharges: flat.otherCharges,
        lateFees: decimal(lateFees),
        interest: decimal(interest),
        totalAmount: decimal(calc.totalAmount),
        outstandingAmount: decimal(calc.outstandingAmount),
        dueDate: dueDateRaw ? new Date(dueDateRaw) : null
      }
    });
    count += 1;
  }
  await auditLog({ userId: user.id, action: "BILLS_GENERATED", entity: "Bill", message: `${count} bills for ${billMonth}` });
  revalidatePath("/admin/bills");
}

export async function addPaymentAction(formData: FormData) {
  const user = await requireUser();
  await addPaymentService({
    userId: user.id,
    billId: value(formData, "billId"),
    amount: num(formData, "amount"),
    mode: value(formData, "mode") as "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE" | "CARD" | "OTHER",
    referenceNo: value(formData, "referenceNo") || undefined,
    remarks: value(formData, "remarks") || undefined
  });
  revalidatePath("/admin/bills");
  revalidatePath("/owner");
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function rowValue(row: Record<string, string>, aliases: string[]) {
  const map = new Map(Object.keys(row).map((key) => [normalizeKey(key), row[key]]));
  for (const alias of aliases) {
    const found = map.get(normalizeKey(alias));
    if (found !== undefined) return String(found).trim();
  }
  return "";
}

export async function bulkUploadFlatsAction(formData: FormData) {
  const user = await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("CSV file is required");
  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) throw new Error(parsed.errors[0].message);

  const building = await prisma.building.findFirst();
  if (!building) throw new Error("Building not found");

  let successRows = 0;
  let failedRows = 0;
  for (const row of parsed.data) {
    try {
      const roomNo = rowValue(row, ["room_no", "roomNo", "flat_no", "flatNo", "room"]);
      const ownerName = rowValue(row, ["owner_name", "ownerName", "name"]);
      if (!roomNo || !ownerName) throw new Error("Missing room_no or owner_name");

      await prisma.flat.upsert({
        where: { buildingId_roomNo: { buildingId: building.id, roomNo } },
        update: {
          ownerName,
          ownerEmail: rowValue(row, ["owner_email", "email"]) || null,
          ownerPhone: rowValue(row, ["owner_phone", "phone", "mobile"]) || null,
          sqft: decimal(rowValue(row, ["sqft", "square_feet", "area"])),
          ratePerSqft: decimal(rowValue(row, ["rate_per_sqft", "rate"])),
          carParkingCount: Number(rowValue(row, ["car_parking_count", "car_parking"]) || 0),
          carParkingRate: decimal(rowValue(row, ["car_parking_rate"])),
          twoWheelerCount: Number(rowValue(row, ["two_wheeler_count", "two_wheeler"]) || 0),
          twoWheelerRate: decimal(rowValue(row, ["two_wheeler_rate"])),
          waterBill: decimal(rowValue(row, ["water_bill", "water"])),
          lightBill: decimal(rowValue(row, ["light_bill", "light"])),
          otherCharges: decimal(rowValue(row, ["other_charges", "other"]))
        },
        create: {
          buildingId: building.id,
          roomNo,
          ownerName,
          ownerEmail: rowValue(row, ["owner_email", "email"]) || null,
          ownerPhone: rowValue(row, ["owner_phone", "phone", "mobile"]) || null,
          sqft: decimal(rowValue(row, ["sqft", "square_feet", "area"])),
          ratePerSqft: decimal(rowValue(row, ["rate_per_sqft", "rate"])),
          carParkingCount: Number(rowValue(row, ["car_parking_count", "car_parking"]) || 0),
          carParkingRate: decimal(rowValue(row, ["car_parking_rate"])),
          twoWheelerCount: Number(rowValue(row, ["two_wheeler_count", "two_wheeler"]) || 0),
          twoWheelerRate: decimal(rowValue(row, ["two_wheeler_rate"])),
          waterBill: decimal(rowValue(row, ["water_bill", "water"])),
          lightBill: decimal(rowValue(row, ["light_bill", "light"])),
          otherCharges: decimal(rowValue(row, ["other_charges", "other"]))
        }
      });
      successRows += 1;
    } catch {
      failedRows += 1;
    }
  }

  const upload = await prisma.bulkUpload.create({
    data: { fileName: file.name, rowCount: parsed.data.length, successRows, failedRows, createdBy: user.id }
  });
  await auditLog({ userId: user.id, action: "FLATS_BULK_UPLOADED", entity: "BulkUpload", entityId: upload.id, after: upload });
  revalidatePath("/admin/flats");
}
