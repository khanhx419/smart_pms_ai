import React, { useState, useEffect } from 'react';
import WorkflowControlPanel from '../components/WorkflowControlPanel';
import KpiCards from '../components/KpiCards';
import HubSpokeVisualizer from '../components/HubSpokeVisualizer';
import EventLogTerminal from '../components/EventLogTerminal';
import CodeArtifactViewer from '../components/CodeArtifactViewer';
import { api } from '../services/api';

export default function LabDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [activeAgent, setActiveAgent] = useState('Coordinator');
  const [governanceMode, setGovernanceMode] = useState('STRICT');
  const [metrics, setMetrics] = useState(null);
  const [events, setEvents] = useState([]);
  const [stories, setStories] = useState([]);

  // Load latest run on mount
  useEffect(() => {
    api.getLatest().then((res) => {
      if (res.data?.metrics) setMetrics(res.data.metrics);
      if (res.data?.events) setEvents(res.data.events);
    }).catch(console.error);

    // Connect to SSE for real-time live events
    const evtSource = api.createEventSource();
    evtSource.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data);
        setEvents((prev) => [...prev, ev]);

        // Dynamically update active agent in visualizer based on event
        if (ev.type.includes('PLANNER')) setActiveAgent('StoryPlannerAgent');
        else if (ev.type.includes('DEV') || ev.type.includes('CODE')) {
          setActiveAgent(ev.message.includes('Frontend') ? 'FrontendDeveloperAgent' : 'BackendDeveloperAgent');
        }
        else if (ev.type.includes('QA') || ev.type.includes('SELF_CORRECTION')) setActiveAgent('QaAgent');
        else if (ev.type.includes('GOV')) setActiveAgent('PmGovernanceAgent');
        else if (ev.type.includes('COORDINATOR') || ev.type.includes('SPRINT')) setActiveAgent('Coordinator');

        if (ev.metadata?.metrics) {
          setMetrics(ev.metadata.metrics);
        }
      } catch (err) {
        console.error(err);
      }
    };

    return () => {
      evtSource.close();
    };
  }, []);

  const handleRunWorkflow = async (epic, mode) => {
    setIsRunning(true);
    setGovernanceMode(mode);
    setActiveAgent('Coordinator');

    try {
      const res = await api.runWorkflow(epic, mode);
      if (res.data) {
        setMetrics(res.data.metrics);
        setStories(res.data.stories || []);
        setEvents(res.data.events || []);
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi chạy SDLC workflow');
    } finally {
      setIsRunning(false);
      setActiveAgent('Coordinator');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Workflow Control Settings */}
      <WorkflowControlPanel onRun={handleRunWorkflow} isRunning={isRunning} />

      {/* Scientific Metrics (AV, SCR, GO) */}
      <KpiCards metrics={metrics} />

      {/* Live Visualizer Arena: Hub-Spoke & Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HubSpokeVisualizer
          activeAgent={activeAgent}
          isRunning={isRunning}
          governanceMode={governanceMode}
        />
        <EventLogTerminal
          events={events}
          onClear={() => setEvents([])}
        />
      </div>

      {/* Generated Code & Test Artifacts */}
      <CodeArtifactViewer stories={stories} />
    </div>
  );
}
