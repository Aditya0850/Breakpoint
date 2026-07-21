import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from './lib/supabase'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Setup from './pages/Setup'
import Interview from './pages/Interview'
import Report from './pages/Report'

const queryClient = new QueryClient()

const PROTECTED_ROUTES = ['/dashboard', '/setup', '/interview', '/report']

function AnimatedRoutes() {
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0b0b10]">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const needsAuth = PROTECTED_ROUTES.some((p) => location.pathname.startsWith(p))
  if (needsAuth && !user) return <Navigate to="/auth" replace />
  if (user && location.pathname === '/auth') return <Navigate to="/dashboard" replace />

  const shouldAnimate = PROTECTED_ROUTES.some((p) => location.pathname.startsWith(p))

  const page = (
    <Routes location={location}>
      <Route path="/" element={<Landing user={user} />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/interview/:sessionId" element={<Interview />} />
      <Route path="/report/:sessionId" element={<Report />} />
    </Routes>
  )

  if (!shouldAnimate) return page

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {page}
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
