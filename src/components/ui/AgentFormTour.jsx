"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

const DEFAULT_SPACING = 32;
const POPOVER_WIDTH = 300;

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
      left: rect.right - POPOVER_WIDTH,
    },
    "top-start": {
      top: rect.top - spacing, // Removed translateY(-100%) reliance to simplify clamping
      left: rect.left,
      transform: "translateY(-100%)"
    },
    "top-center": {
      top: rect.top - spacing,
      left: rect.left + rect.width / 2,
      transform: "translate(-50%, -100%)",
    },
    "top-end": {
       top: rect.top - spacing,
       left: rect.right - POPOVER_WIDTH,
       transform: "translateY(-100%)"
    },
    "right-start": {
      top: rect.top,
      left: rect.right + spacing,
    },
    "right-center": {
      top: rect.top + rect.height / 2,
      left: rect.right + spacing,
      transform: "translateY(-50%)",
    },
    "right-end": {
      top: rect.bottom - 200, // Lift it up slightly so it doesn't hug the bottom edge
      left: rect.right + spacing,
      transform: "translateY(-100%)",
    },
    "left-start": {
      top: rect.top,
      left: rect.left - spacing - POPOVER_WIDTH,
    },
    "left-center": {
      top: rect.top + rect.height / 2,
      left: rect.left - spacing - POPOVER_WIDTH,
      transform: "translateY(-50%)",
    },
  };

  return positions[placement] ?? positions["bottom-start"];
}

function clampPopover(style, rect, placement) {
  if (!rect) return style;
  const next = { ...style };
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Horizontal Clamping
  if (typeof next.left === "number") {
    // If popover goes off left edge
    if (next.left < 16) {
       // Only clamp if not explicitly 'left' placement OR if it's REALLY off screen.
       // For 'left-*' placements, we prefer it to be placed left, but if no space, we might need flip logic.
       // For now, strict 'left' is requested. If it goes offscreen, clamp to 16px.
       // This might overlap target if target is at left edge, but better than invisible.
       next.left = 16;
       // If we forced it right (clamping to 16), and it had translateX(-50%) for center, we need to be careful? 
       // No, because left-center uses translateY(-50%) only (vertical).
       // However, bottom-center uses translateX(-50%).
       if (placement?.includes("-center") && !placement?.startsWith("left") && !placement?.startsWith("right") && !placement?.startsWith("top") && !placement?.startsWith("bottom")) {
          // This check is confusing. bottom-center has translateX.
          // If we clamp left, the translateX will still shift it left by 50%.
          // So next.left shouldn't be 16. It should be 16 + width/2.
          // For now let's just minimal clamp.
       }
        
       if (placement?.includes("bottom-center") || placement?.includes("top-center")) {
           next.transform = next.transform?.replace("translateX(-50%)", "");
       }
    }
    
    // If popover goes off right edge
    if (next.left + POPOVER_WIDTH > width - 16) {
      next.left = width - POPOVER_WIDTH - 16;
       if (placement?.includes("bottom-center") || placement?.includes("top-center")) {
           next.transform = next.transform?.replace("translateX(-50%)", "");
       }
    }
  }

  // Vertical Clamping
  if (typeof next.top === "number") {
    if (next.top < 16) {
      next.top = 16;
      if (placement?.startsWith("top") || placement === "right-end") {
          // If we forced it down (clamping to 16), we must remove translateY(-100%) so it aligns top-down
          next.transform = next.transform?.replace("translateY(-100%)", "");
      }
    }
    
    // Bottom alignment clamping
    if (placement?.includes("end") || placement?.startsWith("top")) {
        // Alignment is bottom-up (translateY(-100%)), so 'top' is the BOTTOM edge.
        if (next.top > height - 16) {
            next.top = height - 16;
        }
    } else {
        // Standard alignment (top-down)
        const estHeight = 250; 
        if (next.top + estHeight > height - 16) {
             // If flows off bottom, pull it up
             if (next.top > height - 150) {
                 next.top = height - estHeight - 16;
             }
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
      setCurrentRect(element.getBoundingClientRect());
      setCurrentElement(element);

      // Scroll target into view
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
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
           element.style.removeProperty("position");
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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="sync">
      {isOpen && activeStep && (
        <>
           {/* Spotlight Overlay & Cutout */}
            {currentRect && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ 
                        opacity: 1,
                        top: currentRect.top,
                        left: currentRect.left,
                        width: currentRect.width,
                        height: currentRect.height,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                        duration: 0.4, 
                        ease: [0.25, 1, 0.5, 1], // Cubic bezier for smooth catch-up
                        opacity: { duration: 0.2 } 
                    }}
                    className="fixed z-[100] rounded-xl pointer-events-none"
                    style={{
                        // 1. Giant shadow for backdrop (no blur, just dark)
                        // 2. Focused ring (#E68A44)
                        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 4px #E68A44, 0 0 30px rgba(230, 138, 68, 0.4)"
                    }}
                />
            )}
            
            {/* Click Blocker (Transparent, below Spotlight hole but above page) 
                Actually, giant shadow doesn't block clicks. 
                If we want to block interactions outside, we need a refined strategy.
                But for now, visual clarity is priority #1. 
            */}

            {/* Popover (Z-102) */}
            <motion.div
                key={`tour-popover-${activeIndex}`}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="fixed z-[102] w-[300px] rounded-xl border border-[#E0D4BC] bg-white shadow-2xl overflow-hidden"
                style={popoverStyle}
            >
                {/* Header Bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#FAF6F1] bg-[#FAF6F1]/50">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E68A44]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#E68A44] uppercase tracking-wider">
                         Step {activeIndex + 1} / {steps.length}
                    </span>
                    <button
                        onClick={() => onClose?.()}
                        className="rounded-full p-1 text-[#8D7F71] hover:bg-[#E68A44]/10 hover:text-[#E68A44] transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="p-5">
                    <h3 className="mb-2 text-lg font-bold text-[#2D2216] leading-tight">
                        {activeStep.title}
                    </h3>
                    <p className="mb-4 text-sm leading-snug text-[#5D4037]">
                        {activeStep.description}
                    </p>
                    
                    {activeStep.hint && (
                        <div className="mb-5 rounded-lg bg-[#FAF6F1] p-3 text-xs text-[#5D4037] border border-[#E0D4BC] flex gap-2">
                             <div className="shrink-0 mt-0.5 w-[2px] h-full bg-[#E68A44] rounded-full"></div>
                             <p className="italic">{activeStep.hint}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                        <button
                            type="button"
                            className="text-xs font-semibold text-[#8D7F71] hover:text-[#2D2216] transition-colors px-1"
                            onClick={() => onClose?.()}
                        >
                            Skip
                        </button>
                        
                        <div className="flex items-center gap-2">
                             <button
                                type="button"
                                onClick={handleBack}
                                disabled={activeIndex === 0}
                                className={`flex items-center justify-center rounded-lg p-2 transition-colors border ${
                                    activeIndex === 0
                                    ? "border-transparent text-[#E0D4BC] cursor-not-allowed"
                                    : "border-[#E0D4BC] text-[#5D4037] hover:bg-[#FAF6F1] hover:text-[#2D2216]"
                                }`}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                className="group flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-[#2D2216] to-[#000000] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#2D2216]/20 transition-all hover:scale-[1.02] hover:shadow-[#E68A44]/30"
                                onClick={handleNext}
                            >
                                {activeIndex + 1 === steps.length
                                ? activeStep.finishLabel || "Finish"
                                : activeStep.nextLabel || "Next"}
                                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
