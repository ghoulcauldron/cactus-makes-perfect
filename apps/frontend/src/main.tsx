import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom'
import CalculatorAuth from './routes/guest/login/CalculatorAuth'
import Welcome from './routes/guest/welcome/Welcome'
import RSVP from './routes/guest/rsvp/RSVP'
import ProtectedRoute from './routes/ProtectedRoute'
import './index.css'
import PhotoCalculatorAuth from './routes/guest/login/PhotoCalculatorAuth'

const DEBUG = true;

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
    element: DEBUG ? <div className="w-screen h-screen bg-green-500 flex items-center justify-center text-white text-4xl">DEBUG MODE</div> : <PhotoCalculatorAuth />
    },
  { path: '/guest/login', element: DEBUG ? <div className="w-screen h-screen bg-green-500 flex items-center justify-center text-white text-4xl">DEBUG MODE</div> : <PhotoCalculatorAuth /> },
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
