import { useEffect, useRef } from "react";

const CX = 100;
const CY = 100;
const CR = 82;

const STATUSES = [
  [0, "Initializing..."],
  [15, "Loading assets..."],
  [35, "Fetching data..."],
  [55, "Building components..."],
  [75, "Almost there..."],
  [90, "Finishing up..."],
  [100, "Ready!"],
];

function clampProgress(value) {
  const numeric = Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(100, numeric));
}

function getStatus(pct) {
  let label = STATUSES[0][1];
  for (const [threshold, text] of STATUSES) {
    if (pct >= threshold) label = text;
  }
  return label;
}

function buildWave(pct, offset, amplitude) {
  const waterY = CY + CR - (pct / 100) * (CR * 2);
  const minX = CX - CR - 14;
  const maxX = CX + CR + 14;
  let d = `M ${minX},${CY + CR + 14} L ${minX},`;
  d += (waterY + Math.sin((minX + offset) * 0.065) * amplitude).toFixed(2) + " ";
  for (let x = minX; x <= maxX; x += 3) {
    const y =
      waterY +
      Math.sin((x + offset) * 0.065) * amplitude +
      Math.sin((x + offset * 0.6) * 0.11) * amplitude * 0.4;
    d += `L ${x.toFixed(2)},${y.toFixed(2)} `;
  }
  d += `L ${maxX},${CY + CR + 14} Z`;
  return d;
}

export default function BubbleLoader({ progress = 0 }) {
  const svgRefs = useRef({});
  const waveOff = useRef({ a: 0, b: 0, c: 0 });
  const pctRef = useRef(0);
  const rafRef = useRef(null);
  const labelRef = useRef(null);
  const statusRef = useRef(null);

  useEffect(() => {
    const next = clampProgress(progress);
    pctRef.current = Math.max(pctRef.current, next);
  }, [progress]);

  useEffect(() => {
    const loop = () => {
      waveOff.current.a += 9.2;
      waveOff.current.b += 7.4;
      waveOff.current.c += 11.1;

      const p = pctRef.current;
      const amp = p > 2 && p < 98 ? 8 : 1;

      const { fill, foam1, foam2 } = svgRefs.current;
      if (fill) {
        fill.setAttribute("d", buildWave(p, waveOff.current.a, amp));
        foam1.setAttribute(
          "d",
          buildWave(p, waveOff.current.b + 60, amp * 0.65),
        );
        foam2.setAttribute(
          "d",
          buildWave(p, waveOff.current.c + 120, amp * 0.45),
        );
      }

      const rounded = Math.round(p);
      if (labelRef.current) {
        labelRef.current.textContent = `${rounded}%`;
        labelRef.current.style.color = rounded > 45 ? "#fff" : "#185FA5";
        labelRef.current.style.textShadow =
          rounded > 45 ? "0 1px 6px rgba(24,95,165,0.4)" : "none";
      }
      if (statusRef.current) {
        statusRef.current.textContent = getStatus(rounded);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.25rem",
        background: "var(--color-background-tertiary, #f8f9fa)",
      }}
    >
      <div style={{ position: "relative", width: 200, height: 200 }}>
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: "visible" }}
        >
          <defs>
            <clipPath id="bubbleClip">
              <circle cx={CX} cy={CY} r={CR} />
            </clipPath>
            <radialGradient id="bubbleSheen" cx="35%" cy="28%" r="55%">
              <stop offset="0%" stopColor="white" stopOpacity="0.35" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="bubbleBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#dceefb" />
              <stop offset="100%" stopColor="#c2e0f7" />
            </radialGradient>
          </defs>

          <circle cx={CX} cy={CY} r={CR} fill="url(#bubbleBg)" />

          <g clipPath="url(#bubbleClip)">
            <path ref={(el) => (svgRefs.current.fill = el)} d="" fill="#2176c7" opacity="0.88" />
            <path ref={(el) => (svgRefs.current.foam1 = el)} d="" fill="#5ba8f5" opacity="0.55" />
            <path ref={(el) => (svgRefs.current.foam2 = el)} d="" fill="#a8d4f8" opacity="0.30" />
          </g>

          <circle cx={CX} cy={CY} r={CR} fill="url(#bubbleSheen)" />
          <circle
            cx={CX}
            cy={CY}
            r={CR}
            fill="none"
            stroke="#185FA5"
            strokeWidth="2.5"
            opacity="0.6"
          />

          <circle cx="78" cy="62" r="6" fill="white" opacity="0.22" />
          <circle cx="68" cy="74" r="3.5" fill="white" opacity="0.14" />
        </svg>

        <div
          ref={labelRef}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 30,
            fontWeight: 500,
            color: "#185FA5",
            pointerEvents: "none",
            fontFamily: "var(--font-sans)",
            transition: "color 0.4s",
          }}
        >
          0%
        </div>
      </div>

      <p
        ref={statusRef}
        style={{
          fontSize: 14,
          color: "var(--color-text-secondary)",
          fontFamily: "var(--font-sans)",
          margin: 0,
          letterSpacing: "0.02em",
        }}
      >
        Initializing...
      </p>
    </div>
  );
}
