"use client";

import * as React from "react";
import { Camera, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadMemberAvatarAction } from "@/app/(portal)/portal/actions";
import { fileToCompressedDataUrl } from "@/lib/image";
import { memberAvatarUrl, cn } from "@/lib/utils";
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
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    setPreviewUrl(null);
  }, [member.avatarUrl]);

  const displayUrl = previewUrl ?? memberAvatarUrl(member);
  const sizeClass = size === "lg" ? "h-20 w-20 rounded-2xl text-lg" : "h-11 w-11 rounded-2xl text-sm";

  async function uploadFile(file: File) {
    setUploading(true);
    setPickerOpen(false);
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
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void uploadFile(file);
  }

  function openCamera() {
    setPickerOpen(false);
    cameraInputRef.current?.click();
  }

  function openGallery() {
    setPickerOpen(false);
    galleryInputRef.current?.click();
  }

  const avatar = (
    <Avatar className={cn(sizeClass, className)}>
      <AvatarImage src={displayUrl} alt={member.fullName} />
      <AvatarFallback>{member.fullName.slice(0, 2)}</AvatarFallback>
    </Avatar>
  );

  if (!editable) return avatar;

  return (
    <>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => setPickerOpen(true)}
        className="group relative inline-flex touch-manipulation rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="portal-dialog gap-0 p-0 sm:max-w-sm">
          <DialogHeader className="border-b border-border/50 px-4 py-4 text-left">
            <DialogTitle>Foto de perfil</DialogTitle>
            <DialogDescription>
              Elige cómo quieres añadir tu foto.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 p-4">
            <Button
              type="button"
              variant="secondary"
              className="min-h-12 justify-start gap-3 touch-manipulation"
              onClick={openCamera}
            >
              <Camera className="h-5 w-5" />
              Hacer una foto
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-12 justify-start gap-3 touch-manipulation"
              onClick={openGallery}
            >
              <ImageIcon className="h-5 w-5" />
              Elegir de la galería
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 touch-manipulation"
              onClick={() => setPickerOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
