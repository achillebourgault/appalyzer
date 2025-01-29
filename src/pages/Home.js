import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import SearchBar from '../components/SearchBar';
import AppGrid from '../components/AppGrid';
import LoadingScreen from '../components/LoadingScreen';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

const electron = window.require ? window.require('electron') : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;

const Container = styled.div`
  position: relative;
  min-height: 100vh;
  padding: 32px 0;
  display: flex;
  flex-direction: column;
  gap: 48px;
  background: ${props => props.theme.colors.background};
  overflow: hidden;
`;

const AnimatedBackground = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  pointer-events: none;
  overflow: hidden;
  opacity: 0.25;
  filter: blur(120px);
  transform: translateZ(0);
`;

const PatternOverlay = styled.div`
  position: absolute;
  top: -50%;
  right: 0;
  bottom: -50%;
  width: 60%;
  pointer-events: none;
  overflow: hidden;
  opacity: 0.08;
  background-image: 
    linear-gradient(${props => props.theme.colors.primary}92 1px, transparent 1px),
    linear-gradient(90deg, ${props => props.theme.colors.primary}92 1px, transparent 1px);
  background-size: 30px 30px;
  background-position: right top;
  mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 30%, rgba(0, 0, 0, 0));
  -webkit-mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 70%, rgba(0, 0, 0, 0));
  animation: patternMove 20s linear infinite;
  transform: translateZ(0);
  will-change: transform;

  @keyframes patternMove {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(-30px, 30px);
    }
  }
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  padding: 0 24px;
`;

const Title = styled(motion.h1)`
  text-align: center;
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const Home = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [appData, setAppData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Appalyzer - Home';
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      if (!ipcRenderer) {
        throw new Error('Electron IPC not available');
      }
      const savedApps = await ipcRenderer.invoke('get-apps');
      setApps(savedApps);
    } catch (err) {
      console.error('Failed to load apps:', err);
      setError('Failed to load applications');
    }
  };

  const handleUrlSubmit = async (url) => {
    try {
      setLoading(true);
      setError(null);

      const normalizedUrl = await ipcRenderer.invoke('normalize-url', url);
      const urlObj = new URL(normalizedUrl);
      const domain = urlObj.hostname;
      const newAppData = {
        id: Date.now().toString(),
        name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1).toLowerCase(),
        domain: domain,
        url: normalizedUrl,
        logo: `https://www.google.com/s2/favicons?sz=128&domain=${domain}`
      };

      setAppData(newAppData);
      await ipcRenderer.invoke('save-app-data', newAppData);

      // Wait for the loading animation to complete (5 seconds)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      navigate(`/app/${newAppData.id}`);
    } catch (error) {
      console.error('Error adding app:', error);
      setError(error.message);
      setLoading(false);
      setAppData(null);
    }
  };

  return (
    <Container>
      <AnimatedBackground />
      <PatternOverlay />
      <Content>
        <Title
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Appalyzer
        </Title>
        <SearchBar onSubmit={handleUrlSubmit} error={error} />
        <AnimatePresence>
          {loading && appData && (
            <LoadingScreen 
              appName={appData.name} 
              appIcon={appData.logo}
            />
          )}
        </AnimatePresence>
        <AppGrid apps={apps} />
      </Content>
    </Container>
  );
};

export default Home;
