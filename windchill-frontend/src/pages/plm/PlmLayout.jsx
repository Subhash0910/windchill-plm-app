import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/organisms/Header/Header';
import ContextSwitcher from '../../components/plm/ContextSwitcher';
import ContextTeamPanel from '../../components/plm/ContextTeamPanel';
import FolderTree from '../../components/plm/FolderTree';
import AIChatBot from '../../components/ai/AIChatBot';
import './PlmLayout.css';

const PlmLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPart, setSelectedPart] = useState(null);
  const [aiActionTrigger, setAiActionTrigger] = useState(null);

  const isDashboard = location.pathname.startsWith('/dashboard');
  const isWorklist = location.pathname.startsWith('/plm/worklist');
  const isChangesGroup = location.pathname.startsWith('/plm/changes');
  const isChangeTasks = location.pathname.startsWith('/plm/changes/tasks');
  const isChanges = isChangesGroup && !isChangeTasks;
  const isAiDemo = location.pathname.startsWith('/plm/ai-demo');
  const isWorkspace = location.pathname.startsWith('/plm') && !isWorklist && !isChangesGroup && !isAiDemo;

  // Determine current page context for AI
  const getCurrentPage = () => {
    if (isWorkspace) return 'workspace';
    if (isWorklist) return 'worklist';
    if (isChanges) return 'changes';
    if (isChangeTasks) return 'change-tasks';
    if (isAiDemo) return 'ai-demo';
    return 'unknown';
  };

  // Handle AI chat actions
  const handleChatAction = (action, params) => {
    console.log('🤖 AI Action:', action, params);

    switch (action) {
      case 'RUN_IMPACT_ANALYSIS':
        handleImpactAnalysis(params);
        break;
      
      case 'SEARCH_PART':
        handlePartSearch(params);
        break;
      
      case 'NAVIGATE_TO_ECN':
        navigate('/plm/changes');
        break;
      
      case 'NAVIGATE_TO_PARTS':
        navigate('/plm/parts');
        break;
      
      default:
        console.log('Unknown action:', action);
    }
  };

  // Handle impact analysis action from AI
  const handleImpactAnalysis = (params) => {
    const { part_number, change_type } = params;
    console.log(`🔍 Triggering analysis for ${part_number} (${change_type})`);

    // If not on AI Demo page, navigate there first
    if (!isAiDemo) {
      console.log('📍 Navigating to AI Demo page...');
      // Store the action to execute after navigation
      sessionStorage.setItem('pendingAiAction', JSON.stringify({
        action: 'RUN_IMPACT_ANALYSIS',
        params: { part_number, change_type }
      }));
      navigate('/plm/ai-demo');
    } else {
      // Already on AI Demo page - trigger the analysis
      console.log('✅ On AI Demo page, triggering analysis');
      setAiActionTrigger({ part_number, change_type, timestamp: Date.now() });
    }
  };

  // Handle part search action from AI
  const handlePartSearch = (params) => {
    const { part_number } = params;
    console.log(`🔍 Searching for part: ${part_number}`);
    
    // Navigate to parts page with search
    navigate(`/plm/parts?search=${part_number}`);
  };

  // Listen for pending actions after navigation
  useEffect(() => {
    if (isAiDemo) {
      const pendingAction = sessionStorage.getItem('pendingAiAction');
      if (pendingAction) {
        try {
          const { action, params } = JSON.parse(pendingAction);
          console.log('⚡ Executing pending action:', action, params);
          sessionStorage.removeItem('pendingAiAction');
          
          // Delay slightly to ensure page is fully loaded
          setTimeout(() => {
            if (action === 'RUN_IMPACT_ANALYSIS') {
              setAiActionTrigger({ ...params, timestamp: Date.now() });
            }
          }, 500);
        } catch (e) {
          console.error('Error parsing pending action:', e);
          sessionStorage.removeItem('pendingAiAction');
        }
      }
    }
  }, [isAiDemo]);

  return (
    <div className="plm-shell">
      <Header title="Workspace" />

      <div className="plm-topnav">
        <div className="plm-topnav-inner">
          <Link className={isDashboard ? 'plm-link active' : 'plm-link'} to="/dashboard">Dashboard</Link>
          <Link className={isWorkspace ? 'plm-link active' : 'plm-link'} to="/plm">Workspace</Link>
          <Link className={isWorklist ? 'plm-link active' : 'plm-link'} to="/plm/worklist">Worklist</Link>
          <Link className={isChanges ? 'plm-link active' : 'plm-link'} to="/plm/changes">Changes</Link>
          <Link className={isChangeTasks ? 'plm-link active' : 'plm-link'} to="/plm/changes/tasks">Change Tasks</Link>
          <Link className={isAiDemo ? 'plm-link active' : 'plm-link'} to="/plm/ai-demo" style={{color: '#667eea', fontWeight: isAiDemo ? 'bold' : 'normal'}}>⚡ AI Demo</Link>
        </div>
      </div>

      <div className="plm-body">
        <aside className="plm-left">
          <ContextSwitcher />
          <ContextTeamPanel />
          <FolderTree />
        </aside>

        <main className="plm-main">
          {/* Pass AI action trigger to child pages via context/props */}
          <Outlet context={{ aiActionTrigger }} />
        </main>
      </div>

      {/* Global AI Chat Bot - Available on ALL pages */}
      <AIChatBot 
        onAction={handleChatAction}
        selectedPart={selectedPart}
        currentPage={getCurrentPage()}
      />
    </div>
  );
};

export default PlmLayout;