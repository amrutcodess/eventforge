import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { User, Clock, FileText, Upload, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SpeakerDashboard = () => {
  const { user } = useAuth();
  const [bio, setBio] = useState(user?.bio || 'Pioneer in multimodal foundation models and autonomous agentic workflows with 20+ patents.');
  const [slidesUploaded, setSlidesUploaded] = useState(false);

  return (
    <div className="space-y-8 font-sans">
      <div>
        <Badge variant="warning">SPEAKER PORTAL SHELL</Badge>
        <h1 className="font-serif text-3xl font-bold text-slate-900 mt-1">Speaker Workstation</h1>
        <p className="text-xs text-slate-500">Manage speaker profile bio, assigned sessions, presentation slides, and room timing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Profile Bio Card */}
        <Card className="md:col-span-5 p-6 border border-slate-200 text-center space-y-4">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'}
            alt={user?.fullName}
            className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-forge-accent shadow-forge-soft"
          />
          <div>
            <h2 className="font-serif text-xl font-bold text-slate-900">{user?.fullName || 'Dr. Elena Rostova'}</h2>
            <p className="text-xs font-semibold text-forge-accent">{user?.title || 'VP of AI Research'}</p>
            <p className="text-xs text-slate-500">{user?.company || 'Neural Dynamics'}</p>
          </div>

          <div className="text-left pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Speaker Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs focus:outline-none focus:border-forge-accent h-24"
            />
            <Button size="sm" variant="primary" className="mt-2 w-full">Save Profile Updates</Button>
          </div>
        </Card>

        {/* Right Assigned Sessions */}
        <div className="md:col-span-7 space-y-6">
          <Card className="p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-slate-900">Assigned Summit Session</h3>
              <Badge variant="accent">KEYNOTE</Badge>
            </div>

            <div className="p-4 rounded-2xl bg-forge-warmGrey/60 border border-slate-200 space-y-2">
              <h4 className="font-serif font-bold text-base text-slate-900">
                Keynote: The Horizon of Autonomous Agentic Workflows & Neural UI
              </h4>
              <p className="text-xs text-slate-600">
                Grand Imperial Ballroom • Day 1 • 9:00 AM – 10:30 AM (90 mins)
              </p>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Presentation Deck (PDF/PPTX)</h4>
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 text-center space-y-2 bg-slate-50">
                <FileText className="w-8 h-8 text-forge-accent mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  {slidesUploaded ? 'keynote-presentation-v2-final.pdf (Uploaded)' : 'Drag and drop your keynote slides file here'}
                </p>
                <Button
                  size="sm"
                  variant={slidesUploaded ? 'ghost' : 'secondary'}
                  onClick={() => setSlidesUploaded(true)}
                  icon={Upload}
                >
                  {slidesUploaded ? 'Update Presentation File' : 'Upload Slides File'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
