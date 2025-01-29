import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const { ipcRenderer } = window.require('electron');

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;
  padding: 20px 0;
  margin-top: 20px;
  width: 100%;
`;

const AppItem = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 15px;
  border-radius: 12px;
  background: ${props => props.theme.colors.surface};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    background: ${props => props.theme.colors.surface}dd;
  }
`;

const AppIcon = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 8px;
`;

const AppName = styled.span`
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
`;

const ContextMenu = styled(motion.div)`
  position: fixed;
  background: ${props => props.theme.colors.surface};
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  min-width: 160px;
  z-index: 1000;
`;

const MenuItem = styled.div`
  padding: 8px 16px;
  cursor: pointer;
  color: ${props => props.theme.colors.text};
  
  &:hover {
    background: ${props => props.theme.colors.surfaceHover};
  }

  &.delete {
    color: ${props => props.theme.colors.error};
  }
`;

const AppGrid = ({ apps = [] }) => {
  const navigate = useNavigate();
  const [contextMenu, setContextMenu] = useState({ visible: false, appId: null, x: 0, y: 0 });

  const handleContextMenu = (e, appId) => {
    e.preventDefault();
    setContextMenu({ 
      visible: true, 
      appId, 
      x: e.clientX, 
      y: e.clientY 
    });
  };

  const handleRename = async (appId) => {
    const newName = prompt('Enter new name:');
    if (newName) {
      await ipcRenderer.invoke('rename-app', { appId, newName });
      window.location.reload();
    }
    setContextMenu({ visible: false, appId: null });
  };

  const handleDelete = async (appId) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      await ipcRenderer.invoke('delete-app', appId);
      window.location.reload();
    }
    setContextMenu({ visible: false, appId: null });
  };

  const handleCreateShortcut = async (appId) => {
    try {
      const app = apps.find(a => a.id === appId);
      if (!app) return;

      console.log('Creating shortcut for app:', app);
      await ipcRenderer.invoke('create-desktop-shortcut', app);
      setContextMenu({ visible: false, appId: null });
    } catch (error) {
      console.error('Error creating shortcut:', error);
      alert('Failed to create desktop shortcut');
    }
  };

  const handleClick = (e) => {
    if (contextMenu.visible) {
      setContextMenu({ visible: false, appId: null });
    }
  };

  React.useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu.visible]);

  return (
    <>
      <Grid>
        {apps.map((app) => (
          <AppItem
            key={app.id}
            onClick={() => navigate(`/app/${app.id}`)}
            onContextMenu={(e) => handleContextMenu(e, app.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <AppIcon src={app.logo} alt={app.name} />
            <AppName>{app.name}</AppName>
          </AppItem>
        ))}
      </Grid>

      <AnimatePresence>
        {contextMenu.visible && (
          <ContextMenu
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <MenuItem onClick={() => handleCreateShortcut(contextMenu.appId)}>
              Create Desktop Shortcut
            </MenuItem>
            <MenuItem onClick={() => handleRename(contextMenu.appId)}>
              Rename
            </MenuItem>
            <MenuItem 
              className="delete"
              onClick={() => handleDelete(contextMenu.appId)}
            >
              Delete
            </MenuItem>
          </ContextMenu>
        )}
      </AnimatePresence>
    </>
  );
};

export default AppGrid;
