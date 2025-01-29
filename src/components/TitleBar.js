import React from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import { FiMinus, FiMaximize2, FiX, FiSettings, FiHome } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const { ipcRenderer } = window.require('electron');

const TitleBarContainer = styled.div`
  height: 32px;
  background: ${props => props.theme.colors.titleBar};
  display: flex;
  align-items: center;
  justify-content: space-between;
  -webkit-app-region: drag;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
`;

const Title = styled.div`
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  margin-left: 12px;
  flex: 1;
`;

const WindowControls = styled.div`
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
`;

const WindowButton = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 32px;
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.isClose ? props.theme.colors.error + '20' : props.theme.colors.hover};
    color: ${props => props.isClose ? props.theme.colors.error : props.theme.colors.text};
  }

  &:active {
    background: ${props => props.isClose ? props.theme.colors.error + '40' : props.theme.colors.active};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ActionButton = styled.button`
  border: none;
  background: none;
  color: ${props => props.theme.colors.text};
  width: 35px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
  margin-right: 2px;

  &:hover {
    background-color: ${props => props.theme.colors.hover};
    transform: translateY(-2px);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const TitleBar = () => {
  const location = useLocation();
  const [currentApp, setCurrentApp] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const loadCurrentApp = async () => {
      if (location.pathname.startsWith('/app/')) {
        const appId = location.pathname.split('/')[2];
        const appData = await ipcRenderer.invoke('get-app-data', appId);
        setCurrentApp(appData);
      } else {
        setCurrentApp(null);
      }
    };

    loadCurrentApp();
  }, [location]);

  const handleMinimize = () => {
    ipcRenderer.invoke('window-control', 'minimize');
  };

  const handleMaximize = () => {
    ipcRenderer.invoke('window-control', 'maximize');
  };

  const handleClose = () => {
    ipcRenderer.invoke('window-control', 'close');
  };

  return (
    <TitleBarContainer>
      <Title>
        {currentApp ? `${currentApp.name} - Appalyzer` : 'Appalyzer'}
      </Title>
      <WindowControls>
        <ActionButton onClick={() => navigate('/')} title="Home">
          <FiHome size={16} />
        </ActionButton>
        <ActionButton onClick={() => navigate('/settings')} title="Settings">
          <FiSettings size={16} />
        </ActionButton>
        <WindowButton onClick={handleMinimize} title="Minimize">
          <FiMinus size={16} />
        </WindowButton>
        <WindowButton onClick={handleMaximize} title="Maximize">
          <FiMaximize2 size={14} />
        </WindowButton>
        <WindowButton isClose onClick={handleClose} title="Close">
          <FiX size={16} />
        </WindowButton>
      </WindowControls>
    </TitleBarContainer>
  );
};

export default TitleBar;
