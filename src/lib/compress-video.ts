"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const FFMPEG_CORE_VERSION = "0.12.10";
const FFMPEG_CDN = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

export type CompressVideoProgress = {
  stage: "loading" | "compressing";
  percent: number;
};

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;
  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = (async () => {
      const ffmpeg = new FFmpeg();
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
      ffmpegInstance = ffmpeg;
      return ffmpeg;
    })();
  }
  return ffmpegLoadPromise;
}

function outputNameForAttempt(attempt: number) {
  return attempt === 0 ? "output.mp4" : `output-${attempt}.mp4`;
}

async function runCompressPass(
  ffmpeg: FFmpeg,
  inputName: string,
  outputName: string,
  crf: string,
  maxWidth: string,
  onProgress?: (progress: CompressVideoProgress) => void,
) {
  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.({
      stage: "compressing",
      percent: Math.min(99, Math.round(progress * 100)),
    });
  };

  ffmpeg.on("progress", progressHandler);
  try {
    await ffmpeg.exec([
      "-i",
      inputName,
      "-vf",
      `scale='min(${maxWidth},iw)':-2`,
      "-c:v",
      "libx264",
      "-crf",
      crf,
      "-preset",
      "fast",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      outputName,
    ]);
  } finally {
    ffmpeg.off("progress", progressHandler);
  }
}

export async function compressVideoFile(
  file: File,
  onProgress?: (progress: CompressVideoProgress) => void,
): Promise<File> {
  onProgress?.({ stage: "loading", percent: 0 });
  const ffmpeg = await getFFmpeg();
  onProgress?.({ stage: "loading", percent: 100 });

  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const inputName = `input.${ext.replace(/[^a-z0-9]/gi, "") || "mp4"}`;

  await ffmpeg.writeFile(inputName, await fetchFile(file));

  const passes: { crf: string; maxWidth: string; maxBytes: number }[] = [
    { crf: "28", maxWidth: "1280", maxBytes: 80 * 1024 * 1024 },
    { crf: "32", maxWidth: "960", maxBytes: 50 * 1024 * 1024 },
    { crf: "35", maxWidth: "720", maxBytes: 35 * 1024 * 1024 },
  ];

  let compressed: File | null = null;

  for (let i = 0; i < passes.length; i++) {
    const pass = passes[i];
    const outputName = outputNameForAttempt(i);
    await runCompressPass(
      ffmpeg,
      inputName,
      outputName,
      pass.crf,
      pass.maxWidth,
      onProgress,
    );

    const data = await ffmpeg.readFile(outputName);
    await ffmpeg.deleteFile(outputName).catch(() => null);

    const blob = new Blob([data as BlobPart], { type: "video/mp4" });
    const baseName = file.name.replace(/\.[^.]+$/, "") || "video";
    compressed = new File([blob], `${baseName}.mp4`, { type: "video/mp4" });

    if (compressed.size <= pass.maxBytes || i === passes.length - 1) {
      break;
    }
  }

  await ffmpeg.deleteFile(inputName).catch(() => null);

  if (!compressed || compressed.size === 0) {
    throw new Error("La compresión no produjo un vídeo válido.");
  }

  onProgress?.({ stage: "compressing", percent: 100 });
  return compressed;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
