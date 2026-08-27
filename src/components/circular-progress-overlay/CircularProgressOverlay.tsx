"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface CircularProgressOverlayProps {
  visible: boolean;
  ready: boolean;
  onComplete?: () => void;
}

const STAGE_MESSAGES = [
  { max: 25, message: "Rechecking validation..." },
  { max: 55, message: "Analyzing changes..." },
  { max: 85, message: "Verifying data..." },
  { max: 101, message: "Finalizing..." },
];

const MAX_BEFORE_READY = 99;
const BASE_STEP_MS = 120;
const FINAL_STEP_MS = 10;

const CircularProgressOverlay: React.FC<CircularProgressOverlayProps> = ({
  visible,
  ready,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const animationRef = useRef<number | null>(null);
  const finalizeTimeoutRef = useRef<number | null>(null);

  const stopTimers = useCallback(() => {
    if (animationRef.current) {
      window.clearInterval(animationRef.current);
      animationRef.current = null;
    }
    if (finalizeTimeoutRef.current) {
      window.clearTimeout(finalizeTimeoutRef.current);
      finalizeTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      stopTimers();
      setProgress(0);
      setMessage("");
      return;
    }

    stopTimers();

    const max = ready ? 100 : MAX_BEFORE_READY;
    const intervalMs = ready ? FINAL_STEP_MS : BASE_STEP_MS;

    animationRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= max) {
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      stopTimers();
    };
  }, [ready, stopTimers, visible]);

  useEffect(() => {
    if (!visible) return;

    const stage = STAGE_MESSAGES.find(({ max }) => progress < max);
    setMessage(stage?.message ?? "Finalizing...");
  }, [progress, visible]);

  useEffect(() => {
    if (!visible || !ready) return;
    if (progress < 100) return;
    if (finalizeTimeoutRef.current) {
      window.clearTimeout(finalizeTimeoutRef.current);
    }
    finalizeTimeoutRef.current = window.setTimeout(() => {
      onComplete?.();
    }, 75);
  }, [onComplete, progress, ready, visible]);

  if (!visible) return null;

  const size = 120;
  const center = size / 2;
  const radius = 44;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.min(100, Math.max(0, progress));
  const dashOffset = circumference - (safeProgress / 100) * circumference;

  return (
    <div className="modal-loader-wrapper" aria-live="polite" aria-busy="true">
      <div className="progress-container">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ display: "block" }}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={stroke}
            fill="transparent"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#65a30d"
            strokeWidth={stroke}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 0.1s linear",
            }}
          />
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="24"
            fontWeight="600"
            fill="#111827"
          >
            {Math.round(safeProgress)}%
          </text>
        </svg>
      </div>

      <div className="progress-message">{message}</div>
    </div>
  );
};

export default CircularProgressOverlay;
