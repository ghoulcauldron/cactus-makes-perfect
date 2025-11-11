import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom'
import CalculatorAuth from './routes/guest/login/CalculatorAuth'
import Welcome from './routes/guest/welcome/Welcome'
import RSVPModal from './routes/guest/modals/RSVPModal'
import ProtectedRoute from './routes/ProtectedRoute'
import './index.css'
import PhotoCalculatorAuth from './routes/guest/login/PhotoCalculatorAuth'
import './fonts.css';

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
