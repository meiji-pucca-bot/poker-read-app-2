"use client";

import { useEffect, useState } from "react";

export default function SplashGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showSplash && (
        <div className="splash-screen">
          <img
            src="/icon-512.png"
            className="splash-logo"
            alt="Poker Read"
          />
        </div>
      )}

      {children}
    </>
  );
}