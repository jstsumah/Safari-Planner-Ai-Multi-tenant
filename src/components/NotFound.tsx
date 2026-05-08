import React from 'react';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import { motion } from 'motion/react';

const NotFound: React.FC<{ onHome: () => void }> = ({ onHome }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-safari-50">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-safari-900 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[20%] w-96 h-96 bg-safari-600 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-12">
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 border-2 border-dashed border-safari-200 rounded-full flex items-center justify-center"
              >
                <Compass size={64} className="text-safari-400" />
              </motion.div>
              <div className="absolute -top-4 -right-4 bg-safari-900 text-white w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-xl">
                404
              </div>
            </div>
          </div>

          <h1 className="text-5xl font-black text-safari-900 mb-4 tracking-tighter italic">
            Lost in the Wild?
          </h1>
          <p className="text-safari-600 font-medium mb-12 max-w-md mx-auto leading-relaxed">
            Even the best explorers take a wrong turn sometimes. The trail you're looking for doesn't seem to exist in our map.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white border border-safari-200 text-safari-900 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-safari-50 transition-all shadow-sm group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Go Back
            </button>
            <button
              onClick={onHome}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-safari-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-lg shadow-safari-900/20 group"
            >
              <Home size={16} className="group-hover:scale-110 transition-transform" />
              Return Home
            </button>
          </div>
        </motion.div>

        <div className="mt-16 pt-8 border-t border-safari-100/50">
          <div className="flex items-center justify-center gap-2 text-safari-400">
            <Compass size={20} />
            <span className="font-extrabold text-sm tracking-tight text-safari-500 uppercase">SafariPlanner.ai</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
