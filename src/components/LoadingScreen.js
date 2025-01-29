import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const Container = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background};
  z-index: 1000;
`;

const Message = styled(motion.div)`
  font-size: 24px;
  color: ${props => props.theme.colors.text};
  margin-bottom: 20px;
  text-align: center;
`;

const AppName = styled.span`
  color: ${props => props.theme.colors.primary};
  font-weight: bold;
`;

const IconContainer = styled(motion.div)`
  width: 80px;
  height: 80px;
  margin: 20px 0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const DotsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const Dot = styled(motion.div)`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary};
`;

const LoadingScreen = ({ appName, appIcon }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 2000),
      setTimeout(() => setStep(2), 4000)
    ];

    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  const dotVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  };

  return (
    <Container
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="wait">
        {step === 0 && (
          <Message
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            Setting up <AppName>{appName}</AppName>
          </Message>
        )}

        {step === 1 && (
          <>
            <Message
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              Retrieving app icon
            </Message>
            {appIcon && (
              <IconContainer
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" }}
              >
                <img src={appIcon} alt={appName} />
              </IconContainer>
            )}
          </>
        )}

        {step === 2 && (
          <Message
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            Ready to launch! 🚀
          </Message>
        )}
      </AnimatePresence>

      {step !== 2 && (
        <DotsContainer>
          {[0, 1, 2].map(i => (
            <Dot
              key={i}
              variants={dotVariants}
              animate="animate"
              style={{ 
                opacity: step >= i ? 1 : 0.3,
                transition: "opacity 0.3s ease"
              }}
            />
          ))}
        </DotsContainer>
      )}
    </Container>
  );
};

export default LoadingScreen;
