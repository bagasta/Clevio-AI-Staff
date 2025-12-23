'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Rocket, Calendar, Star, Sparkles } from 'lucide-react';

export default function ComingSoon() {
  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="min-h-[calc(100vh-12rem)] flex items-center justify-center"
        >
          <div className="w-full max-w-4xl text-center space-y-8">
            {/* Header Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 mx-auto"
            >
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#2D2216] to-[#1A1410] flex items-center justify-center shadow-xl shadow-[#2D2216]/20">
                <Rocket className="h-12 w-12 text-[#E68A44]" />
              </div>
            </motion.div>

            {/* Title and Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-[#2D2216]">
                Coming Soon
              </h1>
              <p className="text-lg md:text-xl text-[#5D4037] max-w-2xl mx-auto">
                We're working hard to bring you something amazing! This feature is currently under development and will be available soon.
              </p>
            </motion.div>

            {/* Progress Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="bg-white border border-[#E0D4BC] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between text-sm text-[#5D4037]">
                    <span className="font-medium">Development Progress</span>
                    <span className="text-[#2D2216] font-bold">75%</span>
                  </div>
                  <div className="w-full bg-[#FAF6F1] rounded-full h-3 overflow-hidden border border-[#E0D4BC]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "75%" }}
                      transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-[#E68A44] to-[#D4763A] rounded-full"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-6 text-sm text-[#5D4037]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#E68A44]" />
                      <span>Q1 2025</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-[#E68A44]" />
                      <span>High Priority</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Features Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {[
                { icon: "🚀", title: "Enhanced Performance", description: "Faster and more efficient" },
                { icon: "🎨", title: "Better UI/UX", description: "Improved user experience" },
                { icon: "🔧", title: "New Features", description: "Exciting capabilities" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <div className="bg-white border border-[#E0D4BC] rounded-2xl p-5 text-center space-y-3 hover:shadow-lg hover:border-[#E68A44]/50 transition-all duration-300 h-full">
                    <div className="text-4xl">{feature.icon}</div>
                    <h3 className="font-bold text-[#2D2216] text-sm">{feature.title}</h3>
                    <p className="text-xs text-[#8D7F71]">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-4"
            >
              <button
                onClick={handleGoBack}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#E0D4BC] bg-white text-[#2D2216] font-bold hover:bg-[#FAF6F1] hover:border-[#E68A44] transition-all shadow-sm"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Go Back
              </button>

              <div className="flex items-center justify-center gap-2 text-sm text-[#8D7F71]">
                <Clock className="h-4 w-4 animate-pulse text-[#E68A44]" />
                <span>Feature in development queue</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
