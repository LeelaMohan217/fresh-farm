"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPath = useRef(pathname);
  const timers = useRef<ReturnType<typeof setTimeout | typeof setInterval>[]>([]);

  function clearTimers() {
    timers.current.forEach((t) => { clearTimeout(t as ReturnType<typeof setTimeout>); clearInterval(t as ReturnType<typeof setInterval>); });
    timers.current = [];
  }

  // Detect link clicks to start the bar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("http") || href.startsWith("//") || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (href === window.location.pathname || href === window.location.pathname + window.location.search) return;

      clearTimers();
      setProgress(0);
      setVisible(true);

      // Quickly jump to 20%, then crawl to ~85%
      timers.current.push(setTimeout(() => setProgress(20), 20));
      timers.current.push(setTimeout(() => setProgress(50), 150));
      timers.current.push(setTimeout(() => setProgress(70), 400));
      timers.current.push(setTimeout(() => setProgress(85), 800));
    }

    document.addEventListener("click", handleClick);
    return () => { document.removeEventListener("click", handleClick); clearTimers(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Complete when new page renders
  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    clearTimers();
    setProgress(100);
    timers.current.push(setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "#16a34a",
          transition: progress === 100 ? "width 0.15s ease" : "width 0.4s ease",
          borderRadius: "0 2px 2px 0",
        }}
      />
    </div>
  );
}
