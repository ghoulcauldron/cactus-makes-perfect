import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom'
import CalculatorAuth from './routes/guest/login/CalculatorAuth'
import Welcome from './routes/guest/welcome/Welcome'
import RSVP from './routes/guest/rsvp/RSVP'
import ProtectedRoute from './routes/ProtectedRoute'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    // If already authed, skip calculator and go straight to Welcome
    loader: () => {
      try {
        if (localStorage.getItem('auth_ok') === 'true') {
          return redirect('/guest/welcome')
        }
      } catch {}
      return null
    },
    element: <CalculatorAuth />
  },
  { path: '/guest/login', element: <CalculatorAuth /> },
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
