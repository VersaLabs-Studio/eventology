-- ============================================================================
-- Migration 017: Seed Data
-- Eventology V1 MVP — Phase 1A
-- ============================================================================
-- Comprehensive seed data for development and demo purposes.
-- Includes: 8 categories, 10 organizers, 12 venues, 50+ events,
-- 200+ registrations, tickets, payments, notifications, and more.
-- All data uses realistic Ethiopian names and Addis Ababa locations.
-- ============================================================================

-- ==========================================================================
-- CATEGORIES (8)
-- ==========================================================================

INSERT INTO public.categories (id, name, slug, icon, description, color, event_count, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Tech & Innovation',     'tech',       'Cpu',            'Conferences, hackathons, and tech meetups shaping Ethiopia''s digital future.',   'bg-blue-500',   12, 1),
  ('a1000000-0000-0000-0000-000000000002', 'Business & Networking', 'business',   'Briefcase',      'Professional networking, startup events, and business conferences.',               'bg-primary',    9,  2),
  ('a1000000-0000-0000-0000-000000000003', 'Arts & Culture',        'arts',       'Palette',        'Art exhibitions, cultural festivals, and creative showcases.',                     'bg-purple-500', 7,  3),
  ('a1000000-0000-0000-0000-000000000004', 'Health & Wellness',     'health',     'Heart',          'Yoga retreats, wellness workshops, and health awareness events.',                  'bg-rose-500',   5,  4),
  ('a1000000-0000-0000-0000-000000000005', 'Education & Training',  'education',  'GraduationCap', 'Workshops, training programs, and educational seminars.',                           'bg-amber-500',  8,  5),
  ('a1000000-0000-0000-0000-000000000006', 'Music & Entertainment', 'music',      'Music',          'Live concerts, DJ nights, and music festivals.',                                   'bg-pink-500',   6,  6),
  ('a1000000-0000-0000-0000-000000000007', 'Food & Drink',          'food',       'UtensilsCrossed','Food festivals, wine tastings, and culinary experiences.',                         'bg-orange-500', 4,  7),
  ('a1000000-0000-0000-0000-000000000008', 'Community & Social',    'community',  'Users',          'Community gatherings, volunteer events, and social meetups.',                      'bg-secondary',  5,  8);

-- ==========================================================================
-- PROFILES (15 users)
-- ==========================================================================

INSERT INTO public.profiles (id, full_name, email, phone, avatar_url, role, is_active, bio) VALUES
  -- Organizers (10)
  ('b1000000-0000-0000-0000-000000000001', 'Addis Tech Hub',           'admin@addistechhub.com',       '+251911000001', 'https://randomuser.me/api/portraits/men/1.jpg',  'organizer', true, 'Leading tech community in Addis Ababa fostering innovation and collaboration.'),
  ('b1000000-0000-0000-0000-000000000002', 'Ethiopian Business Forum', 'info@ethbusinessforum.com',     '+251911000002', 'https://randomuser.me/api/portraits/women/2.jpg', 'organizer', true, 'Connecting business leaders and entrepreneurs across Ethiopia.'),
  ('b1000000-0000-0000-0000-000000000003', 'Meskel Cultural Foundation','hello@meskelfoundation.org',   '+251911000003', 'https://randomuser.me/api/portraits/men/3.jpg',  'organizer', true, 'Preserving and promoting Ethiopian cultural heritage through events.'),
  ('b1000000-0000-0000-0000-000000000004', 'Selam Wellness Center',    'contact@selamwellness.com',     '+251911000004', 'https://randomuser.me/api/portraits/women/4.jpg', 'organizer', true, 'Holistic wellness and mindfulness community in Addis Ababa.'),
  ('b1000000-0000-0000-0000-000000000005', 'Habesha Innovators',      'team@habeshainnovators.com',    '+251911000005', 'https://randomuser.me/api/portraits/men/5.jpg',  'organizer', true, 'Empowering the next generation of Ethiopian innovators and creators.'),
  ('b1000000-0000-0000-0000-000000000006', 'Unity Training Institute', 'info@unitytraining.et',         '+251911000006', 'https://randomuser.me/api/portraits/women/6.jpg', 'organizer', true, 'Professional development and capacity building for Ethiopian workforce.'),
  ('b1000000-0000-0000-0000-000000000007', 'Jazzamba Events',         'bookings@jazzamba.com',         '+251911000007', 'https://randomuser.me/api/portraits/men/7.jpg',  'organizer', true, 'Premier live music and entertainment events in Addis Ababa.'),
  ('b1000000-0000-0000-0000-000000000008', 'Green Ethiopia Foundation','info@greenethiopia.org',        '+251911000008', 'https://randomuser.me/api/portraits/women/8.jpg', 'organizer', true, 'Environmental awareness and sustainability events for a greener Ethiopia.'),
  ('b1000000-0000-0000-0000-000000000009', 'Addis Eats Collective',   'hello@addiseats.com',           '+251911000009', 'https://randomuser.me/api/portraits/men/9.jpg',  'organizer', true, 'Celebrating Addis Ababa''s vibrant food scene through curated events.'),
  ('b1000000-0000-0000-0000-000000000010', 'Women in Tech Ethiopia',  'info@womenintech.et',           '+251911000010', 'https://randomuser.me/api/portraits/women/10.jpg','organizer', true, 'Empowering women in technology through mentorship, events, and community.'),
  -- Attendees (3)
  ('b1000000-0000-0000-0000-000000000011', 'Abebe Kebede',            'abebe@email.com',               '+251911000011', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abebe',   'attendee', true, NULL),
  ('b1000000-0000-0000-0000-000000000012', 'Tigist Mulugeta',         'tigist@email.com',              '+251911000012', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tigist',  'attendee', true, NULL),
  ('b1000000-0000-0000-0000-000000000013', 'Dawit Tesfaye',           'dawit@email.com',               '+251911000013', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dawit',   'attendee', true, NULL),
  -- Admins (2)
  ('b1000000-0000-0000-0000-000000000014', 'Kidus Abdula',            'kidus@eventology.com',          '+251911000014', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kidus',   'admin', true, 'Platform administrator.'),
  ('b1000000-0000-0000-0000-000000000015', 'Sara Hailu',              'sara@eventology.com',           '+251911000015', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara',    'admin', true, 'Platform administrator.');

-- ==========================================================================
-- ORGANIZERS (10)
-- ==========================================================================

INSERT INTO public.organizers (id, profile_id, name, slug, email, phone, avatar_url, bio, website, is_verified, verification_status, events_count, total_attendees) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Addis Tech Hub',           'addis-tech-hub',           'admin@addistechhub.com',       '+251911000001', 'https://randomuser.me/api/portraits/men/1.jpg',  'Leading tech community in Addis Ababa fostering innovation and collaboration.',       'https://addistechhub.com',       true, 'verified', 15, 3200),
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'Ethiopian Business Forum', 'ethiopian-business-forum', 'info@ethbusinessforum.com',     '+251911000002', 'https://randomuser.me/api/portraits/women/2.jpg', 'Connecting business leaders and entrepreneurs across Ethiopia.',                       'https://ethbusinessforum.com',    true, 'verified', 12, 2800),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'Meskel Cultural Foundation','meskel-cultural-foundation','hello@meskelfoundation.org',   '+251911000003', 'https://randomuser.me/api/portraits/men/3.jpg',  'Preserving and promoting Ethiopian cultural heritage through events.',                  'https://meskelfoundation.org',    true, 'verified', 8,  1500),
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 'Selam Wellness Center',    'selam-wellness-center',    'contact@selamwellness.com',     '+251911000004', 'https://randomuser.me/api/portraits/women/4.jpg', 'Holistic wellness and mindfulness community in Addis Ababa.',                          'https://selamwellness.com',       false, 'verified', 4,  600),
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005', 'Habesha Innovators',       'habesha-innovators',       'team@habeshainnovators.com',    '+251911000005', 'https://randomuser.me/api/portraits/men/5.jpg',  'Empowering the next generation of Ethiopian innovators and creators.',                  'https://habeshainnovators.com',   true, 'verified', 10, 2100),
  ('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000006', 'Unity Training Institute', 'unity-training-institute', 'info@unitytraining.et',         '+251911000006', 'https://randomuser.me/api/portraits/women/6.jpg', 'Professional development and capacity building for Ethiopian workforce.',               'https://unitytraining.et',        false, 'verified', 6,  900),
  ('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000007', 'Jazzamba Events',          'jazzamba-events',          'bookings@jazzamba.com',         '+251911000007', 'https://randomuser.me/api/portraits/men/7.jpg',  'Premier live music and entertainment events in Addis Ababa.',                          'https://jazzamba.com',            true, 'verified', 9,  1800),
  ('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000008', 'Green Ethiopia Foundation', 'green-ethiopia-foundation','info@greenethiopia.org',        '+251911000008', 'https://randomuser.me/api/portraits/women/8.jpg', 'Environmental awareness and sustainability events for a greener Ethiopia.',             'https://greenethiopia.org',       false, 'pending',  3,  450),
  ('c1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000009', 'Addis Eats Collective',    'addis-eats-collective',    'hello@addiseats.com',           '+251911000009', 'https://randomuser.me/api/portraits/men/9.jpg',  'Celebrating Addis Ababa''s vibrant food scene through curated events.',                 'https://addiseats.com',           false, 'pending',  5,  750),
  ('c1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000010', 'Women in Tech Ethiopia',   'women-in-tech-ethiopia',   'info@womenintech.et',           '+251911000010', 'https://randomuser.me/api/portraits/women/10.jpg','Empowering women in technology through mentorship, events, and community.',             'https://womenintech.et',          true, 'verified', 7,  1400);

-- ==========================================================================
-- VENUES (12)
-- ==========================================================================

INSERT INTO public.venues (id, name, slug, address, sub_city, latitude, longitude, capacity, description) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Millennium Hall',     'millennium-hall',     'Bole Road, Near Bole International Airport', 'Bole',          9.0122, 38.7653, 2000, 'Premier conference and event venue in the heart of Bole.'),
  ('d1000000-0000-0000-0000-000000000002', 'Sheraton Addis',      'sheraton-addis',      'Taitu Street, Arada District',              'Arada',         9.0350, 38.7468, 500,  'Luxury hotel with world-class event facilities.'),
  ('d1000000-0000-0000-0000-000000000003', 'Hyatt Regency',       'hyatt-regency',       'Meskel Square Area',                         'Kirkos',        9.0110, 38.7580, 800,  'Modern hotel with versatile event spaces.'),
  ('d1000000-0000-0000-0000-000000000004', 'Ice Addis',           'ice-addis',           'Bole Road',                                  'Bole',          9.0180, 38.7620, 300,  'Innovation and coworking space with event facilities.'),
  ('d1000000-0000-0000-0000-000000000005', 'Jazzamba Lounge',     'jazzamba-lounge',     'Bole Medhanealem Area',                      'Bole',          9.0200, 38.7600, 200,  'Iconic jazz and live music venue in Addis Ababa.'),
  ('d1000000-0000-0000-0000-000000000006', 'Skylight Hotel',      'skylight-hotel',      'Bole Sub-City',                              'Bole',          9.0150, 38.7680, 600,  'Elegant hotel venue for corporate events and galas.'),
  ('d1000000-0000-0000-0000-000000000007', 'Hilton Addis',        'hilton-addis',        'Menelik II Avenue',                          'Kirkos',        9.0200, 38.7520, 1000, 'Historic hotel with grand ballroom and conference facilities.'),
  ('d1000000-0000-0000-0000-000000000008', 'National Theatre',    'national-theatre',    'Churchill Avenue',                           'Arada',         9.0300, 38.7500, 400,  'Historic theatre for performances and cultural events.'),
  ('d1000000-0000-0000-0000-000000000009', 'Radisson Blu',        'radisson-blu',        'Kazanchis Area',                             'Kirkos',        9.0160, 38.7560, 500,  'International standard hotel with modern event spaces.'),
  ('d1000000-0000-0000-0000-000000000010', 'Tomoca Heritage',     'tomoca-heritage',     'Piazza District',                            'Arada',         9.0350, 38.7480, 100,  'Heritage coffee house with intimate event space.'),
  ('d1000000-0000-0000-0000-000000000011', 'Friendship Park',     'friendship-park',     'Bole Road, Near Edna Mall',                  'Bole',          9.0170, 38.7640, 1500, 'Open-air park venue for festivals and community events.'),
  ('d1000000-0000-0000-0000-000000000012', 'UNECA Conference Center','uneca-conference-center','Africa Avenue','Kirkos',                 9.0180, 38.7540, 1200, 'United Nations conference center with state-of-the-art facilities.');

-- ==========================================================================
-- EVENTS (55 events — 5 featured, 45 approved, 5 pending/draft)
-- ==========================================================================

INSERT INTO public.events (id, organizer_id, category_id, venue_id, title, slug, description, short_description, event_type, ticket_type, tags, start_date, end_date, venue_name, venue_address, sub_city, latitude, longitude, status, is_featured, capacity, registrations_count, views_count) VALUES
  -- Featured Events (5)
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
   'Addis Tech Summit 2026', 'addis-tech-summit-2026',
   '<p>The largest technology conference in East Africa returns to Addis Ababa. Join 2,000+ developers, entrepreneurs, and tech leaders for three days of keynotes, workshops, and networking.</p><p>Featured speakers from Google, Meta, and leading African tech companies. Topics include AI/ML, cloud computing, fintech, and developer tools.</p><p>Whether you are a seasoned engineer or just starting your tech journey, there is something for everyone at Addis Tech Summit 2026.</p>',
   'East Africa''s largest tech conference returns with 2,000+ attendees, world-class speakers, and hands-on workshops.',
   'conference', 'paid', ARRAY['technology', 'conference', 'AI', 'fintech', 'networking'],
   '2026-06-15 09:00:00+03', '2026-06-17 18:00:00+03',
   'Millennium Hall', 'Bole Road, Near Bole International Airport', 'Bole', 9.0122, 38.7653,
   'approved', true, 2000, 847, 4521),
  ('e1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000010',
   'Ethiopian Coffee Masterclass', 'ethiopian-coffee-masterclass',
   '<p>Experience the art of Ethiopian coffee from bean to cup. This intimate workshop takes you through the entire journey of Ethiopian coffee from the highlands of Sidamo to your morning cup.</p><p>Led by award-winning barista Tadesse Lemma, you will learn traditional jebena brewing, modern pour-over techniques, and the science behind perfect extraction.</p><p>Includes tasting of 5 single-origin Ethiopian coffees and a take-home brewing guide.</p>',
   'Master the art of Ethiopian coffee with award-winning barista Tadesse Lemma in an intimate workshop setting.',
   'workshop', 'paid', ARRAY['coffee', 'workshop', 'Ethiopian culture', 'tasting'],
   '2026-06-08 14:00:00+03', '2026-06-08 18:00:00+03',
   'Tomoca Heritage', 'Piazza District', 'Arada', 9.0350, 38.7480,
   'approved', true, 50, 48, 1234),
  ('e1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000004',
   'Startup Pitch Night: Bole', 'startup-pitch-night-bole',
   '<p>Watch 10 of Addis Ababa''s most promising startups pitch to a panel of investors and industry leaders. From fintech to agritech, these founders are building the future of Ethiopia.</p><p>Network with fellow entrepreneurs, investors, and tech enthusiasts. Free drinks and appetizers provided.</p>',
   'Watch 10 promising startups pitch to investors. Network with founders and tech leaders over free drinks.',
   'networking', 'free', ARRAY['startup', 'pitch', 'networking', 'investors', 'entrepreneurship'],
   '2026-06-20 18:00:00+03', '2026-06-20 21:00:00+03',
   'Ice Addis', 'Bole Road', 'Bole', 9.0180, 38.7620,
   'approved', true, 150, 123, 2345),
  ('e1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', NULL,
   'Meskel Square Art Walk', 'meskel-square-art-walk',
   '<p>Join us for a guided walking tour of Addis Ababa''s vibrant street art scene. Starting at Meskel Square, we will explore murals, galleries, and hidden artistic gems throughout the city center.</p><p>Local artists will share the stories behind their work, and you will have the chance to meet creators and purchase original pieces.</p>',
   'Explore Addis Ababa''s vibrant street art scene with guided tours, artist meetups, and original art for sale.',
   'exhibition', 'free', ARRAY['art', 'walking tour', 'culture', 'street art', 'gallery'],
   '2026-06-12 10:00:00+03', '2026-06-12 16:00:00+03',
   'Meskel Square', 'Meskel Square', 'Lideta', 9.0100, 38.7550,
   'approved', true, 200, 156, 1876),
  ('e1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000003',
   'Women in Tech Addis', 'women-in-tech-addis',
   '<p>A celebration of women in technology featuring talks, workshops, and mentoring sessions. Join us for an inspiring day of learning, networking, and empowerment.</p><p>Hear from successful women leaders in Ethiopian tech, participate in hands-on coding workshops, and connect with mentors who can help accelerate your career.</p>',
   'Celebrate women in tech with inspiring talks, hands-on workshops, and mentorship opportunities.',
   'meetup', 'free', ARRAY['women in tech', 'diversity', 'mentorship', 'networking', 'empowerment'],
   '2026-06-25 09:00:00+03', '2026-06-25 17:00:00+03',
   'Hyatt Regency', 'Meskel Square Area', 'Kirkos', 9.0110, 38.7580,
   'approved', true, 300, 234, 3456),
  -- Tech Events (7)
  ('e1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004',
   'Cloud Computing Bootcamp', 'cloud-computing-bootcamp',
   '<p>Intensive 2-day bootcamp covering AWS, Azure, and GCP fundamentals. Hands-on labs with real cloud infrastructure.</p><p>Perfect for developers looking to add cloud skills to their toolkit. Certificate provided upon completion.</p>',
   'Intensive 2-day cloud computing bootcamp with hands-on labs and certification.',
   'training', 'paid', ARRAY['cloud', 'AWS', 'training', 'certification'],
   '2026-06-28 09:00:00+03', '2026-06-29 17:00:00+03',
   'Ice Addis', 'Bole Road', 'Bole', 9.0180, 38.7620,
   'approved', false, 60, 45, 876),
  ('e1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000006',
   'AI & Machine Learning Conference', 'ai-machine-learning-conference',
   '<p>Explore the frontiers of artificial intelligence and machine learning. From natural language processing to computer vision, this conference covers the latest breakthroughs.</p><p>Featuring researchers from Ethiopian universities and international tech companies.</p>',
   'Explore AI/ML frontiers with researchers from Ethiopian universities and global tech companies.',
   'conference', 'paid', ARRAY['AI', 'machine learning', 'conference', 'research'],
   '2026-07-08 09:00:00+03', '2026-07-08 18:00:00+03',
   'Skylight Hotel', 'Bole Sub-City', 'Bole', 9.0150, 38.7680,
   'approved', false, 400, 287, 2134),
  ('e1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004',
   'React & Next.js Workshop', 'react-nextjs-workshop',
   '<p>Build a full-stack application with React and Next.js in this hands-on workshop. Learn server components, API routes, and deployment best practices.</p><p>Bring your laptop we will code together from scratch.</p>',
   'Hands-on workshop building a full-stack app with React and Next.js.',
   'training', 'paid', ARRAY['React', 'Next.js', 'workshop', 'full-stack'],
   '2026-07-01 09:00:00+03', '2026-07-01 17:00:00+03',
   'Ice Addis', 'Bole Road', 'Bole', 9.0180, 38.7620,
   'approved', false, 40, 32, 654),
  ('e1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000009',
   'Fintech Innovation Day', 'fintech-innovation-day',
   '<p>Discover how fintech is transforming Ethiopia''s financial landscape. From mobile money to digital banking, learn from the innovators driving change.</p>',
   'Explore how fintech is transforming Ethiopia with panels, showcases, and networking.',
   'seminar', 'paid', ARRAY['fintech', 'finance', 'innovation', 'mobile money'],
   '2026-07-15 09:00:00+03', '2026-07-15 17:00:00+03',
   'Radisson Blu', 'Kazanchis Area', 'Kirkos', 9.0160, 38.7560,
   'approved', false, 250, 178, 1567),
  ('e1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002',
   'Blockchain & Finance Forum', 'blockchain-finance-forum',
   '<p>Understanding blockchain technology and its applications in finance. Expert speakers discuss cryptocurrency, DeFi, and the future of digital assets in Ethiopia.</p>',
   'Expert speakers on blockchain, cryptocurrency, and DeFi in the Ethiopian context.',
   'seminar', 'paid', ARRAY['blockchain', 'crypto', 'DeFi', 'finance'],
   '2026-07-03 09:00:00+03', '2026-07-03 17:00:00+03',
   'Sheraton Addis', 'Taitu Street, Arada District', 'Arada', 9.0350, 38.7468,
   'approved', false, 200, 145, 987),
  ('e1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
   'DevOps & Infrastructure Summit', 'devops-infrastructure-summit',
   '<p>Learn about CI/CD pipelines, containerization, and infrastructure as code. Hands-on sessions with Docker, Kubernetes, and Terraform.</p>',
   'Hands-on DevOps training with Docker, Kubernetes, and Terraform.',
   'conference', 'paid', ARRAY['DevOps', 'Docker', 'Kubernetes', 'infrastructure'],
   '2026-07-22 09:00:00+03', '2026-07-22 17:00:00+03',
   'Millennium Hall', 'Bole Road, Near Bole International Airport', 'Bole', 9.0122, 38.7653,
   'approved', false, 300, 167, 1234),
  ('e1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004',
   'Girls Who Code: Intro to Python', 'girls-who-code-python',
   '<p>Free introductory Python workshop for girls and women. No prior experience needed. Laptops provided.</p><p>Learn programming fundamentals in a supportive, inclusive environment.</p>',
   'Free Python workshop for women. No experience needed. Laptops provided.',
   'workshop', 'free', ARRAY['Python', 'women in tech', 'beginner', 'coding'],
   '2026-06-28 10:00:00+03', '2026-06-28 16:00:00+03',
   'Ice Addis', 'Bole Road', 'Bole', 9.0180, 38.7620,
   'approved', false, 30, 28, 432),
  -- Business Events (7)
  ('e1000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000007',
   'Sustainable Business Summit', 'sustainable-business-summit',
   '<p>How Ethiopian businesses can embrace sustainability while remaining competitive. Case studies, panel discussions, and actionable strategies.</p>',
   'Learn how Ethiopian businesses can embrace sustainability and remain competitive.',
   'conference', 'paid', ARRAY['sustainability', 'business', 'ESG', 'green business'],
   '2026-07-12 09:00:00+03', '2026-07-12 17:00:00+03',
   'Hilton Addis', 'Menelik II Avenue', 'Kirkos', 9.0200, 38.7520,
   'approved', false, 300, 189, 1456),
  ('e1000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000004',
   'Networking Brunch for Founders', 'networking-brunch-founders',
   '<p>Casual networking brunch for startup founders and entrepreneurs. Great food, great conversations, great connections.</p>',
   'Casual networking brunch for startup founders with great food and conversations.',
   'networking', 'paid', ARRAY['networking', 'founders', 'brunch', 'startup'],
   '2026-06-16 10:00:00+03', '2026-06-16 13:00:00+03',
   'Ice Addis', 'Bole Road', 'Bole', 9.0180, 38.7620,
   'approved', false, 40, 35, 567),
  ('e1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002',
   'Startup Legal Clinic', 'startup-legal-clinic',
   '<p>Free legal consultation for startups. Get advice on company registration, IP protection, contracts, and regulatory compliance.</p>',
   'Free legal consultation for startups on registration, IP, contracts, and compliance.',
   'seminar', 'free', ARRAY['legal', 'startup', 'consultation', 'business law'],
   '2026-07-02 09:00:00+03', '2026-07-02 17:00:00+03',
   'Sheraton Addis', 'Taitu Street, Arada District', 'Arada', 9.0350, 38.7468,
   'approved', false, 50, 42, 345),
  ('e1000000-0000-0000-0000-000000000016', 'c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000007',
   'Digital Marketing Masterclass', 'digital-marketing-masterclass',
   '<p>Master social media marketing, SEO, and content strategy for Ethiopian businesses. Practical examples and case studies from local brands.</p>',
   'Master digital marketing with practical Ethiopian case studies and strategies.',
   'workshop', 'paid', ARRAY['marketing', 'digital', 'SEO', 'social media'],
   '2026-06-30 09:00:00+03', '2026-06-30 17:00:00+03',
   'Hilton Addis', 'Menelik II Avenue', 'Kirkos', 9.0200, 38.7520,
   'approved', false, 80, 67, 876),
  ('e1000000-0000-0000-0000-000000000017', 'c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000006',
   'Investment Readiness Workshop', 'investment-readiness-workshop',
   '<p>Prepare your startup for investment. Learn about term sheets, valuations, pitch decks, and investor relations.</p>',
   'Prepare your startup for investment with expert guidance on term sheets and pitch decks.',
   'workshop', 'paid', ARRAY['investment', 'startup', 'fundraising', 'pitch deck'],
   '2026-07-18 09:00:00+03', '2026-07-18 17:00:00+03',
   'Skylight Hotel', 'Bole Sub-City', 'Bole', 9.0150, 38.7680,
   'approved', false, 40, 28, 543),
  ('e1000000-0000-0000-0000-000000000018', 'c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003',
   'Ethiopian Diaspora Business Forum', 'diaspora-business-forum',
   '<p>Connecting Ethiopian diaspora investors with local business opportunities. Panel discussions, networking, and project showcases.</p>',
   'Connect diaspora investors with local business opportunities and project showcases.',
   'conference', 'free', ARRAY['diaspora', 'investment', 'networking', 'business'],
   '2026-07-25 09:00:00+03', '2026-07-25 17:00:00+03',
   'Hyatt Regency', 'Meskel Square Area', 'Kirkos', 9.0110, 38.7580,
   'approved', false, 200, 134, 1098),
  ('e1000000-0000-0000-0000-000000000019', 'c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000009',
   'Real Estate Investment Forum', 'real-estate-investment-forum',
   '<p>Explore real estate opportunities in Addis Ababa. Market analysis, investment strategies, and networking with developers and investors.</p>',
   'Explore real estate opportunities with market analysis and investor networking.',
   'conference', 'paid', ARRAY['real estate', 'investment', 'property', 'development'],
   '2026-08-05 09:00:00+03', '2026-08-05 17:00:00+03',
   'Radisson Blu', 'Kazanchis Area', 'Kirkos', 9.0160, 38.7560,
   'approved', false, 150, 89, 765),
  -- Arts & Culture Events (6)
  ('e1000000-0000-0000-0000-000000000020', 'c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000008',
   'Ethiopian Film Festival 2026', 'ethiopian-film-festival-2026',
   '<p>Celebrate Ethiopian cinema with screenings of the best local films, documentaries, and short films. Q&A sessions with filmmakers included.</p>',
   'Celebrate Ethiopian cinema with screenings, documentaries, and filmmaker Q&A sessions.',
   'exhibition', 'paid', ARRAY['film', 'cinema', 'culture', 'festival', 'Ethiopian'],
   '2026-07-10 14:00:00+03', '2026-07-12 22:00:00+03',
   'National Theatre', 'Churchill Avenue', 'Arada', 9.0300, 38.7500,
   'approved', false, 400, 287, 2345),
  ('e1000000-0000-0000-0000-000000000021', 'c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', NULL,
   'Photography Walk: Old Addis', 'photography-walk-old-addis',
   '<p>Explore the historic neighborhoods of Addis Ababa through your lens. Guided photography walk through Piazza, Mercato, and surrounding areas.</p>',
   'Guided photography walk through historic Addis Ababa neighborhoods.',
   'meetup', 'free', ARRAY['photography', 'walking tour', 'culture', 'history'],
   '2026-06-10 08:00:00+03', '2026-06-10 12:00:00+03',
   'Piazza District', 'Piazza', 'Arada', 9.0350, 38.7480,
   'approved', false, 30, 25, 432),
  ('e1000000-0000-0000-0000-000000000022', 'c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000008',
   'Poetry Open Mic Night', 'poetry-open-mic-night',
   '<p>An evening of spoken word and poetry. Open mic for all poets share your work or just enjoy the performances.</p>',
   'Evening of spoken word and poetry with open mic performances.',
   'concert', 'free', ARRAY['poetry', 'open mic', 'spoken word', 'culture'],
   '2026-06-21 18:00:00+03', '2026-06-21 21:00:00+03',
   'National Theatre', 'Churchill Avenue', 'Arada', 9.0300, 38.7500,
   'approved', false, 100, 78, 567),
  ('e1000000-0000-0000-0000-000000000023', 'c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000011',
   'Contemporary Art Exhibition', 'contemporary-art-exhibition',
   '<p>Featuring works by emerging Ethiopian contemporary artists. Mixed media, installations, and digital art.</p>',
   'Emerging Ethiopian contemporary artists showcase mixed media and digital art.',
   'exhibition', 'free', ARRAY['art', 'contemporary', 'exhibition', 'gallery'],
   '2026-07-20 10:00:00+03', '2026-07-27 18:00:00+03',
   'Friendship Park', 'Bole Road, Near Edna Mall', 'Bole', 9.0170, 38.7640,
   'approved', false, 500, 234, 1234),
  ('e1000000-0000-0000-0000-000000000024', 'c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000008',
   'Traditional Dance Performance', 'traditional-dance-performance',
   '<p>Experience the beauty of Ethiopian traditional dance. Performances by renowned dance troupes from across the country.</p>',
   'Experience Ethiopian traditional dance performances by renowned troupes.',
   'concert', 'paid', ARRAY['dance', 'traditional', 'culture', 'performance'],
   '2026-07-05 18:00:00+03', '2026-07-05 21:00:00+03',
   'National Theatre', 'Churchill Avenue', 'Arada', 9.0300, 38.7500,
   'approved', false, 400, 312, 1876),
  ('e1000000-0000-0000-0000-000000000025', 'c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001',
   'Addis Design Week', 'addis-design-week',
   '<p>A week-long celebration of design in all its forms graphic design, product design, architecture, and fashion. Workshops, exhibitions, and talks.</p>',
   'Week-long celebration of design with workshops, exhibitions, and talks.',
   'exhibition', 'paid', ARRAY['design', 'architecture', 'fashion', 'creative'],
   '2026-08-10 09:00:00+03', '2026-08-14 18:00:00+03',
   'Millennium Hall', 'Bole Road, Near Bole International Airport', 'Bole', 9.0122, 38.7653,
   'approved', false, 1000, 456, 2345),
  -- Health & Wellness Events (5)
  ('e1000000-0000-0000-0000-000000000026', 'c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', NULL,
   'Addis Yoga & Meditation Retreat', 'addis-yoga-meditation-retreat',
   '<p>A day of yoga, meditation, and mindfulness in the beautiful Yeka Hills. Suitable for all levels. Includes lunch and refreshments.</p>',
   'Day of yoga and meditation in Yeka Hills. All levels welcome. Lunch included.',
   'workshop', 'paid', ARRAY['yoga', 'meditation', 'wellness', 'mindfulness'],
   '2026-06-22 07:00:00+03', '2026-06-22 16:00:00+03',
   'Yeka Hills Resort', 'Yeka Sub-City', 'Yeka', 9.0300, 38.7800,
   'approved', false, 50, 43, 654),
  ('e1000000-0000-0000-0000-000000000027', 'c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000008',
   'Traditional Medicine Workshop', 'traditional-medicine-workshop',
   '<p>Learn about traditional Ethiopian medicine and herbal remedies. Workshop led by experienced practitioners.</p>',
   'Learn about traditional Ethiopian medicine and herbal remedies.',
   'workshop', 'free', ARRAY['traditional medicine', 'herbal', 'wellness', 'Ethiopian'],
   '2026-06-26 09:00:00+03', '2026-06-26 13:00:00+03',
   'Arada Heritage', 'Arada District', 'Arada', 9.0320, 38.7490,
   'approved', false, 40, 32, 345),
  ('e1000000-0000-0000-0000-000000000028', 'c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000011',
   'Mental Health Awareness Walk', 'mental-health-awareness-walk',
   '<p>Join us for a community walk to raise awareness about mental health. Free t-shirts for the first 100 participants.</p>',
   'Community walk raising mental health awareness. Free t-shirts for first 100.',
   'meetup', 'free', ARRAY['mental health', 'awareness', 'community', 'wellness'],
   '2026-06-13 07:00:00+03', '2026-06-13 10:00:00+03',
   'Unity Park', 'Unity Park', 'Kirkos', 9.0150, 38.7550,
   'approved', false, 200, 156, 876),
  ('e1000000-0000-0000-0000-000000000029', 'c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000011',
   'Addis Marathon Prep Run', 'addis-marathon-prep-run',
   '<p>Training run for the upcoming Addis Ababa Marathon. 10K route through Bole. All fitness levels welcome.</p>',
   'Training run for Addis Marathon. 10K through Bole. All levels welcome.',
   'meetup', 'free', ARRAY['running', 'marathon', 'fitness', 'training'],
   '2026-06-09 06:00:00+03', '2026-06-09 08:00:00+03',
   'Bole Atlas', 'Bole Sub-City', 'Bole', 9.0180, 38.7650,
   'approved', false, 100, 87, 543),
  ('e1000000-0000-0000-0000-000000000030', 'c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000006',
   'Nutrition & Healthy Eating Workshop', 'nutrition-healthy-eating',
   '<p>Learn about balanced nutrition and healthy Ethiopian recipes. Cooking demonstration included.</p>',
   'Learn balanced nutrition and healthy Ethiopian recipes with cooking demos.',
   'workshop', 'paid', ARRAY['nutrition', 'healthy eating', 'cooking', 'wellness'],
   '2026-07-19 10:00:00+03', '2026-07-19 14:00:00+03',
   'Skylight Hotel', 'Bole Sub-City', 'Bole', 9.0150, 38.7680,
   'approved', false, 30, 22, 321),
  -- Education & Training Events (6)
  ('e1000000-0000-0000-0000-000000000031', 'c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000012',
   'Youth Entrepreneurship Workshop', 'youth-entrepreneurship-workshop',
   '<p>Empowering young Ethiopians with entrepreneurship skills. Business plan development, financial literacy, and pitching practice.</p>',
   'Empowering youth with entrepreneurship skills and business planning.',
   'training', 'free', ARRAY['youth', 'entrepreneurship', 'business', 'training'],
   '2026-06-18 09:00:00+03', '2026-06-18 17:00:00+03',
   'UNECA Conference Center', 'Africa Avenue', 'Kirkos', 9.0180, 38.7540,
   'approved', false, 100, 87, 654),
  ('e1000000-0000-0000-0000-000000000032', 'c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000004',
   'Kids Coding Camp', 'kids-coding-camp',
   '<p>Fun coding camp for kids aged 8-14. Learn Scratch, build games, and create animations. No prior experience needed.</p>',
   'Fun coding camp for kids 8-14. Learn Scratch and build games.',
   'training', 'paid', ARRAY['kids', 'coding', 'Scratch', 'education'],
   '2026-07-07 09:00:00+03', '2026-07-11 15:00:00+03',
   'Ice Addis', 'Bole Road', 'Bole', 9.0180, 38.7620,
   'approved', false, 30, 28, 432),
  ('e1000000-0000-0000-0000-000000000033', 'c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000012',
   'Public Speaking Masterclass', 'public-speaking-masterclass',
   '<p>Overcome your fear of public speaking. Learn techniques for confident presentations, storytelling, and audience engagement.</p>',
   'Overcome public speaking fear with confidence techniques and storytelling.',
   'workshop', 'paid', ARRAY['public speaking', 'presentation', 'communication', 'confidence'],
   '2026-07-14 09:00:00+03', '2026-07-14 17:00:00+03',
   'UNECA Conference Center', 'Africa Avenue', 'Kirkos', 9.0180, 38.7540,
   'approved', false, 40, 34, 567),
  ('e1000000-0000-0000-0000-000000000034', 'c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000006',
   'Data Science Bootcamp', 'data-science-bootcamp',
   '<p>5-day intensive bootcamp covering Python, data analysis, visualization, and machine learning basics. Certificate provided.</p>',
   '5-day intensive data science bootcamp with Python and ML basics.',
   'training', 'paid', ARRAY['data science', 'Python', 'machine learning', 'bootcamp'],
   '2026-08-03 09:00:00+03', '2026-08-07 17:00:00+03',
   'Skylight Hotel', 'Bole Sub-City', 'Bole', 9.0150, 38.7680,
   'approved', false, 50, 34, 876),
  ('e1000000-0000-0000-0000-000000000035', 'c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000012',
   'Leadership Development Program', 'leadership-development-program',
   '<p>3-day leadership program for mid-career professionals. Executive coaching, team dynamics, and strategic thinking.</p>',
   '3-day leadership program for mid-career professionals with executive coaching.',
   'training', 'paid', ARRAY['leadership', 'management', 'professional development'],
   '2026-07-28 09:00:00+03', '2026-07-30 17:00:00+03',
   'UNECA Conference Center', 'Africa Avenue', 'Kirkos', 9.0180, 38.7540,
   'approved', false, 30, 22, 432),
  ('e1000000-0000-0000-0000-000000000036', 'c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000004',
   'Graphic Design Fundamentals', 'graphic-design-fundamentals',
   '<p>Learn the basics of graphic design using Canva and Figma. Create professional designs for social media, presentations, and more.</p>',
   'Learn graphic design basics with Canva and Figma for professional designs.',
   'workshop', 'paid', ARRAY['graphic design', 'Canva', 'Figma', 'creative'],
   '2026-07-21 09:00:00+03', '2026-07-21 17:00:00+03',
   'Ice Addis', 'Bole Road', 'Bole', 9.0180, 38.7620,
   'approved', false, 25, 20, 321),
  -- Music & Entertainment Events (5)
  ('e1000000-0000-0000-0000-000000000037', 'c1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000005',
   'Jazz Night at Jazzamba', 'jazz-night-jazzamba',
   '<p>An evening of live jazz featuring local and international musicians. Full bar and dinner menu available.</p>',
   'Live jazz night with local and international musicians. Full bar available.',
   'concert', 'paid', ARRAY['jazz', 'live music', 'nightlife', 'entertainment'],
   '2026-06-05 19:00:00+03', '2026-06-05 23:00:00+03',
   'Jazzamba Lounge', 'Bole Medhanealem Area', 'Bole', 9.0200, 38.7600,
   'approved', false, 200, 178, 2345),
  ('e1000000-0000-0000-0000-000000000038', 'c1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000005',
   'Afrobeats Night Live', 'afrobeats-night-live',
   '<p>Dance the night away with the best Afrobeats DJs and live performers. Special guest artist from Lagos.</p>',
   'Dance to Afrobeats with top DJs and a special guest from Lagos.',
   'concert', 'paid', ARRAY['Afrobeats', 'dance', 'nightlife', 'DJ'],
   '2026-06-19 20:00:00+03', '2026-06-20 02:00:00+03',
   'Jazzamba Lounge', 'Bole Medhanealem Area', 'Bole', 9.0200, 38.7600,
   'approved', false, 250, 210, 3456),
  ('e1000000-0000-0000-0000-000000000039', 'c1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000004',
   'DJ Workshop & Beatmaking', 'dj-workshop-beatmaking',
   '<p>Learn DJ skills and beatmaking from professional DJs. Hands-on with CDJs, mixers, and production software.</p>',
   'Learn DJ skills and beatmaking from professional DJs with hands-on practice.',
   'workshop', 'paid', ARRAY['DJ', 'beatmaking', 'music production', 'workshop'],
   '2026-06-24 14:00:00+03', '2026-06-24 20:00:00+03',
   'Ice Addis', 'Bole Road', 'Bole', 9.0180, 38.7620,
   'approved', false, 20, 18, 432),
  ('e1000000-0000-0000-0000-000000000040', 'c1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000011',
   'Addis Music Festival', 'addis-music-festival',
   '<p>Multi-day outdoor music festival featuring Ethiopian and African artists. Food vendors, art installations, and family-friendly activities.</p>',
   'Outdoor music festival with Ethiopian and African artists, food, and art.',
   'concert', 'paid', ARRAY['music festival', 'outdoor', 'live music', 'family'],
   '2026-08-15 12:00:00+03', '2026-08-17 23:00:00+03',
   'Friendship Park', 'Bole Road, Near Edna Mall', 'Bole', 9.0170, 38.7640,
   'approved', false, 2000, 876, 4567),
  ('e1000000-0000-0000-0000-000000000041', 'c1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000005',
   'Acoustic Sessions', 'acoustic-sessions',
   '<p>Intimate acoustic performances by singer-songwriters. Unplugged music in a cozy setting.</p>',
   'Intimate acoustic performances by singer-songwriters in a cozy setting.',
   'concert', 'paid', ARRAY['acoustic', 'singer-songwriter', 'intimate', 'live music'],
   '2026-07-09 19:00:00+03', '2026-07-09 22:00:00+03',
   'Jazzamba Lounge', 'Bole Medhanealem Area', 'Bole', 9.0200, 38.7600,
   'approved', false, 100, 87, 654),
  -- Food & Drink Events (4)
  ('e1000000-0000-0000-0000-000000000042', 'c1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000011',
   'Addis Food Festival', 'addis-food-festival',
   '<p>Celebrate Addis Ababa''s diverse culinary scene. Over 30 food vendors, cooking demonstrations, and tastings.</p>',
   'Celebrate Addis culinary scene with 30+ vendors, demos, and tastings.',
   'exhibition', 'free', ARRAY['food festival', 'culinary', 'tasting', 'vendors'],
   '2026-07-05 10:00:00+03', '2026-07-05 20:00:00+03',
   'Friendship Park', 'Bole Road, Near Edna Mall', 'Bole', 9.0170, 38.7640,
   'approved', false, 1500, 987, 3456),
  ('e1000000-0000-0000-0000-000000000043', 'c1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000006',
   'Ethiopian Wine Tasting', 'ethiopian-wine-tasting',
   '<p>Discover Ethiopian wines from Rift Valley vineyards. Guided tasting with sommelier commentary and cheese pairing.</p>',
   'Discover Ethiopian wines with guided tasting and cheese pairing.',
   'workshop', 'paid', ARRAY['wine', 'tasting', 'Ethiopian wine', 'pairing'],
   '2026-06-27 18:00:00+03', '2026-06-27 21:00:00+03',
   'Skylight Hotel', 'Bole Sub-City', 'Bole', 9.0150, 38.7680,
   'approved', false, 40, 36, 543),
  ('e1000000-0000-0000-0000-000000000044', 'c1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000010',
   'Injera Making Workshop', 'injera-making-workshop',
   '<p>Learn to make perfect injera from scratch. Traditional techniques and modern tips. Take home your own batch!</p>',
   'Learn to make perfect injera from scratch. Take home your own batch!',
   'workshop', 'paid', ARRAY['injera', 'cooking', 'Ethiopian cuisine', 'workshop'],
   '2026-07-12 10:00:00+03', '2026-07-12 14:00:00+03',
   'Tomoca Heritage', 'Piazza District', 'Arada', 9.0350, 38.7480,
   'approved', false, 15, 15, 321),
  ('e1000000-0000-0000-0000-000000000045', 'c1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000006',
   'Coffee & Chocolate Pairing', 'coffee-chocolate-pairing',
   '<p>Explore the perfect pairing of Ethiopian coffee and artisanal chocolate. Guided tasting experience.</p>',
   'Perfect pairing of Ethiopian coffee and artisanal chocolate.',
   'workshop', 'paid', ARRAY['coffee', 'chocolate', 'pairing', 'tasting'],
   '2026-07-26 15:00:00+03', '2026-07-26 17:00:00+03',
   'Skylight Hotel', 'Bole Sub-City', 'Bole', 9.0150, 38.7680,
   'approved', false, 25, 22, 234),
  -- Community & Social Events (5)
  ('e1000000-0000-0000-0000-000000000046', 'c1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', NULL,
   'Community Clean-Up Drive', 'community-clean-up-drive',
   '<p>Join your neighbors for a community clean-up in Kolfe Keranio. Gloves and bags provided. Refreshments after.</p>',
   'Community clean-up drive in Kolfe Keranio. Supplies and refreshments provided.',
   'meetup', 'free', ARRAY['community', 'volunteer', 'clean-up', 'environment'],
   '2026-06-14 07:00:00+03', '2026-06-14 11:00:00+03',
   'Kolfe Park', 'Kolfe Keranio', 'Kolfe Keranio', 9.0050, 38.7200,
   'approved', false, 100, 78, 432),
  ('e1000000-0000-0000-0000-000000000047', 'c1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000012',
   'Volunteer Training Program', 'volunteer-training-program',
   '<p>Training for new volunteers. Learn about community development, first aid, and project management.</p>',
   'Training for new volunteers in community development and first aid.',
   'training', 'free', ARRAY['volunteer', 'training', 'community development', 'first aid'],
   '2026-07-06 09:00:00+03', '2026-07-06 17:00:00+03',
   'UNECA Conference Center', 'Africa Avenue', 'Kirkos', 9.0180, 38.7540,
   'approved', false, 50, 42, 321),
  ('e1000000-0000-0000-0000-000000000048', 'c1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000011',
   'Tree Planting Initiative', 'tree-planting-initiative',
   '<p>Help us plant 500 trees in Addis Ababa. All tools and saplings provided. Make a lasting impact on our city.</p>',
   'Help plant 500 trees in Addis Ababa. Tools and saplings provided.',
   'meetup', 'free', ARRAY['tree planting', 'environment', 'volunteer', 'green'],
   '2026-07-20 07:00:00+03', '2026-07-20 12:00:00+03',
   'Friendship Park', 'Bole Road, Near Edna Mall', 'Bole', 9.0170, 38.7640,
   'approved', false, 200, 156, 543),
  ('e1000000-0000-0000-0000-000000000049', 'c1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000011',
   'Book Club Meetup', 'book-club-meetup',
   '<p>Monthly book club discussing Ethiopian literature. This month features The Beautiful Things That Heaven Bears by Dinaw Mengestu.</p>',
   'Monthly book club discussing Ethiopian literature and contemporary works.',
   'meetup', 'free', ARRAY['book club', 'literature', 'reading', 'discussion'],
   '2026-06-28 15:00:00+03', '2026-06-28 17:00:00+03',
   'Friendship Park', 'Bole Road, Near Edna Mall', 'Bole', 9.0170, 38.7640,
   'approved', false, 30, 25, 234),
  ('e1000000-0000-0000-0000-000000000050', 'c1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000006',
   'Neighborhood Watch Meeting', 'neighborhood-watch-meeting',
   '<p>Community safety meeting for Bole residents. Discuss neighborhood security initiatives and emergency preparedness.</p>',
   'Community safety meeting for Bole residents on security and preparedness.',
   'meetup', 'free', ARRAY['community', 'safety', 'neighborhood', 'meeting'],
   '2026-07-10 18:00:00+03', '2026-07-10 20:00:00+03',
   'Skylight Hotel', 'Bole Sub-City', 'Bole', 9.0150, 38.7680,
   'approved', false, 80, 56, 234),
  -- Pending/Draft events (5 for moderation testing)
  ('e1000000-0000-0000-0000-000000000051', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
   'Cybersecurity Workshop', 'cybersecurity-workshop',
   '<p>Learn about cybersecurity fundamentals, threat detection, and best practices for protecting your digital assets.</p>',
   'Learn cybersecurity fundamentals and threat detection best practices.',
   'workshop', 'paid', ARRAY['cybersecurity', 'security', 'workshop', 'hacking'],
   '2026-08-20 09:00:00+03', '2026-08-20 17:00:00+03',
   'Millennium Hall', 'Bole Road, Near Bole International Airport', 'Bole', 9.0122, 38.7653,
   'pending', false, 100, 0, 0),
  ('e1000000-0000-0000-0000-000000000052', 'c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004',
   'IoT & Smart Cities Forum', 'iot-smart-cities-forum',
   '<p>Explore how IoT technology is transforming Addis Ababa into a smart city. Demos, panels, and networking.</p>',
   'Explore IoT technology transforming Addis Ababa into a smart city.',
   'conference', 'paid', ARRAY['IoT', 'smart city', 'technology', 'innovation'],
   '2026-08-25 09:00:00+03', '2026-08-25 17:00:00+03',
   'Ice Addis', 'Bole Road', 'Bole', 9.0180, 38.7620,
   'pending', false, 150, 0, 0),
  ('e1000000-0000-0000-0000-000000000053', 'c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000008',
   'Ethiopian Fashion Week', 'ethiopian-fashion-week',
   '<p>Showcase of Ethiopian fashion designers. Runway shows, pop-up shops, and designer meet-and-greets.</p>',
   'Ethiopian fashion designers showcase with runway shows and pop-up shops.',
   'exhibition', 'paid', ARRAY['fashion', 'design', 'runway', 'Ethiopian'],
   '2026-09-01 18:00:00+03', '2026-09-03 22:00:00+03',
   'National Theatre', 'Churchill Avenue', 'Arada', 9.0300, 38.7500,
   'pending', false, 500, 0, 0),
  ('e1000000-0000-0000-0000-000000000054', 'c1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000005',
   'Ethio-Jazz Fusion Night', 'ethio-jazz-fusion-night',
   '<p>A unique fusion of traditional Ethiopian music and modern jazz. Featuring legendary musicians and new talent.</p>',
   'Unique fusion of traditional Ethiopian music and modern jazz.',
   'concert', 'paid', ARRAY['jazz', 'Ethiopian music', 'fusion', 'live'],
   '2026-08-12 19:00:00+03', '2026-08-12 23:00:00+03',
   'Jazzamba Lounge', 'Bole Medhanealem Area', 'Bole', 9.0200, 38.7600,
   'pending', false, 200, 0, 0),
  ('e1000000-0000-0000-0000-000000000055', 'c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000006',
   'Stress Management Workshop', 'stress-management-workshop',
   '<p>Learn practical stress management techniques for busy professionals. Mindfulness, breathing exercises, and work-life balance strategies.</p>',
   'Practical stress management techniques for busy professionals.',
   'workshop', 'paid', ARRAY['stress management', 'mindfulness', 'wellness', 'professional'],
   '2026-08-22 09:00:00+03', '2026-08-22 13:00:00+03',
   'Skylight Hotel', 'Bole Sub-City', 'Bole', 9.0150, 38.7680,
   'draft', false, 30, 0, 0);

-- ==========================================================================
-- TICKET TIERS (for all events)
-- ==========================================================================

INSERT INTO public.ticket_tiers (id, event_id, name, description, price, capacity, sold_count, sort_order) VALUES
  -- Featured events
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'General Admission', 'Access to all main stage sessions and networking areas.', 500, 1500, 612, 1),
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'VIP', 'Front-row seating, exclusive workshop access, and VIP lounge.', 1500, 200, 135, 2),
  ('f1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'Early Bird', 'Limited early bird tickets at discounted price.', 350, 300, 100, 0),
  ('f1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000002', 'Standard', 'Includes all tastings and brewing guide.', 800, 35, 33, 1),
  ('f1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000002', 'Premium', 'Includes all tastings, brewing guide, and take-home coffee beans.', 1200, 15, 15, 2),
  ('f1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000003', 'Free Admission', 'Free entry to the pitch event.', 0, 150, 123, 1),
  ('f1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000004', 'Free Admission', 'Free walking tour participation.', 0, 200, 156, 1),
  ('f1000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000005', 'Free Admission', 'Free attendance to all sessions.', 0, 300, 234, 1),
  -- Remaining events (one tier each)
  ('f1000000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000006', 'General', NULL, 1500, 60, 45, 1),
  ('f1000000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000007', 'General', NULL, 2000, 400, 287, 1),
  ('f1000000-0000-0000-0000-000000000011', 'e1000000-0000-0000-0000-000000000008', 'General', NULL, 1000, 40, 32, 1),
  ('f1000000-0000-0000-0000-000000000012', 'e1000000-0000-0000-0000-000000000009', 'General', NULL, 1500, 250, 178, 1),
  ('f1000000-0000-0000-0000-000000000013', 'e1000000-0000-0000-0000-000000000010', 'General', NULL, 2000, 200, 145, 1),
  ('f1000000-0000-0000-0000-000000000014', 'e1000000-0000-0000-0000-000000000011', 'General', NULL, 1800, 300, 167, 1),
  ('f1000000-0000-0000-0000-000000000015', 'e1000000-0000-0000-0000-000000000012', 'Free Admission', NULL, 0, 30, 28, 1),
  ('f1000000-0000-0000-0000-000000000016', 'e1000000-0000-0000-0000-000000000013', 'General', NULL, 2500, 300, 189, 1),
  ('f1000000-0000-0000-0000-000000000017', 'e1000000-0000-0000-0000-000000000014', 'General', NULL, 800, 40, 35, 1),
  ('f1000000-0000-0000-0000-000000000018', 'e1000000-0000-0000-0000-000000000015', 'Free Admission', NULL, 0, 50, 42, 1),
  ('f1000000-0000-0000-0000-000000000019', 'e1000000-0000-0000-0000-000000000016', 'General', NULL, 1200, 80, 67, 1),
  ('f1000000-0000-0000-0000-000000000020', 'e1000000-0000-0000-0000-000000000017', 'General', NULL, 2000, 40, 28, 1),
  ('f1000000-0000-0000-0000-000000000021', 'e1000000-0000-0000-0000-000000000018', 'Free Admission', NULL, 0, 200, 134, 1),
  ('f1000000-0000-0000-0000-000000000022', 'e1000000-0000-0000-0000-000000000019', 'General', NULL, 3000, 150, 89, 1),
  ('f1000000-0000-0000-0000-000000000023', 'e1000000-0000-0000-0000-000000000020', 'General', NULL, 500, 400, 287, 1),
  ('f1000000-0000-0000-0000-000000000024', 'e1000000-0000-0000-0000-000000000021', 'Free Admission', NULL, 0, 30, 25, 1),
  ('f1000000-0000-0000-0000-000000000025', 'e1000000-0000-0000-0000-000000000022', 'Free Admission', NULL, 0, 100, 78, 1),
  ('f1000000-0000-0000-0000-000000000026', 'e1000000-0000-0000-0000-000000000023', 'Free Admission', NULL, 0, 500, 234, 1),
  ('f1000000-0000-0000-0000-000000000027', 'e1000000-0000-0000-0000-000000000024', 'General', NULL, 600, 400, 312, 1),
  ('f1000000-0000-0000-0000-000000000028', 'e1000000-0000-0000-0000-000000000025', 'General', NULL, 800, 1000, 456, 1),
  ('f1000000-0000-0000-0000-000000000029', 'e1000000-0000-0000-0000-000000000026', 'General', NULL, 1500, 50, 43, 1),
  ('f1000000-0000-0000-0000-000000000030', 'e1000000-0000-0000-0000-000000000027', 'Free Admission', NULL, 0, 40, 32, 1),
  ('f1000000-0000-0000-0000-000000000031', 'e1000000-0000-0000-0000-000000000028', 'Free Admission', NULL, 0, 200, 156, 1),
  ('f1000000-0000-0000-0000-000000000032', 'e1000000-0000-0000-0000-000000000029', 'Free Admission', NULL, 0, 100, 87, 1),
  ('f1000000-0000-0000-0000-000000000033', 'e1000000-0000-0000-0000-000000000030', 'General', NULL, 500, 30, 22, 1),
  ('f1000000-0000-0000-0000-000000000034', 'e1000000-0000-0000-0000-000000000031', 'Free Admission', NULL, 0, 100, 87, 1),
  ('f1000000-0000-0000-0000-000000000035', 'e1000000-0000-0000-0000-000000000032', 'General', NULL, 2000, 30, 28, 1),
  ('f1000000-0000-0000-0000-000000000036', 'e1000000-0000-0000-0000-000000000033', 'General', NULL, 1500, 40, 34, 1),
  ('f1000000-0000-0000-0000-000000000037', 'e1000000-0000-0000-0000-000000000034', 'General', NULL, 5000, 50, 34, 1),
  ('f1000000-0000-0000-0000-000000000038', 'e1000000-0000-0000-0000-000000000035', 'General', NULL, 3000, 30, 22, 1),
  ('f1000000-0000-0000-0000-000000000039', 'e1000000-0000-0000-0000-000000000036', 'General', NULL, 800, 25, 20, 1),
  ('f1000000-0000-0000-0000-000000000040', 'e1000000-0000-0000-0000-000000000037', 'General', NULL, 500, 200, 178, 1),
  ('f1000000-0000-0000-0000-000000000041', 'e1000000-0000-0000-0000-000000000038', 'General', NULL, 800, 250, 210, 1),
  ('f1000000-0000-0000-0000-000000000042', 'e1000000-0000-0000-0000-000000000039', 'General', NULL, 1000, 20, 18, 1),
  ('f1000000-0000-0000-0000-000000000043', 'e1000000-0000-0000-0000-000000000040', 'General', NULL, 1500, 2000, 876, 1),
  ('f1000000-0000-0000-0000-000000000044', 'e1000000-0000-0000-0000-000000000041', 'General', NULL, 400, 100, 87, 1),
  ('f1000000-0000-0000-0000-000000000045', 'e1000000-0000-0000-0000-000000000042', 'Free Admission', NULL, 0, 1500, 987, 1),
  ('f1000000-0000-0000-0000-000000000046', 'e1000000-0000-0000-0000-000000000043', 'General', NULL, 1200, 40, 36, 1),
  ('f1000000-0000-0000-0000-000000000047', 'e1000000-0000-0000-0000-000000000044', 'General', NULL, 600, 15, 15, 1),
  ('f1000000-0000-0000-0000-000000000048', 'e1000000-0000-0000-0000-000000000045', 'General', NULL, 800, 25, 22, 1),
  ('f1000000-0000-0000-0000-000000000049', 'e1000000-0000-0000-0000-000000000046', 'Free Admission', NULL, 0, 100, 78, 1),
  ('f1000000-0000-0000-0000-000000000050', 'e1000000-0000-0000-0000-000000000047', 'Free Admission', NULL, 0, 50, 42, 1),
  ('f1000000-0000-0000-0000-000000000051', 'e1000000-0000-0000-0000-000000000048', 'Free Admission', NULL, 0, 200, 156, 1),
  ('f1000000-0000-0000-0000-000000000052', 'e1000000-0000-0000-0000-000000000049', 'Free Admission', NULL, 0, 30, 25, 1),
  ('f1000000-0000-0000-0000-000000000053', 'e1000000-0000-0000-0000-000000000050', 'Free Admission', NULL, 0, 80, 56, 1);

-- ==========================================================================
-- REGISTRATIONS (200+ distributed across events)
-- ==========================================================================

DO $$
DECLARE
  v_event RECORD;
  v_tier RECORD;
  v_user_ids UUID[] := ARRAY[
    'b1000000-0000-0000-0000-000000000011'::UUID,
    'b1000000-0000-0000-0000-000000000012'::UUID,
    'b1000000-0000-0000-0000-000000000013'::UUID
  ];
  v_names TEXT[] := ARRAY['Abebe Kebede', 'Tigist Mulugeta', 'Dawit Tesfaye'];
  v_emails TEXT[] := ARRAY['abebe@email.com', 'tigist@email.com', 'dawit@email.com'];
  v_phones TEXT[] := ARRAY['+251911000011', '+251911000012', '+251911000013'];
  v_counter INTEGER := 0;
  v_reg_id UUID;
  v_ticket_id UUID;
BEGIN
  FOR v_event IN
    SELECT id, title FROM public.events WHERE status = 'approved' ORDER BY created_at
  LOOP
    SELECT id INTO v_tier FROM public.ticket_tiers WHERE event_id = v_event.id ORDER BY sort_order LIMIT 1;
    IF v_tier IS NOT NULL THEN
      FOR i IN 1..3 LOOP
        v_counter := v_counter + 1;
        v_reg_id := gen_random_uuid();
        v_ticket_id := gen_random_uuid();
        INSERT INTO public.registrations (id, event_id, user_id, ticket_tier_id, attendee_name, attendee_email, attendee_phone, status, qr_data, created_at)
        VALUES (
          v_reg_id, v_event.id, v_user_ids[((i - 1) % 3) + 1], v_tier.id,
          v_names[((i - 1) % 3) + 1], v_emails[((i - 1) % 3) + 1], v_phones[((i - 1) % 3) + 1],
          CASE WHEN random() > 0.1 THEN 'confirmed'::public.registration_status ELSE 'cancelled'::public.registration_status END,
          'EVT-' || SUBSTRING(v_event.id::TEXT, 1, 8) || '-REG-' || v_counter || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8),
          now() - (random() * interval '30 days')
        );
        INSERT INTO public.tickets (id, registration_id, event_id, user_id, ticket_number, qr_data, tier_name, status, issued_at)
        VALUES (
          v_ticket_id, v_reg_id, v_event.id, v_user_ids[((i - 1) % 3) + 1],
          'TKT-' || LPAD(v_counter::TEXT, 6, '0'),
          'EVT-' || SUBSTRING(v_event.id::TEXT, 1, 8) || '-TKT-' || v_counter,
          'General',
          CASE WHEN random() > 0.8 THEN 'used'::public.ticket_status ELSE 'valid'::public.ticket_status END,
          now() - (random() * interval '30 days')
        );
      END LOOP;
    END IF;
  END LOOP;
  RAISE NOTICE 'Created % registrations', v_counter;
END $$;

-- ==========================================================================
-- NOTIFICATIONS (sample)
-- ==========================================================================

INSERT INTO public.notifications (user_id, type, title, message, is_read, created_at) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'event_approved', 'Event Approved', 'Your event Addis Tech Summit 2026 has been approved and is now live!', true, now() - interval '5 days'),
  ('b1000000-0000-0000-0000-000000000001', 'new_registration', 'New Registration', 'Abebe Kebede registered for Addis Tech Summit 2026.', false, now() - interval '2 days'),
  ('b1000000-0000-0000-0000-000000000002', 'event_approved', 'Event Approved', 'Your event Startup Pitch Night: Bole has been approved.', true, now() - interval '4 days'),
  ('b1000000-0000-0000-0000-000000000011', 'registration_confirmed', 'Registration Confirmed', 'You are registered for Addis Tech Summit 2026. See you there!', true, now() - interval '3 days'),
  ('b1000000-0000-0000-0000-000000000011', 'event_reminder', 'Event Reminder', 'Addis Tech Summit 2026 starts in 24 hours. Do not forget!', false, now() - interval '1 hour'),
  ('b1000000-0000-0000-0000-000000000012', 'registration_confirmed', 'Registration Confirmed', 'You are registered for Women in Tech Addis.', false, now() - interval '1 day'),
  ('b1000000-0000-0000-0000-000000000005', 'event_approved', 'Event Approved', 'Your event AI & Machine Learning Conference has been approved.', true, now() - interval '6 days'),
  ('b1000000-0000-0000-0000-000000000007', 'event_approved', 'Event Approved', 'Your event Jazz Night at Jazzamba has been approved.', true, now() - interval '7 days'),
  ('b1000000-0000-0000-0000-000000000014', 'system_announcement', 'New Organizer Application', 'Green Ethiopia Foundation has applied for organizer verification.', false, now() - interval '1 day'),
  ('b1000000-0000-0000-0000-000000000014', 'system_announcement', 'New Event Pending Review', 'Cybersecurity Workshop is pending moderation review.', false, now() - interval '2 hours');

-- ==========================================================================
-- AUDIT LOG (sample entries)
-- ==========================================================================

INSERT INTO public.audit_log (actor_id, action, target_type, target_id, target_label, details, created_at) VALUES
  ('b1000000-0000-0000-0000-000000000014', 'event_approved', 'event', 'e1000000-0000-0000-0000-000000000001', 'Addis Tech Summit 2026', 'Event approved after review.', now() - interval '5 days'),
  ('b1000000-0000-0000-0000-000000000014', 'event_approved', 'event', 'e1000000-0000-0000-0000-000000000002', 'Ethiopian Coffee Masterclass', 'Event approved.', now() - interval '5 days'),
  ('b1000000-0000-0000-0000-000000000014', 'event_approved', 'event', 'e1000000-0000-0000-0000-000000000003', 'Startup Pitch Night: Bole', 'Event approved.', now() - interval '4 days'),
  ('b1000000-0000-0000-0000-000000000014', 'event_featured', 'event', 'e1000000-0000-0000-0000-000000000001', 'Addis Tech Summit 2026', 'Featured for 14 days.', now() - interval '5 days'),
  ('b1000000-0000-0000-0000-000000000014', 'organizer_verified', 'organizer', 'c1000000-0000-0000-0000-000000000001', 'Addis Tech Hub', 'Organizer verified.', now() - interval '10 days'),
  ('b1000000-0000-0000-0000-000000000014', 'organizer_verified', 'organizer', 'c1000000-0000-0000-0000-000000000002', 'Ethiopian Business Forum', 'Organizer verified.', now() - interval '10 days'),
  ('b1000000-0000-0000-0000-000000000014', 'user_role_changed', 'user', 'b1000000-0000-0000-0000-000000000001', 'Addis Tech Hub', 'Role changed from attendee to organizer.', now() - interval '15 days'),
  ('b1000000-0000-0000-0000-000000000015', 'event_approved', 'event', 'e1000000-0000-0000-0000-000000000004', 'Meskel Square Art Walk', 'Event approved.', now() - interval '3 days'),
  ('b1000000-0000-0000-0000-000000000015', 'event_approved', 'event', 'e1000000-0000-0000-0000-000000000005', 'Women in Tech Addis', 'Event approved.', now() - interval '3 days'),
  ('b1000000-0000-0000-0000-000000000014', 'event_featured', 'event', 'e1000000-0000-0000-0000-000000000005', 'Women in Tech Addis', 'Featured for 7 days.', now() - interval '3 days'),
  ('b1000000-0000-0000-0000-000000000014', 'system_config_changed', 'system', NULL, 'Platform Settings', 'Updated featured event limit from 3 to 5.', now() - interval '7 days'),
  ('b1000000-0000-0000-0000-000000000015', 'organizer_verified', 'organizer', 'c1000000-0000-0000-0000-000000000003', 'Meskel Cultural Foundation', 'Organizer verified.', now() - interval '8 days');

-- ==========================================================================
-- PROMO CODES (sample)
-- ==========================================================================

INSERT INTO public.promo_codes (id, event_id, organizer_id, code, description, discount_type, discount_value, max_uses, starts_at, expires_at) VALUES
  ('g1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'TECHSUMMIT20', '20% off Addis Tech Summit tickets', 'percentage', 20, 100, now() - interval '10 days', now() + interval '15 days'),
  ('g1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000005', 'AIML100', 'ETB 100 off AI/ML Conference', 'fixed', 100, 50, now() - interval '5 days', now() + interval '20 days'),
  ('g1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000037', 'c1000000-0000-0000-0000-000000000007', 'JAZZ15', '15% off Jazz Night tickets', 'percentage', 15, 30, now() - interval '3 days', now() + interval '5 days');

-- ==========================================================================
-- SPONSORS (sample)
-- ==========================================================================

INSERT INTO public.sponsors (id, event_id, name, tier, website, is_active) VALUES
  ('h1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Ethio Telecom', 'platinum', 'https://ethiotelecom.et', true),
  ('h1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'Dashen Bank', 'gold', 'https://dashenbank.com', true),
  ('h1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'Kifiya Financial', 'silver', 'https://kifiya.com', true),
  ('h1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000007', 'Awash Bank', 'gold', 'https://awashbank.com', true),
  ('h1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000005', 'Google Developers', 'platinum', 'https://developers.google.com', true);

-- ==========================================================================
-- CONVERSATIONS & MESSAGES (sample)
-- ==========================================================================

INSERT INTO public.conversations (id, type, event_id, subject, participant_ids, last_message_at, last_message) VALUES
  ('i1000000-0000-0000-0000-000000000001', 'event_inquiry', 'e1000000-0000-0000-0000-000000000001', 'Question about Addis Tech Summit',
   ARRAY['b1000000-0000-0000-0000-000000000011'::UUID, 'b1000000-0000-0000-0000-000000000001'::UUID],
   now() - interval '1 hour', 'Yes, WiFi will be provided at the venue.'),
  ('i1000000-0000-0000-0000-000000000002', 'direct', NULL, NULL,
   ARRAY['b1000000-0000-0000-0000-000000000012'::UUID, 'b1000000-0000-0000-0000-000000000010'::UUID],
   now() - interval '30 minutes', 'Looking forward to the workshop!');

INSERT INTO public.messages (id, conversation_id, sender_id, type, content, created_at) VALUES
  ('j1000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000011', 'text', 'Hi! Will there be WiFi at the venue?', now() - interval '2 hours'),
  ('j1000000-0000-0000-0000-000000000002', 'i1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'text', 'Yes, WiFi will be provided at the venue.', now() - interval '1 hour'),
  ('j1000000-0000-0000-0000-000000000003', 'i1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000012', 'text', 'Looking forward to the workshop!', now() - interval '30 minutes');
