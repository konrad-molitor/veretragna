import { motion } from 'framer-motion';
import { Button } from '@heroui/react';
import { ArrowRightIcon } from '@heroicons/react/24/solid';

type LandingContentProps = {
  onStartClick: () => void;
};

export function LandingContent({ onStartClick }: LandingContentProps) {
  return (
    <div className="flex flex-col items-center max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8"
      >
        <img src="../assets/images/logo.png" alt="Veretragna Logo" className="h-24 md:h-32" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 text-center"
      >
        Veretragna
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="text-xl md:text-2xl text-gray-600 mb-12 text-center font-light italic"
      >
        Superar cualquier obstáculo se hace fácil.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="solid"
          size="lg"
          className="px-8 py-3 text-lg font-medium flex items-center gap-2 shadow-lg rounded-full bg-red-600 hover:bg-red-700 text-white"
          onClick={onStartClick}
        >
          Comenzar
          <ArrowRightIcon className="h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  );
}

export default LandingContent;
