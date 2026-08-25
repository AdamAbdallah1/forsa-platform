import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { FaUser, FaBuilding, FaCompass } from "react-icons/fa";
import talentHero from "../assets/talent-hero.lottie";

const ITEMS=[
 {step:"01",label:"Talent Profile",title:"Show what you can do.",description:"Create a profile focused on skills, real accomplishments, and the work you want to pursue.",icon:FaUser},
 {step:"02",label:"Smart Discovery",title:"Find what fits.",description:"Search and discover opportunities based on the direction you want your career to take.",icon:FaCompass},
 {step:"03",label:"Direct Connection",title:"Meet the right team.",description:"Move from application noise to direct connections with teams looking for emerging talent.",icon:FaBuilding}
];

export default function TalentCompanySection(){
 return <section className="relative overflow-hidden border-y border-[#ececf1] bg-[#f7f7fa] py-16 sm:py-20 lg:py-24">
  <div className="absolute inset-0 pointer-events-none opacity-50" style={{backgroundImage:"linear-gradient(rgba(91,61,245,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(91,61,245,.035) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>
  <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
   <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_.85fr] lg:gap-16">
    <motion.div initial={{opacity:0,x:-15}} whileInView={{opacity:1,x:0}} viewport={{once:true}}>
      <span className="text-[11px] font-bold uppercase tracking-[.15em] text-[#5B3DF5]">How Forsa Works</span>
      <h2 className="mt-2 font-['Sora',sans-serif] text-3xl font-bold leading-tight tracking-[-.045em] sm:text-4xl">From potential to <span className="text-[#5B3DF5]">opportunity.</span></h2>
      <p className="mt-4 max-w-xl text-sm leading-6 text-[#696773] sm:text-base">A simple product experience for discovering people, opportunities, and teams — without the traditional hiring clutter.</p>
    </motion.div>
    <motion.div initial={{opacity:0,x:15}} whileInView={{opacity:1,x:0}} viewport={{once:true}}><DotLottieReact src={talentHero} loop autoplay className="mx-auto h-[230px] w-full max-w-[330px] sm:h-[270px]"/></motion.div>
   </div>
   <div className="mt-12 grid gap-3 md:grid-cols-3">
    {ITEMS.map((item,i)=>{const Icon=item.icon;return <motion.div key={item.step} initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.06}} className="rounded-2xl border border-[#e4e3e9] bg-white p-5 shadow-[0_8px_30px_rgba(20,16,50,.035)]">
      <div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1efff] text-[#5B3DF5]"><Icon className="text-xs"/></span><span className="font-mono text-[10px] text-[#9998a2]">{item.step}</span></div>
      <span className="mt-5 block text-[10px] font-bold uppercase tracking-wider text-[#777681]">{item.label}</span>
      <h3 className="mt-1 font-['Sora',sans-serif] text-base font-semibold">{item.title}</h3>
      <p className="mt-2 text-xs leading-5 text-[#777681] sm:text-sm">{item.description}</p>
    </motion.div>})}
   </div>
  </div>
 </section>;
}