"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

const TOTAL_FRAMES = 39;

// Natural sequential filenames from frame_000 to frame_038
const FRAME_FILENAMES: string[] = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
  const padIndex = String(i).padStart(3, "0");
  return `/animation-background/Digital_sprout_growing_from_book_6b5392ba_1080p_${padIndex}.jpg`;
});

interface AnimatedBackgroundProps {
  fps?: number;
  className?: string;
  alignmentX?: number; // 0 = left, 0.5 = center, 1 = right
  alignmentY?: number; // 0 = top, 0.5 = center, 1 = bottom
}

export default function AnimatedBackground({
  fps = 18,
  className = "",
  alignmentX = 0.5,
  alignmentY = 0.5,
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameIndexRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const transitionStepRef = useRef<number>(0);
  const TRANSITION_STEPS = 6; // Frames to cross-dissolve between last and first frame for seamless loop

  const [isReady, setIsReady] = useState<boolean>(false);

  // Draw image frame using aspect-ratio cover without distortion or blur
  const drawCover = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement,
      width: number,
      height: number,
      alpha = 1.0
    ) => {
      const imgW = img.naturalWidth || 1920;
      const imgH = img.naturalHeight || 1080;
      const imgRatio = imgW / imgH;
      const canvasRatio = width / height;

      // Responsive alignment: on desktop (wide viewports) shift tree to right side (0.84)
      // On mobile/portrait viewports, anchor tree and book toward bottom (0.88) to clear top text
      const isWide = width >= 1024;
      const activeAlignX = alignmentX !== 0.5 ? alignmentX : isWide ? 0.84 : 0.5;
      const activeAlignY = alignmentY !== 0.5 ? alignmentY : isWide ? 0.5 : 0.92;

      let renderW = width;
      let renderH = height;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        renderW = width;
        renderH = width / imgRatio;
        offsetY = (height - renderH) * activeAlignY;
        offsetX = (width - renderW) * activeAlignX;
      } else {
        renderH = height;
        renderW = height * imgRatio;
        offsetX = (width - renderW) * activeAlignX;
        offsetY = (height - renderH) * activeAlignY;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
      ctx.restore();
    },
    [alignmentY, alignmentX]
  );

  useEffect(() => {
    let isCancelled = false;

    // Check prefers-reduced-motion
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReducedMotion = reducedMotionQuery.matches;

    // Preload all 39 frames in sequence
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    FRAME_FILENAMES.forEach((src, idx) => {
      const img = new Image();
      img.src = src;

      img.onload = () => {
        if (isCancelled) return;
        loadedImages[idx] = img;
        loadedCount += 1;

        // Render first frame immediately once loaded to prevent any blank or flash
        if (idx === 0 && canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d", { alpha: false });
          if (ctx) {
            drawCover(ctx, img, canvas.width, canvas.height, 1.0);
          }
        }

        // Once majority or all frames loaded, activate smooth loop
        if (loadedCount >= Math.min(10, TOTAL_FRAMES) && !isReady) {
          imagesRef.current = loadedImages;
          setIsReady(true);
        }
      };

      img.onerror = () => {
        if (src.includes("/animation-background/")) {
          // Fallback to URL-encoded space path if hyphen path is not found
          img.src = src.replace("/animation-background/", "/animation%20background/");
        } else {
          console.warn(`[AnimatedBackground] Failed to load frame ${idx}: ${src}`);
        }
      };

      loadedImages[idx] = img;
    });

    imagesRef.current = loadedImages;

    return () => {
      isCancelled = true;
    };
  }, [drawCover, isReady]);

  // Main Canvas Render and Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let isRunning = true;
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = reducedMotionQuery.matches;

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

    // Sizing and DPR adaptation
    const updateCanvasSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // Redraw current frame
      const currentImg = imagesRef.current[frameIndexRef.current];
      if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
        drawCover(ctx, currentImg, canvas.width, canvas.height, 1.0);
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Visibility API: pause when tab hidden, resume when visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = null;
        }
      } else {
        lastFrameTimeRef.current = performance.now();
        if (isRunning && !animFrameIdRef.current) {
          animFrameIdRef.current = requestAnimationFrame(renderLoop);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const frameIntervalMs = 1000 / fps;

    const renderLoop = (timestamp: number) => {
      if (!isRunning) return;

      // If user prefers reduced motion, render the anchor frame statically and halt RAF loop
      if (prefersReducedMotion) {
        const anchorImg = imagesRef.current[18] || imagesRef.current[0];
        if (anchorImg && anchorImg.complete) {
          drawCover(ctx, anchorImg, canvas.width, canvas.height, 1.0);
        }
        return;
      }

      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastFrameTimeRef.current;

      if (elapsed >= frameIntervalMs) {
        lastFrameTimeRef.current = timestamp - (elapsed % frameIntervalMs);

        const images = imagesRef.current;
        const total = images.length;

        if (total > 0) {
          const lastIdx = total - 1;
          const firstIdx = 0;

          // Check if we are in the seamless loop transition from last frame back to first frame
          if (isTransitioningRef.current) {
            transitionStepRef.current += 1;
            const progress = transitionStepRef.current / TRANSITION_STEPS;

            const finalImg = images[lastIdx];
            const firstImg = images[firstIdx];

            if (finalImg?.complete && firstImg?.complete) {
              // Draw final frame as base, smoothly cross-dissolving first frame on top
              drawCover(ctx, finalImg, canvas.width, canvas.height, 1.0);
              drawCover(ctx, firstImg, canvas.width, canvas.height, progress);
            }

            if (transitionStepRef.current >= TRANSITION_STEPS) {
              isTransitioningRef.current = false;
              transitionStepRef.current = 0;
              frameIndexRef.current = 0;
            }
          } else {
            // Normal sequential playback
            const currIdx = frameIndexRef.current;
            const img = images[currIdx];

            if (img && img.complete && img.naturalWidth > 0) {
              drawCover(ctx, img, canvas.width, canvas.height, 1.0);
            }

            // Advance frame index
            if (currIdx >= lastIdx) {
              // Initiate smooth transition into first frame
              isTransitioningRef.current = true;
              transitionStepRef.current = 0;
            } else {
              frameIndexRef.current = currIdx + 1;
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      window.removeEventListener("resize", updateCanvasSize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
    };
  }, [drawCover, fps]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{
          // STRICT: NO blur, no filters, no opacity reduction
          filter: "none",
          transform: "translateZ(0)", // GPU composite layer
        }}
      />
    </div>
  );
}
