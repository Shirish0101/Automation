import { Prisma } from "@prisma/client";

export function toNumber(value: unknown) {
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value || 0);
  return 0;
}

export function formatMoney(value: unknown) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(toNumber(value));
}

export function decimal(value: unknown) {
  return new Prisma.Decimal(Number(value || 0));
}
