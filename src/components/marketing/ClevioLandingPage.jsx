"use client";

import { Send, MessageSquare, ShoppingCart, Headset, TrendingUp, Users, FileText } from "lucide-react";
import Image from "next/image";
import Script from "next/script";

const SOFTWARE_APP_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Clevio AI Staff",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
  },
};

export default function ClevioLandingPage() {
  return (
    <>
      <Script id="clevio-ai-staff-schema" type="application/ld+json">
        {JSON.stringify(SOFTWARE_APP_SCHEMA)}
      </Script>

      <div className="relative min-h-screen bg-background text-foreground">
        
        {/* Fullscreen Hero Background */}
        <div className="absolute inset-0 z-0 h-screen w-full overflow-hidden">
             <Image
                src="/hero-image.webp"
                alt="Background Office"
                fill
                priority
                className="object-cover object-center"
             />
             {/* Optional Overlay if needed for contrast */}
             {/* <div className="absolute inset-0 bg-black/10" /> */}
        </div>

        {/* Content Overlay */}
        <main>
           <section className="relative z-10 flex h-screen flex-col items-center justify-center px-4">
            
            {/* 1. Floating Logo Pill */}
            {/* Positioned top-left-ish based on design, or centered top. 
                User image shows it floating top-left area. 
            */}
            <div className="absolute top-12 left-12 lg:top-16 lg:left-24 hidden md:block">
                 <div className="flex items-center justify-center">
                    <Image 
                        src="/ClevioLogoLandingP.webp" // As requested
                        alt="Clevio AI Staff"
                        width={360}
                        height={120}
                        className="h-auto w-[360px]"
                    />
                 </div>
            </div>


             {/* Mobile Logo Fallback (if user checks on mobile despite shouting DESKTOP) */}
             <div className="absolute top-6 left-6 md:hidden">
                 <div className="flex items-center justify-center rounded-full bg-white px-6 py-2 shadow-lg">
                    <Image 
                        src="/ClevioLogoLandingP.webp" 
                        alt="Clevio AI Staff"
                        width={100}
                        height={35}
                        className="h-auto w-[100px]"
                    />
                 </div>
             </div>


            {/* 2. Hero Content: Headline & Input */}
            {/* Position based on image: The man/robot is on the right. Text is on the left.
                So we need a container that splits or positions text to the left.
            */}
            <div className="container mx-auto h-full"> 
                <div className="flex h-full items-center">
                    <div className="w-full md:max-w-xl lg:max-w-2xl pl-4 md:pl-16 lg:pl-24 mt-32">
                        
                        {/* Headline */}
                        <h1 className="text-3xl font-bold leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] sm:text-4xl lg:text-5xl mb-6">
                            Jika Anda bisa mudah<br/>
                            membuat staf dari AI<br/>
                            <span className="font-extrabold block mt-2 tracking-wide">APA PERAN AI ANDA?</span>
                        </h1>

                        {/* Input Field */}
                        <div className="relative mt-8 max-w-md">
                            <input 
                                type="text" 
                                placeholder="Ketik disini......."
                                className="w-full rounded-full border-none bg-white py-4 pl-6 pr-14 text-gray-700 shadow-xl focus:ring-2 focus:ring-blue-400 outline-none text-lg"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-sky-300/30 p-2 text-sky-400 hover:bg-sky-400 hover:text-white transition-colors">
                                <Send className="h-6 w-6 ml-0.5 fill-current" /> 
                            </button>
                        </div>

                    </div>
                    {/* Right side is empty for the image content */}
                    <div className="hidden md:block md:w-1/2"></div>
                </div>
            </div>

           </section>

           <UseCasesSection />
        </main>
      </div>
    </>
  );
}

function UseCasesSection() {
  const cards = [
    {
        icon: <MessageSquare className="w-6 h-6 text-black" />,
        title: "Customer Service",
        desc: "Layani pelanggan 24/7 dengan respons cepat dan akurat",
        bg: "bg-[#F2F2F2]", 
        foldColor: "bg-[#9E9E9E]",
        iconBg: "bg-white",
        text: "text-black"
    },
    {
        icon: <ShoppingCart className="w-6 h-6 text-black" />,
        title: "Sales Asistant",
        desc: "Tingkatkan penjualan dengan rekomendasi produk yang tepat",
        bg: "bg-[#90A4AE]", 
        foldColor: "bg-[#546E7A]",
        iconBg: "bg-white/30",
        text: "text-black"
    },
    {
        icon: <Headset className="w-6 h-6 text-black" />,
        title: "Support Agent",
        desc: "Berikan dukungan teknis yang efisien dan profesional",
        bg: "bg-[#FFF59D]", 
        foldColor: "bg-[#AFB42B]",
        iconBg: "bg-white/40",
        text: "text-black"
    },
    {
        icon: <TrendingUp className="w-6 h-6 text-black" />,
        title: "Marketing Assistant",
        desc: "Otomatisasi kampanye marketing dan analisis data",
        bg: "bg-[#A5D6A7]", 
        foldColor: "bg-[#558B2F]",
        iconBg: "bg-white/40",
        text: "text-black"
    },
    {
        icon: <Users className="w-6 h-6 text-black" />,
        title: "HR Assistant",
        desc: "Kelola rekrutmen dan onboarding karyawan dengan mudah",
        bg: "bg-[#F48FB1]", 
        foldColor: "bg-[#AD1457]",
        iconBg: "bg-white/40",
        text: "text-black"
    },
    {
        icon: <FileText className="w-6 h-6 text-black" />,
        title: "Admin Assistant",
        desc: "Atur jadwal, dokumen, dan tugas administratif lainnya",
        bg: "bg-[#FFCC80]", 
        foldColor: "bg-[#EF6C00]",
        iconBg: "bg-white/40",
        text: "text-black"
    }
  ];

  return (
    <section className="w-full bg-white py-24 px-8 flex justify-center z-20 relative">
        <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-extrabold text-black mb-6 tracking-tight">
                    Staf AI Apa Lagi Yang Bisa Anda Buat?
                </h2>
                <p className="text-xl md:text-2xl text-gray-600 font-medium">
                    Banyak tugas yang bisa dibantu para staf AI Anda :
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
                {cards.map((card, idx) => (
                    <div 
                        key={idx}
                        className={`relative w-full h-[260px] ${card.bg} rounded-[2.5rem] p-8 flex flex-col shadow-lg transition-transform hover:-translate-y-2 duration-300`}
                    >
                         {/* Binder Holes */}
                        <div className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                            <div className="w-4 h-4 bg-white rounded-full border-[1.5px] border-black/5 shadow-sm"></div>
                            <div className="w-4 h-4 bg-white rounded-full border-[1.5px] border-black/5 shadow-sm"></div>
                            <div className="w-4 h-4 bg-white rounded-full border-[1.5px] border-black/5 shadow-sm"></div>
                        </div>

                        <div className="flex flex-col gap-5 mt-4 relative z-10">
                            <div className={`w-14 h-14 ${card.iconBg} rounded-[1.2rem] flex items-center justify-center shadow-sm`}>
                                {card.icon}
                            </div>
                            <div>
                                <h3 className={`font-black text-2xl mb-2 ${card.text} leading-tight`}>{card.title}</h3>
                                <p className={`text-[15px] font-semibold leading-relaxed w-[90%] ${card.text} opacity-70`}>
                                    {card.desc}
                                </p>
                            </div>
                        </div>

                         {/* Folded Corner Effect */}
                         <div className="absolute bottom-0 right-0 w-[80px] h-[80px]">
                            <div className={`absolute bottom-0 right-0 w-[80px] h-[80px] ${card.foldColor} rounded-br-[2.5rem] rounded-tl-none shadow-[-2px_-2px_10px_rgba(0,0,0,0.1)] z-20`}></div>
                            <div className="absolute bottom-0 right-0 w-[80px] h-[80px] bg-white rounded-br-[3rem] z-10"></div>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
}
