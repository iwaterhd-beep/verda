"use client";

import * as React from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadMemberAvatarAction } from "@/app/(portal)/portal/actions";
import { fileToCompressedDataUrl } from "@/lib/image";
import { memberAvatarUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Member } from "@/types";

interface MemberAvatarPickerProps {
  member: Member;
  size?: "md" | "lg";
  editable?: boolean;
  className?: string;
}

export function MemberAvatarPicker({
  member,
  size = "lg",
  editable = true,
  className,
}: MemberAvatarPickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    setPreviewUrl(null);
  }, [member.avatarUrl]);

  const displayUrl = previewUrl ?? memberAvatarUrl(member);
  const sizeClass = size === "lg" ? "h-20 w-20 rounded-2xl text-lg" : "h-11 w-11 rounded-2xl text-sm";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 800, 0.82);
      const blob = await fetch(dataUrl).then((response) => response.blob());
      const formData = new FormData();
      formData.append("avatar", blob, "avatar.jpg");

      const res = await uploadMemberAvatarAction(formData);
      if (res.error || !res.url) {
        toast.error("No se pudo subir la foto", { description: res.error });
        return;
      }

      setPreviewUrl(res.url);
      queryClient.invalidateQueries({ queryKey: ["my-member"] });
      toast.success("Foto de perfil actualizada");
    } catch {
      toast.error("No se pudo procesar la imagen");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const avatar = (
    <Avatar className={cn(sizeClass, className)}>
      <AvatarImage src={displayUrl} alt={member.fullName} />
      <AvatarFallback>{member.fullName.slice(0, 2)}</AvatarFallback>
    </Avatar>
  );

  if (!editable) return avatar;

  return (
    <div className="relative inline-flex">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="group relative touch-manipulation rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Cambiar foto de perfil"
      >
        {avatar}
        <span
          className={cn(
            "absolute inset-0 grid place-items-center rounded-2xl bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100",
            uploading && "opacity-100",
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Camera className="h-6 w-6" />
          )}
        </span>
      </button>
    </div>
  );
}
