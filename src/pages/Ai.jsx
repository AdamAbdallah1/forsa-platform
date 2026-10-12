import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FaArrowRight,
  FaCompass,
  FaFileAlt,
  FaMicrophone,
  FaPenNib,
} from "react-icons/fa";
import AppHeader from "../components/AppHeader";
import Footer from "../components/Footer";
import AiToolRunner from "../components/AiToolRunner";
import AiGuides from "../components/AiGuides";
import AiUsagePill from "../components/AiUsagePill";
import MiraMark, { MiraStatusPill } from "../components/MiraMark";
import { FORSA_AI_TOOLS, getTool } from "../lib/forsaAiTools";
import { useMiraUsage } from "../lib/miraService";

const TOOL_ICONS = {
  file: FaFileAlt,
  mic: FaMicrophone,
  compass: FaCompass,
  pen: FaPenNib,
};

/*
 * Forsa AI workspace: guided career tools first, free-form chat never as the
 * landing experience. Selecting a tool, moving between steps, editing
 * fields, and reading guides never touch the provider — exactly one AI
 * generation happens per explicit Generate or follow-up submit.
 */
export default function Ai() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { usage, capacity } = useMiraUsage();

  const [activeToolId, setActiveToolId] = useState(() => {
    const requested = searchParams.get("tool");
    return getTool(requested) ? requested : null;
  });
  const [forms, setForms] = useState({});

  const activeTool = activeToolId ? getTool(activeToolId) : null;

  const selectTool = (id) => {
    setActiveToolId(id);
    setSearchParams(id ? { tool: id } : {}, { replace: true });
  };

  return (
    <section className="min-h-screen bg-[#fbfafc]">
      <AppHeader />

      <div className="mx-auto max-w-[1180px] px-5 pb-28 sm:px-6 lg:pb-20">
        <header className="pt-7 sm:pt-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-3 py-1.5 text-xs font-semibold tracking-[-0.01em] text-[var(--forsa-primary)] shadow-sm">
              <MiraMark className="h-3.5 w-3.5" />
              Forsa AI
            </span>

            <MiraStatusPill />

            {/*
             * Usage comes only from server responses (200s and 429s) via the
             * shared store. Before the first interaction the pill shows the
             * plan descriptor — never a counter we cannot substantiate.
             */}
            <AiUsagePill usage={usage} capacity={capacity} />
          </div>

          <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.08] tracking-[-0.05em] text-[#18121f] sm:text-4xl">
            Career help that respects your time
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-neutral-600 sm:text-base">
            Pick a task and answer a few focused questions. Forsa AI generates
            once — no chat maze, no wasted generations. Free pilot: 10 AI
            generations a day.
          </p>
        </header>

        {!activeTool && (
          <>
            <h2 className="mt-8 text-lg font-semibold tracking-[-0.02em] text-neutral-900">
              Choose a career tool
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {FORSA_AI_TOOLS.map((tool) => {
                const Icon = TOOL_ICONS[tool.icon] || FaCompass;

                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => selectTool(tool.id)}
                    className="group flex items-start gap-4 rounded-[22px] border border-[var(--forsa-border)] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[var(--forsa-soft)] hover:shadow-[0_14px_34px_rgba(109,40,217,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)] transition group-hover:bg-[var(--forsa-soft)]"
                    >
                      <Icon className="text-base" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2 text-base font-semibold tracking-[-0.02em] text-neutral-900">
                        {tool.title}
                        <FaArrowRight
                          aria-hidden="true"
                          className="shrink-0 text-xs text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-[var(--forsa-primary)]"
                        />
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-neutral-500">
                        {tool.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-10">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">
                  Career quick guides
                </h2>
                <span className="shrink-0 text-[11px] font-medium text-neutral-400">
                  No AI needed
                </span>
              </div>

              <p className="mt-1 max-w-xl text-sm leading-6 text-neutral-500">
                Short, practical reading that works even when Forsa AI is
                offline or your daily allowance is spent.
              </p>

              <div className="mt-4">
                <AiGuides />
              </div>
            </div>

            <p className="mt-10 max-w-2xl rounded-[18px] border border-[var(--forsa-border)] bg-white px-5 py-4 text-xs leading-6 text-neutral-500">
              Forsa AI gives guidance to review — not instructions to follow
              blindly. Suggestions are based on what you provide, and using
              Forsa AI does not guarantee employment or any specific outcome.
            </p>
          </>
        )}

        {activeTool && (
          <div className="mt-8 rounded-[26px] border border-[var(--forsa-border)] bg-white p-5 shadow-[0_18px_50px_rgba(109,40,217,0.08)] sm:p-7">
            <AiToolRunner
              key={activeTool.id}
              tool={activeTool}
              initialData={forms[activeTool.id] || {}}
              onDataChange={(next) =>
                setForms((previous) => ({
                  ...previous,
                  [activeTool.id]: next,
                }))
              }
              onBack={() => selectTool(null)}
            />
          </div>
        )}
      </div>

      <Footer />
    </section>
  );
}
