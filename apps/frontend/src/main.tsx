import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import CalculatorAuth from './routes/guest/login/CalculatorAuth.tsx'
import Welcome from './routes/guest/welcome/Welcome.tsx'
import RSVP from './routes/guest/rsvp/RSVP.tsx'

const router = createBrowserRouter([
  { path: '/guest/login', element: <CalculatorAuth/> },
  { path: '/guest/welcome', element: <Welcome/> },
  { path: '/guest/rsvp', element: <RSVP/> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>
)
