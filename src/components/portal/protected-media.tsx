"use client";

import * as React from "react";
import { Eye, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProtectedMediaReveal } from "@/components/portal/use-protected-media-reveal";

function blockMediaEvent(event: React.SyntheticEvent) {
  event.preventDefault();
  event.stopPropagation();
}

function ProtectedMediaShell({
  revealed,
  captureShield,
  handlers,
  media,
  controls,
  hint = "Mantén pulsado para ver",
}: {
  revealed: boolean;
  captureShield: boolean;
  handlers: ReturnType<typeof useProtectedMediaReveal>["handlers"];
  media: React.ReactNode;
  controls?: React.ReactNode;
  hint?: string;
}) {
  const locked = !revealed || captureShield;

  return (
    <div
      className="portal-protected-media relative h-full w-full touch-manipulation overflow-hidden"
      {...handlers}
    >
      <div
        className={cn(
          "portal-media-content relative h-full w-full transition-[filter,opacity,transform] duration-200",
          locked && "scale-110 blur-2xl brightness-50 saturate-50",
        )}
        aria-hidden={locked}
      >
        {media}
      </div>
      <div
        className="portal-media-shield absolute inset-0 z-10"
        aria-hidden
        onContextMenu={blockMediaEvent}
      />
      <div
        className={cn(
          "portal-media-watermark absolute inset-0 z-[11]",
          locked && "portal-media-watermark-strong",
        )}
        aria-hidden
      />
      {locked && (
        <div className="portal-media-reveal-overlay absolute inset-0 z-[12] grid place-items-center bg-background/75 backdrop-blur-md">
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary/80">
              <Eye className="h-5 w-5 text-muted-foreground" />
            </span>
            <p className="text-xs font-medium text-muted-foreground">{hint}</p>
          </div>
        </div>
      )}
      {!locked && controls}
    </div>
  );
}

interface ProtectedImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProtectedImage({ src, alt, className }: ProtectedImageProps) {
  const { revealed, captureShield, handlers } = useProtectedMediaReveal();

  return (
    <ProtectedMediaShell
      revealed={revealed}
      captureShield={captureShield}
      handlers={handlers}
      media={
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          draggable={false}
          className={cn("pointer-events-none h-full w-full object-cover", className)}
          onContextMenu={blockMediaEvent}
          onDragStart={blockMediaEvent}
        />
      }
    />
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
  const { revealed, captureShield, handlers } = useProtectedMediaReveal();
  const [playing, setPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(muted);
  const locked = !revealed || captureShield;

  React.useEffect(() => {
    const video = ref.current;
    if (!video || locked) {
      video?.pause();
      return;
    }
    if (playing || autoPlay) void video.play().catch(() => setPlaying(false));
    else video.pause();
  }, [playing, autoPlay, src, locked]);

  React.useEffect(() => {
    const video = ref.current;
    if (video) video.muted = isMuted;
  }, [isMuted, src]);

  React.useEffect(() => {
    if (locked) setPlaying(false);
  }, [locked]);

  return (
    <ProtectedMediaShell
      revealed={revealed}
      captureShield={captureShield}
      handlers={handlers}
      hint="Mantén pulsado para reproducir"
      media={
        <video
          ref={ref}
          src={locked ? undefined : src}
          preload="none"
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
      }
      controls={
        showControls ? (
          <div className="absolute bottom-3 left-3 z-20 flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-10 w-10 touch-manipulation bg-background/80 backdrop-blur"
              aria-label={playing ? "Pausar vídeo" : "Reproducir vídeo"}
              onPointerDown={(event) => event.stopPropagation()}
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
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setIsMuted((value) => !value)}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        ) : undefined
      }
    />
  );
}
