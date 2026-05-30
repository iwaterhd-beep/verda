import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Verda…");

  const club = await prisma.club.upsert({
    where: { slug: "club-verde" },
    update: {},
    create: {
      name: "Club Verde",
      slug: "club-verde",
      city: "Barcelona",
      brandColor: "#22c55e",
      plan: "PRO",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@clubverde.com" },
    update: {},
    create: {
      clubId: club.id,
      email: "admin@clubverde.com",
      name: "Álex Ríos",
      role: "CLUB_ADMIN",
      twoFactorEnabled: true,
    },
  });

  const spaces = ["Sala Lounge", "Terraza", "Sala Gaming", "Sala Privada"];
  for (const name of spaces) {
    await prisma.space.create({
      data: { clubId: club.id, name, capacity: 6 },
    });
  }

  const members = [
    { fullName: "Lucía Fernández", documentId: "12345678A", plan: "PREMIUM" as const, status: "ACTIVE" as const },
    { fullName: "Marc Vidal", documentId: "87654321B", plan: "VIP" as const, status: "ACTIVE" as const },
    { fullName: "Aisha El Amrani", documentId: "X1234567L", plan: "BASIC" as const, status: "PENDING" as const },
  ];

  for (const [i, m] of members.entries()) {
    await prisma.member.create({
      data: {
        clubId: club.id,
        fullName: m.fullName,
        email: `${m.fullName.split(" ")[0].toLowerCase()}@email.com`,
        documentId: m.documentId,
        birthDate: new Date("1994-01-01"),
        qrCode: `VRD-00${i + 1}`,
        status: m.status,
        plan: m.plan,
        ageVerified: true,
        expiresAt: new Date(Date.now() + 365 * 864e5),
      },
    });
  }

  const products = [
    { name: "Amnesia Haze", sku: "FL-AMN", category: "FLOR" as const, stock: 124, price: 9 },
    { name: "Critical Kush", sku: "FL-CRK", category: "FLOR" as const, stock: 38, price: 10 },
    { name: "Hash Marroquí", sku: "EX-HMR", category: "EXTRACTO" as const, stock: 76, price: 12 },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        clubId: club.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        stock: p.stock,
        lowStockThreshold: 50,
        pricePerUnit: p.price,
      },
    });
  }

  console.log("✅ Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
