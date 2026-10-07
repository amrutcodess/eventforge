import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Organization } from './models/Organization.js';
import { Venue } from './models/Venue.js';
import { Event } from './models/Event.js';
import { TicketCategory } from './models/TicketCategory.js';
import { CouponCode } from './models/CouponCode.js';
import { Registration } from './models/Registration.js';
import { Speaker } from './models/Speaker.js';
import { Session } from './models/Session.js';
import { Attendance } from './models/Attendance.js';
import { SponsorPackage } from './models/SponsorPackage.js';
import { Sponsor } from './models/Sponsor.js';
import { Announcement } from './models/Announcement.js';
import { generateQRCodeDataURI } from './utils/qrGenerator.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    console.log('Clearing existing database collections...');

    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Venue.deleteMany({}),
      Event.deleteMany({}),
      TicketCategory.deleteMany({}),
      CouponCode.deleteMany({}),
      Registration.deleteMany({}),
      Speaker.deleteMany({}),
      Session.deleteMany({}),
      Attendance.deleteMany({}),
      SponsorPackage.deleteMany({}),
      Sponsor.deleteMany({}),
      Announcement.deleteMany({})
    ]);

    console.log('Seeding demo accounts...');
    // Note: passwords are hashed by the User model's pre('save') hook, so the plain
    // value is passed straight through here.
    const admin = await User.create({
      fullName: 'Alexander Vance',
      email: 'admin@eventforge.com',
      passwordHash: 'password123',
      globalRole: 'admin',
      title: 'Platform Administrator',
      company: 'EventForge HQ',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      interests: ['AI', 'Cloud Security', 'Enterprise Architecture']
    });

    const organizer = await User.create({
      fullName: 'Eleanor Vance',
      email: 'organizer@eventforge.com',
      passwordHash: 'password123',
      globalRole: 'user',
      title: 'Director of Global Events',
      company: 'Nexus Enterprise',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
      interests: ['Event Tech', 'Leadership', 'Design Systems']
    });

    const staff = await User.create({
      fullName: 'Marcus Sterling',
      email: 'staff@eventforge.com',
      passwordHash: 'password123',
      globalRole: 'user',
      title: 'On-site Logistics Lead',
      company: 'EventForge Ops',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      interests: ['Operations', 'AV Production']
    });

    const speakerUser = await User.create({
      fullName: 'Dr. Elena Rostova',
      email: 'speaker@eventforge.com',
      passwordHash: 'password123',
      globalRole: 'user',
      title: 'Chief Scientist & VP of AI',
      company: 'Neural Dynamics',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      interests: ['Generative AI', 'Neural Networks', 'Agentic Workflows']
    });

    const attendeeUser = await User.create({
      fullName: 'David K. Miller',
      email: 'attendee@eventforge.com',
      passwordHash: 'password123',
      globalRole: 'user',
      title: 'Senior Software Engineer',
      company: 'Apex Systems',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      interests: ['Cloud Architecture', 'React', 'Generative AI']
    });

    const sponsorUser = await User.create({
      fullName: 'Victoria Brooks',
      email: 'sponsor@eventforge.com',
      passwordHash: 'password123',
      globalRole: 'user',
      title: 'VP of Corporate Partnerships',
      company: 'Synthetix Cloud',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      interests: ['Enterprise Cloud', 'Sponsorship']
    });

    console.log('Seeding organization & venue...');
    const org = await Organization.create({
      name: 'Nexus Enterprise Events',
      slug: 'nexus-enterprise',
      website: 'https://nexus-events.com',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
      ownerId: organizer._id,
      members: [
        { userId: organizer._id, role: 'admin' },
        { userId: staff._id, role: 'member' }
      ]
    });

    const venue = await Venue.create({
      name: 'Metropolitan Tech Convention Center',
      address: '742 Market Street',
      city: 'San Francisco',
      country: 'USA',
      rooms: [
        { name: 'Grand Imperial Ballroom', capacity: 600, layout: 'Theater', equipment: ['4K Projector', 'Stage Lighting', 'Surround Sound'] },
        { name: 'Innovation Hall A', capacity: 250, layout: 'Classroom', equipment: ['Dual Displays', 'Wireless Mics'] },
        { name: 'Workshop Suite B', capacity: 100, layout: 'Banquet', equipment: ['Whiteboards', 'Power Outlets at tables'] },
        { name: 'Executive Boardroom', capacity: 40, layout: 'U-Shape', equipment: ['Video Conference Rig'] }
      ]
    });

    console.log('Seeding Flagship Event...');
    const now = new Date();
    const startDate = new Date(now.getTime() + 14 * 24 * 3600 * 1000); // 2 weeks from now
    const endDate = new Date(startDate.getTime() + 2 * 24 * 3600 * 1000); // 2-day conference

    const event = await Event.create({
      orgId: org._id,
      venueId: venue._id,
      title: 'Global AI & Cloud Architecture Summit 2026',
      slug: 'global-ai-cloud-summit-2026',
      tagline: 'Designing Next-Generation Autonomous Systems & Enterprise Infrastructure',
      description: 'Join over 1,200 senior engineers, CTOs, and technical pioneers for 48 hours of high-impact keynotes, interactive agentic AI masterclasses, and executive networking at San Francisco’s flagship venue.',
      bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=80',
      category: 'conference',
      startDate,
      endDate,
      status: 'published',
      staff: [
        { userId: organizer._id, role: 'organizer' },
        { userId: staff._id, role: 'staff' }
      ],
      themeColor: '#2D4A3E',
      tags: ['AI', 'Cloud Architecture', 'DevOps', 'Generative UI']
    });

    console.log('Seeding ticket categories & coupons...');
    // quantitySold is left at 0 and driven up by the registrations created below, so
    // the analytics endpoints and the ticket counters tell the same story.
    const vipTicket = await TicketCategory.create({
      eventId: event._id,
      name: 'VIP Executive Pass',
      description: 'Full 2-day access + Executive Lounge + Private Speaker Dinner + All Recordings',
      price: 499,
      capacity: 100,
      quantitySold: 0,
      badgeColor: '#D4AF37'
    });

    const generalTicket = await TicketCategory.create({
      eventId: event._id,
      name: 'Main Conference Pass',
      description: 'Access to all keynote sessions, expo hall, break-out tracks, and networking lunch.',
      price: 249,
      capacity: 500,
      quantitySold: 0,
      badgeColor: '#2D4A3E'
    });

    const workshopTicket = await TicketCategory.create({
      eventId: event._id,
      name: 'Hands-on AI Masterclass Pass',
      description: 'Exclusive entry to hands-on coding labs & technical workshops.',
      price: 149,
      capacity: 150,
      quantitySold: 0,
      badgeColor: '#3B82F6'
    });

    await CouponCode.create({
      eventId: event._id,
      code: 'FORGE20',
      discountType: 'percentage',
      discountValue: 20,
      maxUses: 100,
      usedCount: 14,
      active: true
    });

    console.log('Seeding speakers...');
    const speaker1 = await Speaker.create({
      eventId: event._id,
      userId: speakerUser._id,
      name: 'Dr. Elena Rostova',
      title: 'VP of AI Research & Neural Systems',
      company: 'Neural Dynamics',
      bio: 'Pioneer in multimodal foundation models and autonomous agentic workflows with 20+ patents.',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      topicTags: ['AI Architecture', 'LLM Agentic Systems', 'Multimodal Models']
    });

    const speaker2 = await Speaker.create({
      eventId: event._id,
      name: 'Marcus Vance',
      title: 'Chief Cloud Architect',
      company: 'Synthetix Infrastructure',
      bio: 'Leading distributed cloud infrastructure design and multi-region resilience for Fortune 100 brands.',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      topicTags: ['Cloud Architecture', 'Kubernetes', 'Serverless']
    });

    const speaker3 = await Speaker.create({
      eventId: event._id,
      name: 'Sophia Chen',
      title: 'Head of Product Design & Generative UI',
      company: 'Aura Studio',
      bio: 'Award-winning designer merging 3D web interfaces, procedural motion, and responsive generative UI.',
      photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
      topicTags: ['Generative UI', 'Three.js', 'Design Systems']
    });

    console.log('Seeding sessions...');
    const kStart = new Date(startDate.getTime() + 9 * 3600 * 1000); // 9:00 AM
    const kEnd = new Date(startDate.getTime() + 10.5 * 3600 * 1000); // 10:30 AM

    const session1 = await Session.create({
      eventId: event._id,
      title: 'Keynote: The Horizon of Autonomous Agentic Workflows & Neural UI',
      summary: 'An inspiring opening keynote exploring how autonomous AI agents are re-shaping modern software engineering.',
      description: 'Explore the architectural paradigm shift from static dashboards to reactive, self-optimizing user interfaces powered by server-side agentic loops.',
      roomName: 'Grand Imperial Ballroom',
      speakerIds: [speaker1._id, speaker3._id],
      track: 'Keynote',
      startTime: kStart,
      endTime: kEnd,
      capacity: 500,
      resources: [
        { title: 'Keynote Presentation Deck (PDF)', url: 'https://example.com/slides/keynote-2026.pdf', fileType: 'pdf' }
      ]
    });

    const s2Start = new Date(startDate.getTime() + 11 * 3600 * 1000); // 11:00 AM
    const s2End = new Date(startDate.getTime() + 12.5 * 3600 * 1000); // 12:30 PM

    const session2 = await Session.create({
      eventId: event._id,
      title: 'Mastering Multi-Region Resilient Cloud Clusters',
      summary: 'Deep-dive into zero-downtime distributed deployments and high-throughput data replication.',
      description: 'Practical tactics for deploying multi-region Kubernetes clusters across AWS and GCP with instant failover.',
      roomName: 'Innovation Hall A',
      speakerIds: [speaker2._id],
      track: 'Cloud Architecture',
      startTime: s2Start,
      endTime: s2End,
      capacity: 250,
      resources: [
        { title: 'Architecture Blueprint Diagram', url: 'https://example.com/docs/cloud-blueprint.png', fileType: 'image' }
      ]
    });

    const s3Start = new Date(startDate.getTime() + 14 * 3600 * 1000); // 2:00 PM
    const s3End = new Date(startDate.getTime() + 16 * 3600 * 1000); // 4:00 PM

    const session3 = await Session.create({
      eventId: event._id,
      title: 'Hands-on Lab: Building 3D Interactive Web Surfaces with Three.js',
      summary: 'Practical workshop creating premium agency-style 3D canvas hero visuals.',
      description: 'Step-by-step masterclass using Three.js shaders, lighting, and soft depth shadows to craft high-converting landing pages.',
      roomName: 'Workshop Suite B',
      speakerIds: [speaker3._id],
      track: 'Design Systems',
      startTime: s3Start,
      endTime: s3End,
      capacity: 100
    });

    console.log('Seeding sponsors & packages...');
    const platPackage = await SponsorPackage.create({
      eventId: event._id,
      name: 'Titanium Platinum Partner',
      tier: 'platinum',
      price: 15000,
      benefits: ['Keynote stage branding', 'Dedicated 20x20 Booth', '10 VIP Passes', 'Private Workshop Slot'],
      maxSponsors: 2
    });

    const goldPackage = await SponsorPackage.create({
      eventId: event._id,
      name: 'Gold Enterprise Sponsor',
      tier: 'gold',
      price: 8000,
      benefits: ['Expo Hall Booth', '5 Main Passes', 'Brand Logo on Badges'],
      maxSponsors: 5
    });

    const sponsorRecord = await Sponsor.create({
      eventId: event._id,
      packageId: platPackage._id,
      userId: sponsorUser._id,
      organizationName: 'Synthetix Cloud',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
      website: 'https://synthetix.cloud',
      contactPerson: { name: 'Victoria Brooks', email: 'sponsor@eventforge.com' },
      deliverables: [
        { title: 'High-Res Vector Brand Logo', description: 'For stage screens and event lanyard printing', status: 'approved', fileUrl: 'https://synthetix.cloud/logo.svg' },
        { title: '15-second Mainstage Video Reel', description: 'Looping during keynotes intermissions', status: 'submitted', fileUrl: 'https://synthetix.cloud/reel.mp4' },
        { title: 'Booth Layout Sign-off', description: '20x20 feet expo footprint design', status: 'pending' }
      ]
    });

    console.log('Seeding registrations & attendance...');
    const regToken = `EF-REG-${event._id.toString().slice(-4)}-${attendeeUser._id.toString().slice(-4)}-998811`;

    const reg = await Registration.create({
      eventId: event._id,
      attendeeId: attendeeUser._id,
      ticketCategoryId: vipTicket._id,
      orderNumber: 'EF-ORD-889922',
      status: 'confirmed',
      amountPaid: 499,
      couponCode: '',
      qrCodeToken: regToken,
      checkedIn: true,
      checkedInAt: new Date(),
      feedback: { rating: 5, comment: 'Exceptional venue and organization. The keynote was mind-blowing!', submittedAt: new Date() }
    });

    await Attendance.create({
      eventId: event._id,
      sessionId: session1._id,
      attendeeId: attendeeUser._id,
      checkedInAt: new Date(),
      method: 'qr'
    });

    console.log('Seeding announcements...');
    await Announcement.create({
      eventId: event._id,
      title: '🚀 Global AI Summit 2026 Registration is Official Opened!',
      content: 'Welcome delegates! Explore our keynotes, reserve workshop slots, and connect with fellow engineering leaders in San Francisco.',
      targetAudience: 'all',
      priority: 'urgent',
      sentAt: new Date()
    });

    await Announcement.create({
      eventId: event._id,
      title: '📢 Speaker Office Hours & VIP Dinner Details Released',
      content: 'VIP Pass holders can now access the Executive Lounge schedule and reserve seating for the private speaker dinner on Day 1.',
      targetAudience: 'attendees',
      priority: 'normal',
      sentAt: new Date()
    });

    console.log('Seeding additional delegates & registrations...');

    const delegateSeed = [
      { fullName: 'Priya Raman', email: 'priya.raman@apexsystems.com', title: 'Platform Engineer', company: 'Apex Systems', interests: ['Kubernetes', 'Cloud Architecture'] },
      { fullName: 'Tomas Weber', email: 'tomas.weber@nordcloud.io', title: 'Site Reliability Lead', company: 'NordCloud', interests: ['Observability', 'Cloud Architecture'] },
      { fullName: 'Aisha Bello', email: 'aisha.bello@vertexbank.com', title: 'Head of Data Platform', company: 'Vertex Bank', interests: ['Data Engineering', 'Generative AI'] },
      { fullName: 'Kenji Nakamura', email: 'kenji.nakamura@hikari.jp', title: 'Principal Architect', company: 'Hikari Systems', interests: ['Serverless', 'Event-Driven Design'] },
      { fullName: 'Laura Mendez', email: 'laura.mendez@brightpath.es', title: 'Engineering Manager', company: 'BrightPath', interests: ['Leadership', 'DevOps'] },
      { fullName: 'Samuel Osei', email: 'samuel.osei@accraworks.com', title: 'Security Architect', company: 'AccraWorks', interests: ['Cloud Security', 'Zero Trust'] },
      { fullName: 'Hannah Fischer', email: 'hannah.fischer@lumen.de', title: 'ML Engineer', company: 'Lumen AI', interests: ['Generative AI', 'MLOps'] },
      { fullName: 'Diego Alvarez', email: 'diego.alvarez@quanta.mx', title: 'Staff Engineer', company: 'Quanta Labs', interests: ['React', 'Design Systems'] },
      { fullName: 'Mei Lin', email: 'mei.lin@orbital.sg', title: 'Director of Platform', company: 'Orbital', interests: ['Cloud Architecture', 'Scaling'] },
      { fullName: 'Omar Haddad', email: 'omar.haddad@cedar.ae', title: 'Backend Engineer', company: 'Cedar Digital', interests: ['Node.js', 'Databases'] },
      { fullName: 'Freya Larsson', email: 'freya.larsson@northwind.se', title: 'Product Engineer', company: 'Northwind', interests: ['Generative UI', 'Three.js'] }
    ];

    const delegates = await User.create(
      delegateSeed.map((d) => ({ ...d, passwordHash: 'password123' }))
    );

    const daysAgo = (n) => new Date(Date.now() - n * 24 * 3600 * 1000);

    // Ticket mix: attendee@eventforge.com already holds a VIP pass (created above).
    const registrationPlan = [
      { user: delegates[0], ticket: vipTicket, age: 11, checkedIn: true, rating: 5, comment: 'Outstanding keynote. The agentic workflow session alone was worth the trip.' },
      { user: delegates[1], ticket: vipTicket, age: 9, checkedIn: true, rating: 4, comment: 'Great venue and smooth check-in with the QR badge.' },
      { user: delegates[2], ticket: generalTicket, age: 10, checkedIn: true, rating: 5, comment: 'Excellent mix of strategy and hands-on content.' },
      { user: delegates[3], ticket: generalTicket, age: 8, checkedIn: false },
      { user: delegates[4], ticket: generalTicket, age: 7, checkedIn: true, rating: 4, comment: 'Well organised, would attend again.' },
      { user: delegates[5], ticket: generalTicket, age: 6, checkedIn: false },
      { user: delegates[6], ticket: generalTicket, age: 4, checkedIn: false },
      { user: delegates[7], ticket: generalTicket, age: 3, checkedIn: false },
      { user: delegates[8], ticket: workshopTicket, age: 5, checkedIn: true, rating: 5, comment: 'The Three.js lab was fantastic — very practical.' },
      { user: delegates[9], ticket: workshopTicket, age: 2, checkedIn: false },
      { user: delegates[10], ticket: workshopTicket, age: 1, checkedIn: false }
    ];

    let planIndex = 0;
    for (const plan of registrationPlan) {
      planIndex += 1;
      const reg = await Registration.create({
        eventId: event._id,
        attendeeId: plan.user._id,
        ticketCategoryId: plan.ticket._id,
        orderNumber: `EF-ORD-${900000 + planIndex}`,
        status: 'confirmed',
        amountPaid: plan.ticket.price,
        qrCodeToken: `EF-REG-${event._id.toString().slice(-4)}-${plan.user._id.toString().slice(-4)}-${700000 + planIndex}`,
        checkedIn: !!plan.checkedIn,
        checkedInAt: plan.checkedIn ? daysAgo(plan.age - 1) : undefined,
        feedback: plan.rating
          ? { rating: plan.rating, comment: plan.comment, submittedAt: daysAgo(Math.max(0, plan.age - 2)) }
          : undefined
      });

      // Backdate createdAt via the raw driver so Mongoose's timestamps don't override it.
      // This is what gives the "registrations over time" chart a real shape.
      await Registration.collection.updateOne(
        { _id: reg._id },
        { $set: { createdAt: daysAgo(plan.age) } }
      );
    }

    // Keep the ticket counters consistent with the registrations that actually exist.
    const confirmedCountFor = (ticketId) =>
      registrationPlan.filter((p) => p.ticket._id.equals(ticketId)).length;

    await TicketCategory.updateOne({ _id: vipTicket._id }, { quantitySold: confirmedCountFor(vipTicket._id) + 1 }); // +1 for attendee@eventforge.com
    await TicketCategory.updateOne({ _id: generalTicket._id }, { quantitySold: confirmedCountFor(generalTicket._id) });
    await TicketCategory.updateOne({ _id: workshopTicket._id }, { quantitySold: confirmedCountFor(workshopTicket._id) });

    console.log('Seeding a second event to exercise multi-event flows...');

    const showcaseStart = new Date(now.getTime() + 45 * 24 * 3600 * 1000);
    const showcaseEnd = new Date(showcaseStart.getTime() + 1 * 24 * 3600 * 1000);

    const showcaseEvent = await Event.create({
      orgId: org._id,
      venueId: venue._id,
      title: 'Enterprise Platform Engineering Workshop 2026',
      slug: 'enterprise-platform-workshop-2026',
      tagline: 'Hands-on Platform Engineering, Developer Experience & Internal Tooling',
      description: 'A single-day, deeply practical workshop for platform teams building internal developer platforms, golden paths, and self-service infrastructure at enterprise scale.',
      bannerImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1400&q=80',
      category: 'workshop',
      startDate: showcaseStart,
      endDate: showcaseEnd,
      status: 'published',
      staff: [
        { userId: organizer._id, role: 'organizer' },
        { userId: staff._id, role: 'staff' }
      ],
      themeColor: '#2D4A3E',
      tags: ['Platform Engineering', 'DevEx', 'Kubernetes']
    });

    const showcaseTicket = await TicketCategory.create({
      eventId: showcaseEvent._id,
      name: 'Workshop Seat',
      description: 'Full-day hands-on workshop seat, including lab environment and catering.',
      price: 199,
      capacity: 60,
      quantitySold: 0,
      badgeColor: '#2D4A3E'
    });

    await TicketCategory.create({
      eventId: showcaseEvent._id,
      name: 'Team Bundle (4 seats)',
      description: 'Four workshop seats booked together at a discounted team rate.',
      price: 699,
      capacity: 20,
      quantitySold: 0,
      badgeColor: '#D4AF37'
    });

    await CouponCode.create({
      eventId: showcaseEvent._id,
      code: 'PLATFORM10',
      discountType: 'percentage',
      discountValue: 10,
      maxUses: 50,
      usedCount: 3,
      active: true
    });

    const showcaseSpeaker = await Speaker.create({
      eventId: showcaseEvent._id,
      userId: speakerUser._id,
      name: 'Dr. Elena Rostova',
      title: 'VP of AI Research & Neural Systems',
      company: 'Neural Dynamics',
      bio: 'Pioneer in multimodal foundation models and autonomous agentic workflows with 20+ patents.',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      topicTags: ['AI Architecture', 'Platform Tooling']
    });

    await Speaker.create({
      eventId: showcaseEvent._id,
      name: 'Marcus Vance',
      title: 'Chief Cloud Architect',
      company: 'Synthetix Infrastructure',
      bio: 'Leading distributed cloud infrastructure design and multi-region resilience for Fortune 100 brands.',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      topicTags: ['Kubernetes', 'Platform Engineering']
    });

    const showcaseSessionStart = new Date(showcaseStart.getTime() + 9 * 3600 * 1000);
    const showcaseSessionEnd = new Date(showcaseStart.getTime() + 13 * 3600 * 1000);

    await Session.create({
      eventId: showcaseEvent._id,
      title: 'Building Golden Paths for Enterprise Platform Teams',
      summary: 'A hands-on walkthrough of designing paved-road templates that scale across hundreds of teams.',
      description: 'Attendees build a golden-path service template end to end, covering scaffolding, CI policy, and progressive delivery defaults.',
      roomName: 'Workshop Suite B',
      speakerIds: [showcaseSpeaker._id],
      track: 'Platform Engineering',
      startTime: showcaseSessionStart,
      endTime: showcaseSessionEnd,
      capacity: 60
    });

    await Registration.create({
      eventId: showcaseEvent._id,
      attendeeId: attendeeUser._id,
      ticketCategoryId: showcaseTicket._id,
      orderNumber: 'EF-ORD-910001',
      status: 'confirmed',
      amountPaid: 199,
      qrCodeToken: `EF-REG-${showcaseEvent._id.toString().slice(-4)}-${attendeeUser._id.toString().slice(-4)}-660001`,
      checkedIn: false
    });

    await TicketCategory.updateOne({ _id: showcaseTicket._id }, { quantitySold: 1 });

    await Announcement.create({
      eventId: showcaseEvent._id,
      title: '🛠️ Workshop Lab Environments Now Provisioned',
      content: 'Bring a laptop — your cloud lab tenancy and repository scaffolding will be pre-provisioned before the session starts.',
      targetAudience: 'attendees',
      priority: 'normal',
      sentAt: new Date()
    });

    console.log(`
=====================================================
🎉 EVENTFORGE DATABASE SEEDED SUCCESSFULLY!
=====================================================
Demo User Credentials (Password for all: password123):
• Platform Admin:  admin@eventforge.com
• Event Organizer: organizer@eventforge.com
• Event Staff:     staff@eventforge.com
• Speaker:         speaker@eventforge.com
• Attendee:        attendee@eventforge.com
• Sponsor:         sponsor@eventforge.com

Events:
1. "Global AI & Cloud Architecture Summit 2026"  (/events/global-ai-cloud-summit-2026)
   - ${registrationPlan.length + 1} registrations across 3 ticket categories (${registrationPlan.filter((p) => p.checkedIn).length + 1} checked in)
   - ${registrationPlan.filter((p) => p.rating).length + 1} attendee feedback submissions
   - Attached to the organizer & staff rosters so multi-event selectors have two entries
2. "Enterprise Platform Engineering Workshop 2026"
   - Second event, same venue and organization — exercises the event switchers in
     the organizer/staff dashboards and the cross-event analytics aggregations

Also seeded: ${delegates.length} delegate accounts (<name>@<company>.com, same password),
sponsorship packages + deliverables, coupons, announcements, sessions and attendance.
=====================================================
    `);

    process.exit(0);
  } catch (err) {
    console.error('Seed Failed:', err);
    process.exit(1);
  }
};

seedData();
