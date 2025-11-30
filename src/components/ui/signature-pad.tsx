"use client";

import * as React from "react";
import { Pen, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  value?: File;
  onChange: (file: File | undefined) => void;
  className?: string;
  disabled?: boolean;
}

export function SignaturePad({ value, onChange, className, disabled }: SignaturePadProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isDrawingRef = React.useRef(false);
  const lastPointRef = React.useRef<{ x: number; y: number } | null>(null);
  const resizeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastDimensionsRef = React.useRef<{ width: number; height: number } | null>(null);
  const [hasSignature, setHasSignature] = React.useState(false);
  const [isDrawing, setIsDrawing] = React.useState(false);

  const getCoordinates = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e) {
        const touch = e.touches[0] || e.changedTouches[0];
        if (!touch) return { x: 0, y: 0 };
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const drawLine = React.useCallback(
    (ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }) => {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    },
    [],
  );

  const startDrawing = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      isDrawingRef.current = true;
      setIsDrawing(true);
      const point = getCoordinates(e);
      lastPointRef.current = point;

      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#1a1a1a";
    },
    [disabled, getCoordinates],
  );

  const draw = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || disabled) return;
      e.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const point = getCoordinates(e);
      const lastPoint = lastPointRef.current;

      if (lastPoint) {
        drawLine(ctx, lastPoint, point);
      } else {
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }

      lastPointRef.current = point;
    },
    [disabled, getCoordinates, drawLine],
  );

  const convertToFile = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "signature.png", { type: "image/png" });
          onChange(file);
        }
      },
      "image/png",
      0.95,
    );
  }, [onChange]);

  const stopDrawing = React.useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setIsDrawing(false);
    lastPointRef.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasData = imageData.data.some((channel, index) => {
      return index % 4 !== 3 && channel !== 0;
    });

    if (hasData) {
      setHasSignature(true);
      convertToFile();
    }
  }, [convertToFile]);

  const clearSignature = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    lastPointRef.current = null;
    onChange(undefined);
  }, [onChange]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = containerRef.current;
    if (!container) return;

    const initCanvas = () => {
      const rect = container.getBoundingClientRect();
      const borderWidth = 2;
      const containerWidth = Math.max(rect.width, 300);
      const containerHeight = 200;
      
      const width = containerWidth - borderWidth * 2;
      const height = containerHeight - borderWidth * 2;

      if (
        lastDimensionsRef.current &&
        lastDimensionsRef.current.width === width &&
        lastDimensionsRef.current.height === height
      ) {
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const wasDrawing = isDrawingRef.current;

      if (!wasDrawing && canvas.width > 0 && canvas.height > 0) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const hasData = imageData.data.some((channel, index) => {
            return index % 4 !== 3 && channel !== 0;
          });

          if (hasData) {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext("2d");
            if (tempCtx) {
              tempCtx.putImageData(imageData, 0, 0);
            }

            const oldWidth = tempCanvas.width / dpr;
            const oldHeight = tempCanvas.height / dpr;

            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            const newCtx = canvas.getContext("2d");
            if (newCtx) {
              newCtx.scale(dpr, dpr);
              newCtx.fillStyle = "#ffffff";
              newCtx.fillRect(0, 0, width, height);
              newCtx.drawImage(tempCanvas, 0, 0, oldWidth, oldHeight, 0, 0, width, height);
              return;
            }
          }
        }
      }

      lastDimensionsRef.current = { width, height };

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 2.5;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }
    };

    initCanvas();

    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(initCanvas, 150);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(container);
    window.addEventListener("resize", handleResize);

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  React.useEffect(() => {
    if (value) {
      setHasSignature(true);
    } else if (!hasSignature && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [value, hasSignature]);

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={containerRef}
        className={cn(
          "relative w-full overflow-hidden rounded-lg border-2 bg-gradient-to-br from-white to-gray-50 transition-all duration-200",
          isDrawing ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "hover:border-primary/50",
        )}
        style={{ height: "200px", maxHeight: "200px", minHeight: "200px", flexShrink: 0 }}
      >
        <canvas
          ref={canvasRef}
          className="absolute block touch-none select-none"
          style={{ top: "2px", left: "2px", width: "calc(100% - 4px)", height: "calc(100% - 4px)" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
        {!hasSignature && !isDrawing && (
          <div className="absolute flex items-center justify-center pointer-events-none" style={{ top: "2px", left: "2px", width: "calc(100% - 4px)", height: "calc(100% - 4px)" }}>
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="rounded-full bg-muted/50 p-4">
                <Pen className="h-6 w-6 opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Sign here</p>
                <p className="text-xs opacity-70 mt-1">Use your mouse or touch screen</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSignature}
          disabled={!hasSignature || disabled}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Clear Signature
        </Button>
        {hasSignature && (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <Check className="h-4 w-4" />
            <span>Signature captured</span>
          </div>
        )}
      </div>
    </div>
  );
}

