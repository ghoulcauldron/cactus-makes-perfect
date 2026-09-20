import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom'
import './index.css'
import './fonts.css'
import UploadPortal from './UploadPortal'

const router = createBrowserRouter([
  {
    // Root: token in URL passes straight through to the portal
    path: '/',
    loader: ({ request }: { request: Request }) => {
      const url   = new URL(request.url);
      const token = url.searchParams.get('token');
      return redirect(token ? `/upload?token=${token}` : '/upload');
    },
  },
  {
    path: '/upload',
    element: <UploadPortal />,
  },
  {
    // Phase 2 cryptex — closed for this phase, returns in v3
    path: '/artifact',
    loader: ({ request }: { request: Request }) => {
      const url   = new URL(request.url);
      const token = url.searchParams.get('token');
      return redirect(token ? `/upload?token=${token}` : '/upload');
    },
  },
  {
    // Legacy Phase 1
    path: '/invite',
    loader: ({ request }: { request: Request }) => {
      const url   = new URL(request.url);
      const token = url.searchParams.get('token');
      return redirect(token ? `/upload?token=${token}` : '/upload');
    },
  },
  { path: '/guest/login',   loader: () => redirect('/upload') },
  { path: '/guest/welcome', loader: () => redirect('/upload') },
  { path: '*',              loader: () => redirect('/upload') },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)