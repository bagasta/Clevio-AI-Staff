"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Menu, Send, BatteryMedium, Wifi, Signal, Check, MessageSquare, ShoppingCart, Headset, TrendingUp, Users, FileText, ArrowLeft, ArrowRight, Clock, Brain, ShieldCheck, Zap, Globe, User, Bot, Gift, Star, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HeaderClock = () => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span>{time}</span>;
};

// Waiting List Section: Sticky Note Form
function WaitingListSection() {
  const [formData, setFormData] = useState({
      Nama: '',
      nomer_Whatsapp: '',
      Kebutuhan: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle, success, error

  const handleChange = (e) => {
      setFormData({
          ...formData,
          [e.target.name]: e.target.value
      });
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      setSubmitStatus('idle');

      try {
          const response = await fetch('/api/n8n-webhook', {
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
          console.error("Error submitting form:", error);
          setSubmitStatus('error');
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <div className="w-full bg-[#f8f9fa] pb-20 pt-10 flex flex-col items-center px-4">
         {/* Sticky Note Container - Paper Look with Binder Holes (Beige) */}
         <div className="w-full bg-[#FDF4C8] rounded-[2.5rem] p-6 pb-12 pt-24 border border-black/5 shadow-[0_20px_40px_rgba(0,0,0,0.1)] relative overflow-hidden">
                    
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

            <div className="text-center mb-8 relative z-10">
                <p className="text-[#E68A44] font-semibold text-xs tracking-widest uppercase mb-3">
                    Early Access
                </p>
                <h2 className="text-3xl font-extrabold text-[#2D2216] mb-3 tracking-tight leading-tight">
                    Gabung Waitlist
                </h2>
                <p className="text-[#4A3C2F] text-[15px] font-medium leading-relaxed max-w-[260px] mx-auto">
                    Daftar sekarang dan dapatkan akses eksklusif saat kami launch.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10 mt-4">
                {/* Nama */}
                <div>
                    <label htmlFor="nama" className="block text-xs font-bold text-[#5D4037] uppercase tracking-wider mb-2">
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
                        className="w-full px-5 py-3 bg-white rounded-2xl border border-[#D7CCC8] focus:border-[#E68A44] focus:ring-1 focus:ring-[#E68A44] outline-none transition-all duration-300 text-[#2D2216] font-medium placeholder:text-gray-400 text-sm"
                    />
                </div>

                {/* WhatsApp Number - Unified Wrapper */}
                <div>
                    <label htmlFor="whatsapp" className="block text-xs font-bold text-[#5D4037] uppercase tracking-wider mb-2">
                        Nomor WhatsApp
                    </label>
                    <div className="flex bg-white rounded-2xl border border-[#D7CCC8] transition-all duration-300 focus-within:border-[#E68A44] focus-within:ring-1 focus-within:ring-[#E68A44] overflow-hidden">
                        <span className="inline-flex items-center px-5 border-r border-[#D7CCC8] bg-gray-50 text-[#5D4037] font-bold text-sm">
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
                            className="flex-1 px-5 py-3 bg-transparent outline-none text-[#2D2216] font-medium placeholder:text-gray-400 text-sm"
                        />
                    </div>
                </div>

                {/* Kebutuhan (Text Area) */}
                <div>
                    <label htmlFor="kebutuhan" className="block text-xs font-bold text-[#5D4037] uppercase tracking-wider mb-2">
                        Kebutuhan Bisnis Anda
                    </label>
                    <textarea
                        id="kebutuhan"
                        name="Kebutuhan"
                        value={formData.Kebutuhan}
                        onChange={handleChange}
                        required
                        rows={3}
                        placeholder="Ceritakan kebutuhan Anda..."
                        className="w-full px-5 py-3 bg-white rounded-2xl border border-[#D7CCC8] focus:border-[#E68A44] focus:ring-1 focus:ring-[#E68A44] outline-none transition-all duration-300 text-[#2D2216] font-medium placeholder:text-gray-400 text-sm resize-none"
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 mt-4 bg-[#2D2216] text-white font-bold rounded-2xl text-[15px] shadow-lg hover:bg-black active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
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
                    <div className="text-center py-4 px-6 bg-green-100 border border-green-200 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-green-700 font-semibold text-sm">
                            ✓ Terima kasih! Anda sudah terdaftar di waiting list.
                        </p>
                    </div>
                )}
                {submitStatus === 'error' && (
                    <div className="text-center py-4 px-6 bg-red-100 border border-red-200 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-red-700 font-semibold text-sm">
                            Terjadi kesalahan. Silakan coba lagi.
                        </p>
                    </div>
                )}
            </form>
         </div>
    </div>
  );
}

export default function MobileLanding() {

  const [status, setStatus] = useState("initial"); // initial, interviewing, finished
  const [isChatOpen, setIsChatOpen] = useState(false); // Controls chat expansion
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const resultRef = useRef(null);
  const inputRef = useRef(null); 
  const chatContainerRef = useRef(null); // Ref for message container
  const chatCardRef = useRef(null); // Ref for the main Chat Card wrapper

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: "smooth"
        });
    }
  };

  useEffect(() => {
    if (isChatOpen) {
        // Use a small timeout to ensure DOM update before scrolling
        setTimeout(scrollToBottom, 100);
    }
  }, [messages, isTyping, isChatOpen]);

  // Keep focus on input when interviewing
  useEffect(() => {
    if (status === 'interviewing' && !isTyping) {
        setTimeout(() => {
             inputRef.current?.focus({ preventScroll: true }); 
             // We use preventScroll: true to stop the browser from jumping the whole page
             // The chat container scroll is handled by scrollToBottom separately
        }, 100);
    }
  }, [messages, status, isTyping]);

  // Auto-scroll to result when finished
  useEffect(() => {
    if (status === "finished") {
      setIsChatOpen(false); // Auto-minimize when done
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500);
    }
  }, [status]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Synchronous focus to force keyboard open on mobile
    inputRef.current?.focus();

    // Add user message
    const userMsg = { role: "user", text: inputValue };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setStatus("interviewing");
    setIsTyping(true);
    setIsChatOpen(true); // Ensure open on send

    // Force the view to scroll the Entire Chat Card to Center
    // This ensures "KEATAS" / "CHAT INPUT USER PERTAMA" behavior
    setTimeout(() => {
        chatCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300); // 300ms delay for layout transition
    
    // Dummy Interview Logic
    setTimeout(() => {
      let aiResponseText = "";
      if (messages.length === 0) {
        aiResponseText = "Menarik! Apa detail tugas spesifik yang harus dilakukan oleh staf AI ini?";
      } else if (messages.length === 2) {
        aiResponseText = "Baik, saya mengerti kebutuhan Anda. Sistem kami sedang menyiapkan demo yang cocok.";
      } else {
        // Finish condition
        setIsTyping(false);
        setStatus("finished");
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", text: aiResponseText }]);
      setIsTyping(false);
    }, 1500); 
  };

  const handleInputFocus = () => {
      // Only expand on focus if we are already interviewing.
      // If initial, we keep it collapsed as a pill until they hit Send.
      if (status !== 'initial') {
        setIsChatOpen(true);
      }
  };
    
  const handleBackgroundClick = () => {
      if (status === 'interviewing' && isChatOpen) {
          setIsChatOpen(false);
      }
  };

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    // Outer container
    <div className="flex min-h-[100dvh] w-full justify-center bg-black">
      
      {/* Mobile Frame Container */}
      <div className={`relative w-full max-w-[480px] bg-slate-900 font-sans shadow-2xl flex flex-col transition-all duration-500 min-h-[100dvh] overflow-hidden`}>
        
        {/* Header - Fixed Z-50 */}
        <header 
          className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 flex items-center justify-between px-6 h-20 transition-all duration-300 supports-[padding-top:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)] ${
            isScrolled || isMenuOpen ? "bg-black/40 backdrop-blur-md" : ""
          }`}
        >
          <div className="relative h-20 w-20">
            <Image
              src="/clevioAISTAFF-Logo-White.png"
              alt="Clevio AI Staff"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          
          {/* Animated Hamburger Icon */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white hover:text-gray-200 transition-colors p-2 -mr-2 relative w-10 h-10 flex items-center justify-center outline-none"
          >
            <div className="relative w-6 h-6">
                <motion.div
                    initial={false}
                    animate={{ rotate: isMenuOpen ? 90 : 0, opacity: isMenuOpen ? 0 : 1 }}
                    transition={{ duration: 0.2 }} // Snappy switch
                    className="absolute inset-0"
                >
                    <Menu className="w-8 h-8" />
                </motion.div>
                <motion.div
                    initial={false}
                    animate={{ rotate: isMenuOpen ? 0 : -90, opacity: isMenuOpen ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0"
                >
                     {/* Manually constructing X for precise control if needed, or just Lucide X */}
                     {/* Using Lucide 'X' but checking imports - wait, I need to import X or use standard svg? 
                        Let's check imports. Just in case, I will use a custom SVG X for thickness match or check if X is imported.
                        Ah, imports line 5 has many icons. Let's assume X is missing and add it or use SVG.
                        Wait, X is not in line 5. I'll add X to imports or just use SVG.
                        Let's use a simple SVG for X to be safe and match style.
                      */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                    </svg>
                </motion.div>
            </div>
          </button>
        </header>

        {/* Compact Dropdown Menu Overlay */}
        <AnimatePresence>
            {isMenuOpen && (
                <>
                     {/* Backdrop for click-outside close */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMenuOpen(false)}
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
                    />

                    {/* Menu Content - Dropdown from Top */}
                    <motion.div
                        initial={{ y: "-100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "-100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-black/80 backdrop-blur-xl rounded-b-[2rem] border-b border-white/10 shadow-2xl overflow-hidden"
                    >
                        <nav className="flex flex-col items-center gap-6 py-10">
                            {[
                                { name: "Fitur", href: "#fitur" },
                                { name: "Cara Kerja", href: "#cara-kerja" },
                                { name: "Testimoni", href: "#testimoni" },
                                { name: "Harga", href: "#harga" }
                            ].map((item, idx) => (
                                <motion.a
                                    key={item.name}
                                    href={item.href}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + idx * 0.05 }}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-xl font-bold text-white/90 hover:text-white transition-all tracking-wide"
                                >
                                    {item.name}
                                </motion.a>
                            ))}
                        </nav>
                    </motion.div>
                </>
            )}
        </AnimatePresence>

        {/* Hero Background */}
        <div 
            className="relative h-[100dvh] w-full shrink-0" 
            onClick={handleBackgroundClick}
            suppressHydrationWarning
        >
            <div className="absolute inset-0 z-0">
            <Image
                src="/landing-page/top-image.png"
                alt="AI Staff Background"
                fill
                className="object-cover object-top"
                priority
            />
            {/* Overlay logic: Darken when chat is OPEN to focus attention, light otherwise */}
            <div className={`absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/90 transition-opacity duration-500 ${isChatOpen ? 'opacity-0' : 'opacity-100'}`} />
            <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${isChatOpen ? 'opacity-100' : 'opacity-0'}`} />
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-6 supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            
            {/* Headline - Show if initial OR (interviewing AND minimized) */}
            <AnimatePresence>
                {(!isChatOpen || status === "initial") && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-1 mb-8 text-center text-[#FFFFFF] absolute bottom-32 left-0 right-0 px-6 pointer-events-none"
                >
                    <h1 className="text-2xl sm:text-3xl font-medium leading-tight drop-shadow-lg">
                    Jika Anda bisa mudah
                    </h1>
                    <h1 className="text-2xl sm:text-3xl font-medium leading-tight drop-shadow-lg">
                    membuat staf dari AI
                    </h1>
                    <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide drop-shadow-lg mt-2">
                    APA PERAN AI ANDA?
                    </h2>
                </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Container */}
            <motion.div
                ref={chatCardRef}
                layout
                className={`relative w-full bg-white shadow-2xl overflow-hidden flex flex-col ${
                isChatOpen ? "rounded-t-3xl rounded-b-xl" : "rounded-full"
                }`}
                animate={{
                height: isChatOpen ? "65%" : "60px",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside chat
            >
                {/* Chat Messages - Visible when Open */}
                <div 
                    ref={chatContainerRef}
                    className={`flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide ${!isChatOpen ? 'hidden' : ''}`}
                >
                    {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                        className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                            msg.role === "user"
                            ? "bg-[#5D4037] text-white rounded-br-none shadow-md"
                            : "bg-[#FAF6F1] text-[#2D2216] rounded-bl-none border border-[#E0D4BC]"
                        }`}
                        >
                        {msg.text}
                        </div>
                    </motion.div>
                    ))}
                    {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-[#FAF6F1] px-4 py-2 rounded-2xl rounded-bl-none border border-[#E0D4BC]">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-[#5D4037] rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-[#5D4037] rounded-full animate-bounce delay-75" />
                            <div className="w-2 h-2 bg-[#5D4037] rounded-full animate-bounce delay-150" />
                        </div>
                        </div>
                    </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area or Finished State */}
                <div className={`relative flex items-center p-1.5 ${isChatOpen ? 'border-t border-gray-100 bg-white' : ''} shrink-0`}>
                    {status === 'finished' ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex items-center justify-between px-5 py-3 w-full bg-green-500 rounded-full"
                        >
                            <span className="text-white font-semibold text-base">Agent berhasil dibuat!</span>
                            <div className="bg-white/20 p-1 rounded-full">
                                <Check className="w-4 h-4 text-white" />
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            <input
                                ref={inputRef}
                                type="text"
                                suppressHydrationWarning
                                value={inputValue}
                                onFocus={handleInputFocus}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder={status === "initial" ? "Ketik disini......" : "Tulis jawaban..."}
                                className="flex-1 px-5 py-3 text-gray-800 bg-transparent outline-none placeholder:text-gray-400 text-base min-w-0"
                            />
                            <button 
                                onClick={handleSend}
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white hover:bg-[#4E342E] transition-transform active:scale-95 shadow-md"
                                style={{ backgroundColor: "#5D4037" }}
                                aria-label="Kirim"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
            </div>
        </div>
      
        {/* CSS Phone Result Section */}
        {status === "finished" && (
            <div ref={resultRef} className="relative w-full bg-white pb-20 pt-10 px-4 animate-in fade-in slide-in-from-bottom-20 duration-1000">
                
                {/* Professional Phone Component */}
                <div className="mx-auto w-full max-w-[340px] relative">
                    {/* Realistic Frame */}
                    <div className="relative bg-black rounded-[55px] p-3 shadow-2xl border-4 border-[#323232] ring-4 ring-gray-200/50">
                        {/* Side Buttons */}
                        <div className="absolute top-32 -left-2 w-1 h-8 bg-gray-800 rounded-l-md opacity-90"></div> {/* Vol Up */}
                        <div className="absolute top-44 -left-2 w-1 h-8 bg-gray-800 rounded-l-md opacity-90"></div> {/* Vol Down */}
                        <div className="absolute top-36 -right-2 w-1 h-12 bg-gray-800 rounded-r-md opacity-90"></div> {/* Power */}

                        {/* Screen Container */}
                        <div className="relative bg-white rounded-[45px] overflow-hidden h-full border border-gray-800/20">
                            
                            {/* Dynamic Island / Notch Area */}
                            <div className="absolute top-0 left-0 right-0 h-8 z-30 flex justify-center">
                                <div className="w-[120px] h-[28px] bg-black rounded-b-[18px] flex items-center justify-center">
                                    {/* Camera dot reflection hint */}
                                    <div className="w-16 h-2 bg-gray-800/50 rounded-full blur-[1px]"></div>
                                </div>
                            </div>

                            {/* Status Bar */}
                            <div className="flex justify-between items-center px-8 pt-3.5 pb-2 text-[10px] font-semibold text-gray-900 bg-white z-20 relative select-none">
                                <HeaderClock />
                                <div className="flex gap-1.5 opacity-80">
                                    <Signal className="w-3.5 h-3.5" />
                                    <Wifi className="w-3.5 h-3.5" />
                                    <BatteryMedium className="w-3.5 h-3.5" />
                                </div>
                            </div>

                            {/* App Header - Elegant Wood Theme */}
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E0D4BC] bg-white/95 backdrop-blur-sm sticky top-0 z-10">
                                <div className="relative">
                                    <div className="w-11 h-11 rounded-full bg-[#5D4037] flex items-center justify-center border border-[#4E342E]">
                                        <span className="text-xl">🤖</span>
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#C0A865] border-2 border-white rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-base text-[#2D2216] leading-tight truncate">Clevio Assistant</h3>
                                    <p className="text-xs text-[#C0A865] font-medium">Online • Mengetik...</p>
                                </div>
                            </div>

                            {/* Chat Content Body - Elegant Spacing & Typography */}
                            <div className="bg-[#FAF6F1] h-[480px] p-5 space-y-4 overflow-y-auto font-sans">
                                <div className="text-xs text-center text-[#8D7F71] mb-6 font-medium">Hari ini</div>
                                
                                <div className="flex justify-start">
                                    <div className="bg-white p-3.5 px-4 rounded-2xl rounded-tl-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-[13px] leading-relaxed text-[#2D2216] border border-[#E0D4BC] max-w-[85%]">
                                        Halo James 👋, saya <span className="font-semibold text-[#5D4037]">Clevio</span>. Saya siap membantu mengelola tugas harian bisnis Anda secara otomatis.
                                    </div>
                                </div>

                                <div className="flex justify-start">
                                    <div className="bg-white p-3.5 px-4 rounded-2xl rounded-tl-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-[13px] leading-relaxed text-[#2D2216] border border-[#E0D4BC] max-w-[85%]">
                                        Dari <b>follow-up pelanggan</b>, <b>mencatat order</b>, sampai <b>menagih invoice</b>—semua bisa saya kerjakan 24/7 tanpa lelah.
                                    </div>
                                </div>

                                <div className="flex justify-start">
                                    <div className="bg-white p-3.5 px-4 rounded-2xl rounded-tl-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-[13px] leading-relaxed text-[#2D2216] border border-[#E0D4BC] max-w-[85%]">
                                        Ada yang bisa saya bantu mulai sekarang?
                                    </div>
                                </div>
                            </div>

                            {/* Fake Input Footer - Minimalist */}
                            <div className="p-4 bg-white border-t border-[#E0D4BC] absolute bottom-0 left-0 right-0 z-20">
                                <div className="flex items-center gap-3 bg-[#FAF6F1] rounded-full px-5 py-3 border border-[#E0D4BC]">
                                    <span className="text-gray-400 text-xs font-medium flex-1">Tulis pesan...</span>
                                    <div className="w-8 h-8 bg-[#5D4037] rounded-full flex items-center justify-center text-white shadow-md">
                                        <Send className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                                {/* Home Indicator */}
                                <div className="mx-auto w-32 h-1 bg-gray-300 rounded-full mt-5"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Carousel Section - Always Rendered Below */}
        <CarouselSection />



        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Features Section */}
        <FeatureSection />
      <TestimonialSection />
      <ComparisonSection />
      <PricingSection />
        <WaitingListSection />
      <CTASection />
      <FooterSection />

      </div>
    </div>
  );
}


function MobileUseCasesSection() {
  // Unified text color: Dark Espresso Brown
  const textColor = "text-[#2D2216]";
  const descColor = "text-[#4A3C2F]";

  const cards = [
    {
        icon: <MessageSquare className="w-6 h-6 text-[#5D4E37]" />,
        title: "Customer Service",
        desc: "Layani pelanggan 24/7 dengan respons cepat dan akurat",
        bg: "#F2F2F2",
        foldColor: "#B0B0B0", // Darker Grayscale
        holeShadow: "rgba(0,0,0,0.15)",
    },
    {
        icon: <ShoppingCart className="w-6 h-6 text-[#5D4E37]" />,
        title: "Sales Asistant",
        desc: "Tingkatkan penjualan dengan rekomendasi produk yang tepat",
        bg: "#A8C5D4",
        foldColor: "#7A98A8", // Darker Blue
        holeShadow: "rgba(0,0,0,0.2)",
    },
    {
        icon: <Headset className="w-6 h-6 text-[#5D4E37]" />,
        title: "Support Agent",
        desc: "Berikan dukungan teknis yang efisien dan profesional",
        bg: "#FFF59D",
        foldColor: "#D8C85A", // Darker Yellow
        holeShadow: "rgba(0,0,0,0.12)",
    },
    {
        icon: <TrendingUp className="w-6 h-6 text-[#5D4E37]" />,
        title: "Marketing Assistant",
        desc: "Otomatisasi kampanye marketing dan analisis data",
        bg: "#9DC99D",
        foldColor: "#6A9F6A", // Darker Green
        holeShadow: "rgba(0,0,0,0.15)",
    },
    {
        icon: <Users className="w-6 h-6 text-[#5D4E37]" />,
        title: "HR Assistant",
        desc: "Kelola rekrutmen dan onboarding karyawan dengan mudah",
        bg: "#F5B8CF",
        foldColor: "#C888A0", // Darker Pink
        holeShadow: "rgba(0,0,0,0.12)",
    },
    {
        icon: <FileText className="w-6 h-6 text-[#5D4E37]" />,
        title: "Admin Assistant",
        desc: "Atur jadwal, dokumen, dan tugas administratif lainnya",
        bg: "#F5C896",
        foldColor: "#C89860", // Darker Orange
        holeShadow: "rgba(0,0,0,0.15)",
    }
  ];

  return (
    <div className="w-full bg-white pb-20 pt-10 px-0 flex flex-col items-center">
        <div className="px-6 text-center mb-8">
            <h2 className="text-3xl font-extrabold text-black mb-4 tracking-tight leading-tight">
                Staf AI Apa Lagi Yang Bisa Anda Buat?
            </h2>
            <p className="text-lg text-gray-600 font-medium leading-normal">
                Banyak tugas yang bisa dibantu para staf AI Anda :
            </p>
        </div>

        {/* Horizontal Scroll Container */}
        <div 
            className="w-full flex overflow-x-auto gap-6 px-6 pb-8 snap-x snap-mandatory scrollbar-hide"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
            {cards.map((card, idx) => (
                <div 
                    key={idx}
                    className="relative shrink-0 w-[280px] h-[320px] rounded-[2rem] p-8 flex flex-col snap-center overflow-hidden shadow-lg transition-transform active:scale-95 group"
                    style={{ 
                        backgroundColor: card.bg,
                        boxShadow: `
                            0 15px 35px rgba(0,0,0,0.12),
                            0 5px 15px rgba(0,0,0,0.08)
                        `,
                    }}
                >
                     {/* Binder Holes - Intense Shadow */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-4 z-20">
                        {[0, 1, 2].map((i) => (
                            <div 
                                key={i} 
                                className="w-4 h-4 rounded-full bg-white"
                                style={{
                                    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.6), inset 1px 1px 2px rgba(0,0,0,0.4)'
                                }}
                            ></div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-5 mt-6 relative z-10 h-full">
                        {/* Icon Box - EXACT Desktop Shadow Logic (Neumorphic) */}
                        <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
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
                        
                        <div className="flex flex-col flex-1">
                            <h3 className={`font-black text-xl mb-2 ${textColor} leading-tight`}>{card.title}</h3>
                            <p className={`text-[14px] font-semibold leading-relaxed w-[90%] ${descColor}`}>
                                {card.desc}
                            </p>
                        </div>
                    </div>

                     {/* Folded Corner - EXACT Desktop CSS */}
                     <div className="absolute bottom-0 right-0 w-[80px] h-[80px] drop-shadow-[-4px_-4px_6px_rgba(0,0,0,0.15)]">
                        {/* Shadow Triangle (Back) */}
                        <div 
                            className="absolute bottom-0 right-0 w-0 h-0"
                            style={{
                                borderStyle: 'solid',
                                borderWidth: '0 0 80px 80px',
                                borderColor: 'transparent transparent rgba(0,0,0,0.25) transparent',
                            }}
                        ></div>
                        
                        {/* Fold Triangle (Flap) */}
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
            <div className="w-2 shrink-0"></div>
        </div>
    </div>
  );
}

function HowItWorksSection() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
        const { current } = scrollRef;
        const itemWidth = 300; 
        const currentScroll = current.scrollLeft;
        const index = Math.round(currentScroll / itemWidth);
        
        let targetScroll;
        if (direction === 'left') {
            targetScroll = Math.max(0, (index - 1) * itemWidth);
        } else {
            targetScroll = (index + 1) * itemWidth;
        }

        current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

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
    <div id="cara-kerja" className="w-full bg-[#F7F7F4] pb-20 pt-10 px-0 flex flex-col items-center">
        <div className="px-6 text-center mb-10">
            <h2 className="text-3xl font-extrabold text-black mb-4 tracking-tight leading-tight">
                Cara Kerja Clevio
            </h2>
            <p className="text-lg text-black font-medium leading-normal">
                Mulai dengan Staf AI Anda <br/> dalam 3 langkah mudah
            </p>
        </div>

        {/* Carousel Container */}
        <div 
            ref={scrollRef}
            className="w-full flex overflow-x-auto gap-6 px-6 pb-8 snap-x snap-mandatory scrollbar-hide"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
            {steps.map((step, idx) => (
                <div 
                    key={idx}
                    className="relative shrink-0 w-[280px] h-[480px] rounded-[2.5rem] flex flex-col snap-center overflow-hidden shadow-lg group"
                    style={{ 
                        backgroundColor: step.bg,
                        boxShadow: `
                            0 15px 35px rgba(0,0,0,0.12),
                            0 5px 15px rgba(0,0,0,0.08)
                        `,
                    }}
                >
                     {/* Binder Holes - Same as Desktop */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-4 z-20">
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

                     {/* Top Half: Illustration Area */}
                     <div className="h-[55%] w-full relative flex items-center justify-center pt-8">
                        <div className="relative w-[85%] h-[85%]">
                            <Image 
                                src={step.image} 
                                alt={step.title}
                                fill
                                className="object-contain"
                            />
                        </div>
                     </div>

                     {/* Bottom Half: Text Content */}
                     <div className="h-[45%] w-full px-6 pt-0 pb-28 flex flex-col text-center relative z-10 justify-end">
                        <h3 className={`font-black text-[22px] leading-tight mb-3 ${textColor}`}>
                            {step.title}
                        </h3>
                        <p className={`text-[15px] leading-relaxed font-semibold opacity-90 ${descColor} max-w-[85%] mx-auto`}>
                            {step.desc}
                        </p>
                     </div>

                     {/* Folded Corner - EXACT Desktop CSS (Triangle Hack) */}
                     <div className="absolute bottom-0 right-0 w-[80px] h-[80px] drop-shadow-[-4px_-4px_6px_rgba(0,0,0,0.15)]">
                        {/* Shadow Triangle (Back) */}
                        <div 
                            className="absolute bottom-0 right-0 w-0 h-0"
                            style={{
                                borderStyle: 'solid',
                                borderWidth: '0 0 80px 80px',
                                borderColor: 'transparent transparent rgba(0,0,0,0.25) transparent',
                            }}
                        ></div>
                        
                        {/* Fold Triangle (Flap) */}
                        <div 
                            className="absolute bottom-0 right-0 w-0 h-0 z-20"
                            style={{
                                borderStyle: 'solid',
                                borderWidth: '80px 80px 0 0',
                                borderColor: `${step.foldColor} transparent transparent transparent`,
                            }}
                        ></div>
                     </div>
                </div>
            ))}
             <div className="w-2 shrink-0"></div>
        </div>

         {/* Navigation Buttons */}
         <div className="w-full flex justify-end gap-4 px-6 mt-2">
            <button 
                onClick={() => scroll('left')}
                className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <button 
                onClick={() => scroll('right')}
                className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
            >
                <ArrowRight className="w-5 h-5" />
            </button>
        </div>
    </div>
  );
};

// Feature Section with 1:1 Visual Match
// Feature Section with Wooden Table Aesthetic
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
    // Wrap in bg-white to maintain page flow
    <div id="fitur" className="w-full bg-white pb-20 pt-8 px-6 flex flex-col items-center">
        {/* Sticky Note Container - Paper Look with Binder Holes (Beige/Wood) */}
        <div className="w-full bg-[#FDF4C8] rounded-[2.5rem] p-6 pb-8 flex flex-col items-center shadow-[0_15px_35px_rgba(0,0,0,0.12),0_5px_15px_rgba(0,0,0,0.08)] relative overflow-hidden">
            
            {/* Binder Holes - Top Center */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-4 z-20">
                {[0, 1, 2, 3].map((i) => (
                    <div 
                        key={i} 
                        className="w-5 h-5 rounded-full bg-white"
                        style={{
                            boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(0,0,0,0.2)'
                        }}
                    ></div>
                ))}
            </div>

            <h2 className="text-[28px] font-black text-[#4E342E] mb-6 mt-12 text-center tracking-tight leading-tight">
                Fitur Unggulan
            </h2>
            
            <div className="w-full flex flex-col gap-4">
                {features.map((feature, idx) => (
                    <div key={idx} className="w-full bg-white rounded-2xl p-5 flex flex-col items-start gap-3 shadow-md border border-white/50">
                        <div className="shrink-0 mb-1">
                            {feature.icon}
                        </div>
                        <div>
                            <h3 className="text-[#1A237E] font-bold text-[18px] leading-tight mb-1.5">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 text-[14px] leading-relaxed font-medium">
                                {feature.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}

function CarouselSection() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
        const { current } = scrollRef;
        const itemWidth = 320; 
        const currentScroll = current.scrollLeft;
        const index = Math.round(currentScroll / itemWidth);
        
        let targetScroll;
        if (direction === 'left') {
            targetScroll = Math.max(0, (index - 1) * itemWidth);
        } else {
            targetScroll = (index + 1) * itemWidth;
        }

        current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

  // Unified text color based on Desktop
  const textColor = "text-[#2D2216]";
  const descColor = "text-[#4A3C2F]";

  const cards = [
    {
        icon: <MessageSquare className="w-6 h-6 text-[#5D4E37]" />,
        title: "Customer Service",
        desc: "Layani pelanggan 24/7 dengan respons cepat dan akurat",
        bg: "#F2F2F2",
        foldColor: "#B0B0B0", // Darker Grayscale
        holeShadow: "rgba(0,0,0,0.15)",
    },
    {
        icon: <ShoppingCart className="w-6 h-6 text-[#5D4E37]" />,
        title: "Sales Asistant",
        desc: "Tingkatkan penjualan dengan rekomendasi produk yang tepat",
        bg: "#A8C5D4",
        foldColor: "#7A98A8", // Darker Blue
        holeShadow: "rgba(0,0,0,0.2)",
    },
    {
        icon: <Headset className="w-6 h-6 text-[#5D4E37]" />,
        title: "Support Agent",
        desc: "Berikan dukungan teknis yang efisien dan profesional",
        bg: "#FFF59D",
        foldColor: "#D8C85A", // Darker Yellow
        holeShadow: "rgba(0,0,0,0.12)",
    },
    {
        icon: <TrendingUp className="w-6 h-6 text-[#5D4E37]" />,
        title: "Marketing Assistant",
        desc: "Otomatisasi kampanye marketing dan analisis data",
        bg: "#9DC99D",
        foldColor: "#6A9F6A", // Darker Green
        holeShadow: "rgba(0,0,0,0.15)",
    },
    {
        icon: <Users className="w-6 h-6 text-[#5D4E37]" />,
        title: "HR Assistant",
        desc: "Kelola rekrutmen dan onboarding karyawan dengan mudah",
        bg: "#F5B8CF",
        foldColor: "#C888A0", // Darker Pink
        holeShadow: "rgba(0,0,0,0.12)",
    },
    {
        icon: <FileText className="w-6 h-6 text-[#5D4E37]" />,
        title: "Admin Assistant",
        desc: "Atur jadwal, dokumen, dan tugas administratif lainnya",
        bg: "#F5C896",
        foldColor: "#C89860", // Darker Orange
        holeShadow: "rgba(0,0,0,0.15)",
    }
  ];

  return (
    <div id="use-cases" className="w-full bg-white pb-10 pt-10 px-4 flex justify-center">
        {/* Gray Rounded Container */}
        <div className="w-full bg-[#E5E7EB] rounded-[3rem] pt-12 pb-10 flex flex-col items-center relative overflow-hidden">
            
            <div className="px-6 text-center mb-10 w-full max-w-sm relative z-10">
                <h2 className="text-[24px] font-black text-black leading-tight mb-2">
                    Staf AI Apa Lagi Yang <br /> Bisa Anda Buat?
                </h2>
                <p className="text-black/70 text-[13px] font-medium leading-relaxed">
                    Banyak tugas yang bisa <br /> dibantu para staf AI Anda :
                </p>
            </div>

            {/* Carousel Container */}
            <div 
                ref={scrollRef}
                className="w-full flex overflow-x-auto gap-6 px-6 pb-8 snap-x snap-mandatory scrollbar-hide"
                style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
                {cards.map((card, idx) => (
                    <div 
                        key={idx}
                        className="relative shrink-0 w-[280px] h-[320px] rounded-[2rem] p-8 flex flex-col snap-center overflow-hidden shadow-lg transition-transform active:scale-95 group"
                        style={{ 
                            backgroundColor: card.bg,
                            boxShadow: `
                                0 15px 35px rgba(0,0,0,0.12),
                                0 5px 15px rgba(0,0,0,0.08)
                            `,
                        }}
                    >
                        {/* Binder Holes - Intense Shadow */}
                        <div className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-4 z-20">
                            {[0, 1, 2].map((i) => (
                                <div 
                                    key={i} 
                                    className="w-4 h-4 rounded-full bg-white"
                                    style={{
                                        boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.6), inset 1px 1px 2px rgba(0,0,0,0.4)'
                                    }}
                                ></div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-5 mt-6 relative z-10 h-full">
                            {/* Icon Box - EXACT Desktop Shadow Logic (Neumorphic) */}
                            <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
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
                            
                            <div className="flex flex-col flex-1">
                                <h3 className={`font-black text-xl mb-2 ${textColor} leading-tight`}>{card.title}</h3>
                                <p className={`text-[14px] font-semibold leading-relaxed w-[90%] ${descColor}`}>
                                    {card.desc}
                                </p>
                            </div>
                        </div>

                        {/* Folded Corner - EXACT Desktop CSS */}
                         <div className="absolute bottom-0 right-0 w-[80px] h-[80px] drop-shadow-[-4px_-4px_6px_rgba(0,0,0,0.15)]">
                            {/* Shadow Triangle (Back) */}
                            <div 
                                className="absolute bottom-0 right-0 w-0 h-0"
                                style={{
                                    borderStyle: 'solid',
                                    borderWidth: '0 0 80px 80px',
                                    borderColor: 'transparent transparent rgba(0,0,0,0.25) transparent',
                                }}
                            ></div>
                            
                            {/* Fold Triangle (Flap) */}
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

            {/* Navigation Buttons - Right Aligned */}
            <div className="w-full flex justify-end gap-3 px-8 mt-[-10px] relative z-20">
                <button 
                    onClick={() => scroll('left')}
                    className="w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center text-black hover:bg-gray-50 active:scale-95 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => scroll('right')}
                    className="w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center text-black hover:bg-gray-50 active:scale-95 transition-all"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
  );
}


// Testimonial Section with Wooden Frame Aesthetic
function TestimonialSection() {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const itemWidth = 320; // Card width + gap
            const currentScroll = current.scrollLeft;
            const index = Math.round(currentScroll / itemWidth);
            
            let targetScroll;
            if (direction === 'left') {
                targetScroll = Math.max(0, (index - 1) * itemWidth);
            } else {
                targetScroll = (index + 1) * itemWidth;
            }
            current.scrollTo({ left: targetScroll, behavior: 'smooth' });
        }
    };

    const testimonials = [
        {
            name: "Dr. Kemal H.S. I Ist",
            image: "/testimoni/kemal.webp"
        },
        {
            name: "Gatot Nuradi Sam",
            image: "/testimoni/gatot.webp"
        },
        {
            name: "Sara Dhewanto",
            image: "/testimoni/sara.webp"
        },
        {
            name: "Sinta Kaniawati",
            image: "/testimoni/sinta.webp"
        }
    ];

    return (
        <div id="testimoni" className="w-full bg-[#f8f9fa] pb-20 pt-10 flex flex-col items-center">
            <h2 className="text-[28px] font-extrabold text-black mb-10 text-center px-4 tracking-tight">
                Ini Kata Mereka :
            </h2>

            <div 
                ref={scrollRef}
                className="w-full flex overflow-x-auto gap-6 px-8 pb-12 snap-x snap-mandatory scrollbar-hide"
                style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
                {testimonials.map((item, idx) => (
                    // Wooden Frame Container
                    <div 
                        key={idx}
                        className="relative shrink-0 w-[280px] h-[420px] bg-[#EBCFB2] rounded-[2.5rem] p-4 shadow-[0_15px_35px_rgba(0,0,0,0.15)] flex flex-col items-center snap-center ring-1 ring-black/5"
                    >
                         {/* Bevel/Depth Effect for Frame */}
                         <div className="absolute inset-0 rounded-[2.5rem] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.05)] pointer-events-none"></div>

                         {/* Inner Card Content */}
                         <div className="w-full h-full bg-white rounded-[1.8rem] relative overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)] isolation-auto group">
                            
                            {/* Full Background Image */}
                            <div className="absolute inset-0 z-0">
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>
                         </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <div className="w-full flex justify-end gap-4 px-6 mt-2">
                <button 
                    onClick={() => scroll('left')}
                    className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => scroll('right')}
                    className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

// Pricing Section: Wooden Board Aesthetic
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
      customTitle: "Mari berdiskusi!", // Special emphasis
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

    <div id="harga" className="w-full bg-[#f8f9fa] pb-20 pt-10 flex flex-col items-center px-4">
        {/* Sticky Note Container - Paper Look with Binder Holes (Beige) */}
        <div className="w-full bg-[#FDF4C8] rounded-[3rem] p-6 pb-12 pt-24 relative overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.12),0_5px_15px_rgba(0,0,0,0.08)]">
            
             {/* Binder Holes - Top Center */}
             <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-4 z-20">
                {[0, 1, 2, 3].map((i) => (
                    <div 
                        key={i} 
                        className="w-5 h-5 rounded-full bg-white"
                        style={{
                            boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(0,0,0,0.2)'
                        }}
                    ></div>
                ))}
            </div>

            <h2 className="text-[28px] font-extrabold text-[#2D2216] text-center leading-tight mb-2 relative z-10 tracking-tight">
                Pilih Paket Anda
            </h2>
            <p className="text-[#5D4037] text-[15px] text-center mb-10 font-bold max-w-[90%] leading-relaxed mx-auto relative z-10">
                Sesuaikan dengan kebutuhan <br /> bisnis Anda
            </p>

            <div className="flex flex-col gap-6 w-full relative z-10">
                {plans.map((plan, idx) => (
                    <div key={idx} className="relative w-full bg-white rounded-[2.5rem] p-8 pb-10 shadow-xl flex flex-col items-start border border-white/60">
                        
                        {/* Title Section */}
                        <h3 className="text-[#1565C0] font-bold text-[20px] mb-2 leading-tight">
                            {plan.name}
                        </h3>
                        <p className="text-gray-500 text-[13px] mb-6 leading-snug font-medium">
                            {plan.desc}
                        </p>

                        {/* Price Display */}
                        {plan.price && (
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-black font-black text-[28px] tracking-tight">{plan.price}</span>
                                <span className="text-gray-500 text-[12px] font-bold">{plan.period}</span>
                            </div>
                        )}

                        {/* Enterprise Custom Title */}
                        {plan.customTitle && (
                            <div className="mb-6">
                                <span className="text-black font-black text-[24px] tracking-tight leading-tight block">
                                    {plan.customTitle}
                                </span>
                            </div>
                        )}
                        
                        {/* Spacing for Gratis (if no price/customTitle) */}
                        {!plan.price && !plan.customTitle && (
                            <div className="mb-2"></div>
                        )}

                        {/* Features List */}
                        <div className="flex flex-col gap-3.5 mb-10 w-full">
                            {plan.features.map((feat, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <Check className="w-4 h-4 text-[#4CAF50] shrink-0 mt-0.5" strokeWidth={3} />
                                    <span className="text-gray-600 text-[13px] font-medium leading-tight">
                                        {feat}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* 3D Pill Button */}
                        <button className="w-full py-3.5 bg-gradient-to-b from-white to-[#F0F0F0] text-black font-bold rounded-full text-[15px] shadow-[0_4px_6px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.08),inset_0_-2px_4px_rgba(0,0,0,0.1)] border border-gray-100 hover:to-[#E0E0E0] active:scale-[0.98] active:shadow-inner transition-all mt-auto relative overflow-hidden group">
                           <span className="relative z-10">{plan.cta}</span>
                           <div className="absolute inset-0 bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}

// Comparison Section: 1:1 Match (Rounded Gray BG, Fixed Timeline)
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
    <div className="w-full bg-white pb-10 pt-10 px-4">
        <h2 className="text-[28px] font-extrabold text-black text-center leading-tight mb-2 mt-4 tracking-tight">
            Staf Biasa VS Staf AI
        </h2>
        <p className="text-gray-600 text-[15px] text-center mb-10 font-medium max-w-[90%] leading-relaxed mx-auto">
            Lihat perbedaan signifikan antara <br /> Staf Biasa dan Staf AI
        </p>

        <div className="flex flex-col gap-8 w-full">
            {/* Staf Biasa Card (White) */}
            <div className="w-full bg-white rounded-[2.5rem] p-8 pb-12 shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-gray-200 relative flex flex-col items-center">
                
                {/* Header Pill */}
                <div className="bg-gray-50 border border-gray-100 rounded-full py-3 px-8 flex items-center gap-3 shadow-inner mb-10 min-w-[200px] justify-center relative z-10">
                    <User className="w-6 h-6 text-gray-500" strokeWidth={2.5} />
                    <span className="font-extrabold text-[18px] text-gray-700 tracking-wide">Staf Biasa</span>
                </div>

                {/* Timeline List */}
                <div className="relative w-full">
                    {/* Vertical Line Container */}
                    <div className="absolute left-[9px] top-2 bottom-6 w-[2px] bg-gray-200 rounded-full z-0"></div>

                    <div className="flex flex-col gap-7 z-10 relative">
                        {staffBiasa.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-4">
                                {/* Dot Column */}
                                <div className="shrink-0 w-[20px] h-[20px] flex items-center justify-center">
                                    <div className="w-4 h-4 bg-gray-400 rounded-full ring-4 ring-white shadow-sm z-10"></div>
                                </div>
                                <span className="text-gray-600 font-bold text-[14px] leading-snug tracking-wide pt-0.5">
                                    {item}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Staf AI Card (Gradient Blue) */}
            <div className="w-full bg-gradient-to-br from-[#6B8594] to-[#4A6475] rounded-[2.5rem] p-8 pb-12 shadow-[0_30px_60px_rgba(74,100,117,0.4)] relative flex flex-col items-center ring-1 ring-white/20">
                
                {/* Header Pill (Glow Effect) */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full py-3 px-8 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.1)] mb-10 min-w-[200px] justify-center relative z-10 text-white">
                    <Bot className="w-7 h-7 text-white" strokeWidth={2.5} />
                    <span className="font-extrabold text-[18px] text-white tracking-wide">Staf AI</span>
                </div>

                {/* Timeline List */}
                <div className="relative w-full">
                     {/* Vertical Line Container */}
                     <div className="absolute left-[9px] top-2 bottom-4 w-[2px] bg-white/60 rounded-full z-0"></div>

                    <div className="flex flex-col gap-6 z-10 relative">
                        {staffAI.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-4">
                                {/* Dot Column */}
                                <div className="shrink-0 w-[20px] h-[20px] flex items-center justify-center">
                                    <div className="w-3.5 h-3.5 bg-white rounded-full z-10 shadow-[0_0_15px_rgba(255,255,255,0.6)]"></div>
                                </div>
                                <span className="text-white font-bold text-[14px] leading-snug tracking-wide pt-0.5 drop-shadow-md">
                                    {item}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}

// CTA Section: Gold Sticky Note with Folded Corner
function CTASection() {
  return (
    <div className="w-full bg-white pb-20 pt-10 px-4 flex justify-center relative z-20 mb-[-50px]">
        {/* Gold/Orange Card Container */}
        <div className="w-full bg-[#f4d06f] rounded-[2.5rem] p-8 pb-32 flex flex-col items-center text-center relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.15),0_10px_20px_rgba(0,0,0,0.1)]">
            
            {/* Binder Holes - Top Center */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-6 z-20">
                {[0, 1, 2, 3].map((i) => (
                    <div 
                        key={i} 
                        className="w-5 h-5 rounded-full bg-white"
                        style={{
                            boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(0,0,0,0.2)'
                        }}
                    ></div>
                ))}
            </div>

            <h2 className="text-[32px] font-black text-[#2D2216] leading-[1.1] mb-6 mt-12 relative z-10 tracking-tight">
                Bangun tim <br/> staf AI Anda
            </h2>

            <p className="text-[#4A3C2F] text-[15px] font-bold leading-relaxed mb-10 max-w-[90%] relative z-10 opacity-90">
                Mulai transformasi digital bisnis Anda hari ini. Gratis untuk memulai, <br/> tidak perlu kartu kredit.
            </p>

            <button className="w-full py-4 bg-[#2D2216] text-white font-extrabold rounded-2xl text-[16px] shadow-xl active:scale-[0.98] transition-all relative z-10 mb-8">
                Mulai Gratis
            </button>

            <p className="text-[#4A3C2F]/70 text-[11px] font-bold leading-relaxed z-10">
                Tidak perlu kartu kredit • Setup dalam 5 menit • Cancel kapan saja
            </p>

            {/* Folded Corner Effect - 3D Peel (Bottom Right) */}
            <div className="absolute bottom-0 right-0 w-[100px] h-[100px] drop-shadow-[-4px_-4px_8px_rgba(0,0,0,0.15)] z-20">
                {/* Shadow Triangle (The Peel) */}
                <div 
                    className="absolute bottom-0 right-0 w-0 h-0"
                    style={{
                        borderStyle: 'solid',
                        borderWidth: '0 0 100px 100px',
                        borderColor: 'transparent transparent rgba(0,0,0,0.2) transparent',
                    }}
                ></div>
                
                {/* Fold Triangle (The Flap) - Slightly darker gold */}
                <div 
                    className="absolute bottom-0 right-0 w-0 h-0 z-20"
                    style={{
                        borderStyle: 'solid',
                        borderWidth: '100px 100px 0 0',
                        borderColor: `#d6b048 transparent transparent transparent`, 
                    }}
                ></div>
            </div>
        </div>
    </div>
  );
}

function FooterSection() {
  return (
    <footer className="w-full bg-[#DCC1A7] pt-24 pb-12 px-8 relative z-10 mt-[-40px]">
         {/* Logo - No Background */}
         <div className="flex justify-center mb-6">
            <Image 
                src="/ClevioLogoLandingP.webp" 
                alt="Clevio Logo"
                width={200}
                height={60}
                className="w-[180px] h-auto object-contain"
            />
         </div>

         <div className="text-center">
             <p className="text-[#4E342E] text-[13px] font-bold opacity-80">
                © 2025 Clevio AI Staff. All rights reserved.
             </p>
         </div>
    </footer>
  );
}