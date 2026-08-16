-- Seed data for UrbanLuxe Portal
-- Run after all migrations are applied.
-- Creates: 1 admin, 3 agents, 1 accountant, 10 customers, 15 properties, 20 leads, deals, 6 quotations, 8 invoices, 12 cheques
-- NOTE: Auth users must be created via Supabase Auth (Admin SDK or dashboard) before running this.
-- The profile IDs below are deterministic UUIDs referenced by the seed.

-- ============================================================
-- PROFILES (reference IDs — actual auth.users created separately)
-- ============================================================

insert into public.profiles (id, full_name, email, phone, role, commission_rate, brn, is_active) values
  ('7cdcac40-6c6f-474f-8cec-fe0a2afaedbc', 'Ahmed Al Mansoori', 'admin@urbanluxe.ae', '+971501234567', 'admin', 0, 'BRN-001', true),
  ('4285d50a-1535-4b4e-89d5-0e6b10ba4a16', 'Sara Al Hashimi', 'sara@urbanluxe.ae', '+971502345678', 'agent', 2.0, 'BRN-002', true),
  ('945707e2-f41e-467e-8843-de246ceed7a5', 'John Matthews', 'john@urbanluxe.ae', '+971503456789', 'agent', 2.5, 'BRN-003', true),
  ('8227cd06-abba-462c-b835-e6543b7e3186', 'Fatima Al Zaabi', 'fatima@urbanluxe.ae', '+971504567890', 'agent', 2.0, 'BRN-004', true),
  ('96805d87-0709-4485-85c5-f2cd020962f3', 'Raj Patel', 'raj@urbanluxe.ae', '+971505678901', 'accountant', 0, null, true)
on conflict (id) do nothing;

-- ============================================================
-- COMPANY SETTINGS (already has row id=1 from migration)
-- ============================================================

update public.company_settings set
  company_name = 'Urban Luxe',
  trn = '100123456700003',
  rera_orn = '87654',
  address = 'Office 1203, Bay Square, Business Bay, Dubai, UAE',
  phone = '+97141234567',
  email = 'info@urbanluxe.ae',
  vat_rate = 5.0,
  quotation_prefix = 'QT-',
  invoice_prefix = 'INV-',
  quotation_approval_threshold = 50000,
  default_currency = 'AED'
where id = 1;

-- ============================================================
-- PROPERTY OWNERS
-- ============================================================

insert into public.property_owners (id, name, phone, email, notes) values
  ('b0000000-0000-0000-0000-000000000001', 'Mohammed Al Futtaim', '+971551112233', 'm.futtaim@email.com', 'VIP owner'),
  ('b0000000-0000-0000-0000-000000000002', 'Emaar Properties', '+971552223344', 'investments@emaar.ae', 'Developer'),
  ('b0000000-0000-0000-0000-000000000003', 'Priya Sharma', '+971553334455', 'priya.s@email.com', null),
  ('b0000000-0000-0000-0000-000000000004', 'Damac Real Estate', '+971554445566', 'leasing@damac.ae', 'Developer'),
  ('b0000000-0000-0000-0000-000000000005', 'Abdullah Al Naboodah', '+971555556677', 'a.naboodah@email.com', null)
on conflict (id) do nothing;

-- ============================================================
-- PROPERTIES (15)
-- ============================================================

insert into public.properties (id, ref_no, title, description, purpose, category, status, community, building, unit_no, bedrooms, bathrooms, size_sqft, parking, price, owner_id, trakheesi_permit_no, furnishing, amenities, assigned_to, featured, created_by) values
  ('c0000000-0000-0000-0000-000000000001', 'PRP-0001', '2BR Apartment in Marina Gate', 'Stunning 2-bedroom apartment with full Marina view', 'sale', 'apartment', 'available', 'Dubai Marina', 'Marina Gate 1', '1203', 2, 2, 1200, 1, 185000000, 'b0000000-0000-0000-0000-000000000001', 'TRK-001', 'Furnished', ARRAY['Pool','Gym','Concierge','Parking'], '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', true, '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('c0000000-0000-0000-0000-000000000002', 'PRP-0002', '3BR Villa in Arabian Ranches', 'Family villa with private garden', 'sale', 'villa', 'available', 'Arabian Ranches', 'Saheel', 'V-45', 3, 4, 3200, 2, 420000000, 'b0000000-0000-0000-0000-000000000003', 'TRK-002', 'Unfurnished', ARRAY['Garden','Maid Room','Garage'], '945707e2-f41e-467e-8843-de246ceed7a5', true, '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('c0000000-0000-0000-0000-000000000003', 'PRP-0003', 'Studio in JVC', 'Affordable studio in Jumeirah Village Circle', 'rent', 'apartment', 'available', 'Jumeirah Village Circle', 'Belgravia', '302', 0, 1, 450, 0, 5500000, 'b0000000-0000-0000-0000-000000000002', 'TRK-003', 'Furnished', ARRAY['Pool','Gym'], '8227cd06-abba-462c-b835-e6543b7e3186', false, '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('c0000000-0000-0000-0000-000000000004', 'PRP-0004', '1BR in Downtown Dubai', 'Burj Khalifa view apartment', 'sale', 'apartment', 'reserved', 'Downtown Dubai', 'Burj Vista', '2501', 1, 1, 750, 1, 145000000, 'b0000000-0000-0000-0000-000000000002', 'TRK-004', 'Furnished', ARRAY['Pool','Gym','Concierge'], '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', true, '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('c0000000-0000-0000-0000-000000000005', 'PRP-0005', '4BR Townhouse in Town Square', 'Modern townhouse with rooftop terrace', 'sale', 'townhouse', 'available', 'Town Square', 'Noor', 'TH-78', 4, 5, 2800, 2, 320000000, 'b0000000-0000-0000-0000-000000000003', 'TRK-005', 'Unfurnished', ARRAY['Garden','Rooftop','Maid Room'], '945707e2-f41e-467e-8843-de246ceed7a5', false, '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('c0000000-0000-0000-0000-000000000006', 'PRP-0006', 'Office Space in DIFC', 'Grade A office with DIFC views', 'rent', 'office', 'available', 'DIFC', 'Gate Village 6', 'L-04', 0, 2, 2000, 4, 28000000, 'b0000000-0000-0000-0000-000000000004', 'TRK-006', 'Fitted', ARRAY['Parking','Reception','24/7 Access'], '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', false, '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('c0000000-0000-0000-0000-000000000007', 'PRP-0007', '2BR in Palm Jumeirah', 'Beachfront apartment with Atlantis view', 'sale', 'apartment', 'sold', 'Palm Jumeirah', 'Shoreline 12', 'PH-01', 2, 3, 1850, 2, 380000000, 'b0000000-0000-0000-0000-000000000001', 'TRK-007', 'Furnished', ARRAY['Beach Access','Pool','Gym','Concierge'], '945707e2-f41e-467e-8843-de246ceed7a5', true, '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('c0000000-0000-0000-0000-000000000008', 'PRP-0008', '3BR Apartment in Bluewaters', 'Luxury living near Ain Dubai', 'rent', 'apartment', 'rented', 'Bluewaters Island', 'Bluewaters Residences', '405', 3, 3, 2200, 2, 19500000, 'b0000000-0000-0000-0000-000000000004', 'TRK-008', 'Furnished', ARRAY['Pool','Gym','Concierge','Beach'], '8227cd06-abba-462c-b835-e6543b7e3186', false, '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('c0000000-0000-0000-0000-000000000009', 'PRP-0009', 'Retail Space in Business Bay', 'Ground floor retail facing Sheikh Zayed Road', 'rent', 'retail', 'available', 'Business Bay', 'Bay Avenue', 'G-12', 0, 0, 1500, 2, 18000000, 'b0000000-0000-0000-0000-000000000005', 'TRK-009', 'Shell and Core', ARRAY['Main Road Frontage','Parking'], '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', false, '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('c0000000-0000-0000-0000-000000000010', 'PRP-0010', 'Off-Plan 2BR in Creek Harbour', 'Pre-launch prices at Dubai Creek Harbour', 'sale', 'off_plan', 'available', 'Dubai Creek Harbour', 'Creek Beach', 'N/A', 2, 2, 1100, 1, 165000000, 'b0000000-0000-0000-0000-000000000002', null, 'Off Plan', ARRAY['Creek View','Beach','Pool','Gym'], '945707e2-f41e-467e-8843-de246ceed7a5', true, '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('c0000000-0000-0000-0000-000000000011', 'PRP-0011', '5BR Villa in Emirates Hills', 'Mansion with lake view', 'sale', 'villa', 'available', 'Emirates Hills', 'Sector W', 'V-102', 5, 7, 8500, 4, 850000000, 'b0000000-0000-0000-0000-000000000005', 'TRK-011', 'Furnished', ARRAY['Private Pool','Lake View','Maid Room','Driver Room','Elevator'], '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', true, '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('c0000000-0000-0000-0000-000000000012', 'PRP-0012', '1BR in JLT', 'Lake view apartment in Jumeirah Lake Towers', 'rent', 'apartment', 'available', 'Jumeirah Lake Towers', 'Cluster X', '1802', 1, 1, 850, 1, 7500000, 'b0000000-0000-0000-0000-000000000003', 'TRK-012', 'Furnished', ARRAY['Pool','Gym','Lake View'], '8227cd06-abba-462c-b835-e6543b7e3186', false, '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('c0000000-0000-0000-0000-000000000013', 'PRP-0013', 'Warehouse in Al Quoz', 'Industrial warehouse with cold storage', 'rent', 'warehouse', 'available', 'Al Quoz', 'Industrial 3', 'W-22', 0, 2, 10000, 6, 35000000, 'b0000000-0000-0000-0000-000000000004', 'TRK-013', 'Cold Storage', ARRAY['Loading Bays','Cold Storage','Power Backup'], '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', false, '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('c0000000-0000-0000-0000-000000000014', 'PRP-0014', 'Land in Dubai South', 'Residential plot near Expo 2020 site', 'sale', 'land', 'available', 'Dubai South', 'Residential City', 'Plot-456', 0, 0, 8000, 0, 95000000, 'b0000000-0000-0000-0000-000000000005', 'TRK-014', null, ARRAY[]::text[], '945707e2-f41e-467e-8843-de246ceed7a5', false, '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('c0000000-0000-0000-0000-000000000015', 'PRP-0015', '2BR in Dubai Hills', 'Park view apartment in Dubai Hills Estate', 'sale', 'apartment', 'available', 'Dubai Hills Estate', 'Park Heights', '1105', 2, 2, 1300, 1, 210000000, 'b0000000-0000-0000-0000-000000000002', 'TRK-015', 'Furnished', ARRAY['Pool','Gym','Park View','Concierge'], '8227cd06-abba-462c-b835-e6543b7e3186', true, '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc')
on conflict (id) do nothing;

-- ============================================================
-- CUSTOMERS (10)
-- ============================================================

insert into public.customers (id, type, name, phone, email, nationality, emirates_id, passport_no, trn, address, tags, notes, assigned_to, created_by) values
  ('d0000000-0000-0000-0000-000000000001', 'individual', 'Khalid Al Rashid', '+971561112233', 'khalid@email.com', 'UAE', '784-1989-1234567-8', 'P12345678', null, 'Dubai Marina, Dubai', ARRAY['VIP','Investor'], 'Looking for investment properties', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('d0000000-0000-0000-0000-000000000002', 'individual', 'Emily Johnson', '+971562223344', 'emily.j@email.com', 'UK', null, 'GB123456789', null, 'Downtown Dubai, Dubai', ARRAY['Expat'], 'First-time buyer', '945707e2-f41e-467e-8843-de246ceed7a5', '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('d0000000-0000-0000-0000-000000000003', 'company', 'Gulf Trading LLC', '+971563334455', 'info@gulftrading.ae', 'UAE', null, null, '100987654300001', 'Business Bay, Dubai', ARRAY['Corporate'], 'Corporate tenant', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('d0000000-0000-0000-0000-000000000004', 'individual', 'Rashid Al Maktoum', '+971564445566', 'rashid.m@email.com', 'UAE', '784-1992-9876543-2', 'UAE98765432', null, 'Palm Jumeirah, Dubai', ARRAY['VIP','HNWI'], 'High net worth individual', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('d0000000-0000-0000-0000-000000000005', 'individual', 'Aisha Al Suwaidi', '+971565556677', 'aisha.s@email.com', 'UAE', '784-1995-5555555-1', null, null, 'Al Barsha, Dubai', ARRAY['Tenant'], 'Looking for annual rental', '8227cd06-abba-462c-b835-e6543b7e3186', '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('d0000000-0000-0000-0000-000000000006', 'individual', 'Michael Chen', '+971566667788', 'm.chen@email.com', 'China', null, 'CN123456789', null, 'JLT, Dubai', ARRAY['Investor'], 'Multiple property investor', '945707e2-f41e-467e-8843-de246ceed7a5', '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('d0000000-0000-0000-0000-000000000007', 'company', 'Tech Solutions FZ-LLC', '+971567778899', 'finance@techsol.ae', 'UAE', null, null, '100456789300002', 'DIFC, Dubai', ARRAY['Corporate','DIFC'], 'DIFC registered company', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('d0000000-0000-0000-0000-000000000008', 'individual', 'Sunita Reddy', '+971568889900', 'sunita.r@email.com', 'India', null, 'IN987654321', null, 'Discovery Gardens, Dubai', ARRAY['Expat','Tenant'], 'Family looking for 2BR rental', '8227cd06-abba-462c-b835-e6543b7e3186', '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('d0000000-0000-0000-0000-000000000009', 'individual', 'Omar Al Sharif', '+971569990011', 'omar.s@email.com', 'Syria', null, 'SY12345678', null, 'Business Bay, Dubai', ARRAY['Investor'], 'Interested in off-plan', '945707e2-f41e-467e-8843-de246ceed7a5', '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('d0000000-0000-0000-0000-000000000010', 'individual', 'Layla Hassan', '+971560011223', 'layla.h@email.com', 'Egypt', null, 'EG87654321', null, 'Arabian Ranches, Dubai', ARRAY['Buyer'], 'Looking for family villa', '8227cd06-abba-462c-b835-e6543b7e3186', '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('d0000000-0000-0000-0000-000000000011', 'individual', 'Robert Lee', '+971560022334', 'robert.l@email.com', 'USA', null, 'US123456789', null, 'Emirates Hills, Dubai', ARRAY['VIP','HNWI','Investor'], 'Cash buyer looking for mansion', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc')
on conflict (id) do nothing;

-- ============================================================
-- LEADS (20 across stages)
-- ============================================================

insert into public.leads (
  id, name, phone, email, source, interest, budget_min, budget_max, preferred_areas, notes, status,
  assigned_to, next_follow_up_at, created_by, language, financing, timeframe, purpose, bedrooms, category, tags
) values
  ('e0000000-0000-0000-0000-000000000001', 'David Wilson', '+971551110001', 'd.wilson@email.com', 'property_finder', 'buy', 150000000, 250000000, ARRAY['Dubai Marina','JBR'], 'Looking for 2BR sea view', 'new', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', now() + interval '2 days', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', 'en', 'mortgage', '3_months', 'end_user', '2', 'apartment', ARRAY['warm']),
  ('e0000000-0000-0000-0000-000000000002', 'Maria Garcia', '+971551110002', 'maria.g@email.com', 'bayut', 'rent', 8000000, 12000000, ARRAY['Downtown Dubai'], 'Needs 1BR furnished', 'new', '945707e2-f41e-467e-8843-de246ceed7a5', now() + interval '1 day', '945707e2-f41e-467e-8843-de246ceed7a5', 'en', 'undecided', 'immediate', 'end_user', '1', 'apartment', ARRAY['warm']),
  ('e0000000-0000-0000-0000-000000000003', 'Hassan Ali', '+971551110003', 'hassan.a@email.com', 'website', 'buy', 300000000, 500000000, ARRAY['Palm Jumeirah','Emirates Hills'], 'VIP buyer, cash purchaser', 'contacted', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', now() + interval '3 days', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', 'ar', 'cash', 'immediate', 'investment', '4+', 'villa', ARRAY['vip']),
  ('e0000000-0000-0000-0000-000000000004', 'Sophie Martin', '+971551110004', 'sophie.m@email.com', 'referral', 'rent', 6000000, 9000000, ARRAY['JLT','JVC'], 'Teacher relocating', 'contacted', '8227cd06-abba-462c-b835-e6543b7e3186', now() + interval '1 day', '8227cd06-abba-462c-b835-e6543b7e3186', 'en', null, '3_months', 'end_user', '1', 'apartment', ARRAY['warm']),
  ('e0000000-0000-0000-0000-000000000005', 'Yusuf Khan', '+971551110005', 'yusuf.k@email.com', 'dubizzle', 'buy', 100000000, 180000000, ARRAY['Dubai Hills','Town Square'], 'First-time buyer, mortgage needed', 'qualified', '945707e2-f41e-467e-8843-de246ceed7a5', now() + interval '5 days', '945707e2-f41e-467e-8843-de246ceed7a5', 'hi', 'mortgage', '6_months', 'end_user', '3', 'townhouse', ARRAY['warm']),
  ('e0000000-0000-0000-0000-000000000006', 'Anna Schmidt', '+971551110006', 'anna.s@email.com', 'property_finder', 'rent', 14000000, 20000000, ARRAY['Bluewaters','Palm Jumeirah'], 'Looking for luxury rental', 'qualified', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', now() + interval '4 days', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', 'en', 'cash', 'immediate', 'end_user', '2', 'apartment', ARRAY['vip']),
  ('e0000000-0000-0000-0000-000000000007', 'Ali Reza', '+971551110007', 'ali.reza@email.com', 'walk_in', 'buy', 50000000, 100000000, ARRAY['JVC','Discovery Gardens'], 'Budget buyer', 'new', null, null, '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc', 'en', 'mortgage', '12_months', 'investment', 'studio', 'apartment', ARRAY['warm']),
  ('e0000000-0000-0000-0000-000000000008', 'Nora Ahmed', '+971551110008', 'nora.a@email.com', 'social', 'off_plan', 150000000, 300000000, ARRAY['Creek Harbour','Emaar Beachfront'], 'Off-plan investor', 'contacted', '945707e2-f41e-467e-8843-de246ceed7a5', now() + interval '2 days', '945707e2-f41e-467e-8843-de246ceed7a5', 'ar', 'undecided', '12_months', 'investment', '2', 'off_plan', ARRAY['vip']),
  ('e0000000-0000-0000-0000-000000000009', 'Tom Brown', '+971551110009', 'tom.b@email.com', 'website', 'buy', 200000000, 350000000, ARRAY['Arabian Ranches','Dubai Hills'], 'Family relocation from UK', 'qualified', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', now() + interval '3 days', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', 'en', 'mortgage', '6_months', 'end_user', '4+', 'villa', ARRAY['warm']),
  ('e0000000-0000-0000-0000-000000000010', 'Zainab Farooq', '+971551110010', 'zainab.f@email.com', 'referral', 'rent', 7000000, 10000000, ARRAY['Business Bay','DIFC'], 'Corporate housing needed', 'new', '8227cd06-abba-462c-b835-e6543b7e3186', now() + interval '2 days', '8227cd06-abba-462c-b835-e6543b7e3186', 'ar', null, 'immediate', 'end_user', '1', 'apartment', ARRAY['warm']),
  ('e0000000-0000-0000-0000-000000000011', 'Robert Lee', '+971551110011', 'robert.l@email.com', 'bayut', 'buy', 400000000, 600000000, ARRAY['Emirates Hills','Palm Jumeirah'], 'HNWI, cash buyer', 'qualified', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', now() + interval '7 days', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', 'en', 'cash', '3_months', 'investment', '4+', 'villa', ARRAY['vip']),
  ('e0000000-0000-0000-0000-000000000012', 'Fatima Noor', '+971551110012', 'fatima.n@email.com', 'property_finder', 'rent', 5000000, 8000000, ARRAY['Al Furjan','JVC'], 'Budget rental for family', 'new', '8227cd06-abba-462c-b835-e6543b7e3186', now() + interval '3 days', '8227cd06-abba-462c-b835-e6543b7e3186', 'ar', 'undecided', '3_months', 'end_user', '2', 'apartment', ARRAY['warm']),
  ('e0000000-0000-0000-0000-000000000013', 'Karan Mehta', '+971551110013', 'karan.m@email.com', 'social', 'buy', 120000000, 200000000, ARRAY['JLT','Business Bay'], 'Investor looking for ROI', 'contacted', '945707e2-f41e-467e-8843-de246ceed7a5', now() + interval '1 day', '945707e2-f41e-467e-8843-de246ceed7a5', 'hi', 'mortgage', '6_months', 'investment', '1', 'apartment', ARRAY['warm']),
  ('e0000000-0000-0000-0000-000000000014', 'Linda Wang', '+971551110014', 'linda.w@email.com', 'website', 'off_plan', 200000000, 400000000, ARRAY['Creek Harbour'], 'Off-plan enthusiast', 'qualified', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', now() + interval '5 days', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', 'zh', 'cash', '12_months', 'investment', '2', 'off_plan', ARRAY['vip']),
  ('e0000000-0000-0000-0000-000000000015', 'Ibrahim Saleh', '+971551110015', 'ibrahim.s@email.com', 'walk_in', 'buy', 80000000, 150000000, ARRAY['Dubai South','Dubailand'], 'Looking near Expo site', 'new', null, null, '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc', 'ar', 'mortgage', '12_months', 'both', '3', 'townhouse', ARRAY['warm']),
  ('e0000000-0000-0000-0000-000000000016', 'Grace Park', '+971551110016', 'grace.p@email.com', 'referral', 'rent', 9000000, 13000000, ARRAY['Dubai Marina','JBR'], 'Korean expat, needs sea view', 'contacted', '8227cd06-abba-462c-b835-e6543b7e3186', now() + interval '2 days', '8227cd06-abba-462c-b835-e6543b7e3186', 'en', null, 'immediate', 'end_user', '2', 'apartment', ARRAY['warm']),
  ('e0000000-0000-0000-0000-000000000017', 'Salem Obaid', '+971551110017', 'salem.o@email.com', 'bayut', 'buy', 250000000, 400000000, ARRAY['Dubai Hills','Arabian Ranches'], 'Upgrade from apartment to villa', 'qualified', '945707e2-f41e-467e-8843-de246ceed7a5', now() + interval '4 days', '945707e2-f41e-467e-8843-de246ceed7a5', 'ar', 'cash', '6_months', 'end_user', '4+', 'villa', ARRAY['vip']),
  ('e0000000-0000-0000-0000-000000000018', 'Helen Cruz', '+971551110018', 'helen.c@email.com', 'property_finder', 'rent', 11000000, 16000000, ARRAY['Downtown Dubai','Business Bay'], 'Marketing executive relocating', 'new', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', now() + interval '3 days', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', 'en', 'undecided', '3_months', 'end_user', '1', 'apartment', ARRAY['warm']),
  ('e0000000-0000-0000-0000-000000000019', 'Adnan Yousuf', '+971551110019', 'adnan.y@email.com', 'dubizzle', 'commercial', 20000000, 35000000, ARRAY['DIFC','Business Bay'], 'Office space for tech startup', 'contacted', '945707e2-f41e-467e-8843-de246ceed7a5', now() + interval '1 day', '945707e2-f41e-467e-8843-de246ceed7a5', 'en', 'cash', 'immediate', 'investment', 'studio', 'commercial', ARRAY['vip']),
  ('e0000000-0000-0000-0000-000000000020', 'Maya Patel', '+971551110020', 'maya.p@email.com', 'website', 'buy', 180000000, 280000000, ARRAY['Dubai Marina','Bluewaters'], 'Investor from India', 'qualified', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', now() + interval '6 days', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', 'hi', 'mortgage', '6_months', 'investment', '2', 'apartment', ARRAY['warm'])
on conflict (id) do nothing;

-- ============================================================
-- DEALS (10 — mix of stages)
-- ============================================================

insert into public.deals (id, title, customer_id, property_id, deal_type, stage, value, commission_amount, commission_rate, assigned_to, expected_close_date, stage_changed_at, created_by) values
  ('f0000000-0000-0000-0000-000000000001', 'Sale — Marina Gate 2BR — Khalid', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'sale', 'negotiation', 185000000, 3700000, 2.0, '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', '2026-09-15', now() - interval '5 days', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16'),
  ('f0000000-0000-0000-0000-000000000002', 'Sale — Palm Jumeirah 2BR — Rashid', 'd0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007', 'sale', 'won', 380000000, 9500000, 2.5, '945707e2-f41e-467e-8843-de246ceed7a5', '2026-07-01', now() - interval '30 days', '945707e2-f41e-467e-8843-de246ceed7a5'),
  ('f0000000-0000-0000-0000-000000000003', 'Rental — Bluewaters 3BR — Aisha', 'd0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000008', 'rental', 'won', 19500000, 975000, 5.0, '8227cd06-abba-462c-b835-e6543b7e3186', '2026-06-20', now() - interval '45 days', '8227cd06-abba-462c-b835-e6543b7e3186'),
  ('f0000000-0000-0000-0000-000000000004', 'Sale — Arabian Ranches Villa — Layla', 'd0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000002', 'sale', 'viewing', 420000000, 8400000, 2.0, '945707e2-f41e-467e-8843-de246ceed7a5', '2026-10-01', now() - interval '2 days', '945707e2-f41e-467e-8843-de246ceed7a5'),
  ('f0000000-0000-0000-0000-000000000005', 'Sale — Downtown 1BR — Emily', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 'sale', 'offer', 145000000, 3625000, 2.5, '945707e2-f41e-467e-8843-de246ceed7a5', '2026-08-20', now() - interval '7 days', '945707e2-f41e-467e-8843-de246ceed7a5'),
  ('f0000000-0000-0000-0000-000000000006', 'Rental — DIFC Office — Gulf Trading', 'd0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000006', 'rental', 'contract', 28000000, 1400000, 5.0, '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', '2026-08-10', now() - interval '10 days', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16'),
  ('f0000000-0000-0000-0000-000000000007', 'Sale — Dubai Hills 2BR — Michael', 'd0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000015', 'sale', 'inquiry', 210000000, 4200000, 2.0, '945707e2-f41e-467e-8843-de246ceed7a5', '2026-11-01', now(), '945707e2-f41e-467e-8843-de246ceed7a5'),
  ('f0000000-0000-0000-0000-000000000008', 'Sale — Emirates Hills Mansion — Robert', 'd0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', 'sale', 'negotiation', 850000000, 17000000, 2.0, '4285d50a-1535-4b4e-89d5-0e6b10ba4a16', '2026-09-30', now() - interval '3 days', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16'),
  ('f0000000-0000-0000-0000-000000000009', 'Off-Plan — Creek Harbour — Omar', 'd0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000010', 'off_plan', 'viewing', 165000000, 3300000, 2.0, '945707e2-f41e-467e-8843-de246ceed7a5', '2026-12-15', now() - interval '1 day', '945707e2-f41e-467e-8843-de246ceed7a5'),
  ('f0000000-0000-0000-0000-000000000010', 'Rental — JLT 1BR — Sunita', 'd0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000012', 'rental', 'lost', 7500000, null, null, '8227cd06-abba-462c-b835-e6543b7e3186', null, now() - interval '20 days', '8227cd06-abba-462c-b835-e6543b7e3186')
on conflict (id) do nothing;

update public.deals set lost_reason = 'Found cheaper option' where id = 'f0000000-0000-0000-0000-000000000010';

-- ============================================================
-- QUOTATIONS (6)
-- ============================================================

insert into public.quotations (id, quote_no, customer_id, deal_id, status, issue_date, valid_until, subtotal, discount, vat_amount, total, notes, terms, created_by) values
  ('a1000000-0000-0000-0000-000000000001', 'QT-2026-0001', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'sent', '2026-08-01', '2026-08-31', 185000000, 0, 9250000, 194250000, 'Marina Gate 2BR purchase', 'Subject to NOC and title transfer', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16'),
  ('a1000000-0000-0000-0000-000000000002', 'QT-2026-0002', 'd0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000002', 'accepted', '2026-06-15', '2026-07-15', 380000000, 5000000, 18750000, 393750000, 'Palm Jumeirah 2BR', 'Standard terms', '945707e2-f41e-467e-8843-de246ceed7a5'),
  ('a1000000-0000-0000-0000-000000000003', 'QT-2026-0003', 'd0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000003', 'accepted', '2026-06-01', '2026-07-01', 19500000, 0, 975000, 20475000, 'Bluewaters 3BR annual rental', 'Paid in 4 cheques', '8227cd06-abba-462c-b835-e6543b7e3186'),
  ('a1000000-0000-0000-0000-000000000004', 'QT-2026-0004', 'd0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000005', 'pending_approval', '2026-08-03', '2026-09-03', 145000000, 15000000, 6500000, 136500000, 'Downtown 1BR with discount', 'Pending manager approval for discount', '945707e2-f41e-467e-8843-de246ceed7a5'),
  ('a1000000-0000-0000-0000-000000000005', 'QT-2026-0005', 'd0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000006', 'approved', '2026-07-20', '2026-08-20', 28000000, 0, 1400000, 29400000, 'DIFC Office annual rental', 'Commercial lease terms', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16'),
  ('a1000000-0000-0000-0000-000000000006', 'QT-2026-0006', 'd0000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000008', 'draft', '2026-08-05', '2026-09-05', 850000000, 0, 42500000, 892500000, 'Emirates Hills Mansion', 'Luxury property sale terms', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16')
on conflict (id) do nothing;

-- ============================================================
-- INVOICES (8)
-- ============================================================

insert into public.invoices (id, invoice_no, customer_id, deal_id, quotation_id, status, issue_date, due_date, subtotal, discount, vat_amount, total, amount_paid, notes, created_by) values
  ('a2000000-0000-0000-0000-000000000001', 'INV-2026-0001', 'd0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'paid', '2026-07-01', '2026-07-15', 380000000, 5000000, 18750000, 393750000, 393750000, 'Palm Jumeirah sale commission', '945707e2-f41e-467e-8843-de246ceed7a5'),
  ('a2000000-0000-0000-0000-000000000002', 'INV-2026-0002', 'd0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'partially_paid', '2026-06-20', '2026-07-20', 19500000, 0, 975000, 20475000, 5118750, 'Bluewaters rental — 4 cheques, 1 cleared', '8227cd06-abba-462c-b835-e6543b7e3186'),
  ('a2000000-0000-0000-0000-000000000003', 'INV-2026-0003', 'd0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000005', 'sent', '2026-07-25', '2026-08-25', 28000000, 0, 1400000, 29400000, 0, 'DIFC office rental commission', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16'),
  ('a2000000-0000-0000-0000-000000000004', 'INV-2026-0004', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', null, 'sent', '2026-08-01', '2026-08-31', 185000000, 0, 9250000, 194250000, 0, 'Marina Gate sale — pending', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16'),
  ('a2000000-0000-0000-0000-000000000005', 'INV-2026-0005', 'd0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000007', null, 'overdue', '2026-06-15', '2026-07-15', 210000000, 0, 10500000, 220500000, 0, 'Dubai Hills sale — overdue', '945707e2-f41e-467e-8843-de246ceed7a5'),
  ('a2000000-0000-0000-0000-000000000006', 'INV-2026-0006', 'd0000000-0000-0000-0000-000000000008', null, null, 'paid', '2026-05-01', '2026-05-15', 7500000, 0, 375000, 7875000, 7875000, 'JLT referral fee', '8227cd06-abba-462c-b835-e6543b7e3186'),
  ('a2000000-0000-0000-0000-000000000007', 'INV-2026-0007', 'd0000000-0000-0000-0000-000000000007', null, null, 'sent', '2026-07-15', '2026-08-15', 15000000, 0, 750000, 15750000, 0, 'Tech Solutions — consultancy', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16'),
  ('a2000000-0000-0000-0000-000000000008', 'INV-2026-0008', 'd0000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000009', null, 'draft', '2026-08-05', '2026-09-05', 165000000, 0, 8250000, 173250000, 0, 'Creek Harbour off-plan', '945707e2-f41e-467e-8843-de246ceed7a5')
on conflict (id) do nothing;

-- ============================================================
-- CHEQUES (12 — mix of statuses)
-- ============================================================

insert into public.cheques (id, direction, customer_id, payee, bank_name, cheque_no, amount, due_date, status, invoice_id, deal_id, property_id, notes, created_by) values
  ('a3000000-0000-0000-0000-000000000001', 'incoming', 'd0000000-0000-0000-0000-000000000005', null, 'Emirates NBD', 'CHQ-001', 5118750, '2026-06-20', 'cleared', 'a2000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000008', '1st of 4 PDCs', '8227cd06-abba-462c-b835-e6543b7e3186'),
  ('a3000000-0000-0000-0000-000000000002', 'incoming', 'd0000000-0000-0000-0000-000000000005', null, 'Emirates NBD', 'CHQ-002', 5118750, '2026-09-20', 'pending', 'a2000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000008', '2nd of 4 PDCs', '8227cd06-abba-462c-b835-e6543b7e3186'),
  ('a3000000-0000-0000-0000-000000000003', 'incoming', 'd0000000-0000-0000-0000-000000000005', null, 'Emirates NBD', 'CHQ-003', 5118750, '2026-12-20', 'pending', 'a2000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000008', '3rd of 4 PDCs', '8227cd06-abba-462c-b835-e6543b7e3186'),
  ('a3000000-0000-0000-0000-000000000004', 'incoming', 'd0000000-0000-0000-0000-000000000005', null, 'Emirates NBD', 'CHQ-004', 5118750, '2027-03-20', 'pending', 'a2000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000008', '4th of 4 PDCs', '8227cd06-abba-462c-b835-e6543b7e3186'),
  ('a3000000-0000-0000-0000-000000000005', 'incoming', 'd0000000-0000-0000-0000-000000000004', null, 'ADCB', 'CHQ-005', 393750000, '2026-07-05', 'cleared', 'a2000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000007', 'Full payment Palm sale', '945707e2-f41e-467e-8843-de246ceed7a5'),
  ('a3000000-0000-0000-0000-000000000006', 'incoming', 'd0000000-0000-0000-0000-000000000003', null, 'Mashreq', 'CHQ-006', 29400000, '2026-08-25', 'pending', 'a2000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 'DIFC office rental', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16'),
  ('a3000000-0000-0000-0000-000000000007', 'incoming', 'd0000000-0000-0000-0000-000000000001', null, 'Emirates NBD', 'CHQ-007', 194250000, '2026-08-31', 'pending', 'a2000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Marina Gate sale', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16'),
  ('a3000000-0000-0000-0000-000000000008', 'incoming', 'd0000000-0000-0000-0000-000000000006', null, 'HSBC', 'CHQ-008', 220500000, '2026-07-15', 'bounced', 'a2000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000015', 'Bounced — insufficient funds', '945707e2-f41e-467e-8843-de246ceed7a5'),
  ('a3000000-0000-0000-0000-000000000009', 'incoming', 'd0000000-0000-0000-0000-000000000007', null, 'RAKBANK', 'CHQ-009', 15750000, '2026-08-10', 'deposited', 'a2000000-0000-0000-0000-000000000007', null, null, 'Tech Solutions consultancy', '4285d50a-1535-4b4e-89d5-0e6b10ba4a16'),
  ('a3000000-0000-0000-0000-000000000010', 'outgoing', null, 'Emaar Properties', 'Emirates NBD', 'CHQ-010', 5000000, '2026-08-15', 'pending', null, null, null, 'Marketing campaign payment', '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc'),
  ('a3000000-0000-0000-0000-000000000011', 'incoming', 'd0000000-0000-0000-0000-000000000008', null, 'ADCB', 'CHQ-011', 7875000, '2026-05-10', 'cleared', 'a2000000-0000-0000-0000-000000000006', null, null, 'JLT referral fee', '8227cd06-abba-462c-b835-e6543b7e3186'),
  ('a3000000-0000-0000-0000-000000000012', 'outgoing', null, 'Damac Real Estate', 'Mashreq', 'CHQ-012', 12000000, '2026-09-01', 'pending', null, null, null, 'Property management fee', '7cdcac40-6c6f-474f-8cec-fe0a2afaedbc')
on conflict (id) do nothing;

update public.cheques set bounce_reason = 'Insufficient funds' where id = 'a3000000-0000-0000-0000-000000000008';

-- ============================================================
-- PAYMENTS (linked to cleared cheques)
-- ============================================================

insert into public.payments (id, invoice_id, customer_id, method, amount, received_date, reference, cheque_id, created_by) values
  ('a4000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005', 'cheque', 5118750, '2026-06-20', 'CHQ-001 cleared', 'a3000000-0000-0000-0000-000000000001', '8227cd06-abba-462c-b835-e6543b7e3186'),
  ('a4000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'cheque', 393750000, '2026-07-05', 'CHQ-005 cleared', 'a3000000-0000-0000-0000-000000000005', '945707e2-f41e-467e-8843-de246ceed7a5'),
  ('a4000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000008', 'cheque', 7875000, '2026-05-10', 'CHQ-011 cleared', 'a3000000-0000-0000-0000-000000000011', '8227cd06-abba-462c-b835-e6543b7e3186')
on conflict (id) do nothing;

-- ============================================================
-- ACTIVITY LOG (sample entries)
-- ============================================================

insert into public.activity_log (actor_id, entity_type, entity_id, action, diff) values
  ('7cdcac40-6c6f-474f-8cec-fe0a2afaedbc', 'company_settings', '00000000-0000-0000-0000-000000000001', 'updated', '{"vat_rate": 5.0}'::jsonb),
  ('945707e2-f41e-467e-8843-de246ceed7a5', 'deal', 'f0000000-0000-0000-0000-000000000002', 'status_changed', '{"stage": "won"}'::jsonb),
  ('8227cd06-abba-462c-b835-e6543b7e3186', 'deal', 'f0000000-0000-0000-0000-000000000003', 'status_changed', '{"stage": "won"}'::jsonb),
  ('4285d50a-1535-4b4e-89d5-0e6b10ba4a16', 'lead', 'e0000000-0000-0000-0000-000000000003', 'created', null),
  ('945707e2-f41e-467e-8843-de246ceed7a5', 'property', 'c0000000-0000-0000-0000-000000000007', 'status_changed', '{"status": "sold"}'::jsonb),
  ('8227cd06-abba-462c-b835-e6543b7e3186', 'cheque', 'a3000000-0000-0000-0000-000000000008', 'status_changed', '{"status": "bounced"}'::jsonb);
