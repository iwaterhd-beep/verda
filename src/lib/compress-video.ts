"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const FFMPEG_CORE_VERSION = "0.12.10";
const FFMPEG_CDN = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`;

export type CompressVideoProgress = {
  stage: "loading" | "compressing";
  percent: number;
};

type EncodeProfile = {
  id: string;
  buildArgs: (input: string, output: string, maxWidth: string) => string[];
};

const SIZE_PASSES = [
  { maxWidth: "1280", maxBytes: 80 * 1024 * 1024 },
  { maxWidth: "960", maxBytes: 50 * 1024 * 1024 },
  { maxWidth: "720", maxBytes: 35 * 1024 * 1024 },
  { maxWidth: "640", maxBytes: 25 * 1024 * 1024 },
];

const ENCODE_PROFILES: EncodeProfile[] = [
  {
    id: "auto-audio",
    buildArgs: (input, output, maxWidth) => [
      "-i",
      input,
      "-vf",
      `scale='min(${maxWidth},iw)':-2`,
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-ac",
      "2",
      output,
    ],
  },
  {
    id: "auto-silent",
    buildArgs: (input, output, maxWidth) => [
      "-i",
      input,
      "-vf",
      `scale='min(${maxWidth},iw)':-2`,
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      output,
    ],
  },
  {
    id: "mpeg4",
    buildArgs: (input, output, maxWidth) => [
      "-i",
      input,
      "-vf",
      `scale='min(${maxWidth},iw)':-2`,
      "-c:v",
      "mpeg4",
      "-q:v",
      "4",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      output,
    ],
  },
  {
    id: "h264",
    buildArgs: (input, output, maxWidth) => [
      "-i",
      input,
      "-vf",
      `scale='min(${maxWidth},iw)':-2`,
      "-c:v",
      "libx264",
      "-crf",
      "28",
      "-preset",
      "veryfast",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      output,
    ],
  },
  {
    id: "simple",
    buildArgs: (input, output) => ["-i", input, output],
  },
];

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

function inputFileName(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  const fromMime = file.type.split("/")[1]?.split(";")[0]?.toLowerCase();
  const ext =
    fromName && /^[a-z0-9]{2,5}$/.test(fromName)
      ? fromName
      : fromMime && /^[a-z0-9]{2,5}$/.test(fromMime)
        ? fromMime
        : "mp4";
  return `input.${ext}`;
}

async function getFFmpeg() {
  if (ffmpegInstance?.loaded) return ffmpegInstance;
  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = (async () => {
      const ffmpeg = new FFmpeg();
      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(
            `${FFMPEG_CDN}/ffmpeg-core.js`,
            "text/javascript",
          ),
          wasmURL: await toBlobURL(
            `${FFMPEG_CDN}/ffmpeg-core.wasm`,
            "application/wasm",
          ),
        });
      } catch {
        ffmpegLoadPromise = null;
        throw new Error(
          "No se pudo cargar el compresor. Revisa tu conexión e inténtalo otra vez.",
        );
      }
      ffmpegInstance = ffmpeg;
      return ffmpeg;
    })();
  }
  return ffmpegLoadPromise;
}

async function prepareInput(
  ffmpeg: FFmpeg,
  file: File,
): Promise<{ inputPath: string; cleanup: () => Promise<void> }> {
  const mountPoint = "/media";
  try {
    await ffmpeg.mount(
      "WORKERFS" as Parameters<FFmpeg["mount"]>[0],
      { files: [file] },
      mountPoint,
    );
    return {
      inputPath: `${mountPoint}/${file.name}`,
      cleanup: async () => {
        await ffmpeg.unmount(mountPoint).catch(() => null);
      },
    };
  } catch {
    const inputPath = inputFileName(file);
    await ffmpeg.writeFile(inputPath, await fetchFile(file));
    return {
      inputPath,
      cleanup: async () => {
        await ffmpeg.deleteFile(inputPath).catch(() => null);
      },
    };
  }
}

async function tryEncode(
  ffmpeg: FFmpeg,
  file: File,
  outputName: string,
  profile: EncodeProfile,
  maxWidth: string,
  onProgress?: (progress: CompressVideoProgress) => void,
): Promise<File | null> {
  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.({
      stage: "compressing",
      percent: Math.min(99, Math.round(progress * 100)),
    });
  };

  ffmpeg.on("progress", progressHandler);

  const { inputPath, cleanup } = await prepareInput(ffmpeg, file);

  try {
    const code = await ffmpeg.exec(
      profile.buildArgs(inputPath, outputName, maxWidth),
    );
    if (code !== 0) {
      return null;
    }

    const data = await ffmpeg.readFile(outputName);
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
    if (!bytes.byteLength) return null;

    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const blob = new Blob([copy], { type: "video/mp4" });
    const baseName = file.name.replace(/\.[^.]+$/, "") || "video";
    return new File([blob], `${baseName}.mp4`, { type: "video/mp4" });
  } catch {
    return null;
  } finally {
    ffmpeg.off("progress", progressHandler);
    await ffmpeg.deleteFile(outputName).catch(() => null);
    await cleanup();
  }
}

export async function compressVideoFile(
  file: File,
  onProgress?: (progress: CompressVideoProgress) => void,
): Promise<File> {
  onProgress?.({ stage: "loading", percent: 0 });
  const ffmpeg = await getFFmpeg();
  onProgress?.({ stage: "loading", percent: 100 });

  let best: File | null = null;

  for (const sizePass of SIZE_PASSES) {
    for (const profile of ENCODE_PROFILES) {
      const outputName = `output-${profile.id}-${sizePass.maxWidth}.mp4`;
      const result = await tryEncode(
        ffmpeg,
        file,
        outputName,
        profile,
        sizePass.maxWidth,
        onProgress,
      );

      if (!result || result.size === 0) continue;

      best = result;
      if (result.size <= sizePass.maxBytes) {
        onProgress?.({ stage: "compressing", percent: 100 });
        return result;
      }
    }
  }

  if (best && best.size < file.size) {
    onProgress?.({ stage: "compressing", percent: 100 });
    return best;
  }

  if (best) {
    onProgress?.({ stage: "compressing", percent: 100 });
    return best;
  }

  throw new Error(
    "No se pudo comprimir el vídeo. Prueba con MP4/MOV o un clip más corto.",
  );
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
