"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { useRef } from "react";

import { cn } from "@/lib/utils";

type DockItem = {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
};

type MacOSDockProps = {
  apps: DockItem[];
  openApps: string[];
  onAppClick: (app: DockItem) => void;
  className?: string;
};

type DockAppButtonProps = {
  app: DockItem;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  isOpen: boolean;
  onClick: (app: DockItem) => void;
};

const BASE_ICON_SIZE = 56;
const HOVER_DISTANCE = 160;
const MAX_SIZE_INCREASE = 24;

function DockAppButton({ app, mouseX, isOpen, onClick }: DockAppButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const distance = useTransform(mouseX, (value) => {
    const bounds = ref.current?.getBoundingClientRect();

    if (!bounds) {
      return Number.POSITIVE_INFINITY;
    }

    return value - (bounds.x + bounds.width / 2);
  });
  const widthTransform = useTransform(distance, (value) => {
    if (!Number.isFinite(value)) {
      return BASE_ICON_SIZE;
    }

    const dist = Math.abs(value);
    if (dist > HOVER_DISTANCE) {
      return BASE_ICON_SIZE;
    }

    return BASE_ICON_SIZE + ((HOVER_DISTANCE - dist) / HOVER_DISTANCE) * MAX_SIZE_INCREASE;
  });

  const width = useSpring(widthTransform, {
    mass: 0.12,
    stiffness: 150,
    damping: 12,
  });

  const Icon = app.icon;

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={app.name}
      title={app.name}
      onClick={() => onClick(app)}
      style={{ width, height: width }}
      className={cn(
        "relative flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-white/40 bg-white/80 text-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white",
        isOpen && "text-blue-600"
      )}
    >
      <Icon className="size-6" strokeWidth={2} />
      <span
        className={cn(
          "pointer-events-none absolute -bottom-3 size-1.5 rounded-full bg-blue-500 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      />
    </motion.button>
  );
}

export function MacOSDock({ apps, openApps, onAppClick, className }: MacOSDockProps) {
  const mouseX = useMotionValue(Number.POSITIVE_INFINITY);

  return (
    <div
      className={cn(
        "inline-flex items-end gap-2 rounded-3xl border border-white/60 bg-white/70 p-2.5 shadow-lg backdrop-blur-xl",
        className
      )}
      onMouseMove={(event) => mouseX.set(event.clientX)}
      onMouseLeave={() => mouseX.set(Number.POSITIVE_INFINITY)}
    >
      {apps.map((app) => (
        <DockAppButton key={app.id} app={app} mouseX={mouseX} isOpen={openApps.includes(app.id)} onClick={onAppClick} />
      ))}
    </div>
  );
}
