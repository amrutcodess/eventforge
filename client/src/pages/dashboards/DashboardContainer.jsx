import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { OrganizerDashboard } from './OrganizerDashboard';
import { StaffDashboard } from './StaffDashboard';
import { SpeakerDashboard } from './SpeakerDashboard';
import { AttendeeDashboard } from './AttendeeDashboard';
import { SponsorDashboard } from './SponsorDashboard';
import { Shield, Calendar, Users, Mic, Ticket, Award } from 'lucide-react';

export const DashboardContainer = ({ onOpenQRScanner }) => {
  const { user } = useAuth();
  
  // Default active role view based on user global role
  const initialRole = user?.globalRole === 'admin' ? 'admin' : 'organizer';
  const [activeRoleView, setActiveRoleView] = useState(initialRole);

  const roleTabs = [
    { id: 'admin', label: 'Platform Admin', icon: Shield, show: user?.globalRole === 'admin' },
    { id: 'organizer', label: 'Event Organizer', icon: Calendar, show: true },
    { id: 'staff', label: 'Event Staff (Check-in)', icon: Users, show: true },
    { id: 'speaker', label: 'Speaker Portal', icon: Mic, show: true },
    { id: 'attendee', label: 'Attendee Pass', icon: Ticket, show: true },
    { id: 'sponsor', label: 'Sponsor Workspace', icon: Award, show: true }
  ].filter(t => t.show);

  return (
    <div className="min-h-screen bg-forge-bg text-slate-900 font-sans pb-24">
      
      {/* ROLE SWITCHER DASHBOARD HEADER BAR */}
      <div className="bg-forge-dark border-b border-forge-darkBorder text-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={user?.fullName}
              className="w-10 h-10 rounded-full border border-forge-accent object-cover"
            />
            <div>
              <h2 className="font-serif text-lg font-bold text-white">{user?.fullName}</h2>
              <p className="text-xs text-slate-400">{user?.email} • {user?.company || 'Nexus Enterprise'}</p>
            </div>
          </div>

          {/* Role Navigation Pills */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-full border border-slate-800 overflow-x-auto">
            {roleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeRoleView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveRoleView(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-forge-accent text-white shadow-forge-glow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* DASHBOARD CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeRoleView === 'admin' && <AdminDashboard />}
        {activeRoleView === 'organizer' && <OrganizerDashboard />}
        {activeRoleView === 'staff' && <StaffDashboard />}
        {activeRoleView === 'speaker' && <SpeakerDashboard />}
        {activeRoleView === 'attendee' && <AttendeeDashboard />}
        {activeRoleView === 'sponsor' && <SponsorDashboard />}
      </main>

    </div>
  );
};
