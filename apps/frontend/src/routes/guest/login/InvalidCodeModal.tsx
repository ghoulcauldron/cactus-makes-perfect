import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InvalidCodeModalProps {
  show: boolean;
  onClose: () => void;
}

export default function InvalidCodeModal({ show, onClose }: InvalidCodeModalProps) {
  // Auto-dismiss after 2s
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center relative overflow-hidden"
            initial={{ scale: 0.8, rotate: -5, opacity: 0 }}
            animate={{
              scale: [1, 1.05, 0.95, 1],   // playful wiggle
              rotate: [0, -3, 3, 0],
              opacity: 1
            }}
            exit={{ scale: 0.8, rotate: 5, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {/* Whimsical emoji burst */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-5xl">
              ❌✨💥
            </div>

            <h2 className="text-2xl font-display text-cactus-green mb-2">
              Nope, Try Again!
            </h2>
            <p className="text-gray-700">
              That code didn’t open the cactus gates 🌵  
              Give it another shot.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
