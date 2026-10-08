import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AssistantProvider } from './context/AssistantContext';
import { Navbar } from './components/ui/Navbar';
import { Footer } from './components/ui/Footer';
import { SmoothScroll } from './components/motion/SmoothScroll';
import { ScrollToTop } from './components/motion/ScrollToTop';
import { ScrollProgress } from './components/motion/ScrollProgress';
import { PageTransition } from './components/motion/PageTransition';
import { AssistantWidget } from './components/ai/AssistantWidget';

import { Landing } from './pages/Landing';
import { EventDetail } from './pages/EventDetail';
import { TicketPass } from './pages/TicketPass';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Legal } from './pages/Legal';
import { NotFound } from './pages/NotFound';
import { DashboardContainer } from './pages/dashboards/DashboardContainer';

/** Gate for authenticated-only routes; sends anonymous visitors to the login page. */
const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

export function App() {
  return (
    <AuthProvider>
      <AssistantProvider>
        <Router>
          <SmoothScroll />
          <ScrollToTop />
          <ScrollProgress />
          <div className="flex flex-col min-h-screen bg-canvas text-ink font-sans">
            <Navbar />

            <div className="flex-1">
              <PageTransition>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/events/:slug" element={<EventDetail />} />
                  <Route path="/ticket-pass/:id" element={<TicketPass />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/legal" element={<Legal />} />
                  <Route
                    path="/dashboard"
                    element={
                      <RequireAuth>
                        <DashboardContainer />
                      </RequireAuth>
                    }
                  />
                  {/* Catch-all. Without it a mistyped URL rendered the navbar and footer around
                      an empty div, which reads as a broken app rather than a missing page. */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PageTransition>
            </div>

            <Footer />
          </div>

          {/* Inside the router so it can read the active route, and inside AuthProvider so it
              sends the token when there is one — an authenticated visitor gets the higher rate
              tier and, on an event they help run, the unpublished programme too. */}
          <AssistantWidget />
        </Router>
      </AssistantProvider>
    </AuthProvider>
  );
}

export default App;
