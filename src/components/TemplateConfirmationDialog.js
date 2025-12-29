"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function TemplateConfirmationDialog({
  isOpen,
  template,
  onConfirm,
  onCancel,
  isLoading,
}) {
  useEffect(() => {
    if (!isOpen) {
      // Dispatch close event
      window.dispatchEvent(
        new CustomEvent("modalStateChange", { detail: { isOpen: false } })
      );
      return;
    }

    // Dispatch open event
    window.dispatchEvent(
      new CustomEvent("modalStateChange", { detail: { isOpen: true } })
    );

    const { body, documentElement } = document;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = documentElement.style.overflow;
    const prevBodyPadding = body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = prevBodyOverflow;
      documentElement.style.overflow = prevHtmlOverflow;
      body.style.paddingRight = prevBodyPadding;
      window.dispatchEvent(
        new CustomEvent("modalStateChange", { detail: { isOpen: false } })
      );
    };
  }, [isOpen]);

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Reset expansion state when dialog opens/closes or template changes
  useEffect(() => {
    if (isOpen) {
        setIsDescriptionExpanded(false);
    }
  }, [isOpen, template]);

  const preventScroll = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        onWheel={preventScroll}
        onTouchMove={preventScroll}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-[#E0D4BC] bg-white/95 backdrop-blur-xl p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-[#2D2216]">
            Start Agent Interview
          </h3>
          <p className="mt-2 text-sm text-[#5D4037]">
            You&apos;re about to start chatting with Agent Interview
          </p>
        </div>

        {/* Template Preview */}
        {/* Template Preview */}
        <div className="mb-6 rounded-xl border border-[#E0D4BC] bg-white/50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#E68A44]/10 text-lg font-bold text-[#E68A44]">
              {template.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-[#2D2216]">{template.name}</h4>
              <span className="mt-1 inline-block rounded-full bg-[#E68A44]/10 px-2.5 py-0.5 text-xs font-medium text-[#E68A44]">
                {template.category}
              </span>
              <div className="mt-2 text-sm text-[#5D4037]">
                <p className={`${isDescriptionExpanded ? '' : 'line-clamp-2'}`}>
                    {template.description}
                </p>
                {template.description && template.description.length > 100 && (
                    <button 
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="flex items-center gap-1 mt-1 text-[#E68A44] hover:text-[#D57B3B] font-bold text-xs transition-colors focus:outline-none"
                    >
                        {isDescriptionExpanded ? (
                            <>Show less <ChevronUp className="w-3 h-3" /></>
                        ) : (
                            <>Read more <ChevronDown className="w-3 h-3" /></>
                        )}
                    </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Interview Info */}
        <div className="mb-6 rounded-xl bg-[#FAF6F1] border border-[#E0D4BC] p-4">
          <h4 className="mb-2 text-sm font-bold text-[#2D2216]">
            What to expect:
          </h4>
          <ul className="space-y-2 text-sm text-[#5D4037]">
            <li className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E68A44]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Agent Interview will ask about your agent&apos;s name</span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E68A44]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Customize capabilities and behavior</span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E68A44]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Refine system prompts and settings</span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E68A44]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Auto-fill form when interview completes</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-[#E0D4BC] bg-white px-4 py-3 text-sm font-medium text-[#5D4037] transition-colors hover:bg-[#FAF6F1] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-gradient-to-b from-[#2D2216] to-[#1A1410] px-4 py-3 text-sm font-medium text-white shadow-lg shadow-[rgba(45,34,22,0.24)] transition-all hover:shadow-[rgba(45,34,22,0.32)] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Starting...
              </span>
            ) : (
              "Start Interview"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
