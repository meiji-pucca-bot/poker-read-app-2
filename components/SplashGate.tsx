"use client";

import { useEffect, useState } from "react";

export default function SplashGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] =
    useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 1900);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {children}

      {showSplash && (
        <div className="kb-splash">
          <div className="kb-splash-content">
            <div className="kb-icon-wrap">
              <img
                src="/apple-icon.png"
                alt="Poker Read"
                className="kb-splash-icon"
              />

              <span className="kb-shine" />
            </div>

            <div className="kb-splash-text">
              <h1>Poker Read</h1>
              <p>AI POKER COACH</p>
            </div>
          </div>

          <style jsx>{`
            .kb-splash {
              position: fixed;
              inset: 0;
              z-index: 99999;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              background:
                radial-gradient(
                  circle at center,
                  rgba(31, 125, 78, 0.38),
                  transparent 42%
                ),
                linear-gradient(
                  160deg,
                  #07130e,
                  #0b1f16 55%,
                  #050e0a
                );
              animation: splashExit
                1.9s ease-in-out forwards;
            }

            .kb-splash-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              transform: translateY(-10px);
            }

            .kb-icon-wrap {
              position: relative;
              width: 140px;
              height: 140px;
              overflow: hidden;
              border-radius: 32px;
              box-shadow:
                0 0 0 1px
                  rgba(255, 215, 100, 0.4),
                0 20px 55px
                  rgba(0, 0, 0, 0.5),
                0 0 45px
                  rgba(238, 187, 56, 0.24);
              animation: iconPop
                0.65s
                cubic-bezier(
                  0.2,
                  0.9,
                  0.25,
                  1.2
                )
                both;
            }

            .kb-splash-icon {
              display: block;
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .kb-shine {
              position: absolute;
              top: -35%;
              left: -80%;
              width: 40%;
              height: 175%;
              background: linear-gradient(
                90deg,
                transparent,
                rgba(
                  255,
                  248,
                  210,
                  0.9
                ),
                transparent
              );
              filter: blur(2px);
              transform: rotate(18deg);
              animation: shineMove
                0.7s ease-out
                0.5s forwards;
            }

            .kb-splash-text {
              margin-top: 25px;
              text-align: center;
              opacity: 0;
              transform: translateY(14px);
              animation: textAppear
                0.45s ease-out
                0.62s forwards;
            }

            .kb-splash-text h1 {
              margin: 0;
              color: white;
              font-size: 32px;
              font-weight: 900;
              letter-spacing: -0.03em;
            }

            .kb-splash-text p {
              margin: 9px 0 0;
              color: #e7bd58;
              font-size: 13px;
              font-weight: 900;
              letter-spacing: 0.2em;
            }

            @keyframes iconPop {
              0% {
                opacity: 0;
                transform: scale(0.76);
              }

              65% {
                opacity: 1;
                transform: scale(1.07);
              }

              100% {
                opacity: 1;
                transform: scale(1);
              }
            }

            @keyframes shineMove {
              from {
                left: -80%;
              }

              to {
                left: 145%;
              }
            }

            @keyframes textAppear {
              from {
                opacity: 0;
                transform: translateY(14px);
              }

              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes splashExit {
              0%,
              76% {
                opacity: 1;
                visibility: visible;
              }

              100% {
                opacity: 0;
                visibility: hidden;
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}