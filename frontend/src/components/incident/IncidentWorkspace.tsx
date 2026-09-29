'use client';

import React from 'react';
import { useIncident } from '@/hooks/useIncident';
import { useInvestigation } from '@/hooks/useInvestigation';
import IncidentHeader from './IncidentHeader';
import SymptomList from './SymptomList';
import AIInvestigationSection from './AIInvestigationSection';
import ResolutionForm from './ResolutionForm';
import PostmortemForm from '@/components/postmortem/PostmortemForm';
import RetainKnowledgeForm from '@/components/postmortem/RetainKnowledgeForm';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import type { Post_Mortem, Knowledge_Entry } from '@/types';

interface IncidentWorkspaceProps {
  incidentId: string;
}

export default function IncidentWorkspace({ incidentId }: IncidentWorkspaceProps) {
  const { incident, loading, error, retry, setIncident } = useIncident(incidentId);

  // Lift investigation state so header actions and workspace are perfectly synchronized
  const {
    investigation,
    analyzing,
    error: investigationError,
    analyze,
    updateStepStatus,
  } = useInvestigation(incidentId, incident?.investigation);

  if (loading) {
    return <LoadingState variant="skeleton" shape="page" label="Loading incident workspace…" />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message || 'Unable to load this incident.'}
        statusCode={error.status || undefined}
        onRetry={retry}
        fullPage
      />
    );
  }

  if (!incident) {
    return (
      <ErrorState
        message="Incident not found in organizational database."
        onRetry={retry}
        fullPage
      />
    );
  }

  const handleResolveClick = () => {
    const el = document.getElementById('resolution-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <article aria-labelledby="incident-title" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header with metadata and quick actions */}
      <IncidentHeader
        incident={incident}
        onAnalyze={analyze}
        onResolveClick={handleResolveClick}
        isAnalyzing={analyzing}
      />

      {/* 2. Incident Overview: Reported Symptoms & Diagnostic Terminal Logs */}
      <SymptomList symptoms={incident.symptoms} logs={incident.logs} />

      {/* 3. Centerpiece: AI Investigation & Organizational Memory Workspace */}
      <AIInvestigationSection
        incident={incident}
        investigation={investigation}
        analyzing={analyzing}
        error={investigationError}
        onAnalyze={analyze}
        onUpdateStep={updateStepStatus}
        onIncidentUpdate={setIncident}
      />

      {/* 4. Resolution & Post-Mortem & Knowledge Retention Loop */}
      <div className="space-y-6 pt-4 border-t border-brand-border/60">
        <ResolutionForm
          incident={incident}
          onResolved={(updated) => setIncident(updated)}
        />

        <PostmortemForm
          incident={incident}
          onComplete={(pm: Post_Mortem) =>
            setIncident((i) => (i ? { ...i, postMortem: pm } : i))
          }
        />

        <RetainKnowledgeForm
          incident={incident}
          onRetained={(entry: Knowledge_Entry) =>
            setIncident((i) => (i ? { ...i, knowledgeEntry: entry } : i))
          }
        />
      </div>
    </article>
  );
}
