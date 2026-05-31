"use client";

import * as React from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function blockMediaEvent(event: React.SyntheticEvent) {
  event.preventDefault();
  event.stopPropagation();
}

interface ProtectedImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProtectedImage({ src, alt, className }: ProtectedImageProps) {
  return (
    <div className="portal-protected-media relative h-full w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={cn("pointer-events-none h-full w-full object-cover", className)}
        onContextMenu={blockMediaEvent}
        onDragStart={blockMediaEvent}
      />
      <div
        className="portal-media-shield absolute inset-0 z-10"
        aria-hidden
        onContextMenu={blockMediaEvent}
      />
      <div className="portal-media-watermark absolute inset-0 z-[11]" aria-hidden />
    </div>
  );
}

interface ProtectedVideoProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  showControls?: boolean;
}

export function ProtectedVideo({
  src,
  className,
  autoPlay = false,
  loop = false,
  muted = true,
  showControls = false,
}: ProtectedVideoProps) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = React.useState(autoPlay);
  const [isMuted, setIsMuted] = React.useState(muted);

  React.useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (playing) void video.play().catch(() => setPlaying(false));
    else video.pause();
  }, [playing, src]);

  React.useEffect(() => {
    const video = ref.current;
    if (video) video.muted = isMuted;
  }, [isMuted, src]);

  return (
    <div className="portal-protected-media relative h-full w-full overflow-hidden">
      <video
        ref={ref}
        src={src}
        autoPlay={autoPlay}
        loop={loop}
        muted={isMuted}
        playsInline
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload noplaybackrate noremoteplayback"
        className={cn("pointer-events-none h-full w-full object-cover", className)}
        onContextMenu={blockMediaEvent}
        onDragStart={blockMediaEvent}
      />
      <div
        className="portal-media-shield absolute inset-0 z-10"
        aria-hidden
        onContextMenu={blockMediaEvent}
      />
      <div className="portal-media-watermark absolute inset-0 z-[11]" aria-hidden />
      {showControls && (
        <div className="absolute bottom-3 left-3 z-20 flex gap-2">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-10 w-10 touch-manipulation bg-background/80 backdrop-blur"
            aria-label={playing ? "Pausar vídeo" : "Reproducir vídeo"}
            onClick={() => setPlaying((value) => !value)}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-10 w-10 touch-manipulation bg-background/80 backdrop-blur"
            aria-label={isMuted ? "Activar sonido" : "Silenciar vídeo"}
            onClick={() => setIsMuted((value) => !value)}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}
