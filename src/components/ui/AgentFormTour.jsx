"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

const DEFAULT_SPACING = 18;

function resolveElement(selector) {
  if (typeof selector === "function") {
    return selector();
  }
  if (typeof selector === "string") {
    return document.querySelector(selector);
  }
  if (selector instanceof HTMLElement) {
    return selector;
  }
  return null;
}

function computePopoverPosition(
  rect,
  placement = "bottom-start",
  spacing = DEFAULT_SPACING
) {
  if (!rect) {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const positions = {
    "bottom-start": {
      top: rect.bottom + spacing,
      left: rect.left,
    },
    "bottom-center": {
      top: rect.bottom + spacing,
      left: rect.left + rect.width / 2,
      transform: "translateX(-50%)",
    },
    "bottom-end": {
      top: rect.bottom + spacing,
      left: rect.right,
      transform: "translateX(-100%)",
    },
    "top-start": {
      top: rect.top - spacing,
      left: rect.left,
      transform: "translateY(-100%)",
    },
    "top-center": {
      top: rect.top - spacing,
      left: rect.left + rect.width / 2,
      transform: "translate(-50%, -100%)",
    },
    "right-center": {
      top: rect.top + rect.height / 2,
      left: rect.right + spacing,
      transform: "translateY(-50%)",
    },
    "left-center": {
      top: rect.top + rect.height / 2,
      left: rect.left - spacing,
      transform: "translate(-100%, -50%)",
    },
  };

  return positions[placement] ?? positions["bottom-start"];
}

function clampPopover(style, rect, placement) {
  if (!rect) return style;
  const next = { ...style };
  const width = window.innerWidth;
  const height = window.innerHeight;

  if (typeof next.left === "number") {
    if (next.left < 16) {
      next.left = 16;
      next.transform = undefined;
    }
    if (next.left > width - 360) { // Adjusted width for wider card
      next.left = width - 360;
      if (placement?.includes("center")) {
        next.transform = undefined;
      }
    }
  }

  if (typeof next.top === "number") {
    if (next.top < 16) {
      next.top = 16;
      if (placement?.startsWith("top")) {
        next.transform = undefined;
      }
    }
    if (next.top > height - 300) {
      next.top = height - 300;
      if (!placement?.startsWith("top")) {
        next.transform = undefined;
      }
    }
  }

  return next;
}

export default function AgentFormTour({
  steps = [],
  isOpen = false,
  onClose,
  onStepChange,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentRect, setCurrentRect] = useState(null);
  const [currentElement, setCurrentElement] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(0);
      setCurrentRect(null);
      setCurrentElement(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const step = steps?.[activeIndex];
    if (!step) return;

    const element = resolveElement(step.selector);

    if (currentElement && currentElement !== element) {
      currentElement.classList.remove("tour-highlight");
      currentElement.style.removeProperty("z-index");
      currentElement.style.removeProperty("position");
      currentElement.style.removeProperty("box-shadow");
      currentElement.style.removeProperty("background-color");
    }

    if (element) {
      element.classList.add("tour-highlight");

      if (!element.style.position || element.style.position === "static") {
        element.style.position = "relative";
      }
      element.style.zIndex = "100"; // Lower than popover's 110 (z-50 + child)
      // Add subtle highlight to target
      element.style.boxShadow = "0 0 0 4px rgba(230, 138, 68, 0.2)"; // Brand highlight
      element.style.backgroundColor = "white"; // Ensure visibility
      element.style.borderRadius = "0.75rem"; // Match rounded-xl

      setCurrentRect(element.getBoundingClientRect());
      setCurrentElement(element);

      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      const tm = setTimeout(() => {
        if (!document.body.contains(element)) return;
        setCurrentRect(element.getBoundingClientRect());
      }, 250);

      const updateRect = () => {
        if (!element) return;
        setCurrentRect(element.getBoundingClientRect());
      };

      window.addEventListener("resize", updateRect);
      window.addEventListener("scroll", updateRect, true);

      return () => {
        clearTimeout(tm);
        window.removeEventListener("resize", updateRect);
        window.removeEventListener("scroll", updateRect, true);
        if (element) {
          element.classList.remove("tour-highlight");
          element.style.removeProperty("z-index");
          element.style.removeProperty("position");
          element.style.removeProperty("box-shadow");
          element.style.removeProperty("background-color");
          element.style.removeProperty("border-radius");
        }
      };
    } else {
      setCurrentRect(null);
      setCurrentElement(null);
    }
  }, [activeIndex, steps, isOpen, currentElement]);

  const goTo = useCallback(
    (index) => {
      setActiveIndex(index);
      onStepChange?.(index);
    },
    [onStepChange]
  );

  const handleNext = useCallback(() => {
    const next = activeIndex + 1;
    if (next < steps.length) {
      goTo(next);
    } else {
      onClose?.();
    }
  }, [activeIndex, steps, goTo, onClose]);

  const handleBack = useCallback(() => {
    const prev = activeIndex - 1;
    if (prev >= 0) {
      goTo(prev);
    }
  }, [activeIndex, goTo]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
      if (event.key === "ArrowRight") {
        handleNext();
      }
      if (event.key === "ArrowLeft") {
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, handleNext, handleBack, onClose]);

  const activeStep = steps?.[activeIndex];
  const popoverStyle = useMemo(() => {
    if (!activeStep) return {};
    const base = computePopoverPosition(
      currentRect,
      activeStep.placement,
      activeStep.spacing ?? DEFAULT_SPACING
    );
    return clampPopover(base, currentRect, activeStep.placement);
  }, [activeStep, currentRect]);

  if (!mounted || !isOpen || !activeStep) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/20"
          onClick={() => onClose?.()}
        />

        {/* Popover */}
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute z-[110] w-[340px] rounded-2xl border border-[#E0D4BC] bg-white/95 p-6 shadow-2xl backdrop-blur-xl"
          style={popoverStyle}
        >
          <div className="flex items-start justify-between mb-4">
            <span className="inline-flex items-center rounded-full bg-[#E68A44]/10 px-2.5 py-0.5 text-xs font-bold text-[#E68A44]">
              Step {activeIndex + 1} of {steps.length}
            </span>
            <button
              onClick={() => onClose?.()}
              className="rounded-full p-1 text-[#5D4037] hover:bg-[#FAF6F1] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h3 className="mb-2 text-lg font-bold text-[#2D2216]">
            {activeStep.title}
          </h3>
          <p className="mb-4 text-sm text-[#5D4037] leading-relaxed">
            {activeStep.description}
          </p>
          {activeStep.hint && (
            <div className="mb-6 rounded-lg bg-[#FAF6F1] p-3 text-xs text-[#8D7F71] italic border border-[#E0D4BC]/50">
              Tip: {activeStep.hint}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              className="text-sm font-medium text-[#8D7F71] hover:text-[#5D4037] transition-colors"
              onClick={() => onClose?.()}
            >
              Skip
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={activeIndex === 0}
                className={`flex items-center justify-center rounded-xl p-2.5 transition-colors ${
                  activeIndex === 0
                    ? "cursor-not-allowed text-[#E0D4BC]"
                    : "text-[#5D4037] hover:bg-[#FAF6F1] hover:text-[#2D2216]"
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#2D2216] to-[#1A1410] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#2D2216]/20 transition-all hover:translate-y-[-1px] hover:shadow-xl active:translate-y-[1px]"
                onClick={handleNext}
              >
                {activeIndex + 1 === steps.length
                  ? activeStep.finishLabel || "Finish"
                  : activeStep.nextLabel || "Next"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
