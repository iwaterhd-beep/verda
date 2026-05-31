"use client";

import { createClient } from "@/lib/supabase/client";
import type { MemberApplication } from "@/types";

type Row = {
  id: string;
  full_name: string;
  document_id: string;
  birth_date: string;
  locality: string;
  address: string;
  phone: string;
  email: string;
  face_photo: string | null;
  dni_front: string | null;
  dni_back: string | null;
  status: MemberApplication["status"];
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
};

function toApplication(r: Row): MemberApplication {
  return {
    id: r.id,
    fullName: r.full_name,
    documentId: r.document_id,
    birthDate: r.birth_date,
    locality: r.locality,
    address: r.address,
    phone: r.phone,
    email: r.email,
    facePhoto: r.face_photo,
    dniFront: r.dni_front,
    dniBack: r.dni_back,
    status: r.status,
    rejectionReason: r.rejection_reason ?? undefined,
    submittedAt: r.submitted_at,
    reviewedAt: r.reviewed_at ?? undefined,
  };
}

export type NewApplication = Omit<
  MemberApplication,
  "id" | "status" | "submittedAt" | "reviewedAt" | "rejectionReason"
> & { clubId?: string };

export async function submitApplication(data: NewApplication) {
  const supabase = createClient();
  const { error } = await supabase.from("member_applications").insert({
    club_id: data.clubId ?? null,
    full_name: data.fullName,
    document_id: data.documentId,
    birth_date: data.birthDate,
    locality: data.locality,
    address: data.address,
    phone: data.phone,
    email: data.email,
    face_photo: data.facePhoto,
    dni_front: data.dniFront,
    dni_back: data.dniBack,
  });
  if (error) throw error;
}

export async function fetchApplications(): Promise<MemberApplication[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("member_applications")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(toApplication);
}

export async function fetchMyApplication(): Promise<MemberApplication | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("members")
    .select("email")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member?.email) return null;

  const { data, error } = await supabase
    .from("member_applications")
    .select("*")
    .eq("email", member.email)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return toApplication(data as Row);
}

export async function rejectApplication(id: string, reason?: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("member_applications")
    .update({
      status: "REJECTED",
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason ?? null,
    })
    .eq("id", id);
  if (error) throw error;
}
