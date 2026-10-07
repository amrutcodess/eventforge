import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { OrganizerDashboard } from './OrganizerDashboard';
import { StaffDashboard } from './StaffDashboard';
import { SpeakerDashboard } from './SpeakerDashboard';
import { AttendeeDashboard } from './AttendeeDashboard';
import { SponsorDashboard } from './SponsorDashboard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Shield, Calendar, Users, Mic, Ticket, Award, Layers } from 'lucide-react';
import api from '../../utils/api';

export const DashboardContainer = () => {
  const { user } = useAuth();

  const [roles, setRoles] = useState(null);
  const [activeRoleView, setActiveRoleView] = useState(null);

  useEffect(() => {
    resolveRoles();
  }, []);

  /**
   * A user's workspace access is derived from real data rather than assumed: event
   * membership for organizer/staff, a speaker profile, a sponsorship, or a registration.
   * The API enforces the same rules server-side — this just avoids showing tabs that
   * would only ever return 403.
   */
  const resolveRoles = async () => {
    const [eventsRes, regsRes, speakerRes, sponsorRes] = await Promise.allSettled([
      api.get('/events/manage/all'),
      api.get('/registrations/my-all'),
      api.get('/speakers/me'),
      api.get('/sponsors/me')
    ]);

    const isAdmin = user?.globalRole === 'admin';
    const managedEvents = eventsRes.status === 'fulfilled' ? eventsRes.value.data : [];
    const registrations = regsRes.status === 'fulfilled' ? regsRes.value.data : [];
    const speakerProfiles = speakerRes.status === 'fulfilled' ? speakerRes.value.data?.speakerProfiles || [] : [];
    const sponsorships = sponsorRes.status === 'fulfilled' ? sponsorRes.value.data || [] : [];

    // The API serializes Mongoose documents, so the identifier is `_id` (not `id`).
    // `/events/manage/all` returns every event this user is on the roster for, but each
    // roster also lists *other* users — so the per-user check is still required, otherwise
    // a staff member would also be granted the organizer tab on a shared event.
    const myId = user?._id || user?.id;
    const myStaffRoles = managedEvents.flatMap((evt) =>
      (evt.staff || [])
        .filter((s) => {
          const staffId = s.userId?._id || s.userId;
          return staffId && myId && String(staffId) === String(myId);
        })
        .map((s) => s.role)
    );

    const resolved = {
      admin: isAdmin,
      organizer: isAdmin || myStaffRoles.includes('organizer'),
      staff: isAdmin || myStaffRoles.length > 0,
      speaker: isAdmin || speakerProfiles.length > 0,
      attendee: isAdmin || registrations.length > 0,
      sponsor: isAdmin || sponsorships.length > 0
    };

    setRoles(resolved);

    const order = ['admin', 'organizer', 'staff', 'speaker', 'attendee', 'sponsor'];
    setActiveRoleView(order.find((r) => resolved[r]) || null);
  };

  const roleTabs = [
    { id: 'admin', label: 'Platform Admin', icon: Shield },
    { id: 'organizer', label: 'Event Organizer', icon: Calendar },
    { id: 'staff', label: 'Event Staff (Check-in)', icon: Users },
    { id: 'speaker', label: 'Speaker Portal', icon: Mic },
    { id: 'attendee', label: 'Attendee Pass', icon: Ticket },
    { id: 'sponsor', label: 'Sponsor Workspace', icon: Award }
  ].filter((t) => roles?.[t.id]);

  if (!roles) {
    return (
      <div className="min-h-screen bg-forge-bg flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-forge-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (roleTabs.length === 0) {
    return (
      <div className="min-h-screen bg-forge-bg py-16 px-4">
        <Card className="max-w-xl mx-auto p-12 text-center">
          <Layers className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-slate-900">No Workspace Assigned Yet</h2>
          <p className="text-xs text-slate-500 mt-2">
            Your account is active, but you are not yet registered for an event, assigned to an event
            staff roster, or linked to a speaker or sponsor profile.
          </p>
        </Card>
      </div>
    );
  }

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
              <p className="text-xs text-slate-400">{user?.email} • {user?.company || 'Independent'}</p>
            </div>
          </div>

          {/* Role Navigation Pills — only workspaces this account actually holds */}
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
