import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

type StartupBoundaryState = { error: Error | null };

class StartupErrorBoundary extends React.Component<React.PropsWithChildren, StartupBoundaryState> {
  state: StartupBoundaryState = { error: null };
  static getDerivedStateFromError(error: Error): StartupBoundaryState { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('VUE 3D Canvas failed while rendering:', error, info.componentStack);
  }
  render() {
    if (this.state.error) return (
      <main style={{ minHeight: '100vh', boxSizing: 'border-box', padding: 24, background: '#17191d', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 22 }}>VUE 3D Canvas could not start</h1>
        <p style={{ color: '#cbd5e1', maxWidth: 760 }}>A startup rendering error occurred. The details below can help identify the cause; project data has not been changed.</p>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', padding: 16, background: '#252a32', border: '1px solid #475569', borderRadius: 8, color: '#fecaca' }}>{this.state.error.message || String(this.state.error)}</pre>
        <button type="button" onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '9px 14px', borderRadius: 6, border: '1px solid #64748b', background: '#334155', color: 'white' }}>Reload application</button>
      </main>
    );
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = '<main style="padding:24px;font:16px system-ui;color:#fff;background:#17191d">VUE 3D Canvas could not find its application mount point (#root).</main>';
} else {
  try {
    createRoot(rootElement).render(<StartupErrorBoundary><App /></StartupErrorBoundary>);
  } catch (error) {
    console.error('VUE 3D Canvas failed before React mounted:', error);
    rootElement.innerHTML = '<main style="padding:24px;font:16px system-ui;color:#fff;background:#17191d"><h1>VUE 3D Canvas could not start</h1><p>Startup failed before the interface mounted. Open the browser console for details.</p></main>';
  }
}
