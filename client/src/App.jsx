import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/ui/Navbar';
import { Footer } from './components/ui/Footer';
import { QRScannerModal } from './components/QRScannerModal';

import { Landing } from './pages/Landing';
import { EventDetail } from './pages/EventDetail';
import { TicketPass } from './pages/TicketPass';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DashboardContainer } from './pages/dashboards/DashboardContainer';

export function App() {
  const [globalQRScannerOpen, setGlobalQRScannerOpen] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-forge-bg text-slate-900 font-sans">
          <Navbar onOpenQRScanner={() => setGlobalQRScannerOpen(true)} />
          
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/events/:slug" element={<EventDetail />} />
              <Route path="/ticket-pass/:id" element={<TicketPass />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<DashboardContainer onOpenQRScanner={() => setGlobalQRScannerOpen(true)} />} />
            </Routes>
          </div>

          <Footer />

          {/* Global Staff QR Code Ticket Scanner */}
          <QRScannerModal
            isOpen={globalQRScannerOpen}
            onClose={() => setGlobalQRScannerOpen(false)}
            eventId="global-ai-cloud-summit-2026"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
