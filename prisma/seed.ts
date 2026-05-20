import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@starnx.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123";

  const building = await prisma.building.upsert({
    where: { id: "default-building" },
    update: {},
    create: {
      id: "default-building",
      name: "StarnX Society",
      address: ""
    }
  });

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "System Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: Role.ADMIN
    }
  });

  console.log(`Created default building: ${building.name}`);
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log("No flats are seeded. Use Bulk Upload or Add Flat from the app.");
}

main().finally(async () => prisma.$disconnect());
