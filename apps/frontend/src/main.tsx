import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom'
import Welcome from './routes/guest/welcome/Welcome'
import ProtectedRoute from './routes/ProtectedRoute'
import './index.css'
import PhotoCalculatorAuth from './routes/guest/login/PhotoCalculatorAuth'
import './fonts.css';

// --- NEW IMPORT ---
import TheArtifact from './components/Artifact/TheArtifact';

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

    element: (
      <>
        <PhotoCalculatorAuth />
      </>
    )
  },
  { 
    path: '/guest/login', 
    element: (
      <>
        <PhotoCalculatorAuth />
      </>
    ) 
  },
  {
    path: '/invite',
    element: (
      <>
        <PhotoCalculatorAuth />
      </>
    )
  },
  { 
    path: '/guest/welcome',
    element: (
      <ProtectedRoute>
        <Welcome />
      </ProtectedRoute>
    ),
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>
)
