import { useLayoutEffect, useRef, useCallback } from "react";
import { gsap, prefersReducedMotion, EASE } from "@/lib/gsapConfig";
import X from "lucide-react/dist/esm/icons/x";

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") onCloseRef.current();
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    // GSAP entrance — overlay fade + modal scale/y (transforms only)
    if (!prefersReducedMotion) {
      if (overlayRef.current) {
        gsap.from(overlayRef.current, {
          opacity: 0,
          duration: 0.25,
          ease: EASE.out,
        });
      }
      if (modalRef.current) {
        gsap.from(modalRef.current, {
          opacity: 0,
          scale: 0.96,
          y: 16,
          duration: 0.35,
          ease: EASE.back,
        });
      }
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) onCloseRef.current();
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 sm:p-6"
      style={{
        background:
          "linear-gradient(180deg, rgb(4 8 18 / 0.52), rgb(4 8 18 / 0.68))",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        overscrollBehavior: "contain",
      }}
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`w-full ${sizeClasses[size]} rounded-[28px] shadow-modal overflow-hidden max-h-[calc(100vh-1.5rem)] sm:max-h-[min(88vh,820px)]`}
        style={{
          background:
            "linear-gradient(145deg, rgb(var(--glass-bg-strong) / 0.9), rgb(var(--glass-bg) / 0.55))",
          border: "1px solid rgb(var(--glass-border) / 0.35)",
          boxShadow: "var(--shadow-modal)",
          backdropFilter: "blur(18px) saturate(140%)",
          WebkitBackdropFilter: "blur(18px) saturate(140%)",
        }}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-border">
          <h3 className="text-section text-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-overlay text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 overflow-y-auto max-h-[calc(100vh-7rem)] sm:max-h-[calc(min(88vh,820px)-88px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
