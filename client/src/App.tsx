import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import UsersPage from './pages/UsersPage'
import TicketsPage from './pages/TicketsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/users" element={<UsersPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
