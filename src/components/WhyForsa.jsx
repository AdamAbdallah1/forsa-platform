import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { FaCompass, FaUserCircle, FaComments, FaArrowRight } from "react-icons/fa";
import whyHero from "../assets/why-hero.lottie";

const FEATURES=[
 {number:"01",icon:FaCompass,title:"Find what fits.",description:"Discover opportunities aligned with your goals — from your first internship to meaningful projects."},
 {number:"02",icon:FaUserCircle,title:"Show what you bring.",description:"Build a modern profile around skills, proof of work, and the things you can actually do."},
 {number:"03",icon:FaComments,title:"Start a conversation.",description:"Connect directly with teams and people behind opportunities without unnecessary recruitment friction."}
];

export default function WhyForsa(){
 return <section className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
  <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
   <div className="grid items-center gap-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
    <motion.div initial={{opacity:0,x:-15}} whileInView={{opacity:1,x:0}} viewport={{once:true}} className="order-2 lg:order-1">
      <DotLottieReact src={whyHero} loop autoplay className="mx-auto h-[240px] w-full max-w-[340px] sm:h-[290px]"/>
    </motion.div>
    <motion.div initial={{opacity:0,x:15}} whileInView={{opacity:1,x:0}} viewport={{once:true}} className="order-1 lg:order-2">
      <span className="text-[11px] font-bold uppercase tracking-[.15em] text-[#5B3DF5]">Why Forsa</span>
      <h2 className="mt-2 font-['Sora',sans-serif] text-3xl font-bold leading-tight tracking-[-.045em] sm:text-4xl">Opportunity should feel <span className="text-[#5B3DF5]">personal.</span></h2>
      <p className="mt-4 max-w-xl text-sm leading-6 text-[#696773] sm:text-base">Forsa removes the noise between capable people and teams that need them, creating a clearer path from discovery to connection.</p>
      <div className="mt-6 flex flex-wrap gap-2">{["Talent first","Direct access","Verified roles"].map(x=><span key={x} className="rounded-full border border-[#e5e4ea] bg-[#fafafd] px-3 py-1.5 text-[10px] font-semibold">{x}</span>)}</div>
    </motion.div>
   </div>
   <div className="mt-12 grid gap-3 md:grid-cols-3">
    {FEATURES.map((f,i)=>{const Icon=f.icon;return <motion.div key={f.number} initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.06}} className="group rounded-2xl border border-[#e7e6ec] bg-[#fbfbfd] p-5 hover:-translate-y-1 hover:border-[#5B3DF5]/25 hover:bg-white hover:shadow-[0_18px_45px_rgba(20,16,50,.07)]">
      <div className="flex justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1efff] text-[#5B3DF5]"><Icon className="text-xs"/></span><span className="font-mono text-[10px] text-[#9998a2]">{f.number}</span></div>
      <h3 className="mt-5 font-['Sora',sans-serif] text-base font-semibold">{f.title}</h3><p className="mt-2 text-xs leading-5 text-[#777681] sm:text-sm">{f.description}</p>
      <div className="mt-5 text-[10px] font-bold text-[#5B3DF5]">Explore experience <FaArrowRight className="ml-1 inline transition group-hover:translate-x-1"/></div>
    </motion.div>})}
   </div>
  </div>
 </section>;
}