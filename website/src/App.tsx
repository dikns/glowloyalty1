import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111111',
            color: '#F5F0E8',
            border: '1px solid #222',
            borderRadius: 0,
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#C9A84C', secondary: '#080808' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/prijava" element={<Login />} />
        <Route path="/registracija" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
      </Routes>
    </>
  )
}
