import { NextResponse } from "next/server";
import { members } from "@/lib/mock-data";
import type { Member } from "@/types";

// NOTA: almacén en memoria para la demo. En producción se reemplaza por Prisma:
//   const data = await prisma.member.findMany({ where: { clubId } })
const store: Member[] = [...members];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase();
  const status = searchParams.get("status");

  let result = store;
  if (q) {
    result = result.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.documentId.toLowerCase().includes(q),
    );
  }
  if (status && status !== "ALL") {
    result = result.filter((m) => m.status === status);
  }

  return NextResponse.json({ data: result, total: result.length });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.fullName) {
    return NextResponse.json(
      { error: "El nombre es obligatorio" },
      { status: 422 },
    );
  }

  const member: Member = {
    id: `m_${Math.random().toString(36).slice(2, 8)}`,
    fullName: body.fullName,
    email: body.email ?? "",
    phone: body.phone ?? "",
    documentType: body.documentType ?? "DNI",
    documentId: body.documentId ?? "",
    birthDate: body.birthDate ?? "2000-01-01",
    status: "PENDING",
    membershipPlan: body.membershipPlan ?? "BASIC",
    joinedAt: new Date().toISOString().slice(0, 10),
    expiresAt: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10),
    qrCode: `VRD-${Math.floor(Math.random() * 900 + 100)}`,
    consumptionLimit: 40,
    consumedThisMonth: 0,
    signatureSigned: false,
    ageVerified: false,
    avatarSeed: body.fullName,
    walletBalance: 0,
  };

  store.unshift(member);
  return NextResponse.json({ data: member }, { status: 201 });
}
