import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Setup from './pages/Setup'
import Interview from './pages/Interview'
import Report from './pages/Report'

const queryClient = new QueryClient()

// Landing/Auth own large custom layouts already (nav, hero, etc.) —
// fading those in addition to their internal animations would fight
// with them, so only the newer token-based pages get the wrapper.
const ANIMATED_ROUTES = ['/dashboard', '/setup', '/interview', '/report']

function AnimatedRoutes() {
  const location = useLocation()
  const shouldAnimate = ANIMATED_ROUTES.some((p) => location.pathname.startsWith(p))

  const page = (
    <Routes location={location}>
      <Route path="/" element={<Landing />} />
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
