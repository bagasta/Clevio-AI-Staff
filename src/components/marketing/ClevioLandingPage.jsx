"use client";

import { useState } from "react";
import { Send, MessageSquare, ShoppingCart, Headset, TrendingUp, Users, FileText, Clock, Brain, ShieldCheck, Zap, Globe, User, Bot, Check } from "lucide-react";
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
           <HowItWorksSection />
           <FeatureSection />
           <TestimonialSection />
           <ComparisonSection />
           <PricingSection />
           <WaitingListSection />
           <CTASection />
           <FooterSection />
        </main>
      </div>
    </>
  );
}

function UseCasesSection() {
  // Unified text color: Dark Espresso Brown - works on all pastel backgrounds
  const textColor = "text-[#2D2216]";
  const descColor = "text-[#4A3C2F]";

  const cards = [
    {
        icon: <MessageSquare className="w-6 h-6 text-[#5D4E37]" />,
        title: "Customer Service",
        desc: "Layani pelanggan 24/7 dengan respons cepat dan akurat",
        bg: "#F2F2F2",
        foldColor: "#CFCFCF",
        holeShadow: "rgba(0,0,0,0.15)",
    },
    {
        icon: <ShoppingCart className="w-6 h-6 text-[#5D4E37]" />,
        title: "Sales Asistant",
        desc: "Tingkatkan penjualan dengan rekomendasi produk yang tepat",
        bg: "#A8C5D4",
        foldColor: "#86A8B8",
        holeShadow: "rgba(0,0,0,0.2)",
    },
    {
        icon: <Headset className="w-6 h-6 text-[#5D4E37]" />,
        title: "Support Agent",
        desc: "Berikan dukungan teknis yang efisien dan profesional",
        bg: "#FFF59D",
        foldColor: "#E8D86A",
        holeShadow: "rgba(0,0,0,0.12)",
    },
    {
        icon: <TrendingUp className="w-6 h-6 text-[#5D4E37]" />,
        title: "Marketing Assistant",
        desc: "Otomatisasi kampanye marketing dan analisis data",
        bg: "#9DC99D",
        foldColor: "#7AAF7A",
        holeShadow: "rgba(0,0,0,0.15)",
    },
    {
        icon: <Users className="w-6 h-6 text-[#5D4E37]" />,
        title: "HR Assistant",
        desc: "Kelola rekrutmen dan onboarding karyawan dengan mudah",
        bg: "#F5B8CF",
        foldColor: "#D898B0",
        holeShadow: "rgba(0,0,0,0.12)",
    },
    {
        icon: <FileText className="w-6 h-6 text-[#5D4E37]" />,
        title: "Admin Assistant",
        desc: "Atur jadwal, dokumen, dan tugas administratif lainnya",
        bg: "#F5C896",
        foldColor: "#D8A870",
        holeShadow: "rgba(0,0,0,0.15)",
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
                        className="relative w-full h-[260px] rounded-[2rem] p-8 flex flex-col transition-all duration-500 hover:-translate-y-3 group cursor-pointer overflow-hidden"
                        style={{ 
                            backgroundColor: card.bg,
                            boxShadow: `
                                0 15px 35px rgba(0,0,0,0.12),
                                0 5px 15px rgba(0,0,0,0.08)
                            `,
                        }}
                    >
                         {/* Binder Holes - WHITE with Stronger INNER SHADOW (visible on all colors) */}
                        <div className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-4 z-20">
                            {[0, 1, 2].map((i) => (
                                <div 
                                    key={i} 
                                    className="w-4 h-4 rounded-full bg-white"
                                    style={{
                                        boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(0,0,0,0.2)'
                                    }}
                                ></div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-5 mt-6 relative z-10">
                            {/* Icon Box */}
                            <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                                style={{
                                    backgroundColor: card.bg,
                                    boxShadow: `
                                        3px 3px 8px rgba(0,0,0,0.12),
                                        -2px -2px 6px rgba(255,255,255,0.5),
                                        inset 1px 1px 2px rgba(255,255,255,0.3)
                                    `
                                }}
                            >
                                {card.icon}
                            </div>
                            <div>
                                <h3 className={`font-black text-xl mb-2 ${textColor} leading-tight`}>{card.title}</h3>
                                <p className={`text-[14px] font-semibold leading-relaxed w-[85%] ${descColor}`}>
                                    {card.desc}
                                </p>
                            </div>
                        </div>

                         {/* Folded Corner using Borders for Perfect Triangles */}
                         <div className="absolute bottom-0 right-0 w-[80px] h-[80px] drop-shadow-[-4px_-4px_6px_rgba(0,0,0,0.15)]">
                            {/* Shadow Triangle (Bottom-Right) - The 'Peel' or 'Back' */}
                            <div 
                                className="absolute bottom-0 right-0 w-0 h-0"
                                style={{
                                    borderStyle: 'solid',
                                    borderWidth: '0 0 80px 80px',
                                    borderColor: 'transparent transparent rgba(0,0,0,0.25) transparent',
                                }}
                            ></div>
                            
                            {/* Fold Triangle (Top-Left) - The 'Flap' */}
                            <div 
                                className="absolute bottom-0 right-0 w-0 h-0 z-20"
                                style={{
                                    borderStyle: 'solid',
                                    borderWidth: '80px 80px 0 0',
                                    borderColor: `${card.foldColor} transparent transparent transparent`,
                                }}
                            ></div>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
}


function HowItWorksSection() {
  // Unified text color for consistency
  const textColor = "text-[#2D2216]";
  const descColor = "text-[#4A3C2F]";

  const steps = [
    {
        title: "Daftar & Pilih Peran",
        desc: "Buat akun dan pilih peran Staff AI yang sesuai dengan kebutuhan bisnis Anda",
        bg: "#FDF4C8", // Cream
        foldColor: "#C0A865", // Dark Gold
        image: "/carousel-works/daftarDanPilihPeran.webp"
    },
    {
        title: "Kustomisasi & Latih",
        desc: "Sesuaikan personality dan latih Staff AI dengan data bisnis Anda",
        bg: "#A8C0D4", // Slate Blue-ish
        foldColor: "#6C8796", // Darker Slate
        image: "/carousel-works/kostumisasiDanLatih.webp"
    },
    {
        title: "Aktifkan & Pantau",
        desc: "Aktifkan Staff AI Anda dan pantau performa secara real-time",
        bg: "#FAD9D5", // Pink
        foldColor: "#C48E8E", // Darker Pink
        image: "/carousel-works/aktifkanDanPantau.webp"
    }
  ];

  return (
    <section className="w-full bg-[#F7F7F4] py-24 px-8 flex justify-center z-20 relative">
        <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-extrabold text-black mb-6 tracking-tight">
                    Cara Kerja Clevio
                </h2>
                <p className="text-xl md:text-2xl text-black font-medium leading-normal">
                    Mulai dengan Staf AI Anda <br className="hidden md:block"/> dalam 3 langkah mudah
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {steps.map((step, idx) => (
                    <div 
                        key={idx}
                        className="relative w-full aspect-[3/4] max-h-[500px] md:max-h-none rounded-[2.5rem] flex flex-col overflow-hidden transition-transform duration-500 hover:-translate-y-3 group mx-auto max-w-[360px] md:max-w-none"
                        style={{ 
                            backgroundColor: step.bg,
                            boxShadow: `
                                0 15px 35px rgba(0,0,0,0.12),
                                0 5px 15px rgba(0,0,0,0.08)
                            `,
                        }}
                    >
                         {/* Binder Holes - WHITE with Stronger INNER SHADOW */}
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-4 z-20">
                            {[0, 1, 2].map((i) => (
                                <div 
                                    key={i} 
                                    className="w-5 h-5 rounded-full bg-white"
                                    style={{
                                        boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(0,0,0,0.2)'
                                    }}
                                ></div>
                            ))}
                        </div>

                        {/* Top Half: Image Area */}
                        <div className="h-[55%] w-full relative flex items-center justify-center pt-12">
                            <div className="relative w-[90%] h-[90%] drop-shadow-md transition-transform duration-500 group-hover:scale-105">
                                <Image
                                    src={step.image}
                                    alt={step.title}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>

                        {/* Bottom Half: Text Content */}
                        <div className="h-[45%] w-full px-8 pt-2 pb-8 flex flex-col relative z-10 text-center">
                            <h3 className={`font-black text-2xl mb-3 ${textColor} leading-tight`}>{step.title}</h3>
                            <p className={`text-[15px] font-semibold leading-relaxed ${descColor}`}>
                                {step.desc}
                            </p>
                        </div>

                         {/* Folded Corner using Borders for Perfect Triangles */}
                         <div className="absolute bottom-0 right-0 w-[90px] h-[90px] drop-shadow-[-4px_-4px_6px_rgba(0,0,0,0.15)] z-20">
                            {/* Shadow Triangle (Bottom-Right) - The 'Peel' */}
                            <div 
                                className="absolute bottom-0 right-0 w-0 h-0"
                                style={{
                                    borderStyle: 'solid',
                                    borderWidth: '0 0 90px 90px',
                                    borderColor: 'transparent transparent rgba(0,0,0,0.25) transparent',
                                }}
                            ></div>
                            
                            {/* Fold Triangle (Top-Left) - The 'Flap' */}
                            <div 
                                className="absolute bottom-0 right-0 w-0 h-0 z-20"
                                style={{
                                    borderStyle: 'solid',
                                    borderWidth: '90px 90px 0 0',
                                    borderColor: `${step.foldColor} transparent transparent transparent`,
                                }}
                            ></div>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
}

function FeatureSection() {
  const features = [
    {
      icon: <div className="w-10 h-10 bg-[#E3F2FD] rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-[#1A237E] stroke-[2]" /></div>,
      title: "Tersedia 24/7",
      desc: "Staff AI Anda tidak pernah tidur dan siap melayani kapan saja"
    },
    {
      icon: <div className="w-10 h-10 bg-[#FFF9C4] rounded-xl flex items-center justify-center"><Brain className="w-6 h-6 text-[#1A237E] stroke-[2]" /></div>,
      title: "Pembelajaran Berkelanjutan",
      desc: "Semakin pintar seiring waktu dengan machine learning"
    },
    {
      icon: <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center"><TrendingUp className="w-6 h-6 text-[#1A237E] stroke-[2]" /></div>,
      title: "Analitik Real-time",
      desc: "Pantau performa dan dapatkan insights mendalam"
    },
    {
      icon: <div className="w-10 h-10 bg-[#E3F2FD] rounded-xl flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-[#1A237E] stroke-[2]" /></div>,
      title: "Keamanan Terjamin",
      desc: "Data Anda dilindungi dengan enkripsi tingkat enterprise"
    },
    {
      icon: <div className="w-10 h-10 bg-[#FFF9C4] rounded-xl flex items-center justify-center"><Zap className="w-6 h-6 text-[#1A237E] stroke-[2]" /></div>,
      title: "Respons Instan",
      desc: "Jawab pertanyaan pelanggan dalam hitungan detik"
    },
    {
      icon: <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center"><Globe className="w-6 h-6 text-[#1A237E] stroke-[2]" /></div>,
      title: "Multi-bahasa",
      desc: "Berkomunikasi dalam berbagai bahasa dengan lancar"
    }
  ];

  return (
    <section className="w-full bg-white py-24 px-8 flex justify-center z-20 relative">
        <div className="container mx-auto max-w-6xl">
            <h2 className="text-4xl font-extrabold text-black mb-12 text-center tracking-tight">
                Fitur Unggulan
            </h2>

            {/* Sticky Note Container - Paper Look with Binder Holes */}
            <div className="w-full bg-[#FDF4C8] rounded-[2.5rem] px-5 md:px-16 pb-10 md:pb-16 pt-28 flex flex-col items-center shadow-[0_15px_35px_rgba(0,0,0,0.12),0_5px_15px_rgba(0,0,0,0.08)] relative overflow-hidden">
                
                {/* Binder Holes - WHITE with Stronger INNER SHADOW (Top Center) */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-6 z-20">
                    {[0, 1, 2, 3].map((i) => (
                        <div 
                            key={i} 
                            className="w-6 h-6 rounded-full bg-white"
                            style={{
                                boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(0,0,0,0.2)'
                            }}
                        ></div>
                    ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full relative z-10 mt-1">
                    {features.map((feature, idx) => (
                        <div key={idx} className="w-full bg-white rounded-[1.5rem] p-6 flex flex-col items-start gap-4 shadow-xl border border-white/50 h-full transition-transform hover:-translate-y-1 duration-300">
                            <div className="shrink-0">
                                {feature.icon}
                            </div>
                            <div>
                                <h3 className="text-[#1A237E] font-bold text-lg leading-tight mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed font-medium">
                                    {feature.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </section>
  );
}

function TestimonialSection() {
  const testimonials = [
    {
        name: "Dr. Kemal H.S. I Ist",
        role: "Konsultan Manajemen Governance, Risk and Compliance",
        quote: "Clevio menawarkan AI untuk Profesional, dirancang untuk tingkatkan kompetensi, produktivitas, dan efektivitas kerja dengan dukungan analisis data yang kuat.",
        image: "/testimoni/kemal.webp"
    },
    {
        name: "Gatot Nuradi Sam",
        role: "Executive Director Bina Antarbudaya",
        quote: "Kelemahan kita selalu di data dan managing information. AI bisa membantu meng-cluster informasi seperti relawan dan sponsor, lalu menunjukkan mana yang paling potensial untuk kita tindak lanjuti.",
        image: "/testimoni/gatot.webp"
    },
    {
        name: "Sara Dhewanto",
        role: "Impact Incubator",
        quote: "Saya memakai staf AI untuk membantu pekerjaan saya agar tugas-tugas rutin bisa selesai lebih cepat dan akurat.",
        image: "/testimoni/sara.webp"
    },
    {
        name: "Sinta Kaniawati",
        role: "Ketua Dewan Pengurus Bina Antarbudaya",
        quote: "AI itu membantu, tapi keseimbangan manusia tetap penting. Tantangan-nya adalah bagaimana kita menggunakan AI dengan bijak agar tidak kehilangan nilai manusiawi.",
        image: "/testimoni/sinta.webp"
    }
  ];

  return (
    <section className="w-full bg-[#f8f9fa] py-24 px-8 flex justify-center z-20 relative">
        <div className="container mx-auto max-w-7xl">
            <h2 className="text-4xl md:text-5xl font-extrabold text-black mb-16 text-center tracking-tight">
                Ini Kata Mereka :
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {testimonials.map((item, idx) => (
                    // Wooden Frame Container
                    <div 
                        key={idx}
                        className="relative w-full aspect-[3/5] bg-[#EBCFB2] rounded-[2.5rem] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex flex-col items-center transition-transform hover:-translate-y-2 duration-300 ring-1 ring-black/5"
                    >
                         {/* Bevel/Depth Effect for Frame */}
                         <div className="absolute inset-0 rounded-[2.5rem] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.05)] pointer-events-none"></div>

                         {/* Inner Card Content */}
                         <div className="w-full h-full bg-white rounded-[1.8rem] relative overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)] isolation-auto">
                            
                            {/* Full Background Image */}
                            <div className="absolute inset-0 z-0">
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover object-top"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                />
                            </div>


                         </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
}

function ComparisonSection() {
    const staffBiasa = [
      "Gaji bulanan + benefit + training",
      "Jam kerja terbatas (8 jam/hari)",
      "1 staf = 1 customer"
    ];
  
    const staffAI = [
      "Biaya langganan tetap, tanpa benefit & training",
      "Kerja 24/7 tanpa lembur & tanpa cuti",
      "1 Staf AI = ratusan customer sekaligus",
      "Tidak resign, tidak sakit, selalu ikut SOP",
      "Onboarding sangat cepat"
    ];
  
    return (
      <section className="w-full bg-white py-24 px-8 flex justify-center z-20 relative">
          <div className="container mx-auto max-w-6xl">
              <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-extrabold text-black mb-4 tracking-tight">
                      Staf Biasa VS Staf AI
                  </h2>
                  <p className="text-xl text-gray-600 font-medium">
                      Lihat perbedaan signifikan antara<br/>
                      Staf Biasa dan Staf AI
                  </p>
              </div>
  
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
                  
                  {/* Staf Biasa */}
                  <div className="w-full bg-white rounded-[2.5rem] p-10 pb-16 shadow-[0_10px_40px_rgba(0,0,0,0.1)] flex flex-col items-center border border-gray-100">
                       {/* Header Pill */}
                       <div className="bg-white border-2 border-gray-100 rounded-full py-4 px-10 flex items-center gap-3 shadow-md mb-12 min-w-[240px] justify-center">
                          <User className="w-6 h-6 text-black" strokeWidth={2.5} />
                          <span className="font-extrabold text-xl text-black">Staf Biasa</span>
                      </div>
  
                      <div className="w-full max-w-md relative">
                          {/* Connecting Line - positioned to align with dot centers */}
                          <div className="absolute left-[7px] top-[10px] bottom-[10px] w-[2px] bg-black/20 rounded-full"></div>
  
                          <ul className="flex flex-col gap-7">
                              {staffBiasa.map((item, idx) => (
                                  <li key={idx} className="flex items-center gap-5 relative z-10">
                                      <div className="shrink-0 w-4 h-4 bg-black rounded-full ring-4 ring-white shadow-sm"></div>
                                      <span className="font-bold text-lg text-black leading-snug">{item}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>
  
                  {/* Staf AI */}
                  <div className="w-full bg-[#6B8594] rounded-[2.5rem] p-10 pb-16 shadow-[0_20px_50px_rgba(107,133,148,0.4)] flex flex-col items-center ring-4 ring-white/50">
                       {/* Header Pill */}
                       <div className="bg-white rounded-full py-4 px-10 flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.3)] mb-12 min-w-[240px] justify-center">
                          <Bot className="w-7 h-7 text-[#6B8594]" strokeWidth={2.5} />
                          <span className="font-extrabold text-xl text-[#6B8594]">Staf AI</span>
                      </div>
  
                      <div className="w-full max-w-md relative">
                          {/* Connecting Line - positioned to align with dot centers */}
                          <div className="absolute left-[7px] top-[10px] bottom-[10px] w-[2px] bg-white/40 rounded-full"></div>
  
                          <ul className="flex flex-col gap-6">
                              {staffAI.map((item, idx) => (
                                  <li key={idx} className="flex items-center gap-5 relative z-10">
                                      <div className="shrink-0 w-4 h-4 bg-white rounded-full shadow-lg"></div>
                                      <span className="font-bold text-lg text-white leading-snug drop-shadow-md">{item}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>
  
              </div>
          </div>
      </section>
    );
}

function PricingSection() {
    const plans = [
        {
          name: "Gratis",
          desc: "Sempurna untuk mencoba Staff AI",
          features: [
            "1 Staff AI",
            "100 percakapan/bulan",
            "Fitur dasar",
            "Email support",
            "Dashboard analytics"
          ],
          cta: "Coba Gratis"
        },
        {
          name: "Pro",
          desc: "Untuk bisnis yang sedang berkembang",
          price: "Rp. 1.299.000",
          period: "/Bulan",
          features: [
            "5 Staff AI",
            "Unlimited percakapan",
            "Semua fitur premium",
            "Priority support 24/7",
            "Advanced analytics",
            "Custom branding",
            "API access"
          ],
          cta: "Coba Sekarang"
        },
        {
          name: "Enterprise",
          desc: "Solusi lengkap untuk perusahaan",
          customTitle: "Mari berdiskusi!", 
          features: [
            "Unlimited Staff AI",
            "Unlimited percakapan",
            "Semua fitur Pro",
            "Dedicated account manager",
            "Custom integration",
            "SLA guarantee",
            "Training & onboarding",
            "White-label solution"
          ],
          cta: "Coba Sekarang"
        }
    ];

    return (
        <section className="w-full bg-white py-16 px-4 md:px-8 flex justify-center z-20 relative">
            <div className="container mx-auto max-w-6xl">
                 {/* Sticky Note Container */}
                <div className="w-full bg-[#FDF4C8] rounded-[2.5rem] p-8 md:p-12 pt-28 relative overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.12),0_5px_15px_rgba(0,0,0,0.08)]">
                     
                     {/* Binder Holes - Top Left */}
                     <div className="absolute top-8 left-8 md:left-12 flex gap-4 z-20">
                        {[0, 1, 2, 3].map((i) => (
                            <div 
                                key={i} 
                                className="w-6 h-6 rounded-full bg-white"
                                style={{
                                    boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(0,0,0,0.2)'
                                }}
                            ></div>
                        ))}
                    </div>

                    <div className="text-center mb-8 relative z-10">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-black mb-4Tracking-tight">
                            Pilih Paket Anda
                        </h2>
                        <p className="text-xl text-[#5D4037] font-bold">
                            Lihat perbedaan signifikan antara<br/>
                            Staf Biasa dan Staf AI
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {plans.map((plan, idx) => (
                             <div key={idx} className="bg-white rounded-[2rem] p-6 lg:p-8 flex flex-col shadow-xl h-full border border-white/60">
                                 <h3 className="text-[#1565C0] font-bold text-xl mb-1">{plan.name}</h3>
                                 <p className="text-gray-500 text-xs font-medium mb-6">{plan.desc}</p>

                                {plan.price ? (
                                    <div className="flex items-baseline gap-1 mb-6 mt-2">
                                        <span className="text-black font-extrabold text-3xl tracking-tight">{plan.price}</span>
                                        <span className="text-gray-500 text-xs font-bold">{plan.period}</span>
                                    </div>
                                ) : plan.customTitle ? (
                                    <div className="mb-6 mt-2">
                                        <span className="text-black font-extrabold text-2xl tracking-tight leading-tight block">
                                            {plan.customTitle}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="mb-6 mt-2 h-[36px]"></div> 
                                )}

                                <div className="flex flex-col gap-3 mb-8 flex-grow">
                                    {plan.features.map((feat, i) => (
                                        <div key={i} className="flex items-start gap-2.5">
                                            <Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" strokeWidth={3} />
                                            <span className="text-gray-600 text-sm font-medium leading-relaxed">
                                                {feat}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <button className="w-full py-3 bg-gradient-to-b from-white to-[#F0F0F0] text-black font-bold rounded-full text-base shadow-[0_4px_6px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.08),inset_0_-2px_4px_rgba(0,0,0,0.1)] border border-gray-100 hover:to-[#E0E0E0] active:scale-[0.98] transition-all">
                                    {plan.cta}
                                </button>
                             </div>
                         ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function WaitingListSection() {
    const [formData, setFormData] = useState({
        Nama: '',
        nomer_Whatsapp: '',
        Kebutuhan: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const response = await fetch('https://n8n.srv651498.hstgr.cloud/webhook/Waiting_list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setSubmitStatus('success');
                setFormData({ Nama: '', nomer_Whatsapp: '', Kebutuhan: '' });
            } else {
                setSubmitStatus('error');
            }
        } catch (error) {
            console.error('Submission error:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="w-full bg-[#F7F7F4] py-24 px-4 md:px-8 flex justify-center z-20 relative overflow-hidden">
            <div className="container mx-auto max-w-2xl relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <p className="text-[#E68A44] font-semibold text-sm tracking-widest uppercase mb-4">
                        Early Access
                    </p>
                    <h2 className="text-4xl md:text-5xl font-bold text-[#2D2216] mb-4 tracking-tight leading-tight">
                        Gabung Waitlist
                    </h2>
                    <p className="text-[#4A3C2F] text-lg font-medium max-w-3xl mx-auto leading-relaxed md:whitespace-nowrap">
                        Daftar sekarang dan dapatkan akses eksklusif saat kami launch.
                    </p>
                </div>

                {/* Sticky Note Form Card */}
                <div className="bg-[#FDF4C8] rounded-[2.5rem] p-8 md:p-12 pt-24 border border-black/5 shadow-[0_20px_40px_rgba(0,0,0,0.1)] relative overflow-hidden">
                    
                     {/* Binder Holes - Top Center */}
                     <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-6 z-20">
                        {[0, 1, 2, 3].map((i) => (
                            <div 
                                key={i} 
                                className="w-6 h-6 rounded-full bg-white"
                                style={{
                                    boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(0,0,0,0.2)'
                                }}
                            ></div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
                        {/* Nama */}
                        <div>
                            <label htmlFor="nama" className="block text-xs font-bold text-[#5D4037] uppercase tracking-wider mb-3">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                id="nama"
                                name="Nama"
                                value={formData.Nama}
                                onChange={handleChange}
                                required
                                placeholder="John Doe"
                                className="w-full px-5 py-4 bg-white rounded-2xl border border-[#D7CCC8] focus:border-[#E68A44] focus:ring-0 outline-none transition-all duration-300 text-[#2D2216] font-medium placeholder:text-gray-400"
                            />
                        </div>

                        {/* WhatsApp Number */}
                        <div>
                            <label htmlFor="whatsapp" className="block text-xs font-bold text-[#5D4037] uppercase tracking-wider mb-3">
                                Nomor WhatsApp
                            </label>
                            <div className="flex">
                                <span className="inline-flex items-center px-5 rounded-l-2xl border border-r-0 border-[#D7CCC8] bg-white text-[#5D4037] font-bold text-sm">
                                    +62
                                </span>
                                <input
                                    type="tel"
                                    id="whatsapp"
                                    name="nomer_Whatsapp"
                                    value={formData.nomer_Whatsapp}
                                    onChange={handleChange}
                                    required
                                    placeholder="812 3456 7890"
                                    className="flex-1 px-5 py-4 bg-white rounded-r-2xl border border-[#D7CCC8] focus:border-[#E68A44] focus:ring-0 outline-none transition-all duration-300 text-[#2D2216] font-medium placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* Kebutuhan (Text Area) */}
                        <div>
                            <label htmlFor="kebutuhan" className="block text-xs font-bold text-[#5D4037] uppercase tracking-wider mb-3">
                                Kebutuhan Bisnis Anda
                            </label>
                            <textarea
                                id="kebutuhan"
                                name="Kebutuhan"
                                value={formData.Kebutuhan}
                                onChange={handleChange}
                                required
                                rows={4}
                                placeholder="Ceritakan kebutuhan Anda..."
                                className="w-full px-5 py-4 bg-white rounded-2xl border border-[#D7CCC8] focus:border-[#E68A44] focus:ring-0 outline-none transition-all duration-300 text-[#2D2216] font-medium placeholder:text-gray-400 resize-none"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 mt-2 bg-[#2D2216] text-white font-bold rounded-2xl text-base shadow-lg hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                    </svg>
                                    Mengirim...
                                </span>
                            ) : 'Daftar Waiting List'}
                        </button>

                        {/* Status Messages */}
                        {submitStatus === 'success' && (
                            <div className="text-center py-4 px-6 bg-green-100 border border-green-200 rounded-2xl">
                                <p className="text-green-700 font-semibold text-sm">
                                    ✓ Terima kasih! Anda sudah terdaftar di waiting list.
                                </p>
                            </div>
                        )}
                        {submitStatus === 'error' && (
                            <div className="text-center py-4 px-6 bg-red-100 border border-red-200 rounded-2xl">
                                <p className="text-red-700 font-semibold text-sm">
                                    Terjadi kesalahan. Silakan coba lagi.
                                </p>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </section>
    );
}

function CTASection() {
    return (
        <section className="w-full bg-white py-12 px-4 md:px-8 flex justify-center z-20 relative mb-[-40px]">
            <div className="container mx-auto max-w-6xl">
                {/* 3D Sticky Note CTA - Gold/Orange Paper */}
                <div className="w-full bg-[#f4d06f] rounded-[2.5rem] py-12 px-6 md:py-20 md:px-12 flex flex-col items-center text-center relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.15),0_10px_20px_rgba(0,0,0,0.1)] group">
                     
                    {/* Binder Holes - Top Center */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-6 z-20">
                        {[0, 1, 2, 3].map((i) => (
                            <div 
                                key={i} 
                                className="w-6 h-6 rounded-full bg-white"
                                style={{
                                    boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(0,0,0,0.2)'
                                }}
                            ></div>
                        ))}
                    </div>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#2D2216] leading-tight mb-6 relative z-10 pt-8">
                        Bangun tim <br/>
                        staf AI Anda
                    </h2>
                    
                    <p className="text-[#4A3C2F] text-sm md:text-base font-bold mb-10 max-w-xl leading-relaxed relative z-10 opacity-90">
                        Mulai transformasi digital bisnis Anda hari ini. Gratis untuk memulai,
                        tidak perlu kartu kredit.
                    </p>

                    <button className="px-12 py-4 bg-[#2D2216] text-white font-extrabold rounded-2xl text-lg shadow-xl hover:scale-105 hover:bg-black active:scale-95 transition-all duration-300 relative z-10">
                        Mulai Gratis
                    </button>

                    <p className="text-[#4A3C2F]/70 text-[10px] md:text-xs font-bold mt-6 relative z-10">
                        Tidak perlu kartu kredit • Setup dalam 5 menit • Cancel kapan saja
                    </p>

                     {/* Folded Corner Effect - 3D Peel */}
                     <div className="absolute bottom-0 right-0 w-[120px] h-[120px] drop-shadow-[-4px_-4px_8px_rgba(0,0,0,0.15)] z-20">
                            {/* Shadow Triangle (The Peel) */}
                            <div 
                                className="absolute bottom-0 right-0 w-0 h-0"
                                style={{
                                    borderStyle: 'solid',
                                    borderWidth: '0 0 120px 120px',
                                    borderColor: 'transparent transparent rgba(0,0,0,0.2) transparent',
                                }}
                            ></div>
                            
                            {/* Fold Triangle (The Flap) - Slightly darker gold */}
                            <div 
                                className="absolute bottom-0 right-0 w-0 h-0 z-20"
                                style={{
                                    borderStyle: 'solid',
                                    borderWidth: '120px 120px 0 0',
                                    borderColor: `#d6b048 transparent transparent transparent`, 
                                }}
                            ></div>
                     </div>
                </div>
            </div>
        </section>
    );
}

function FooterSection() {
    return (
        <footer className="w-full bg-[#DCC1A7] pt-32 pb-12 px-8 relative z-0 mt-[-80px]">
             {/* Logo - No Background */}
             <div className="flex justify-center mb-6">
                <Image 
                    src="/ClevioLogoLandingP.webp" 
                    alt="Clevio Logo"
                    width={240}
                    height={80}
                    className="w-[240px] h-auto object-contain"
                />
             </div>

             <div className="text-center">
                 <p className="text-[#4E342E] text-sm font-bold opacity-80">
                    © 2025 Clevio AI Staff. All rights reserved.
                 </p>
             </div>
        </footer>
    );
}
