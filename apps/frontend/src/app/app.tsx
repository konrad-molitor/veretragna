import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@heroui/react';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import HealthCheck from '../components/HealthCheck';
import LandingContent from '../components/LandingContent';
import AuthForm from '../components/AuthForm';

export function App() {
  const [showAuthForm, setShowAuthForm] = useState(false);

  const handleStartClick = () => {
    setShowAuthForm(true);
  };

  const handleCloseAuthForm = () => {
    setShowAuthForm(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left side - Image */}
      <div className="w-full md:w-1/2 relative">
        <div
          className="h-full bg-cover bg-center"
          style={{ backgroundImage: 'url(../assets/images/bus5.png)' }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-20" />
        </div>
        {/* Removed blur effect at the edge */}
      </div>

      {/* Right side - Content */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 bg-gray-50 min-h-[100vh] md:min-h-0">
        <AnimatePresence mode="wait">
          {!showAuthForm ? (
            <motion.div
              key="landing-content"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex justify-center items-center"
            >
              <LandingContent onStartClick={handleStartClick} />
            </motion.div>
          ) : (
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full flex justify-center items-center"
            >
              <AuthForm onClose={handleCloseAuthForm} visible={showAuthForm} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <HealthCheck />
    </div>
  );
}

export default App;
