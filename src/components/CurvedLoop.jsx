import { useEffect, useMemo, useRef, useState, useId } from "react";

const CurvedLoop = ({
  marqueeText = "",
  speed = 1,
  className = "",
  curveAmount = 70,
  direction = "left",
  interactive = true,
}) => { 
  const text = useMemo(() => {
    const trimmed = marqueeText.trim();
    return `${trimmed}\u00A0`;
  }, [marqueeText]);

  const measureRef = useRef(null);
  const textPathRef = useRef(null);
  const dragRef = useRef(false);
  const lastXRef = useRef(0);
  const dirRef = useRef(direction);
  const velRef = useRef(0);

  const [spacing, setSpacing] = useState(0);
  const [offset, setOffset] = useState(0);

  const uid = useId();
  const pathId = `curve-${uid}`;

  const pathD = `M-100,40 Q720,${40 + curveAmount} 1540,40`;

  const ready = spacing > 0;

  const totalText = ready
    ? Array(Math.ceil(1800 / spacing) + 3)
        .fill(text)
        .join("")
    : text;

  useEffect(() => {
    const measure = () => {
      if (!measureRef.current) return;

      const length = measureRef.current.getComputedTextLength();

      if (length > 0) {
        setSpacing(length);
      }
    };

    measure();

    const frame = requestAnimationFrame(measure);

    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [text, className]);

  useEffect(() => {
    if (!spacing || !textPathRef.current) return;

    const initial = -spacing;

    textPathRef.current.setAttribute(
      "startOffset",
      `${initial}px`
    );

    setOffset(initial);
  }, [spacing]);

  useEffect(() => {
    if (!spacing || !ready) return;

    let frame;

    const step = () => {
      if (!dragRef.current && textPathRef.current) {
        const delta =
          dirRef.current === "right" ? speed : -speed;

        const currentOffset = parseFloat(
          textPathRef.current.getAttribute("startOffset") || "0"
        );

        let newOffset = currentOffset + delta;

        if (newOffset <= -spacing) {
          newOffset += spacing;
        }

        if (newOffset > 0) {
          newOffset -= spacing;
        }

        textPathRef.current.setAttribute(
          "startOffset",
          `${newOffset}px`
        );

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

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!interactive || !dragRef.current || !textPathRef.current) {
      return;
    }

    const dx = event.clientX - lastXRef.current;

    lastXRef.current = event.clientX;
    velRef.current = dx;

    const currentOffset = parseFloat(
      textPathRef.current.getAttribute("startOffset") || "0"
    );

    let newOffset = currentOffset + dx;

    if (newOffset <= -spacing) {
      newOffset += spacing;
    }

    if (newOffset > 0) {
      newOffset -= spacing;
    }

    textPathRef.current.setAttribute(
      "startOffset",
      `${newOffset}px`
    );

    setOffset(newOffset);
  };

  const endDrag = () => {
    if (!interactive) return;

    dragRef.current = false;

    if (Math.abs(velRef.current) > 0) {
      dirRef.current =
        velRef.current > 0 ? "right" : "left";
    }
  };

  const cursorStyle = interactive
    ? dragRef.current
      ? "grabbing"
      : "grab"
    : "default";

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        visibility: ready ? "visible" : "hidden",
        cursor: cursorStyle,
        touchAction: interactive ? "none" : "auto",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <svg
        className="block h-[38px] w-full select-none sm:h-[44px] lg:h-[50px]"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <text
          ref={measureRef}
          xmlSpace="preserve"
          className={className}
          style={{
            visibility: "hidden",
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          {text}
        </text>

        <defs>
          <path
            id={pathId}
            d={pathD}
            fill="none"
          />
        </defs>

        {ready && (
          <text
            xmlSpace="preserve"
            className={className}
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
};

export default CurvedLoop;
