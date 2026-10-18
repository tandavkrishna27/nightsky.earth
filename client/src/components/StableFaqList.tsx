import { useLayoutEffect, useRef, useState } from "react";

export default function StableFaqList({
  items,
  idPrefix,
  className = "",
}: {
  items: readonly (readonly [string, string])[];
  idPrefix: string;
  className?: string;
}) {
  const list = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [reservedHeight, setReservedHeight] = useState<number>();

  useLayoutEffect(() => {
    const element = list.current!;
    let active = true;
    let frame = 0;
    const measure = () => {
      if (!active) return;
      const details = Array.from(element.querySelectorAll("details"));
      const listStyle = getComputedStyle(element);
      let baseHeight =
        parseFloat(listStyle.borderTopWidth) +
        parseFloat(listStyle.borderBottomWidth);
      let longestAnswer = 0;
      for (const detail of details) {
        baseHeight +=
          detail.querySelector("summary")!.getBoundingClientRect().height +
          parseFloat(getComputedStyle(detail).borderBottomWidth);
        // Measure closed answers at the real column width without exposing a duplicate transcript.
        const probe = detail
          .querySelector(".faq-answer")!
          .cloneNode(true) as HTMLParagraphElement;
        probe.setAttribute("aria-hidden", "true");
        Object.assign(probe.style, {
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          top: "0",
          left: "0",
          right: "0",
          height: "auto",
        });
        element.appendChild(probe);
        longestAnswer = Math.max(
          longestAnswer,
          probe.getBoundingClientRect().height,
        );
        probe.remove();
      }
      setReservedHeight(Math.ceil(baseHeight + longestAnswer));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(schedule)
        : null;
    observer?.observe(element);
    element
      .querySelectorAll("summary")
      .forEach((summary) => observer?.observe(summary));
    window.addEventListener("resize", schedule);
    measure();
    void document.fonts?.ready.then(() => {
      if (active) measure();
    });
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  return (
    <div
      ref={list}
      className={`stable-faq-list ${className}`}
      style={{ minHeight: reservedHeight }}
    >
      {items.map(([question, answer], index) => (
        <details
          key={question}
          name={`${idPrefix}-faq`}
          open={openIndex === index}
          onToggle={(event) => {
            const expanded = event.currentTarget.open;
            setOpenIndex((current) =>
              expanded ? index : current === index ? null : current,
            );
          }}
        >
          <summary
            onClick={(event) => {
              event.preventDefault();
              setOpenIndex((current) => (current === index ? null : index));
            }}
          >
            {question}
          </summary>
          <p className="faq-answer">{answer}</p>
        </details>
      ))}
    </div>
  );
}
