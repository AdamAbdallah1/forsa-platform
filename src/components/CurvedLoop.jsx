import { useRef, useEffect, useState, useMemo, useId } from "react";

export default function CurvedLoop({
  marqueeText = "Find work ✦ Hire talent ✦ Apply faster ✦ Verified companies ✦ Built for Lebanon ✦",
  speed = 1.2,
  className = "",
  curveAmount = 70,
  direction = "left",
  interactive = false,
}) {
  const text = useMemo(() => {
    const hasTrailing = /\s|\u00A0$/.test(marqueeText);
    return (hasTrailing ? marqueeText.replace(/\s+$/, "") : marqueeText) + "\u00A0";
  }, [marqueeText]);

  const measureRef = useRef(null);
  const textPathRef = useRef(null);
  const [spacing, setSpacing] = useState(0);
  const [offset, setOffset] = useState(0);
  const uid = useId();
  const pathId = `curve-${uid}`;
  const pathD = `M-120,70 Q720,${70 + curveAmount} 1560,70`;

  const dragRef = useRef(false);
  const lastXRef = useRef(0);
  const dirRef = useRef(direction);
  const velRef = useRef(0);

  const totalText = spacing
    ? Array(Math.ceil(2200 / spacing) + 2).fill(text).join("")
    : text;

  const ready = spacing > 0;

  useEffect(() => {
    if (measureRef.current) {
      setSpacing(measureRef.current.getComputedTextLength());
    }
  }, [text, className]);

  useEffect(() => {
    if (!spacing || !textPathRef.current) return;

    const initial = -spacing;
    textPathRef.current.setAttribute("startOffset", `${initial}px`);
    setOffset(initial);
  }, [spacing]);

  useEffect(() => {
    if (!spacing || !ready) return;

    let frame = 0;

    const step = () => {
      if (!dragRef.current && textPathRef.current) {
        const delta = dirRef.current === "right" ? speed : -speed;
        const currentOffset = parseFloat(
          textPathRef.current.getAttribute("startOffset") || "0"
        );

        let newOffset = currentOffset + delta;
        const wrapPoint = spacing;

        if (newOffset <= -wrapPoint) newOffset += wrapPoint;
        if (newOffset > 0) newOffset -= wrapPoint;

        textPathRef.current.setAttribute("startOffset", `${newOffset}px`);
        setOffset(newOffset);
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [spacing, speed, ready]);

  const onPointerDown = (event) => {
    if (!interactive) return;

    dragRef.current = true;
    lastXRef.current = event.clientX;
    velRef.current = 0;
    event.target.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!interactive || !dragRef.current || !textPathRef.current) return;

    const dx = event.clientX - lastXRef.current;
    lastXRef.current = event.clientX;
    velRef.current = dx;

    const currentOffset = parseFloat(
      textPathRef.current.getAttribute("startOffset") || "0"
    );

    let newOffset = currentOffset + dx;
    const wrapPoint = spacing;

    if (newOffset <= -wrapPoint) newOffset += wrapPoint;
    if (newOffset > 0) newOffset -= wrapPoint;

    textPathRef.current.setAttribute("startOffset", `${newOffset}px`);
    setOffset(newOffset);
  };

  const endDrag = () => {
    if (!interactive) return;

    dragRef.current = false;
    dirRef.current = velRef.current > 0 ? "right" : "left";
  };

  return (
    <div
      className="relative h-[90px] w-full overflow-hidden sm:h-[110px] lg:h-[125px]"
      style={{
        visibility: ready ? "visible" : "hidden",
        cursor: interactive ? (dragRef.current ? "grabbing" : "grab") : "default",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <svg
        className="absolute left-1/2 top-1/2 block w-[1500px] max-w-none -translate-x-1/2 -translate-y-1/2 select-none overflow-visible"
        viewBox="0 0 1440 160"
      >
        <text
          ref={measureRef}
          xmlSpace="preserve"
          className="text-[72px] font-black uppercase tracking-[-0.06em] sm:text-[90px]"
          style={{ visibility: "hidden", opacity: 0, pointerEvents: "none" }}
        >
          {text}
        </text>

        <defs>
          <path id={pathId} d={pathD} fill="none" stroke="transparent" />
        </defs>

        {ready && (
          <text
            xmlSpace="preserve"
            className={`fill-[var(--forsa-primary)] text-[42px] font-semibold uppercase tracking-[-0.05em] opacity-[0.07] sm:text-[56px] lg:text-[64px] ${className}`}
          >
            <textPath
              ref={textPathRef}
              href={`#${pathId}`}
              startOffset={`${offset}px`}
              xmlSpace="preserve"
            >
              {totalText}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  );
}