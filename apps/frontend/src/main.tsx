import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import CalculatorAuth from './routes/guest/login/CalculatorAuth'
import Welcome from './routes/guest/welcome/Welcome'
import RSVP from './routes/guest/rsvp/RSVP'
import './index.css'

const router = createBrowserRouter([
  { path: '/', element: <Welcome /> },
  { path: '/guest/login', element: <CalculatorAuth/> },
  { path: '/guest/welcome', element: <Welcome/> },
  { path: '/guest/rsvp', element: <RSVP/> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>
)