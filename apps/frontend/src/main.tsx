import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom'
import AccessDenied from './pages/AccessDenied'
import './index.css'
import './fonts.css'
import AmbientSound from './components/AmbientSound'
import TheArtifact from './TheArtifact'

const router = createBrowserRouter([
  {
    // Root: dispatch based on what's in localStorage
    path: '/',
    loader: () => {
      if (localStorage.getItem('artifact_token')) return redirect('/artifact');
      return redirect('/artifact');
    },
  },
  {
    // Primary Phase 2 entry point
    path: '/artifact',
    element: <TheArtifact />,
  },
  {
    // Legacy Phase 1 invite links — forward token to artifact
    path: '/invite',
    loader: ({ request }: { request: Request }) => {
      const url   = new URL(request.url);
      const token = url.searchParams.get('token');
      return redirect(token ? `/artifact?token=${token}` : '/artifact');
    },
  },
  {
    // Legacy Phase 1 login — forward to artifact
    path: '/guest/login',
    loader: () => redirect('/artifact'),
  },
  {
    // Legacy Phase 1 welcome — forward to artifact
    path: '/guest/welcome',
    loader: () => redirect('/artifact'),
  },
  {
    path: '/denied',
    element: <AccessDenied />,
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AmbientSound />
    <RouterProvider router={router} />
  </React.StrictMode>
)