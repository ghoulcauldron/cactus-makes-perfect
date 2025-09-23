import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom'
import CalculatorAuth from './routes/guest/login/CalculatorAuth'
import Welcome from './routes/guest/welcome/Welcome'
import RSVP from './routes/guest/rsvp/RSVP'
import ProtectedRoute from './routes/ProtectedRoute'
import './index.css'
import PhotoCalculatorAuth from './routes/guest/login/PhotoCalculatorAuth'
import './fonts.css';

const DEBUG = true;

function DebugBadge() {
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      backgroundColor: 'green',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      fontWeight: 'bold',
      zIndex: 1000,
      fontSize: '12px',
      fontFamily: 'sans-serif'
    }}>
      DEBUG
    </div>
  );
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
    element: (
      <>
        {DEBUG && <DebugBadge />}
        <PhotoCalculatorAuth />
      </>
    )
  },
  { 
    path: '/guest/login', 
    element: (
      <>
        {DEBUG && <DebugBadge />}
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
  { 
    path: '/guest/rsvp',
    element: (
      <ProtectedRoute>
        <RSVP />
      </ProtectedRoute>
    ),
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>
)
