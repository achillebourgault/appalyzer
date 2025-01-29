import React, { useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const BarContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: fit-content;
  min-width: 500px;
  display: flex;
  justify-content: center;
  z-index: 999;
`;

const Bar = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 24px;
  width: 100%;
  background: rgba(32, 33, 36, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
`;

const AppIconWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-radius: 12px;
  transition: all 0.2s ease;
  background: ${props => props.isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};

  &:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.1);
  }
`;

const AppIcon = styled(motion.button).attrs({
  type: 'button'
})`
  width: 48px;
  height: 48px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  position: relative;
  border-radius: 12px;
  transition: all 0.2s ease;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 8px;
  }
`;

const AppName = styled.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AppContainer = styled.div`
  display: flex;
  gap: 16px;
  padding: 8px;
  width: 100%;
  justify-content: center;
`;

const AppBar = ({ apps = [], onReorder = () => {}, show }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredApp, setHoveredApp] = useState(null);
  const isInSubApp = location.pathname.startsWith('/app/');
  const currentAppId = isInSubApp ? location.pathname.split('/')[2] : null;

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(apps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(items);
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <AnimatePresence>
      {show && (
        <BarContainer>
          <Bar
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={variants}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="appbar-apps" direction="horizontal">
                {(provided) => (
                  <AppContainer
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {apps.map((app, index) => (
                      <Draggable key={app.id} draggableId={app.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <AppIconWrapper isActive={app.id === currentAppId}>
                              <AppIcon
                                onMouseEnter={() => setHoveredApp(app.id)}
                                onMouseLeave={() => setHoveredApp(null)}
                                onClick={() => navigate(`/app/${app.id}`)}
                                style={{
                                  opacity: snapshot.isDragging ? 0.5 : 1
                                }}
                              >
                                {app.logo ? (
                                  <img src={app.logo} alt={app.name} draggable="false" />
                                ) : (
                                  <div style={{ fontSize: '18px' }}>{app.name[0].toUpperCase()}</div>
                                )}
                              </AppIcon>
                              <AppName>{app.name}</AppName>
                            </AppIconWrapper>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </AppContainer>
                )}
              </Droppable>
            </DragDropContext>
          </Bar>
        </BarContainer>
      )}
    </AnimatePresence>
  );
};

export default AppBar;
