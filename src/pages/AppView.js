import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const { ipcRenderer } = window.require('electron');

const Container = styled.div`
  position: fixed;
  top: 32px;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.theme.colors.background};
  display: flex;
  flex-direction: column;

  webview {
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  text-align: center;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 400px;
  margin-bottom: 20px;
`;

const BackButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`;

const AppView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const webviewRef = useRef(null);
  let mouseTimer = null;

  useEffect(() => {
    const loadApp = async () => {
      try {
        const appData = await ipcRenderer.invoke('get-app-data', id);
        if (!appData) {
          navigate('/');
          return;
        }
        setApp(appData);
        await ipcRenderer.invoke('set-window-title', appData.name);
        if (appData.logo) {
          await ipcRenderer.invoke('set-window-icon', appData.logo);
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to load app:', error);
        setError('Failed to load app');
        navigate('/');
      }
    };

    loadApp();

    return () => {
      ipcRenderer.invoke('set-window-title', null);
      ipcRenderer.invoke('reset-window-icon');
    };
  }, [id, navigate]);

  useEffect(() => {
    if (app) {
      document.title = app.name;
      ipcRenderer.invoke('update-window-icon', app.icon);
    }
  }, [app]);

  useEffect(() => {
    const handleMouseMove = () => {
      if (mouseTimer) {
        clearTimeout(mouseTimer);
      }
      mouseTimer = setTimeout(() => {
        if (webviewRef.current) {
          webviewRef.current.blur();
        }
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseTimer) {
        clearTimeout(mouseTimer);
      }
    };
  }, []);

  useEffect(() => {
    if (webviewRef.current && app) {
      const webview = webviewRef.current;

      const handleNewWindow = (e) => {
        e.preventDefault();
        const { shell } = window.require('electron');
        shell.openExternal(e.url);
      };

      webview.addEventListener('new-window', handleNewWindow);
      
      return () => {
        webview.removeEventListener('new-window', handleNewWindow);
      };
    }
  }, [app]);

  useEffect(() => {
    if (webviewRef.current) {
      webviewRef.current.addEventListener('dom-ready', () => {
        webviewRef.current.executeJavaScript(`
          const meta = document.createElement('meta');
          meta.httpEquiv = 'Content-Security-Policy';
          meta.content = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;";
          document.head.appendChild(meta);
        `);
      });
    }
  }, []);

  if (error) {
    return (
      <ErrorContainer>
        <ErrorMessage>{error}</ErrorMessage>
        <BackButton onClick={() => navigate('/')}>Back to Home</BackButton>
      </ErrorContainer>
    );
  }

  if (loading) {
    return null;
  }

  return (
    <Container>
      <webview
        ref={webviewRef}
        src={app.url}
        partition={`persist:app-${app.id}`}
        webpreferences="contextIsolation=yes, nativeWindowOpen=yes"
        allowpopups="true"
        httpreferrer={app.url}
      />
    </Container>
  );
};

export default AppView;