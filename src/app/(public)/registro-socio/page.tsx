import { fetchClubInviteInfoAction } from "@/app/(dashboard)/socios/invite-actions";
import { RegistroSocioForm } from "./registro-socio-form";

export default async function RegistroSocioPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string }>;
}) {
  const { club: clubParam } = await searchParams;
  const clubInfo = clubParam
    ? await fetchClubInviteInfoAction(clubParam)
    : null;

  return (
    <RegistroSocioForm
      clubId={clubInfo?.id}
      clubName={clubInfo?.name}
      invalidClub={Boolean(clubParam && !clubInfo)}
    />
  );
}
