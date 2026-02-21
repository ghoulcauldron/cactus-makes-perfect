import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom'
import Welcome from './routes/guest/welcome/Welcome'
import ProtectedRoute from './routes/ProtectedRoute'
import PhotoCalculatorAuth from './routes/guest/login/PhotoCalculatorAuth'
import AccessDenied from './pages/AccessDenied'
import './index.css'
import './fonts.css';

// --- ARTIFACT IMPORT ---
import TheArtifact from './components/Artifact/TheArtifact';

// --- SIMPLE DEV GATEKEEPER ---
// This prevents random users from stumbling onto your 3D test
function ArtifactGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // 1. Check if we already unlocked it this session
    if (sessionStorage.getItem('artifact_unlock') === 'true') {
      setVerified(true);
      return;
    }

    // 2. If not, prompt the user
    // NOTE: This uses the browser's native blocking prompt
    const password = window.prompt("🔐 Restricted Access. Enter Dev Password:");

    if (password === "C4ctu$m4k3s93rf3cT") { // <--- CHANGE THIS PASSWORD IF YOU WANT
      sessionStorage.setItem('artifact_unlock', 'true');
      setVerified(true);
    } else {
      // 3. Wrong password? Send them home.
      alert("Access Denied.");
      window.location.href = "/";
    }
  }, []);

  if (!verified) return <div style={{ background: '#000', height: '100vh', width: '100vw' }} />;
  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: '/',
    loader: () => {
        try {
        if (localStorage.getItem('auth_token')) {
            return redirect('/guest/welcome');
        }
        } catch {}
        return null;
    },
    element: <PhotoCalculatorAuth />
  },
  { 
    path: '/guest/login', 
    element: <PhotoCalculatorAuth /> 
  },
  {
    path: '/invite',
    element: <PhotoCalculatorAuth />
  },
  {
    path: '/denied',
    element: <AccessDenied />
  },
  { 
    path: '/guest/welcome',
    element: (
      <ProtectedRoute>
        <Welcome />
      </ProtectedRoute>
    ),
  },
  
  // --- NEW HIDDEN ROUTE ---
  {
    path: '/artifact',
    element: (
      <ArtifactGate>
        <TheArtifact />
      </ArtifactGate>
    )
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>
)