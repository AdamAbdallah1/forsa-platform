import { useNavigate } from "react-router-dom";

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-6xl px-6 py-14 pb-28 sm:py-16 lg:py-20">
      <div className="rounded-[30px] border border-neutral-200 bg-black p-6 text-white sm:rounded-[36px] sm:p-8 md:p-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="text-center md:text-left">
            <p className="text-sm text-neutral-400">Start with Forsa</p>

            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:mx-0 md:text-5xl">
              Find the opportunity. Or post one.
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-neutral-300 sm:text-base md:mx-0">
              A cleaner place for Lebanon’s students, freelancers, creators,
              and small businesses to connect.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row md:shrink-0">
            <button
              onClick={() => navigate("/auth")}
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-neutral-200"
            >
              Create profile
            </button>

            <button
              onClick={() => navigate("/post")}
              className="rounded-full border border-white/20 bg-transparent px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Post opportunity
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}