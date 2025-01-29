import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiGithub, FiTrash2 } from 'react-icons/fi';

const { ipcRenderer } = window.require('electron');

const Container = styled.div`
  position: relative;
  min-height: 100vh;
  padding: 32px 0;
  display: flex;
  flex-direction: column;
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

const Dot = styled(motion.div)`
  width: 4px;
  height: 4px;
  background: ${props => props.theme.colors.text};
  border-radius: 50%;
  opacity: 0.15;
  justify-self: center;
  align-self: center;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 24px;
  color: ${props => props.theme.colors.text};
  position: relative;
`;

const Section = styled.div`
  position: relative;
  z-index: 1;
`;

const Setting = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: ${props => props.theme.colors.card}66;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  backdrop-filter: blur(10px);
  margin-bottom: 16px;
`;

const Label = styled.div`
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  
  span {
    display: block;
    color: ${props => props.theme.colors.textSecondary};
    font-size: 12px;
    margin-top: 4px;
  }
`;

const CustomCheckbox = styled.label`
  display: inline-block;
  position: relative;
  cursor: pointer;
  user-select: none;
  width: 48px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + span {
      background: ${props => props.theme.colors.primary};
    }

    &:checked + span:before {
      transform: translateX(24px);
    }
  }

  span {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.theme.colors.border};
    transition: 0.3s;
    border-radius: 12px;

    &:before {
      content: "";
      position: absolute;
      width: 18px;
      height: 18px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
    }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  position: relative;
  z-index: 1;
`;

const Button = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  background: transparent;
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.colors.hover};
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
  }

  &.danger {
    border-color: ${props => props.theme.colors.error}66;
    color: ${props => props.theme.colors.error};

    &:hover {
      background: ${props => props.theme.colors.error}11;
      border-color: ${props => props.theme.colors.error};
    }

    svg {
      color: ${props => props.theme.colors.error};
    }
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Settings = () => {
  const [startAtLogin, setStartAtLogin] = React.useState(false);

  React.useEffect(() => {
    const loadSettings = async () => {
      const settings = await ipcRenderer.invoke('get-settings');
      setStartAtLogin(settings.startAtLogin);
    };
    loadSettings();
  }, []);

  const handleStartAtLoginChange = async () => {
    const newValue = !startAtLogin;
    await ipcRenderer.invoke('set-settings', { startAtLogin: newValue });
    setStartAtLogin(newValue);
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      await ipcRenderer.invoke('clear-data');
      window.location.reload();
    }
  };

  const handleGithub = () => {
    ipcRenderer.invoke('open-external-url', 'https://github.com/achillebourgault/appalyzer');
  };

  return (
    <Container>
      <AnimatedBackground />
      <PatternOverlay />
      <Title>Settings</Title>

      <Section>
        <Setting>
          <Label>
            Start at login
            <span>Launch Appalyzer when your computer starts</span>
          </Label>
          <CustomCheckbox>
            <input
              type="checkbox"
              checked={startAtLogin}
              onChange={handleStartAtLoginChange}
            />
            <span />
          </CustomCheckbox>
        </Setting>
      </Section>

      <ButtonContainer>
        <Button
          className="danger"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClearData}
        >
          <FiTrash2 />
          Clear Data
        </Button>
        <Button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGithub}
        >
          <FiGithub />
          View Source Code
        </Button>
      </ButtonContainer>
    </Container>
  );
};

export default Settings;
