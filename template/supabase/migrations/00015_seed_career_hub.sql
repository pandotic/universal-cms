-- Career Hub seed data
-- Generated from JSON seed files in docs/esg_source_career_hub_package/seeds/
-- This migration is idempotent (uses ON CONFLICT upserts).

BEGIN;

-- ============================================================
-- ch_providers
-- ============================================================
INSERT INTO ch_providers (slug, name, short_description, long_description, official_url, official_youtube_channel_url, logo_url, organization_type, headquarters_region, provider_category, is_featured, is_active, sort_order)
VALUES ('ifrs-foundation', 'IFRS Foundation', 'Global standards organization offering sustainability disclosure education, courses, and the FSA Credential.', 'The IFRS Foundation supports sustainability disclosure capability building through the FSA Credential and free self-paced learning resources tied to IFRS Sustainability Disclosure Standards.', 'https://www.ifrs.org/', 'https://www.youtube.com/@IFRSFoundation/videos', NULL, 'standards_body', 'global', 'standards_and_credentialing', TRUE, TRUE, 10)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  official_url = EXCLUDED.official_url,
  official_youtube_channel_url = EXCLUDED.official_youtube_channel_url,
  logo_url = EXCLUDED.logo_url,
  organization_type = EXCLUDED.organization_type,
  headquarters_region = EXCLUDED.headquarters_region,
  provider_category = EXCLUDED.provider_category,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_providers (slug, name, short_description, long_description, official_url, official_youtube_channel_url, logo_url, organization_type, headquarters_region, provider_category, is_featured, is_active, sort_order)
VALUES ('gri', 'Global Reporting Initiative', 'Major sustainability reporting framework and professional certification provider.', 'GRI provides reporting standards, learning resources, and professional certification programs for sustainability reporting and ESG disclosure practitioners.', 'https://www.globalreporting.org/', 'https://www.youtube.com/channel/UC0ETfBwgtVLYc8SHWaYjczg', NULL, 'standards_body', 'global', 'standards_and_credentialing', TRUE, TRUE, 20)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  official_url = EXCLUDED.official_url,
  official_youtube_channel_url = EXCLUDED.official_youtube_channel_url,
  logo_url = EXCLUDED.logo_url,
  organization_type = EXCLUDED.organization_type,
  headquarters_region = EXCLUDED.headquarters_region,
  provider_category = EXCLUDED.provider_category,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_providers (slug, name, short_description, long_description, official_url, official_youtube_channel_url, logo_url, organization_type, headquarters_region, provider_category, is_featured, is_active, sort_order)
VALUES ('cfa-institute', 'CFA Institute', 'Global professional body offering sustainable investing and climate-focused finance certificates.', 'CFA Institute provides certificates and educational pathways for finance professionals integrating sustainability and climate risk into investment analysis and decision-making.', 'https://www.cfainstitute.org/', 'https://www.youtube.com/user/cfainstitute', NULL, 'professional_body', 'global', 'finance_and_investing', TRUE, TRUE, 30)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  official_url = EXCLUDED.official_url,
  official_youtube_channel_url = EXCLUDED.official_youtube_channel_url,
  logo_url = EXCLUDED.logo_url,
  organization_type = EXCLUDED.organization_type,
  headquarters_region = EXCLUDED.headquarters_region,
  provider_category = EXCLUDED.provider_category,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_providers (slug, name, short_description, long_description, official_url, official_youtube_channel_url, logo_url, organization_type, headquarters_region, provider_category, is_featured, is_active, sort_order)
VALUES ('garp', 'GARP', 'Professional body offering the SCR Certificate for climate and sustainability risk professionals.', 'GARP supports risk professionals through certification and learning programs focused on sustainability, climate risk, transition risk, and related enterprise risk topics.', 'https://www.garp.org/', 'https://www.youtube.com/@GARPvideo', NULL, 'professional_body', 'global', 'risk_management', TRUE, TRUE, 40)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  official_url = EXCLUDED.official_url,
  official_youtube_channel_url = EXCLUDED.official_youtube_channel_url,
  logo_url = EXCLUDED.logo_url,
  organization_type = EXCLUDED.organization_type,
  headquarters_region = EXCLUDED.headquarters_region,
  provider_category = EXCLUDED.provider_category,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_providers (slug, name, short_description, long_description, official_url, official_youtube_channel_url, logo_url, organization_type, headquarters_region, provider_category, is_featured, is_active, sort_order)
VALUES ('ghg-protocol', 'GHG Protocol', 'Leading greenhouse gas accounting framework with practical e-learning and webinars.', 'GHG Protocol provides foundational greenhouse gas accounting standards and practical training on corporate, scope 2, scope 3, product, and policy-related topics.', 'https://ghgprotocol.org/', 'https://www.youtube.com/channel/UCpgcM7yN5peRHDx69DLs6jA/videos', NULL, 'standards_body', 'global', 'carbon_accounting', TRUE, TRUE, 50)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  official_url = EXCLUDED.official_url,
  official_youtube_channel_url = EXCLUDED.official_youtube_channel_url,
  logo_url = EXCLUDED.logo_url,
  organization_type = EXCLUDED.organization_type,
  headquarters_region = EXCLUDED.headquarters_region,
  provider_category = EXCLUDED.provider_category,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_providers (slug, name, short_description, long_description, official_url, official_youtube_channel_url, logo_url, organization_type, headquarters_region, provider_category, is_featured, is_active, sort_order)
VALUES ('tnfd', 'Taskforce on Nature-related Financial Disclosures', 'Nature-related risk and disclosure resource provider with free learning resources.', 'TNFD offers free learning and implementation materials to help professionals understand nature-related dependencies, impacts, risks, opportunities, and disclosure practices.', 'https://tnfd.global/', 'https://www.youtube.com/@taskforcenature/videos', NULL, 'framework_body', 'global', 'nature_and_disclosure', TRUE, TRUE, 60)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  official_url = EXCLUDED.official_url,
  official_youtube_channel_url = EXCLUDED.official_youtube_channel_url,
  logo_url = EXCLUDED.logo_url,
  organization_type = EXCLUDED.organization_type,
  headquarters_region = EXCLUDED.headquarters_region,
  provider_category = EXCLUDED.provider_category,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_providers (slug, name, short_description, long_description, official_url, official_youtube_channel_url, logo_url, organization_type, headquarters_region, provider_category, is_featured, is_active, sort_order)
VALUES ('pri-academy', 'PRI Academy', 'Responsible investment training platform for investors, boards, and ESG-focused finance professionals.', 'PRI Academy provides applied training across responsible investment, ESG integration, climate risk, nature, governance, and board-level education.', 'https://priacademy.org/', 'https://www.youtube.com/@UNPRItube', NULL, 'training_provider', 'global', 'responsible_investing', TRUE, TRUE, 70)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  official_url = EXCLUDED.official_url,
  official_youtube_channel_url = EXCLUDED.official_youtube_channel_url,
  logo_url = EXCLUDED.logo_url,
  organization_type = EXCLUDED.organization_type,
  headquarters_region = EXCLUDED.headquarters_region,
  provider_category = EXCLUDED.provider_category,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_providers (slug, name, short_description, long_description, official_url, official_youtube_channel_url, logo_url, organization_type, headquarters_region, provider_category, is_featured, is_active, sort_order)
VALUES ('efrag', 'EFRAG', 'European sustainability reporting body providing ESRS guidance and knowledge resources.', 'EFRAG supports the European sustainability reporting ecosystem through ESRS guidance, implementation materials, and knowledge hub resources.', 'https://www.efrag.org/', 'https://www.youtube.com/channel/UCxcljiiUM2JD02SMuFUTUwA', NULL, 'standards_body', 'europe', 'eu_reporting', TRUE, TRUE, 80)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  official_url = EXCLUDED.official_url,
  official_youtube_channel_url = EXCLUDED.official_youtube_channel_url,
  logo_url = EXCLUDED.logo_url,
  organization_type = EXCLUDED.organization_type,
  headquarters_region = EXCLUDED.headquarters_region,
  provider_category = EXCLUDED.provider_category,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_providers (slug, name, short_description, long_description, official_url, official_youtube_channel_url, logo_url, organization_type, headquarters_region, provider_category, is_featured, is_active, sort_order)
VALUES ('cdp', 'CDP', 'Environmental disclosure organization with practical reporting and disclosure resources.', 'CDP offers disclosure systems, annual preparation materials, and practical resources for organizations reporting climate and environmental data.', 'https://www.cdp.net/en', 'https://www.youtube.com/channel/UCriW4gZMiuZsq51iLSRXdTQ', NULL, 'disclosure_platform', 'global', 'disclosure_platform', TRUE, TRUE, 90)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  official_url = EXCLUDED.official_url,
  official_youtube_channel_url = EXCLUDED.official_youtube_channel_url,
  logo_url = EXCLUDED.logo_url,
  organization_type = EXCLUDED.organization_type,
  headquarters_region = EXCLUDED.headquarters_region,
  provider_category = EXCLUDED.provider_category,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_providers (slug, name, short_description, long_description, official_url, official_youtube_channel_url, logo_url, organization_type, headquarters_region, provider_category, is_featured, is_active, sort_order)
VALUES ('isep', 'Institute of Sustainability and Environmental Professionals', 'Professional body supporting sustainability skills, training, membership pathways, and jobs.', 'ISEP provides sustainability skills frameworks, professional training, membership progression, and associated career/job resources.', 'https://www.isepglobal.org/', 'https://www.youtube.com/channel/UCIVpKvhY09EZRMytx2N1f3Q', NULL, 'professional_body', 'global', 'skills_and_professional_development', TRUE, TRUE, 100)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  official_url = EXCLUDED.official_url,
  official_youtube_channel_url = EXCLUDED.official_youtube_channel_url,
  logo_url = EXCLUDED.logo_url,
  organization_type = EXCLUDED.organization_type,
  headquarters_region = EXCLUDED.headquarters_region,
  provider_category = EXCLUDED.provider_category,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- ============================================================
-- ch_roles
-- ============================================================
INSERT INTO ch_roles (slug, name, short_description, full_description, department_context, core_skills, common_frameworks, typical_titles, beginner_path_summary, intermediate_path_summary, advanced_path_summary, progression_stage, is_featured, is_active, sort_order)
VALUES ('esg-manager', 'ESG Manager', 'Cross-functional sustainability professional coordinating strategy, reporting, and implementation.', 'The ESG Manager is the engine of a company''s sustainability programme — the person who connects strategy to execution across the organisation. Day-to-day, the role spans an unusually wide range of activities: coordinating the annual sustainability report, managing the data collection process from multiple business units, responding to investor ESG questionnaires, managing CDP submissions, liaising with external assurance providers, and translating the company''s sustainability strategy into operational plans that finance, operations, HR, and procurement can actually implement. It is fundamentally a coordination role — the ESG Manager rarely owns the underlying data or operations directly but must ensure everyone who does is aligned and reporting accurately.

ESG Managers sit within sustainability, corporate affairs, or investor relations teams, though the organisational location varies significantly. At companies where ESG is primarily a reporting and compliance function, the ESG Manager may report into the General Counsel or CFO. At companies where sustainability is a strategic priority, the role sits closer to the C-suite — sometimes reporting directly to the CEO or a Chief Sustainability Officer. The role has expanded rapidly in scope over the past five years as regulatory requirements (particularly CSRD in Europe) have elevated ESG from voluntary reporting to mandatory compliance with assurance requirements.

Salary ranges vary significantly by company size, sector, and geography. In Europe, mid-career ESG Managers at large companies earn €70,000–110,000. In the US, the range is broader: $80,000–140,000 for established roles at large corporates. Consulting and financial services firms pay at the higher end of these ranges. The role has strong career progression — experienced ESG Managers move into Head of Sustainability, Chief Sustainability Officer, or specialist roles in ESG advisory.

The skills premium in the market is moving toward regulatory depth. Candidates who deeply understand CSRD, ESRS, and ISSB requirements — and can navigate the intersection of sustainability and financial reporting — command significantly higher compensation than those with general sustainability knowledge alone. Certification through CFA ESG, GARP SCR, or GRI-accredited programmes strengthens candidates'' positioning significantly.', 'Sustainability, corporate strategy, operations, finance, reporting', '["program management","stakeholder coordination","reporting literacy","strategy translation"]'::jsonb, '["GRI","ISSB","CDP","TNFD"]'::jsonb, '["ESG Manager","Sustainability Manager","Corporate Responsibility Manager"]'::jsonb, 'Most people enter ESG management roles from adjacent functions rather than directly. The most common entry points are: sustainability analyst or coordinator roles, corporate communications or investor relations roles that develop ESG reporting skills, finance or audit roles that build data management and reporting competency, or environmental/social specialist roles (EHS, community affairs) that provide domain expertise. A small number of people enter through graduate programmes specifically in sustainable business or ESG.

For beginners building toward an ESG Manager role, the priority learning areas are: (1) foundational ESG literacy — understanding the major frameworks (GRI, ISSB, CDPCSRD) and how they relate to each other; (2) GHG accounting basics — Scope 1, 2, and 3 calculation methodologies; (3) materiality — understanding what makes an ESG topic material to a company and how materiality assessments work; and (4) stakeholder engagement — the practice of identifying and engaging with the range of stakeholders who have an interest in corporate ESG performance. Free resources from GRI, the IFRS Foundation, and CDP provide solid foundations for all of these.', 'At the intermediate stage, ESG professionals have 2–5 years of experience and are deepening specialisation while expanding their organisational influence. Key development priorities are: regulatory depth (understanding CSRD, ESRS, and national regulatory requirements in detail — this is where most value creation is happening in the market right now), assurance readiness (understanding what third-party assurance of sustainability reports requires and how to build data governance that supports it), and stakeholder management (managing the relationship with rating agencies, investors, and assurance providers effectively).

At this stage, formal credentials significantly strengthen career positioning. The GRI Professional certification, CFA Institute Certificate in ESG Investing, or GARP Sustainability and Climate Risk (SCR) designation all signal technical depth to employers. Building hands-on experience with ESG reporting software (Workiva, Sweep, Watershed, or similar platforms) and familiarity with CDP questionnaire completion adds practical value. Developing expertise in one specialist area — whether that is Scope 3 emissions, TCFD/climate risk, or supply chain ESG — creates a differentiated profile.', 'Senior ESG professionals move into roles with board-level accountability — Head of Sustainability, VP of ESG, or Chief Sustainability Officer. At this level, the skills premium shifts from technical depth to strategic influence: the ability to connect sustainability strategy to business value creation, communicate credibly with boards and investors, and lead cross-functional programmes that align the entire organisation with sustainability commitments. Technical expertise remains important as a foundation but is less differentiating at senior levels than it is at mid-career.

The CSO path increasingly requires strong financial literacy — particularly in climate-related financial disclosures, climate risk quantification, and the integration of sustainability metrics into financial planning and capital allocation. Many senior ESG leaders are building hybrid profiles that combine sustainability expertise with finance, legal, or operations leadership experience. Executive education programmes from institutions including Cambridge Institute for Sustainability Leadership (CISL), Oxford Saïd Business School, and INSEAD provide useful structured development for professionals making this transition.', 'mid_career', TRUE, TRUE, 10)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  department_context = EXCLUDED.department_context,
  core_skills = EXCLUDED.core_skills,
  common_frameworks = EXCLUDED.common_frameworks,
  typical_titles = EXCLUDED.typical_titles,
  beginner_path_summary = EXCLUDED.beginner_path_summary,
  intermediate_path_summary = EXCLUDED.intermediate_path_summary,
  advanced_path_summary = EXCLUDED.advanced_path_summary,
  progression_stage = EXCLUDED.progression_stage,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_roles (slug, name, short_description, full_description, department_context, core_skills, common_frameworks, typical_titles, beginner_path_summary, intermediate_path_summary, advanced_path_summary, progression_stage, is_featured, is_active, sort_order)
VALUES ('reporting-disclosure-specialist', 'Reporting & Disclosure Specialist', 'Professional focused on ESG, sustainability, and regulatory reporting outputs.', 'The Reporting & Disclosure Specialist is the technical architect of a company''s external ESG communications — the person most responsible for ensuring that the company''s sustainability disclosures are accurate, complete, compliant with applicable frameworks, and produced on schedule. Where an ESG Manager has broad programmatic responsibility, the Reporting Specialist goes deep: maintaining the data dictionary, managing the reporting workflow across business units, owning the framework mapping (which data points satisfy which GRI, ISSB, or ESRS requirements), coordinating with external assurance providers, and ultimately producing the finished sustainability report or regulatory filing.

As mandatory ESG reporting has expanded — particularly with the phased introduction of CSRD for European companies — this role has shifted from a niche function to a critical compliance position. CSRD''s requirements for assured, iXBRL-tagged sustainability reports under ESRS standards have created substantial demand for specialists who understand both the regulatory requirements and the technical reporting workflows needed to satisfy them. The role increasingly sits at the intersection of sustainability and finance functions, working closely with the CFO''s office, internal audit, and legal to ensure that sustainability disclosures meet the same standards of rigour as financial reporting.

The Reporting Specialist works with ESG reporting software platforms — Workiva, Sweep, Briink, or similar — and manages the data collection and validation process that underlies disclosures. Strong data management skills are essential: the role requires an ability to spot inconsistencies, chase missing data, apply the right methodologies, and maintain audit trails that can withstand external assurance review. Attention to detail and comfort with regulatory complexity are defining characteristics of effective Reporting Specialists.

Compensation reflects the high demand for technically skilled practitioners. Mid-career Reporting Specialists at large companies in Europe earn €65,000–100,000; US equivalents earn $75,000–130,000. The role has strong progression paths into ESG Director, Head of ESG Reporting, or specialist consulting roles advising companies on regulatory compliance.', 'Sustainability, finance, legal, investor relations, ESG reporting, corporate strategy', '["reporting","stakeholder coordination","materiality","framework interpretation"]'::jsonb, '["GRI","ISSB","ESRS","CDP"]'::jsonb, '["ESG Reporting Manager","Sustainability Reporting Specialist","Disclosure Analyst"]'::jsonb, 'Reporting Specialists enter through audit, finance, or data analyst backgrounds — roles that build comfort with structured data, document controls, and compliance processes. Sustainability and environmental science backgrounds are also common entry points for those who combine domain knowledge with strong analytical skills. Graduate programmes in sustainable finance, ESG, or environmental management increasingly offer dedicated pathways into this type of role.

For beginners, the foundational priorities are: deep familiarity with at least one major reporting framework (GRI Universal Standards or ISSB IFRS S1/S2 are the highest-value starting points); practical experience with the CDP questionnaire, which is the most widely used ESG disclosure process and a good introduction to how structured reporting works; basic GHG accounting knowledge (Scope 1, 2, and at least the categories of Scope 3); and proficiency in Excel or similar data management tools as a baseline before moving to purpose-built ESG platforms. The GRI Learning Hub offers structured courses that are directly applicable to this role.', 'At the intermediate level, the priorities shift toward regulatory depth and assurance readiness. Understanding CSRD and ESRS standards in technical detail — including the double materiality assessment process, ESRS topic coverage, and iXBRL reporting requirements — is the highest-value skill for European market practitioners. Understanding what limited and reasonable assurance require in terms of data quality, audit trails, and internal controls is essential for anyone managing the assurance process.

Hands-on experience with enterprise ESG reporting software (Workiva is the market leader for complex, assurance-ready reporting; Sweep and Briink have strong CSRD capabilities) is a significant differentiator. At this stage, developing a specialist focus — whether in CSRD/ESRS compliance, ISSB/TCFD reporting, or Scope 3 data management — creates clear positioning. The GRI Professional Certification and Workiva certifications provide market-recognised credentials that validate reporting-specific expertise.', NULL, 'mid_career', TRUE, TRUE, 20)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  department_context = EXCLUDED.department_context,
  core_skills = EXCLUDED.core_skills,
  common_frameworks = EXCLUDED.common_frameworks,
  typical_titles = EXCLUDED.typical_titles,
  beginner_path_summary = EXCLUDED.beginner_path_summary,
  intermediate_path_summary = EXCLUDED.intermediate_path_summary,
  advanced_path_summary = EXCLUDED.advanced_path_summary,
  progression_stage = EXCLUDED.progression_stage,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_roles (slug, name, short_description, full_description, department_context, core_skills, common_frameworks, typical_titles, beginner_path_summary, intermediate_path_summary, advanced_path_summary, progression_stage, is_featured, is_active, sort_order)
VALUES ('climate-carbon-analyst', 'Climate / Carbon Analyst', 'Practitioner focused on GHG accounting, emissions data, and climate-related analysis.', 'The Climate / Carbon Analyst is the technical specialist responsible for greenhouse gas accounting, emissions inventory development, and climate-related data analysis. This role is the backbone of a company''s carbon measurement programme — the person who ensures that Scope 1, 2, and 3 emissions are calculated correctly, using the right methodologies and emission factors, with complete documentation that will withstand external verification. As climate disclosure requirements have expanded under CSRD, ISSB S2, and voluntary frameworks like CDP and SBTi, demand for professionals with deep GHG accounting expertise has grown substantially.

Day-to-day work includes: maintaining the Scope 1 and 2 emissions inventory (collecting activity data from facilities, applying emission factors, reconciling year-on-year changes), managing Scope 3 data collection across the 15 categories (coordinating with procurement for spend data, engaging suppliers for primary data, applying appropriate calculation methodologies), responding to CDP climate questionnaire requests, and supporting the target-setting process for science-based targets. At companies with active decarbonisation programmes, the analyst also models reduction scenarios and tracks progress against emission reduction targets.

The role sits within sustainability, environment, or corporate affairs teams, but increasingly bridges into finance as climate data becomes part of regulated financial disclosure. At larger organisations, Carbon Analysts may specialise in a subset of the work — Scope 3 specialists, climate risk analysts, or carbon market analysts are distinct sub-specialisations. At smaller organisations, one person may cover the full spectrum from inventory to reporting to target-setting.

GHG accounting is a genuinely technical discipline requiring familiarity with the GHG Protocol Corporate Standard, Scope 3 Standard, and sector-specific guidance documents. Emission factor databases (IPCC, EPA, DEFRA, IEA, EXIOBASE), carbon accounting software platforms, and verification standards (ISO 14064-3) are all practical knowledge areas. Compensation for skilled Carbon Analysts reflects this technical depth: mid-career roles at large organisations command €55,000–90,000 in Europe, $65,000–110,000 in the US.', 'Sustainability, climate, operations, consulting, carbon accounting', '["GHG accounting","data analysis","inventory development","methodology interpretation"]'::jsonb, '["GHG Protocol","ISSB","CDP"]'::jsonb, '["Carbon Analyst","Climate Analyst","GHG Accounting Specialist"]'::jsonb, 'Carbon Analysts enter through environmental science, engineering, energy, or sustainability backgrounds. A strong quantitative foundation — comfort with data, unit conversions, and working through methodological uncertainty — is as important as domain knowledge. Many people enter the field through environmental consulting roles, where exposure to a range of client GHG inventories builds technical breadth quickly.

For beginners, the essential foundations are: completing the GHG Protocol Corporate Standard (freely available) and understanding how Scope 1, 2, and 3 are defined and calculated; getting hands-on with CDP''s climate questionnaire, which provides a structured framework for the key data points and calculation approaches; building familiarity with at least one emission factor database (EPA for US context, DEFRA for UK, or the IEA for energy-related factors); and developing proficiency in data management (Excel at minimum, Python or SQL for more analytical roles). The CDP and GHG Protocol websites offer free learning resources that are directly practice-relevant.', 'At the intermediate level, the priority is deepening Scope 3 capability — the most technically demanding and highest-value area of GHG accounting. Understanding the nuances of spend-based vs. Activity-based vs. Supplier-specific calculation methods across all 15 Scope 3 categories, and knowing when to use each approach, is the defining skill of experienced Carbon Analysts. Equally important is understanding the SBTi Corporate Manual, which specifies how companies must set near-term and net zero targets and what validation requires.

Formal certification significantly strengthens positioning. The GARP Sustainability and Climate Risk (SCR) designation provides rigorous climate finance and risk training that broadens the analyst''s value beyond pure accounting. The ISO 14064 Lead Verifier certification is valuable for those moving toward verification work. Experience with purpose-built carbon accounting software (Watershed, Sweep, Persefoni, or similar) is expected at this level, as is demonstrated experience supporting CDP disclosures or SBTi target validation. Building Python or SQL skills for data pipeline automation is increasingly differentiating.', NULL, 'mid_career', TRUE, TRUE, 30)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  department_context = EXCLUDED.department_context,
  core_skills = EXCLUDED.core_skills,
  common_frameworks = EXCLUDED.common_frameworks,
  typical_titles = EXCLUDED.typical_titles,
  beginner_path_summary = EXCLUDED.beginner_path_summary,
  intermediate_path_summary = EXCLUDED.intermediate_path_summary,
  advanced_path_summary = EXCLUDED.advanced_path_summary,
  progression_stage = EXCLUDED.progression_stage,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_roles (slug, name, short_description, full_description, department_context, core_skills, common_frameworks, typical_titles, beginner_path_summary, intermediate_path_summary, advanced_path_summary, progression_stage, is_featured, is_active, sort_order)
VALUES ('sustainable-investing-analyst', 'Sustainable Investing Analyst', 'Finance professional integrating sustainability and climate considerations into investment analysis.', 'The Sustainable Investing Analyst integrates environmental, social, and governance considerations into investment research, portfolio construction, and stewardship activities. This role exists across a wide range of institutional investor types — asset managers, pension funds, insurance companies, endowments, and development finance institutions — and the precise responsibilities vary significantly by context. At an active equity manager, the role may focus on sector-level ESG risk integration and engagement with company management. At a passive manager running ESG index funds, it may focus on index methodology, ESG data quality, and proxy voting. At a private equity firm, it may encompass pre-deal ESG due diligence and portfolio-level impact measurement.

Core day-to-day activities include: accessing and analysing ESG data from providers (MSCI, Sustainalytics, S&P Global, CDP), integrating ESG analysis into investment research notes or models, conducting engagement with portfolio companies on material ESG topics, supporting proxy voting decisions on shareholder resolutions, and producing ESG-related reporting for clients or regulators. Under SFDR, many investment products now require detailed ESG disclosure that depends on the analyst''s ability to source and validate ESG data across large portfolios.

The Sustainable Investing Analyst role has evolved rapidly as ESG integration has moved from a niche to a mainstream investment practice. Increasingly, analysts are expected to quantify the financial materiality of ESG risks — translating climate scenarios into portfolio-level impact, estimating stranded asset risk, or modelling the revenue implications of regulatory changes. This requires a combination of investment analysis skills, ESG data fluency, and climate/sustainability domain knowledge that is genuinely unusual and highly sought after.

Compensation reflects both the investment context and the ESG premium. Junior analysts at major asset managers earn £40,000–65,000 in London, with senior ESG analysts and portfolio managers earning significantly more. The CFA charter combined with the CFA Institute Certificate in ESG Investing is the most recognised credential combination in this field.', 'Asset management, investment research, institutional investors, finance', '["investment analysis","ESG integration","climate valuation","stewardship literacy"]'::jsonb, '["PRI","ISSB","CFA sustainability education"]'::jsonb, '["ESG Analyst","Responsible Investment Analyst","Sustainable Investing Analyst"]'::jsonb, 'Most people enter sustainable investing from finance, economics, or investment analysis backgrounds — the investment analysis skills are foundational and hard to substitute with ESG domain knowledge alone. Some enter from environmental economics, public policy, or sustainability backgrounds and build investment analysis skills on the job or through structured learning. Graduate programmes in sustainable finance at institutions including Imperial College, Oxford, and various business schools provide direct pathways into the field.

For beginners, the priorities are: building investment analysis fundamentals (financial statement analysis, valuation, portfolio construction basics — the CFA curriculum provides a rigorous foundation); developing ESG data fluency by working through the documentation of major rating providers (MSCI, Sustainalytics) and understanding what they measure and how; completing the CFA Institute Certificate in ESG Investing, which covers ESG integration across asset classes and is widely recognised by employers in the field; and building familiarity with SFDR and how ESG regulatory requirements shape what institutional investors need to disclose.', 'At the intermediate level, developing climate finance expertise is the highest-value specialisation. Understanding TCFD and ISSB S2 climate disclosures, climate scenario analysis (NGFS scenarios, IEA pathways), physical and transition risk quantification, and the methodology behind climate-aligned portfolio construction (Paris-aligned benchmarks, net zero portfolio frameworks) positions analysts for the most demanding and best-compensated roles in the field.

The CFA charter remains the most universally respected investment credential and provides strong positioning for senior roles. Building experience with specific ESG data platforms (Bloomberg ESG Terminal, MSCI analytics tools, Sustainalytics workbench) and hands-on engagement experience — developing engagement frameworks, writing engagement letters, presenting findings to management or boards — creates distinctive practical credentials. The PRI''s climate-specific resources and its Academy courses provide structured frameworks for the engagement and stewardship dimensions of the role.', NULL, 'mid_career', TRUE, TRUE, 40)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  department_context = EXCLUDED.department_context,
  core_skills = EXCLUDED.core_skills,
  common_frameworks = EXCLUDED.common_frameworks,
  typical_titles = EXCLUDED.typical_titles,
  beginner_path_summary = EXCLUDED.beginner_path_summary,
  intermediate_path_summary = EXCLUDED.intermediate_path_summary,
  advanced_path_summary = EXCLUDED.advanced_path_summary,
  progression_stage = EXCLUDED.progression_stage,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_roles (slug, name, short_description, full_description, department_context, core_skills, common_frameworks, typical_titles, beginner_path_summary, intermediate_path_summary, advanced_path_summary, progression_stage, is_featured, is_active, sort_order)
VALUES ('climate-risk-professional', 'Climate Risk Professional', 'Risk-focused professional working on transition, physical, enterprise, or nature-related risk.', 'The Climate Risk Professional is responsible for identifying, assessing, and communicating the financial risks that climate change poses to a company or financial institution. This includes both physical risks — the direct impacts of climate change on assets, operations, and supply chains (floods, heat stress, sea level rise, wildfire) — and transition risks — the financial impacts of the shift to a low-carbon economy through policy changes, technology disruption, market shifts, and reputational factors. The role sits at the intersection of sustainability expertise and financial risk management, and is as relevant in financial services (banks, insurers, asset managers) as it is in large corporates managing their own asset and operational risk exposure.

Day-to-day responsibilities depend heavily on sector. At a bank or insurer, the Climate Risk Professional may work within the risk management function, building climate risk models, running regulatory stress tests (such as those required by the Bank of England or ECB), and assessing the climate-related transition risk in lending or underwriting portfolios. At a corporate, the role supports TCFD or ISSB S2 disclosure — running scenario analysis across short, medium, and long-term time horizons, quantifying the financial impact of climate scenarios on the business, and developing resilience strategies in response. At a regulator or central bank, it involves developing supervisory approaches, data requirements, and stress testing methodologies.

The role has been shaped significantly by the Task Force on Climate-related Financial Disclosures (TCFD), now absorbed into ISSB S2. TCFD requires companies to disclose how they assess and manage climate risk under governance, strategy, risk management, and metrics & targets pillars. The scenario analysis requirement — assessing how the business performs under different climate scenarios, including a 1.5°C and a high-physical-risk scenario — is technically demanding and has driven demand for professionals with both climate science literacy and financial modelling skills.

Compensation is strong, particularly in financial services. Climate Risk roles at major banks and insurers in London command £60,000–100,000+ at mid-senior levels. At corporates the range is wider: €55,000–90,000 in Europe for established roles. The GARP Sustainability and Climate Risk (SCR) designation is the most recognised credential specifically focused on this domain.', 'Risk, enterprise risk, banking, insurance, consulting, strategy', '["risk analysis","scenario thinking","transition risk","governance"]'::jsonb, '["GARP SCR","TNFD","ISSB"]'::jsonb, '["Climate Risk Manager","Sustainability Risk Analyst","Enterprise Risk Professional"]'::jsonb, 'Climate Risk professionals most enter from risk management, actuarial, economics, or physical/environmental science backgrounds. The risk management skill set — identifying and quantifying uncertainty, stress testing, scenario modelling — is foundational and hard to substitute with sustainability knowledge alone. Financial services backgrounds are particularly well-suited because the regulatory context (central bank climate stress tests, TCFD disclosure requirements) is deeply embedded in the financial sector.

For beginners, priority learning areas are: understanding the TCFD recommendations in full (freely available), particularly the scenario analysis requirements; gaining familiarity with major climate scenarios (NGFS scenarios, IEA Net Zero 2050, RCP/SSP physical risk scenarios) and understanding the difference between transition and physical risk pathways; completing the GARP SCR study materials, which provide a rigorous and structured curriculum covering both the physical science of climate change and its financial implications; and building data skills (Python, R, or Excel modelling) for scenario analysis work.', 'At the intermediate level, developing hands-on experience with climate scenario analysis tools and methodologies is the defining priority. Understanding how to translate NGFS or IEA scenarios into financial impacts for a specific business or portfolio requires both methodological knowledge (how are physical hazard intensities modelled? how are transition risks translated into revenue/cost impacts?) and sectoral knowledge (what are the specific transition risk factors for oil and gas, real estate, or automotive?).

The GARP SCR designation provides the most direct credential for this specialisation. Complementary credentials from the CFA Institute (climate risk coverage in the ESG Certificate) or actuarial climate risk modules are valuable depending on sector context. Building familiarity with the Chartered Insurance Institute''s climate risk resources is useful for insurance-sector roles. Developing expertise in physical risk data tools (Jupiter Intelligence, Four Twenty Seven, or similar providers) and transition risk modelling frameworks creates strong differentiation.', NULL, 'mid_career', TRUE, TRUE, 50)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  department_context = EXCLUDED.department_context,
  core_skills = EXCLUDED.core_skills,
  common_frameworks = EXCLUDED.common_frameworks,
  typical_titles = EXCLUDED.typical_titles,
  beginner_path_summary = EXCLUDED.beginner_path_summary,
  intermediate_path_summary = EXCLUDED.intermediate_path_summary,
  advanced_path_summary = EXCLUDED.advanced_path_summary,
  progression_stage = EXCLUDED.progression_stage,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_roles (slug, name, short_description, full_description, department_context, core_skills, common_frameworks, typical_titles, beginner_path_summary, intermediate_path_summary, advanced_path_summary, progression_stage, is_featured, is_active, sort_order)
VALUES ('internal-audit-assurance-professional', 'Internal Audit / Assurance Professional', 'Professional supporting ESG controls, auditability, evidence, and assurance readiness.', 'The Internal Audit / Assurance Professional with ESG focus is responsible for providing independent assurance over the quality, accuracy, and reliability of a company''s sustainability data, processes, and controls. As mandatory external assurance of sustainability reports has become a regulatory requirement under CSRD — initially to limited assurance standard, progressing to reasonable assurance — the internal audit function has become a critical first line of defence in preparing companies for external scrutiny. An ESG-focused internal auditor evaluates whether the data collection processes, calculation methodologies, approval workflows, and disclosures that underpin the sustainability report are reliable and consistent with the applicable reporting framework.

In practice, this role involves: developing and executing audit plans that cover the key ESG reporting processes and controls; testing data from source systems to final disclosure for accuracy and completeness; assessing whether stated methodologies are actually applied consistently; reviewing whether approval and sign-off processes are functioning as designed; identifying and reporting gaps to management before external assurers find them; and tracking remediation of issues identified in previous audit cycles. The role requires a combination of auditing methodology, ESG data knowledge, and regulatory awareness — understanding what ESRS, GRI, or ISSB require provides the benchmark against which controls and disclosures are assessed.

The role has grown rapidly in importance as sustainability reporting has moved from voluntary to mandatory with assurance requirements. Internal audit functions that previously had no ESG mandate are being expanded to cover sustainability data and processes. At organisations subject to CSRD, internal audit involvement in the sustainability reporting process is increasingly expected — both by external assurers (who may rely on internal audit work in their own procedures) and by audit committees (who want independent internal assurance before the external auditor arrives).

Compensation aligns with internal audit pay scales broadly, with ESG expertise commanding a premium: mid-career roles at large organisations earn €60,000–95,000 in Europe, $70,000–115,000 in the US. The CIA (Certified Internal Auditor) designation combined with ESG-specific credentials (GRI Professional, CFA ESG Certificate) represents strong positioning for this specialisation.', 'Internal audit, finance, compliance, assurance, controls', '["controls","evidence design","audit readiness","cross-functional review"]'::jsonb, '["ISSB","GRI","ESRS"]'::jsonb, '["Sustainability Assurance Manager","Internal Audit Manager","ESG Controls Lead"]'::jsonb, 'The most common entry path into ESG internal audit is through the internal audit function itself — audit professionals who develop ESG expertise on top of their core auditing skills are highly valued because the auditing methodology is foundational. Environmental, health and safety (EHS) auditing experience provides a closely adjacent entry point with relevant process and compliance auditing skills. Sustainability reporting roles that develop familiarity with data governance and controls can also transition into assurance-focused work.

For beginners looking to move into ESG assurance, the priority areas are: deeply understanding one major ESG reporting framework (GRI or ESRS/CSRD is most valuable given the regulatory mandatory assurance context); developing familiarity with the assurance standards that govern ESG verification — ISSA 5000 (the new IAASB sustainability assurance standard), ISAE 3000, and ISAE 3410; understanding what constitutes a material misstatement in sustainability data and how materiality is applied in an ESG assurance context; and building practical knowledge of data governance concepts — what data lineage means, what controls over data are expected, what an audit trail should look like.', 'At the intermediate level, the priority is developing deep familiarity with CSRD assurance requirements — specifically the ESRS standards, what limited assurance under ISSA 5000 requires, and what the progression to reasonable assurance will demand. Professionals who can advise on what internal controls, documentation, and processes are needed to satisfy external assurers at both standards are in very high demand.

The CIA designation is the most valuable core credential for career progression in internal audit. Supplementing it with GRI Professional Certification or the CSRD-specific training offered by major professional bodies provides ESG-specific depth. Developing hands-on experience leading ESG data audits — including testing data from source systems to report, assessing methodology application, and evaluating control effectiveness — builds the practical competence that distinguishes capable ESG assurance professionals from those with only theoretical knowledge.', NULL, 'senior', TRUE, TRUE, 60)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  department_context = EXCLUDED.department_context,
  core_skills = EXCLUDED.core_skills,
  common_frameworks = EXCLUDED.common_frameworks,
  typical_titles = EXCLUDED.typical_titles,
  beginner_path_summary = EXCLUDED.beginner_path_summary,
  intermediate_path_summary = EXCLUDED.intermediate_path_summary,
  advanced_path_summary = EXCLUDED.advanced_path_summary,
  progression_stage = EXCLUDED.progression_stage,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_roles (slug, name, short_description, full_description, department_context, core_skills, common_frameworks, typical_titles, beginner_path_summary, intermediate_path_summary, advanced_path_summary, progression_stage, is_featured, is_active, sort_order)
VALUES ('supply-chain-sustainability-professional', 'Supply Chain Sustainability Professional', 'Professional focused on supplier data, reporting expectations, and sustainability performance across value chains.', 'The Supply Chain Sustainability Professional is responsible for managing the environmental, social, and governance dimensions of a company''s value chain — from raw material suppliers through manufacturing, logistics, and distribution to end of life. For many companies, particularly in consumer goods, retail, apparel, food and agriculture, and electronics, the supply chain is where the vast majority of ESG risk and impact resides. This role is responsible for making that risk visible, manageable, and reportable — collecting ESG data from suppliers, assessing supply chain risks, engaging with suppliers on improvement, and supporting the company''s Scope 3 emissions disclosure and supply chain due diligence obligations.

Day-to-day work spans a wide range of activities: managing supplier ESG assessment processes (using platforms like EcoVadis, Sedex, or CDP Supply Chain to collect and track supplier ratings), coordinating Scope 3 Category 1 (purchased goods and services) data collection from key suppliers, conducting supply chain risk assessments to identify human rights and environmental risk hotspots, engaging with suppliers on sustainability performance improvement, supporting compliance with supply chain due diligence laws (LkSG, CSDDD), and contributing to the supply chain sections of sustainability reports and regulatory filings.

The role requires a combination of skills that is relatively rare: ESG data competency (particularly Scope 3 accounting and supplier assessment methodologies), procurement and supply chain process knowledge (understanding how supplier relationships are managed, what leverage points exist for driving change), and risk management capability (applying risk frameworks to complex, multi-tier supply chains with limited data). Cross-cultural communication skills are valuable given that many supply chains span multiple geographies with different legal and regulatory contexts.

Compensation varies by sector and company size. In consumer goods, retail, and apparel — the sectors with the most developed supply chain ESG functions — mid-career professionals earn €55,000–85,000 in Europe, $65,000–100,000 in the US. The CDP Supply Chain, EcoVadis certification, and GRI supply chain-specific training provide relevant credentials.', 'Procurement, operations, sustainability, supply chain, sourcing', '["supplier engagement","data collection","operational coordination","disclosure readiness"]'::jsonb, '["CDP","GHG Protocol","GRI"]'::jsonb, '["Supplier Sustainability Manager","Sustainable Procurement Lead","Supply Chain ESG Specialist"]'::jsonb, 'Supply Chain Sustainability professionals most enter from procurement, supply chain management, or sustainability backgrounds. Procurement experience is particularly valuable because it provides understanding of how supplier relationships work, what contractual mechanisms are available, and how suppliers respond to buyer requirements. Environmental health and safety (EHS) backgrounds provide relevant risk assessment skills. Development sector or NGO experience in supply chain human rights programmes is an increasingly recognised entry route.

For beginners, priority learning areas are: understanding Scope 3 Category 1 calculation methodologies (the GHG Protocol Scope 3 Standard is the core reference document); gaining hands-on familiarity with supplier assessment platforms (CDP Supply Chain is free to access as a user; EcoVadis offers training resources); understanding the human rights due diligence frameworks relevant to supply chain work (UN Guiding Principles, OECD Guidelines, and the CSDDD requirements); and building a working understanding of supply chain risk assessment — how to identify and prioritise risk by geography, commodity, and tier.', 'At the intermediate level, developing deep Scope 3 Category 1 expertise — moving from spend-based estimates to supplier-specific primary data collection — is the most technically demanding and strategically important skill. Understanding the differences between spend-based, average-data, supplier-specific, and hybrid methods, and knowing when to use each, is the hallmark of experienced Supply Chain Sustainability professionals.

Building expertise in supply chain due diligence law — particularly the CSDDD, Germany''s LkSG, and France''s Duty of Vigilance — is increasingly essential given the legal obligations these create. Hands-on experience managing an EcoVadis or Sedex supplier engagement programme, including working with suppliers to improve their scores over time, provides strong differentiation. CSRD''s ESRS S2 (value chain workers) coverage is an emerging area where supply chain professionals need to develop reporting expertise.', NULL, 'mid_career', TRUE, TRUE, 70)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  department_context = EXCLUDED.department_context,
  core_skills = EXCLUDED.core_skills,
  common_frameworks = EXCLUDED.common_frameworks,
  typical_titles = EXCLUDED.typical_titles,
  beginner_path_summary = EXCLUDED.beginner_path_summary,
  intermediate_path_summary = EXCLUDED.intermediate_path_summary,
  advanced_path_summary = EXCLUDED.advanced_path_summary,
  progression_stage = EXCLUDED.progression_stage,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_roles (slug, name, short_description, full_description, department_context, core_skills, common_frameworks, typical_titles, beginner_path_summary, intermediate_path_summary, advanced_path_summary, progression_stage, is_featured, is_active, sort_order)
VALUES ('esg-consultant', 'ESG Consultant', 'Advisor helping organizations interpret, plan, and implement ESG-related strategies and reporting.', 'The ESG Consultant advises companies on how to develop, implement, and communicate their sustainability strategies, navigate regulatory requirements, and build ESG reporting programmes. Unlike in-house ESG roles, the ESG Consultant works across multiple clients simultaneously — bringing frameworks, benchmarks, and expertise developed across engagements to each client relationship. This variety is one of the role''s defining characteristics: a good ESG Consultant in a single year might facilitate double materiality assessments for a manufacturer, develop a net zero roadmap for a retailer, advise a financial institution on SFDR classification, and guide a mid-market company through its first CSRD readiness assessment.

Day-to-day work encompasses a broad range: client meetings and workshops (including C-suite and board stakeholders), research and analysis (benchmarking, regulatory interpretation, gap analysis), report writing and presentation development, framework mapping and disclosure design, project management, and business development. The communication skills required are considerable — translating complex technical and regulatory concepts into clear, actionable advice for senior executives who may have limited sustainability backgrounds. The consulting context also requires commercial awareness: building client relationships, managing scope, and identifying opportunities to extend engagements.

ESG consulting is structured differently across firm types. The Big Four accounting firms (Deloitte, PwC, EY, KPMG) have large ESG practices combining strategy advisory with assurance capability — particularly relevant for CSRD mandates where the same firm can advise on the reporting programme and provide mandatory assurance. Specialist ESG boutiques (South Pole, ERM, Anthesis, Systemiq) offer deep technical expertise in specific domains and move faster on emerging topics like biodiversity and TNFD. Strategy firms (McKinsey, BCG) address ESG in broader business transformation contexts. The right firm and practice area depends on the type of work that most interests you.

Compensation varies by firm type and level. At the Big Four and major strategy firms, starting salaries for ESG consultants are €45,000–65,000, rising to €70,000–110,000 at manager level. Boutique ESG consultancies vary more widely. The ESG consulting market is growing rapidly, driven by mandatory regulatory requirements — making it a strong career environment for the medium term.', 'Consulting, advisory, sustainability, strategy, boutique ESG firms', '["client advisory","framework translation","presentation","cross-functional problem solving"]'::jsonb, '["GRI","ISSB","ESRS","TNFD","GHG Protocol"]'::jsonb, '["ESG Consultant","Sustainability Advisor","Climate Strategy Consultant"]'::jsonb, 'ESG consulting attracts people from diverse backgrounds: sustainability specialists who want broader sector exposure, finance or audit professionals who want to specialise in ESG, policy professionals who want to work in the private sector, and recent graduates from sustainability, environmental science, or business programmes. The consulting skill set — structured problem solving, clear communication, client management, project delivery — is as important as ESG domain knowledge, and both need to be present to succeed.

For beginners, the entry priorities are: developing a solid foundation in at least one major ESG framework (GRI or CSRD/ESRS has the highest practical relevance given regulatory demand); building familiarity with GHG accounting basics (Scope 1, 2, 3 — almost every ESG engagement touches on carbon); developing consulting core skills (structured writing, slide building, workshop facilitation) through whichever medium is available; and securing an entry-level analyst or associate role at a firm with a credible ESG practice where good mentorship and project variety are available.', 'At the intermediate level, developing a specialist positioning within ESG consulting is what drives career progression and market value. The highest-demand specialisations currently are CSRD regulatory compliance (deep ESRS knowledge, double materiality facilitation, assurance readiness), climate strategy and SBTi (net zero target setting, transition planning, Scope 3 data strategy), and TNFD/nature (biodiversity risk assessment, nature-related disclosure). Developing a recognised specialism in one of these areas while maintaining generalist ESG literacy creates strong differentiation.

Formal credentials become important at this career stage for market signalling. The combination of GRI Professional Certification and CFA ESG Certificate covers the two most credible credential frameworks. GARP SCR is valuable for climate-focused practices. Building a track record of successful engagements and client references is ultimately more important than credentials — case study experience that demonstrates tangible client outcomes (first CSRD report produced, SBTi target validated, assurance achieved) is the most compelling evidence of capability.', NULL, 'mid_career', TRUE, TRUE, 80)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  department_context = EXCLUDED.department_context,
  core_skills = EXCLUDED.core_skills,
  common_frameworks = EXCLUDED.common_frameworks,
  typical_titles = EXCLUDED.typical_titles,
  beginner_path_summary = EXCLUDED.beginner_path_summary,
  intermediate_path_summary = EXCLUDED.intermediate_path_summary,
  advanced_path_summary = EXCLUDED.advanced_path_summary,
  progression_stage = EXCLUDED.progression_stage,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_roles (slug, name, short_description, full_description, department_context, core_skills, common_frameworks, typical_titles, beginner_path_summary, intermediate_path_summary, advanced_path_summary, progression_stage, is_featured, is_active, sort_order)
VALUES ('cso-executive', 'CSO / Executive', 'Executive-level leader responsible for ESG strategy, governance, and organizational direction.', 'The Chief Sustainability Officer (CSO) or equivalent executive role is the senior leader responsible for defining, driving, and communicating the company''s sustainability strategy at board level. The CSO integrates environmental, social, and governance considerations into the organisation''s core strategy, governance structures, and external reporting — operating at the intersection of business leadership, regulatory compliance, and stakeholder management. As ESG has moved from a reputation management function to a board-level governance and regulatory compliance issue, the CSO role has correspondingly grown in seniority, scope, and strategic importance.

The CSO''s day-to-day responsibilities span the full breadth of the sustainability agenda: leading the development and periodic revision of the company''s sustainability strategy; overseeing regulatory compliance (CSRD, CSDDD, climate disclosure requirements); managing the company''s external sustainability reporting and assurance process; engaging directly with major investors on ESG matters; presenting sustainability performance and strategy to the board and audit committee; representing the company in external sustainability forums and with regulators; and leading the cross-functional teams (ESG reporting, carbon, supply chain sustainability, social impact) that execute the sustainability programme.

The CSO role requires a rare combination of capabilities: deep sustainability and ESG expertise; board-level communication and governance skills; the ability to translate sustainability into business and financial language; political savvy for navigating internal resistance to change; and credibility with external stakeholders ranging from institutional investors and rating agencies to regulators and NGOs. Many effective CSOs have hybrid profiles — former CFOs, General Counsels, or Chief Strategy Officers who have developed deep sustainability expertise, or long-tenured sustainability professionals who have developed strong business and governance skills.

Compensation for CSO roles at large public companies ranges from €200,000–500,000+ in total compensation in Europe, with US equivalents at $300,000–700,000+ for large-cap companies. The role has become a genuine executive career destination in its own right, distinct from the Head of Sustainability middle-management role from which many CSOs progress.', 'Executive leadership, board, strategy, investor relations, sustainability leadership', '["governance","strategy","stakeholder communication","board communication"]'::jsonb, '["ISSB","GRI","TNFD","PRI"]'::jsonb, '["Chief Sustainability Officer","VP Sustainability","Head of ESG"]'::jsonb, 'There is no direct entry path to CSO — it is a senior executive role reached through sustained career development. The most common progression paths are: through the sustainability function (ESG Manager → Head of Sustainability → VP/Director of ESG → CSO), through a functional leadership route (CFO, General Counsel, or COO who develops deep ESG expertise and transitions), or through external advisory (senior ESG consultant or investment professional who moves into an executive corporate role).

For those at the beginning of their careers with CSO ambitions, the foundations are: building real expertise in core ESG technical domains (GHG accounting, major reporting frameworks, regulatory requirements); developing business acumen and financial literacy as deeply as ESG knowledge — sustainability professionals who cannot speak the language of finance, risk, and business strategy rarely reach C-suite; and seeking early career experiences that build both sustainability depth and cross-functional leadership exposure.', 'At the intermediate and senior stages of the path to CSO, the priorities shift decisively from technical depth to executive presence, governance capability, and strategic influence. Developing experience presenting to boards and audit committees, engaging with activist investors and ESG rating agencies, and leading cross-functional programmes that span finance, legal, operations, and procurement is far more differentiating at senior levels than additional technical credentials.

Executive education programmes — Cambridge CISL, Oxford Saïd''s Sustainability Leadership programme, or INSEAD''s purpose leadership offerings — provide structured development for senior sustainability professionals making the transition to executive-level roles. Building a track record of delivering measurable business outcomes from sustainability programmes (cost savings from energy efficiency, risk reduction from supply chain due diligence, capital market benefits from improved ESG ratings) makes the business case for the CSO''s organisational value in the clearest terms.', 'At the CSO level, continued development focuses on governance leadership, board relationships, and strategic positioning. Developing deep expertise in one or two emerging areas — biodiversity and TNFD, climate transition planning, just transition, or AI and sustainability — positions the CSO as a thought leader and creates external profile that strengthens their credibility and influence. Board directorships — joining the board of another company, NGO, or public body as a non-executive director — develop governance skills from a board member''s perspective and build valuable networks.

Engagement with external frameworks and standard-setters at a leadership level — participating in ISSB or EFRAG consultations, serving on advisory bodies, contributing to industry taskforces — builds both expertise and external reputation. The most effective senior CSOs combine organisational delivery with external influence, helping to shape the regulatory and standard-setting environment in ways that benefit both the company and the field more broadly.', 'executive', TRUE, TRUE, 90)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  department_context = EXCLUDED.department_context,
  core_skills = EXCLUDED.core_skills,
  common_frameworks = EXCLUDED.common_frameworks,
  typical_titles = EXCLUDED.typical_titles,
  beginner_path_summary = EXCLUDED.beginner_path_summary,
  intermediate_path_summary = EXCLUDED.intermediate_path_summary,
  advanced_path_summary = EXCLUDED.advanced_path_summary,
  progression_stage = EXCLUDED.progression_stage,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_roles (slug, name, short_description, full_description, department_context, core_skills, common_frameworks, typical_titles, beginner_path_summary, intermediate_path_summary, advanced_path_summary, progression_stage, is_featured, is_active, sort_order)
VALUES ('early-career-career-switcher', 'Early Career / Career Switcher', 'Learner entering the ESG and sustainability field from school or another professional background.', 'The Early Career / Career Switcher profile represents the largest and most diverse segment of people entering the ESG and sustainability field. This includes recent graduates from sustainability, environmental science, business, law, economics, and related programmes who are starting their careers; professionals from other fields — finance, consulting, engineering, communications, policy — who want to transition into ESG roles; and individuals returning to the workforce who want to develop sustainability expertise. What unites this group is that they are building foundational ESG competencies rather than deepening established expertise.

The entry-level ESG job market is competitive and geographically concentrated. Roles are most abundant in financial centres (London, New York, Zurich, Frankfurt, Singapore, Hong Kong) and major corporate headquarters. Common entry-level titles include ESG Analyst, Sustainability Coordinator, Climate Analyst, Reporting Analyst, and ESG Research Associate. Most of these roles require a combination of analytical skills, ESG knowledge, and some evidence of practical engagement with the field — internships, academic projects, or personal learning initiatives.

The most effective early-career ESG professionals combine domain learning with practical skills that employers need immediately: data management and Excel proficiency, clear written communication, project coordination, and comfort with structured analytical frameworks. Pure domain knowledge — knowing what CSRD requires or how GHG accounting works — is valuable but needs to be paired with demonstrable practical skills. Building a portfolio of practical work (completing CDP submissions, contributing to sustainability reports, building emissions models) creates evidence of capability that is more compelling to employers than certifications alone.

The career trajectory from early-career entry depends heavily on specialisation. ESG professionals who develop deep expertise in a specific domain — regulatory reporting, climate risk, supply chain sustainability, impact investing — tend to progress faster and command higher compensation than those who remain generalists. Building that specialisation strategically, based on market demand and personal interest, is the most important career decision for early-stage professionals.', 'Career transition, entry-level, graduate, cross-functional learners', '["foundational ESG literacy","career exploration","structured learning","professional positioning"]'::jsonb, '["ISSB","GRI","TNFD","PRI"]'::jsonb, '["ESG Analyst","Sustainability Associate","Junior Climate Analyst"]'::jsonb, 'For career switchers and new entrants, the starting point is building foundational ESG literacy — understanding the major frameworks (GRI, ISSB, CSRD), the GHG accounting basics (Scope 1, 2, 3), and the key stakeholders in the ESG ecosystem (standard-setters, regulators, rating agencies, investors). This are done through free resources: the GRI Learning Hub, IFRS Foundation educational materials, CDP''s publicly available guidance documents, and Coursera or edX courses from institutions like Yale, Imperial College, and Lund University.

Practical skills are as important as knowledge. Building proficiency in Excel data management, learning to navigate ESG rating platforms, and completing a CDP questionnaire (even on a practice basis) creates practical competency. Internships — including virtual internships with sustainability teams — provide the most direct evidence of capability for early-career job applications. LinkedIn Learning, GRI Academy, and the GARP SCR preparation materials all offer structured self-study options that signal commitment and developing expertise to prospective employers.', 'At the intermediate stage (2–4 years into an ESG career), the priority is developing a defined specialisation and building credentials that validate that expertise. The highest-demand specialisations in the current market are CSRD/regulatory compliance (given the wave of mandatory adoption across European companies), climate and carbon (GHG accounting, SBTi, net zero strategy), and sustainable investing (ESG integration, climate risk, SFDR). Choosing a specialism based on genuine interest and market opportunity — and building deep knowledge in that area — creates the differentiated profile that drives career acceleration.

Formal credentials matter at this career stage. The GRI Professional Certification, CFA Institute Certificate in ESG Investing, and GARP SCR designation are the three most widely recognised in the market. Building hands-on experience with ESG software platforms (Workiva, Watershed, Sweep, or similar) adds practical differentiation. Developing a professional network through industry associations (EFRAG, PRI, TCFD-aligned networks) and events accelerates both learning and career opportunities significantly.', NULL, 'early_career', TRUE, TRUE, 100)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  department_context = EXCLUDED.department_context,
  core_skills = EXCLUDED.core_skills,
  common_frameworks = EXCLUDED.common_frameworks,
  typical_titles = EXCLUDED.typical_titles,
  beginner_path_summary = EXCLUDED.beginner_path_summary,
  intermediate_path_summary = EXCLUDED.intermediate_path_summary,
  advanced_path_summary = EXCLUDED.advanced_path_summary,
  progression_stage = EXCLUDED.progression_stage,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- ============================================================
-- ch_tags
-- ============================================================
INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('esg-fundamentals', 'ESG Fundamentals', NULL, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('sustainability-reporting', 'Sustainability Reporting', NULL, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('disclosure', 'Disclosure', NULL, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('issb', 'ISSB', NULL, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('ifrs-s1', 'IFRS S1', NULL, FALSE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('ifrs-s2', 'IFRS S2', NULL, FALSE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('gri', 'GRI', NULL, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('esrs', 'ESRS', NULL, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('csrd', 'CSRD', NULL, FALSE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('carbon-accounting', 'Carbon Accounting', NULL, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('ghg-accounting', 'GHG Accounting', NULL, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('scope-3', 'Scope 3', NULL, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('climate-risk', 'Climate Risk', NULL, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('transition-planning', 'Transition Planning', NULL, FALSE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('sustainable-finance', 'Sustainable Finance', NULL, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('responsible-investment', 'Responsible Investment', NULL, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('nature-risk', 'Nature Risk', NULL, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('biodiversity', 'Biodiversity', NULL, FALSE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('assurance', 'Assurance', NULL, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('internal-controls', 'Internal Controls', NULL, FALSE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('board-education', 'Board Education', NULL, FALSE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('supplier-disclosure', 'Supplier Disclosure', NULL, FALSE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

INSERT INTO ch_tags (slug, name, description, is_featured)
VALUES ('materiality', 'Materiality', NULL, FALSE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

-- ============================================================
-- ch_job_sources
-- ============================================================
INSERT INTO ch_job_sources (slug, source_name, source_url, description, category, is_external, is_featured, is_active, sort_order)
VALUES ('isep-jobs', 'ISEP Jobs', 'https://www.isepjobs.org/jobs/', 'Professional sustainability and environmental job board connected to a recognized professional body.', 'sustainability_jobs', TRUE, TRUE, TRUE, 10)
ON CONFLICT (slug) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_url = EXCLUDED.source_url,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_external = EXCLUDED.is_external,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_job_sources (slug, source_name, source_url, description, category, is_external, is_featured, is_active, sort_order)
VALUES ('climatebase', 'Climatebase', 'https://climatebase.org/', 'Climate and sustainability career platform with job discovery and broader climate career resources.', 'climate_jobs', TRUE, TRUE, TRUE, 20)
ON CONFLICT (slug) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_url = EXCLUDED.source_url,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_external = EXCLUDED.is_external,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_job_sources (slug, source_name, source_url, description, category, is_external, is_featured, is_active, sort_order)
VALUES ('trellis-jobs', 'Trellis Jobs', 'https://jobs.trellis.net/', 'Sustainability-focused job resource connected to a recognized professional media/community ecosystem.', 'sustainability_jobs', TRUE, TRUE, TRUE, 30)
ON CONFLICT (slug) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_url = EXCLUDED.source_url,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_external = EXCLUDED.is_external,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- ============================================================
-- ch_programs
-- ============================================================
INSERT INTO ch_programs (provider_id, slug, title, program_type, short_summary, full_description, official_url, program_status, is_free, price_text, price_min, price_max, currency, duration_text, estimated_hours, level, format, exam_required, certificate_of_completion, credential_awarded, credential_name, renewal_required, renewal_text, continuing_education_text, prerequisite_text, official_video_embed_url, official_video_url, is_featured, is_active, featured_rank, last_verified_at)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'ifrs-foundation'), 'fsa-credential', 'FSA Credential', 'certification', 'Two-part sustainability disclosure and analysis credential for finance and reporting professionals.', NULL, 'https://www.ifrs.org/products-and-services/sustainability-products-and-services/fsa-credential/', 'active', FALSE, 'Level I and Level II priced separately; see official page.', 450, 650, 'USD', 'Self-paced', NULL, 'intermediate', 'self_paced', TRUE, FALSE, TRUE, 'FSA Credential', FALSE, NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, 10, '2026-03-19T00:00:00Z')
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  program_type = EXCLUDED.program_type,
  short_summary = EXCLUDED.short_summary,
  full_description = EXCLUDED.full_description,
  official_url = EXCLUDED.official_url,
  program_status = EXCLUDED.program_status,
  is_free = EXCLUDED.is_free,
  price_text = EXCLUDED.price_text,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  duration_text = EXCLUDED.duration_text,
  estimated_hours = EXCLUDED.estimated_hours,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  exam_required = EXCLUDED.exam_required,
  certificate_of_completion = EXCLUDED.certificate_of_completion,
  credential_awarded = EXCLUDED.credential_awarded,
  credential_name = EXCLUDED.credential_name,
  renewal_required = EXCLUDED.renewal_required,
  renewal_text = EXCLUDED.renewal_text,
  continuing_education_text = EXCLUDED.continuing_education_text,
  prerequisite_text = EXCLUDED.prerequisite_text,
  official_video_embed_url = EXCLUDED.official_video_embed_url,
  official_video_url = EXCLUDED.official_video_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  featured_rank = EXCLUDED.featured_rank,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO ch_programs (provider_id, slug, title, program_type, short_summary, full_description, official_url, program_status, is_free, price_text, price_min, price_max, currency, duration_text, estimated_hours, level, format, exam_required, certificate_of_completion, credential_awarded, credential_name, renewal_required, renewal_text, continuing_education_text, prerequisite_text, official_video_embed_url, official_video_url, is_featured, is_active, featured_rank, last_verified_at)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'ifrs-foundation'), 'ifrs-sustainability-knowledge-hub-courses', 'IFRS Sustainability Knowledge Hub Courses', 'course', 'Free self-paced learning modules on IFRS Sustainability Disclosure Standards.', NULL, 'https://www.ifrs.org/sustainability/knowledge-hub/courses/', 'active', TRUE, 'Free', 0, 0, 'USD', 'Self-paced modules', 13, 'beginner', 'self_paced', FALSE, TRUE, FALSE, NULL, FALSE, NULL, 'May support CPD/CPE depending on module.', NULL, NULL, NULL, TRUE, TRUE, 20, '2026-03-19T00:00:00Z')
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  program_type = EXCLUDED.program_type,
  short_summary = EXCLUDED.short_summary,
  full_description = EXCLUDED.full_description,
  official_url = EXCLUDED.official_url,
  program_status = EXCLUDED.program_status,
  is_free = EXCLUDED.is_free,
  price_text = EXCLUDED.price_text,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  duration_text = EXCLUDED.duration_text,
  estimated_hours = EXCLUDED.estimated_hours,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  exam_required = EXCLUDED.exam_required,
  certificate_of_completion = EXCLUDED.certificate_of_completion,
  credential_awarded = EXCLUDED.credential_awarded,
  credential_name = EXCLUDED.credential_name,
  renewal_required = EXCLUDED.renewal_required,
  renewal_text = EXCLUDED.renewal_text,
  continuing_education_text = EXCLUDED.continuing_education_text,
  prerequisite_text = EXCLUDED.prerequisite_text,
  official_video_embed_url = EXCLUDED.official_video_embed_url,
  official_video_url = EXCLUDED.official_video_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  featured_rank = EXCLUDED.featured_rank,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO ch_programs (provider_id, slug, title, program_type, short_summary, full_description, official_url, program_status, is_free, price_text, price_min, price_max, currency, duration_text, estimated_hours, level, format, exam_required, certificate_of_completion, credential_awarded, credential_name, renewal_required, renewal_text, continuing_education_text, prerequisite_text, official_video_embed_url, official_video_url, is_featured, is_active, featured_rank, last_verified_at)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'gri'), 'gri-professional-certification-program', 'GRI Professional Certification Program', 'certification', 'Professional certification pathway for sustainability reporting practitioners.', NULL, 'https://www.globalreporting.org/academy/certification/', 'active', FALSE, 'Pricing varies by route; see official page.', NULL, NULL, 'EUR', 'Self-paced or training-partner route', NULL, 'intermediate', 'hybrid', TRUE, FALSE, TRUE, 'GRI Certified Sustainability Professional', TRUE, 'Renewed through continuing education requirements.', 'Continuing education units required.', NULL, NULL, NULL, TRUE, TRUE, 30, '2026-03-19T00:00:00Z')
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  program_type = EXCLUDED.program_type,
  short_summary = EXCLUDED.short_summary,
  full_description = EXCLUDED.full_description,
  official_url = EXCLUDED.official_url,
  program_status = EXCLUDED.program_status,
  is_free = EXCLUDED.is_free,
  price_text = EXCLUDED.price_text,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  duration_text = EXCLUDED.duration_text,
  estimated_hours = EXCLUDED.estimated_hours,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  exam_required = EXCLUDED.exam_required,
  certificate_of_completion = EXCLUDED.certificate_of_completion,
  credential_awarded = EXCLUDED.credential_awarded,
  credential_name = EXCLUDED.credential_name,
  renewal_required = EXCLUDED.renewal_required,
  renewal_text = EXCLUDED.renewal_text,
  continuing_education_text = EXCLUDED.continuing_education_text,
  prerequisite_text = EXCLUDED.prerequisite_text,
  official_video_embed_url = EXCLUDED.official_video_embed_url,
  official_video_url = EXCLUDED.official_video_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  featured_rank = EXCLUDED.featured_rank,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO ch_programs (provider_id, slug, title, program_type, short_summary, full_description, official_url, program_status, is_free, price_text, price_min, price_max, currency, duration_text, estimated_hours, level, format, exam_required, certificate_of_completion, credential_awarded, credential_name, renewal_required, renewal_text, continuing_education_text, prerequisite_text, official_video_embed_url, official_video_url, is_featured, is_active, featured_rank, last_verified_at)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'gri'), 'gri-academy', 'GRI Academy', 'learning_library', 'Learning library and training platform for GRI-related reporting education.', NULL, 'https://www.globalreporting.org/reporting-support/education/gri-academy/', 'active', FALSE, 'Varies by training item.', NULL, NULL, 'EUR', 'Varies', NULL, 'mixed', 'resource_library', FALSE, TRUE, FALSE, NULL, FALSE, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 40, '2026-03-19T00:00:00Z')
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  program_type = EXCLUDED.program_type,
  short_summary = EXCLUDED.short_summary,
  full_description = EXCLUDED.full_description,
  official_url = EXCLUDED.official_url,
  program_status = EXCLUDED.program_status,
  is_free = EXCLUDED.is_free,
  price_text = EXCLUDED.price_text,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  duration_text = EXCLUDED.duration_text,
  estimated_hours = EXCLUDED.estimated_hours,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  exam_required = EXCLUDED.exam_required,
  certificate_of_completion = EXCLUDED.certificate_of_completion,
  credential_awarded = EXCLUDED.credential_awarded,
  credential_name = EXCLUDED.credential_name,
  renewal_required = EXCLUDED.renewal_required,
  renewal_text = EXCLUDED.renewal_text,
  continuing_education_text = EXCLUDED.continuing_education_text,
  prerequisite_text = EXCLUDED.prerequisite_text,
  official_video_embed_url = EXCLUDED.official_video_embed_url,
  official_video_url = EXCLUDED.official_video_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  featured_rank = EXCLUDED.featured_rank,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO ch_programs (provider_id, slug, title, program_type, short_summary, full_description, official_url, program_status, is_free, price_text, price_min, price_max, currency, duration_text, estimated_hours, level, format, exam_required, certificate_of_completion, credential_awarded, credential_name, renewal_required, renewal_text, continuing_education_text, prerequisite_text, official_video_embed_url, official_video_url, is_featured, is_active, featured_rank, last_verified_at)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'cfa-institute'), 'cfa-sustainable-investing-certificate', 'Sustainable Investing Certificate', 'certificate_program', 'Foundational sustainable investing certificate for finance and investment professionals.', NULL, 'https://www.cfainstitute.org/programs/sustainable-investing-certificate', 'active', FALSE, 'See official page for current pricing.', 890, 890, 'USD', 'Self-paced', 100, 'beginner', 'self_paced', TRUE, FALSE, TRUE, 'Sustainable Investing Certificate', FALSE, NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, 50, '2026-03-19T00:00:00Z')
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  program_type = EXCLUDED.program_type,
  short_summary = EXCLUDED.short_summary,
  full_description = EXCLUDED.full_description,
  official_url = EXCLUDED.official_url,
  program_status = EXCLUDED.program_status,
  is_free = EXCLUDED.is_free,
  price_text = EXCLUDED.price_text,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  duration_text = EXCLUDED.duration_text,
  estimated_hours = EXCLUDED.estimated_hours,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  exam_required = EXCLUDED.exam_required,
  certificate_of_completion = EXCLUDED.certificate_of_completion,
  credential_awarded = EXCLUDED.credential_awarded,
  credential_name = EXCLUDED.credential_name,
  renewal_required = EXCLUDED.renewal_required,
  renewal_text = EXCLUDED.renewal_text,
  continuing_education_text = EXCLUDED.continuing_education_text,
  prerequisite_text = EXCLUDED.prerequisite_text,
  official_video_embed_url = EXCLUDED.official_video_embed_url,
  official_video_url = EXCLUDED.official_video_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  featured_rank = EXCLUDED.featured_rank,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO ch_programs (provider_id, slug, title, program_type, short_summary, full_description, official_url, program_status, is_free, price_text, price_min, price_max, currency, duration_text, estimated_hours, level, format, exam_required, certificate_of_completion, credential_awarded, credential_name, renewal_required, renewal_text, continuing_education_text, prerequisite_text, official_video_embed_url, official_video_url, is_featured, is_active, featured_rank, last_verified_at)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'cfa-institute'), 'cfa-climate-risk-valuation-investing-certificate', 'Climate Risk, Valuation, and Investing Certificate', 'certificate_program', 'Advanced climate-focused certificate for finance professionals.', NULL, 'https://www.cfainstitute.org/programs/climate-investing-certificate', 'active', FALSE, 'See official page for current pricing.', 1590, 1590, 'USD', 'Self-paced multi-course series', 100, 'advanced', 'self_paced', FALSE, TRUE, TRUE, 'Climate Risk, Valuation, and Investing Certificate', FALSE, NULL, NULL, 'Best suited for learners with finance background.', NULL, NULL, TRUE, TRUE, 60, '2026-03-19T00:00:00Z')
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  program_type = EXCLUDED.program_type,
  short_summary = EXCLUDED.short_summary,
  full_description = EXCLUDED.full_description,
  official_url = EXCLUDED.official_url,
  program_status = EXCLUDED.program_status,
  is_free = EXCLUDED.is_free,
  price_text = EXCLUDED.price_text,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  duration_text = EXCLUDED.duration_text,
  estimated_hours = EXCLUDED.estimated_hours,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  exam_required = EXCLUDED.exam_required,
  certificate_of_completion = EXCLUDED.certificate_of_completion,
  credential_awarded = EXCLUDED.credential_awarded,
  credential_name = EXCLUDED.credential_name,
  renewal_required = EXCLUDED.renewal_required,
  renewal_text = EXCLUDED.renewal_text,
  continuing_education_text = EXCLUDED.continuing_education_text,
  prerequisite_text = EXCLUDED.prerequisite_text,
  official_video_embed_url = EXCLUDED.official_video_embed_url,
  official_video_url = EXCLUDED.official_video_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  featured_rank = EXCLUDED.featured_rank,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO ch_programs (provider_id, slug, title, program_type, short_summary, full_description, official_url, program_status, is_free, price_text, price_min, price_max, currency, duration_text, estimated_hours, level, format, exam_required, certificate_of_completion, credential_awarded, credential_name, renewal_required, renewal_text, continuing_education_text, prerequisite_text, official_video_embed_url, official_video_url, is_featured, is_active, featured_rank, last_verified_at)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'garp'), 'garp-scr-certificate', 'SCR Certificate', 'certification', 'Climate and sustainability risk credential for risk professionals.', NULL, 'https://www.garp.org/scr', 'active', FALSE, 'Pricing varies by window and membership; see official fees page.', 525, 750, 'USD', 'Self-paced exam preparation', 125, 'intermediate', 'self_paced', TRUE, FALSE, TRUE, 'SCR Certificate', FALSE, NULL, 'Continuing professional development is encouraged.', NULL, NULL, NULL, TRUE, TRUE, 70, '2026-03-19T00:00:00Z')
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  program_type = EXCLUDED.program_type,
  short_summary = EXCLUDED.short_summary,
  full_description = EXCLUDED.full_description,
  official_url = EXCLUDED.official_url,
  program_status = EXCLUDED.program_status,
  is_free = EXCLUDED.is_free,
  price_text = EXCLUDED.price_text,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  duration_text = EXCLUDED.duration_text,
  estimated_hours = EXCLUDED.estimated_hours,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  exam_required = EXCLUDED.exam_required,
  certificate_of_completion = EXCLUDED.certificate_of_completion,
  credential_awarded = EXCLUDED.credential_awarded,
  credential_name = EXCLUDED.credential_name,
  renewal_required = EXCLUDED.renewal_required,
  renewal_text = EXCLUDED.renewal_text,
  continuing_education_text = EXCLUDED.continuing_education_text,
  prerequisite_text = EXCLUDED.prerequisite_text,
  official_video_embed_url = EXCLUDED.official_video_embed_url,
  official_video_url = EXCLUDED.official_video_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  featured_rank = EXCLUDED.featured_rank,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO ch_programs (provider_id, slug, title, program_type, short_summary, full_description, official_url, program_status, is_free, price_text, price_min, price_max, currency, duration_text, estimated_hours, level, format, exam_required, certificate_of_completion, credential_awarded, credential_name, renewal_required, renewal_text, continuing_education_text, prerequisite_text, official_video_embed_url, official_video_url, is_featured, is_active, featured_rank, last_verified_at)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'ghg-protocol'), 'ghg-protocol-e-learning-opportunities', 'GHG Protocol E-Learning Opportunities', 'learning_library', 'Practical greenhouse gas accounting training catalog covering corporate, scope 2, scope 3, product, and policy topics.', NULL, 'https://ghgprotocol.org/e-learning-opportunities', 'active', FALSE, 'Free and paid options available; see official catalog.', 0, 600, 'USD', 'Varies by course or webinar', NULL, 'mixed', 'resource_library', FALSE, TRUE, FALSE, NULL, FALSE, NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, 80, '2026-03-19T00:00:00Z')
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  program_type = EXCLUDED.program_type,
  short_summary = EXCLUDED.short_summary,
  full_description = EXCLUDED.full_description,
  official_url = EXCLUDED.official_url,
  program_status = EXCLUDED.program_status,
  is_free = EXCLUDED.is_free,
  price_text = EXCLUDED.price_text,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  duration_text = EXCLUDED.duration_text,
  estimated_hours = EXCLUDED.estimated_hours,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  exam_required = EXCLUDED.exam_required,
  certificate_of_completion = EXCLUDED.certificate_of_completion,
  credential_awarded = EXCLUDED.credential_awarded,
  credential_name = EXCLUDED.credential_name,
  renewal_required = EXCLUDED.renewal_required,
  renewal_text = EXCLUDED.renewal_text,
  continuing_education_text = EXCLUDED.continuing_education_text,
  prerequisite_text = EXCLUDED.prerequisite_text,
  official_video_embed_url = EXCLUDED.official_video_embed_url,
  official_video_url = EXCLUDED.official_video_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  featured_rank = EXCLUDED.featured_rank,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO ch_programs (provider_id, slug, title, program_type, short_summary, full_description, official_url, program_status, is_free, price_text, price_min, price_max, currency, duration_text, estimated_hours, level, format, exam_required, certificate_of_completion, credential_awarded, credential_name, renewal_required, renewal_text, continuing_education_text, prerequisite_text, official_video_embed_url, official_video_url, is_featured, is_active, featured_rank, last_verified_at)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'tnfd'), 'tnfd-learning-lab', 'TNFD Learning Lab', 'course', 'Free self-paced TNFD learning experience for nature-related risk and disclosure literacy.', NULL, 'https://tnfd.global/knowledge-hub/learning-lab-landing/', 'active', TRUE, 'Free', 0, 0, 'USD', 'Self-paced modules', NULL, 'beginner', 'self_paced', FALSE, FALSE, FALSE, NULL, FALSE, NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, 90, '2026-03-19T00:00:00Z')
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  program_type = EXCLUDED.program_type,
  short_summary = EXCLUDED.short_summary,
  full_description = EXCLUDED.full_description,
  official_url = EXCLUDED.official_url,
  program_status = EXCLUDED.program_status,
  is_free = EXCLUDED.is_free,
  price_text = EXCLUDED.price_text,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  duration_text = EXCLUDED.duration_text,
  estimated_hours = EXCLUDED.estimated_hours,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  exam_required = EXCLUDED.exam_required,
  certificate_of_completion = EXCLUDED.certificate_of_completion,
  credential_awarded = EXCLUDED.credential_awarded,
  credential_name = EXCLUDED.credential_name,
  renewal_required = EXCLUDED.renewal_required,
  renewal_text = EXCLUDED.renewal_text,
  continuing_education_text = EXCLUDED.continuing_education_text,
  prerequisite_text = EXCLUDED.prerequisite_text,
  official_video_embed_url = EXCLUDED.official_video_embed_url,
  official_video_url = EXCLUDED.official_video_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  featured_rank = EXCLUDED.featured_rank,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO ch_programs (provider_id, slug, title, program_type, short_summary, full_description, official_url, program_status, is_free, price_text, price_min, price_max, currency, duration_text, estimated_hours, level, format, exam_required, certificate_of_completion, credential_awarded, credential_name, renewal_required, renewal_text, continuing_education_text, prerequisite_text, official_video_embed_url, official_video_url, is_featured, is_active, featured_rank, last_verified_at)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'pri-academy'), 'pri-responsible-investment-in-60-minutes', 'Responsible Investment in 60 Minutes', 'course', 'Short introductory responsible investment course.', NULL, 'https://priacademy.org/courses/responsible-investment-in-60-minutes/', 'active', FALSE, 'See official page for pricing.', NULL, NULL, 'GBP', '1 hour', 1, 'beginner', 'self_paced', FALSE, TRUE, FALSE, NULL, FALSE, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 100, '2026-03-19T00:00:00Z')
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  program_type = EXCLUDED.program_type,
  short_summary = EXCLUDED.short_summary,
  full_description = EXCLUDED.full_description,
  official_url = EXCLUDED.official_url,
  program_status = EXCLUDED.program_status,
  is_free = EXCLUDED.is_free,
  price_text = EXCLUDED.price_text,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  duration_text = EXCLUDED.duration_text,
  estimated_hours = EXCLUDED.estimated_hours,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  exam_required = EXCLUDED.exam_required,
  certificate_of_completion = EXCLUDED.certificate_of_completion,
  credential_awarded = EXCLUDED.credential_awarded,
  credential_name = EXCLUDED.credential_name,
  renewal_required = EXCLUDED.renewal_required,
  renewal_text = EXCLUDED.renewal_text,
  continuing_education_text = EXCLUDED.continuing_education_text,
  prerequisite_text = EXCLUDED.prerequisite_text,
  official_video_embed_url = EXCLUDED.official_video_embed_url,
  official_video_url = EXCLUDED.official_video_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  featured_rank = EXCLUDED.featured_rank,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO ch_programs (provider_id, slug, title, program_type, short_summary, full_description, official_url, program_status, is_free, price_text, price_min, price_max, currency, duration_text, estimated_hours, level, format, exam_required, certificate_of_completion, credential_awarded, credential_name, renewal_required, renewal_text, continuing_education_text, prerequisite_text, official_video_embed_url, official_video_url, is_featured, is_active, featured_rank, last_verified_at)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'pri-academy'), 'pri-understanding-esg', 'Understanding ESG', 'course', 'Foundational ESG course for investors and finance professionals.', NULL, 'https://priacademy.org/courses/understanding-esg/', 'active', FALSE, 'See official page for pricing.', NULL, NULL, 'GBP', '3 hours', 3, 'beginner', 'self_paced', FALSE, TRUE, FALSE, NULL, FALSE, NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, 110, '2026-03-19T00:00:00Z')
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  program_type = EXCLUDED.program_type,
  short_summary = EXCLUDED.short_summary,
  full_description = EXCLUDED.full_description,
  official_url = EXCLUDED.official_url,
  program_status = EXCLUDED.program_status,
  is_free = EXCLUDED.is_free,
  price_text = EXCLUDED.price_text,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  duration_text = EXCLUDED.duration_text,
  estimated_hours = EXCLUDED.estimated_hours,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  exam_required = EXCLUDED.exam_required,
  certificate_of_completion = EXCLUDED.certificate_of_completion,
  credential_awarded = EXCLUDED.credential_awarded,
  credential_name = EXCLUDED.credential_name,
  renewal_required = EXCLUDED.renewal_required,
  renewal_text = EXCLUDED.renewal_text,
  continuing_education_text = EXCLUDED.continuing_education_text,
  prerequisite_text = EXCLUDED.prerequisite_text,
  official_video_embed_url = EXCLUDED.official_video_embed_url,
  official_video_url = EXCLUDED.official_video_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  featured_rank = EXCLUDED.featured_rank,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO ch_programs (provider_id, slug, title, program_type, short_summary, full_description, official_url, program_status, is_free, price_text, price_min, price_max, currency, duration_text, estimated_hours, level, format, exam_required, certificate_of_completion, credential_awarded, credential_name, renewal_required, renewal_text, continuing_education_text, prerequisite_text, official_video_embed_url, official_video_url, is_featured, is_active, featured_rank, last_verified_at)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'pri-academy'), 'pri-applied-responsible-investment', 'Applied Responsible Investment', 'course', 'Applied responsible investment training for practitioners seeking deeper investor-focused capability.', NULL, 'https://priacademy.org/courses/applied-responsible-investment/', 'active', FALSE, 'See official page for pricing.', NULL, NULL, 'GBP', '15 hours', 15, 'intermediate', 'self_paced', FALSE, TRUE, FALSE, NULL, FALSE, NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, 120, '2026-03-19T00:00:00Z')
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  program_type = EXCLUDED.program_type,
  short_summary = EXCLUDED.short_summary,
  full_description = EXCLUDED.full_description,
  official_url = EXCLUDED.official_url,
  program_status = EXCLUDED.program_status,
  is_free = EXCLUDED.is_free,
  price_text = EXCLUDED.price_text,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  duration_text = EXCLUDED.duration_text,
  estimated_hours = EXCLUDED.estimated_hours,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  exam_required = EXCLUDED.exam_required,
  certificate_of_completion = EXCLUDED.certificate_of_completion,
  credential_awarded = EXCLUDED.credential_awarded,
  credential_name = EXCLUDED.credential_name,
  renewal_required = EXCLUDED.renewal_required,
  renewal_text = EXCLUDED.renewal_text,
  continuing_education_text = EXCLUDED.continuing_education_text,
  prerequisite_text = EXCLUDED.prerequisite_text,
  official_video_embed_url = EXCLUDED.official_video_embed_url,
  official_video_url = EXCLUDED.official_video_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  featured_rank = EXCLUDED.featured_rank,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO ch_programs (provider_id, slug, title, program_type, short_summary, full_description, official_url, program_status, is_free, price_text, price_min, price_max, currency, duration_text, estimated_hours, level, format, exam_required, certificate_of_completion, credential_awarded, credential_name, renewal_required, renewal_text, continuing_education_text, prerequisite_text, official_video_embed_url, official_video_url, is_featured, is_active, featured_rank, last_verified_at)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'pri-academy'), 'pri-responsible-investment-for-boards-and-trustees', 'Responsible Investment for Boards and Trustees', 'course', 'Board and governance-focused responsible investment course.', NULL, 'https://priacademy.org/courses/responsible-investment-for-boards-and-trustees/', 'active', FALSE, 'See official page for pricing.', NULL, NULL, 'GBP', '1.5 hours', 2, 'beginner', 'self_paced', FALSE, TRUE, FALSE, NULL, FALSE, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 130, '2026-03-19T00:00:00Z')
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  program_type = EXCLUDED.program_type,
  short_summary = EXCLUDED.short_summary,
  full_description = EXCLUDED.full_description,
  official_url = EXCLUDED.official_url,
  program_status = EXCLUDED.program_status,
  is_free = EXCLUDED.is_free,
  price_text = EXCLUDED.price_text,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  duration_text = EXCLUDED.duration_text,
  estimated_hours = EXCLUDED.estimated_hours,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  exam_required = EXCLUDED.exam_required,
  certificate_of_completion = EXCLUDED.certificate_of_completion,
  credential_awarded = EXCLUDED.credential_awarded,
  credential_name = EXCLUDED.credential_name,
  renewal_required = EXCLUDED.renewal_required,
  renewal_text = EXCLUDED.renewal_text,
  continuing_education_text = EXCLUDED.continuing_education_text,
  prerequisite_text = EXCLUDED.prerequisite_text,
  official_video_embed_url = EXCLUDED.official_video_embed_url,
  official_video_url = EXCLUDED.official_video_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  featured_rank = EXCLUDED.featured_rank,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO ch_programs (provider_id, slug, title, program_type, short_summary, full_description, official_url, program_status, is_free, price_text, price_min, price_max, currency, duration_text, estimated_hours, level, format, exam_required, certificate_of_completion, credential_awarded, credential_name, renewal_required, renewal_text, continuing_education_text, prerequisite_text, official_video_embed_url, official_video_url, is_featured, is_active, featured_rank, last_verified_at)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'efrag'), 'efrag-esrs-knowledge-hub', 'ESRS Knowledge Hub', 'knowledge_hub', 'Official ESRS implementation and reference resource.', NULL, 'https://knowledgehub.efrag.org/', 'active', TRUE, 'Free', 0, 0, 'EUR', 'Resource hub', NULL, 'intermediate', 'resource_library', FALSE, FALSE, FALSE, NULL, FALSE, NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, 140, '2026-03-19T00:00:00Z')
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  program_type = EXCLUDED.program_type,
  short_summary = EXCLUDED.short_summary,
  full_description = EXCLUDED.full_description,
  official_url = EXCLUDED.official_url,
  program_status = EXCLUDED.program_status,
  is_free = EXCLUDED.is_free,
  price_text = EXCLUDED.price_text,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  duration_text = EXCLUDED.duration_text,
  estimated_hours = EXCLUDED.estimated_hours,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  exam_required = EXCLUDED.exam_required,
  certificate_of_completion = EXCLUDED.certificate_of_completion,
  credential_awarded = EXCLUDED.credential_awarded,
  credential_name = EXCLUDED.credential_name,
  renewal_required = EXCLUDED.renewal_required,
  renewal_text = EXCLUDED.renewal_text,
  continuing_education_text = EXCLUDED.continuing_education_text,
  prerequisite_text = EXCLUDED.prerequisite_text,
  official_video_embed_url = EXCLUDED.official_video_embed_url,
  official_video_url = EXCLUDED.official_video_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  featured_rank = EXCLUDED.featured_rank,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO ch_programs (provider_id, slug, title, program_type, short_summary, full_description, official_url, program_status, is_free, price_text, price_min, price_max, currency, duration_text, estimated_hours, level, format, exam_required, certificate_of_completion, credential_awarded, credential_name, renewal_required, renewal_text, continuing_education_text, prerequisite_text, official_video_embed_url, official_video_url, is_featured, is_active, featured_rank, last_verified_at)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'cdp'), 'cdp-disclosure-preparation-resources', 'CDP Disclosure Preparation Resources', 'learning_library', 'Official disclosure preparation resources and events from CDP.', NULL, 'https://www.cdp.net/en/events/prepare-to-disclose-to-cdp-in-2026', 'active', TRUE, 'Free official resource/event content', 0, 0, 'USD', 'Varies', NULL, 'mixed', 'resource_library', FALSE, FALSE, FALSE, NULL, FALSE, NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, 150, '2026-03-19T00:00:00Z')
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  program_type = EXCLUDED.program_type,
  short_summary = EXCLUDED.short_summary,
  full_description = EXCLUDED.full_description,
  official_url = EXCLUDED.official_url,
  program_status = EXCLUDED.program_status,
  is_free = EXCLUDED.is_free,
  price_text = EXCLUDED.price_text,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  duration_text = EXCLUDED.duration_text,
  estimated_hours = EXCLUDED.estimated_hours,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  exam_required = EXCLUDED.exam_required,
  certificate_of_completion = EXCLUDED.certificate_of_completion,
  credential_awarded = EXCLUDED.credential_awarded,
  credential_name = EXCLUDED.credential_name,
  renewal_required = EXCLUDED.renewal_required,
  renewal_text = EXCLUDED.renewal_text,
  continuing_education_text = EXCLUDED.continuing_education_text,
  prerequisite_text = EXCLUDED.prerequisite_text,
  official_video_embed_url = EXCLUDED.official_video_embed_url,
  official_video_url = EXCLUDED.official_video_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  featured_rank = EXCLUDED.featured_rank,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO ch_programs (provider_id, slug, title, program_type, short_summary, full_description, official_url, program_status, is_free, price_text, price_min, price_max, currency, duration_text, estimated_hours, level, format, exam_required, certificate_of_completion, credential_awarded, credential_name, renewal_required, renewal_text, continuing_education_text, prerequisite_text, official_video_embed_url, official_video_url, is_featured, is_active, featured_rank, last_verified_at)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'isep'), 'isep-certificate-in-sustainability-and-environmental-management', 'Certificate in Sustainability and Environmental Management', 'certificate_program', 'Structured sustainability certificate aligned to professional skills development.', NULL, 'https://www.isepglobal.org/learn/courses/certificate-in-sustainability-and-environmental-management/', 'active', FALSE, 'See official page for current pricing.', NULL, NULL, 'GBP', 'Structured course', NULL, 'beginner', 'partner_led', FALSE, TRUE, TRUE, 'Certificate in Sustainability and Environmental Management', FALSE, NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, 160, '2026-03-19T00:00:00Z')
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  program_type = EXCLUDED.program_type,
  short_summary = EXCLUDED.short_summary,
  full_description = EXCLUDED.full_description,
  official_url = EXCLUDED.official_url,
  program_status = EXCLUDED.program_status,
  is_free = EXCLUDED.is_free,
  price_text = EXCLUDED.price_text,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  duration_text = EXCLUDED.duration_text,
  estimated_hours = EXCLUDED.estimated_hours,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  exam_required = EXCLUDED.exam_required,
  certificate_of_completion = EXCLUDED.certificate_of_completion,
  credential_awarded = EXCLUDED.credential_awarded,
  credential_name = EXCLUDED.credential_name,
  renewal_required = EXCLUDED.renewal_required,
  renewal_text = EXCLUDED.renewal_text,
  continuing_education_text = EXCLUDED.continuing_education_text,
  prerequisite_text = EXCLUDED.prerequisite_text,
  official_video_embed_url = EXCLUDED.official_video_embed_url,
  official_video_url = EXCLUDED.official_video_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  featured_rank = EXCLUDED.featured_rank,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO ch_programs (provider_id, slug, title, program_type, short_summary, full_description, official_url, program_status, is_free, price_text, price_min, price_max, currency, duration_text, estimated_hours, level, format, exam_required, certificate_of_completion, credential_awarded, credential_name, renewal_required, renewal_text, continuing_education_text, prerequisite_text, official_video_embed_url, official_video_url, is_featured, is_active, featured_rank, last_verified_at)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'isep'), 'isep-skills-and-training-hub', 'ISEP Skills and Training Hub', 'learning_library', 'Skills mapping, training access, and professional development resources from ISEP.', NULL, 'https://www.isepglobal.org/skills/training/', 'active', FALSE, 'Mixed resources and courses; see official site.', NULL, NULL, 'GBP', 'Varies', NULL, 'mixed', 'resource_library', FALSE, FALSE, FALSE, NULL, FALSE, NULL, NULL, NULL, NULL, NULL, FALSE, TRUE, 170, '2026-03-19T00:00:00Z')
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  program_type = EXCLUDED.program_type,
  short_summary = EXCLUDED.short_summary,
  full_description = EXCLUDED.full_description,
  official_url = EXCLUDED.official_url,
  program_status = EXCLUDED.program_status,
  is_free = EXCLUDED.is_free,
  price_text = EXCLUDED.price_text,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  currency = EXCLUDED.currency,
  duration_text = EXCLUDED.duration_text,
  estimated_hours = EXCLUDED.estimated_hours,
  level = EXCLUDED.level,
  format = EXCLUDED.format,
  exam_required = EXCLUDED.exam_required,
  certificate_of_completion = EXCLUDED.certificate_of_completion,
  credential_awarded = EXCLUDED.credential_awarded,
  credential_name = EXCLUDED.credential_name,
  renewal_required = EXCLUDED.renewal_required,
  renewal_text = EXCLUDED.renewal_text,
  continuing_education_text = EXCLUDED.continuing_education_text,
  prerequisite_text = EXCLUDED.prerequisite_text,
  official_video_embed_url = EXCLUDED.official_video_embed_url,
  official_video_url = EXCLUDED.official_video_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  featured_rank = EXCLUDED.featured_rank,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

-- ============================================================
-- ch_resources
-- ============================================================
INSERT INTO ch_resources (provider_id, slug, title, resource_type, official_url, embed_url, short_summary, thumbnail_url, is_featured, is_active, sort_order)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'ifrs-foundation'), 'ifrs-foundation-official-youtube-channel', 'IFRS Foundation Official YouTube Channel', 'channel', 'https://www.youtube.com/@IFRSFoundation/videos', NULL, 'Official channel for IFRS Foundation sustainability and standards-related videos.', NULL, TRUE, TRUE, 10)
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  resource_type = EXCLUDED.resource_type,
  official_url = EXCLUDED.official_url,
  embed_url = EXCLUDED.embed_url,
  short_summary = EXCLUDED.short_summary,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_resources (provider_id, slug, title, resource_type, official_url, embed_url, short_summary, thumbnail_url, is_featured, is_active, sort_order)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'gri'), 'gri-official-youtube-channel', 'GRI Official YouTube Channel', 'channel', 'https://www.youtube.com/channel/UC0ETfBwgtVLYc8SHWaYjczg', 'https://www.youtube.com/embed?listType=user_uploads&list=UC0ETfBwgtVLYc8SHWaYjczg', 'Official GRI channel with reporting-related videos and training content.', NULL, TRUE, TRUE, 20)
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  resource_type = EXCLUDED.resource_type,
  official_url = EXCLUDED.official_url,
  embed_url = EXCLUDED.embed_url,
  short_summary = EXCLUDED.short_summary,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_resources (provider_id, slug, title, resource_type, official_url, embed_url, short_summary, thumbnail_url, is_featured, is_active, sort_order)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'cfa-institute'), 'cfa-institute-official-youtube-channel', 'CFA Institute Official YouTube Channel', 'channel', 'https://www.youtube.com/user/cfainstitute', NULL, 'Official CFA Institute channel with finance and sustainability-related video content.', NULL, TRUE, TRUE, 30)
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  resource_type = EXCLUDED.resource_type,
  official_url = EXCLUDED.official_url,
  embed_url = EXCLUDED.embed_url,
  short_summary = EXCLUDED.short_summary,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_resources (provider_id, slug, title, resource_type, official_url, embed_url, short_summary, thumbnail_url, is_featured, is_active, sort_order)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'garp'), 'garp-official-youtube-channel', 'GARP Official YouTube Channel', 'channel', 'https://www.youtube.com/@GARPvideo', NULL, 'Official GARP channel with SCR and risk-related learning content.', NULL, TRUE, TRUE, 40)
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  resource_type = EXCLUDED.resource_type,
  official_url = EXCLUDED.official_url,
  embed_url = EXCLUDED.embed_url,
  short_summary = EXCLUDED.short_summary,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_resources (provider_id, slug, title, resource_type, official_url, embed_url, short_summary, thumbnail_url, is_featured, is_active, sort_order)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'ghg-protocol'), 'ghg-protocol-official-youtube-channel', 'GHG Protocol Official YouTube Channel', 'channel', 'https://www.youtube.com/channel/UCpgcM7yN5peRHDx69DLs6jA/videos', 'https://www.youtube.com/embed?listType=user_uploads&list=UCpgcM7yN5peRHDx69DLs6jA', 'Official GHG Protocol channel with accounting and standards-related videos.', NULL, TRUE, TRUE, 50)
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  resource_type = EXCLUDED.resource_type,
  official_url = EXCLUDED.official_url,
  embed_url = EXCLUDED.embed_url,
  short_summary = EXCLUDED.short_summary,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_resources (provider_id, slug, title, resource_type, official_url, embed_url, short_summary, thumbnail_url, is_featured, is_active, sort_order)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'tnfd'), 'tnfd-official-youtube-channel', 'TNFD Official YouTube Channel', 'channel', 'https://www.youtube.com/@taskforcenature/videos', NULL, 'Official TNFD channel with videos on nature-related risk and disclosure.', NULL, TRUE, TRUE, 60)
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  resource_type = EXCLUDED.resource_type,
  official_url = EXCLUDED.official_url,
  embed_url = EXCLUDED.embed_url,
  short_summary = EXCLUDED.short_summary,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_resources (provider_id, slug, title, resource_type, official_url, embed_url, short_summary, thumbnail_url, is_featured, is_active, sort_order)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'pri-academy'), 'pri-official-youtube-channel', 'PRI Official YouTube Channel', 'channel', 'https://www.youtube.com/@UNPRItube', NULL, 'Official PRI channel with responsible investment videos and related learning content.', NULL, TRUE, TRUE, 70)
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  resource_type = EXCLUDED.resource_type,
  official_url = EXCLUDED.official_url,
  embed_url = EXCLUDED.embed_url,
  short_summary = EXCLUDED.short_summary,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_resources (provider_id, slug, title, resource_type, official_url, embed_url, short_summary, thumbnail_url, is_featured, is_active, sort_order)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'efrag'), 'efrag-official-youtube-channel', 'EFRAG Official YouTube Channel', 'channel', 'https://www.youtube.com/channel/UCxcljiiUM2JD02SMuFUTUwA', 'https://www.youtube.com/embed?listType=user_uploads&list=UCxcljiiUM2JD02SMuFUTUwA', 'Official EFRAG channel with ESRS and sustainability reporting materials.', NULL, TRUE, TRUE, 80)
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  resource_type = EXCLUDED.resource_type,
  official_url = EXCLUDED.official_url,
  embed_url = EXCLUDED.embed_url,
  short_summary = EXCLUDED.short_summary,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_resources (provider_id, slug, title, resource_type, official_url, embed_url, short_summary, thumbnail_url, is_featured, is_active, sort_order)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'cdp'), 'cdp-official-youtube-channel', 'CDP Official YouTube Channel', 'channel', 'https://www.youtube.com/channel/UCriW4gZMiuZsq51iLSRXdTQ', 'https://www.youtube.com/embed?listType=user_uploads&list=UCriW4gZMiuZsq51iLSRXdTQ', 'Official CDP channel with disclosure and reporting-related content.', NULL, TRUE, TRUE, 90)
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  resource_type = EXCLUDED.resource_type,
  official_url = EXCLUDED.official_url,
  embed_url = EXCLUDED.embed_url,
  short_summary = EXCLUDED.short_summary,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_resources (provider_id, slug, title, resource_type, official_url, embed_url, short_summary, thumbnail_url, is_featured, is_active, sort_order)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'isep'), 'isep-official-youtube-channel', 'ISEP Official YouTube Channel', 'channel', 'https://www.youtube.com/channel/UCIVpKvhY09EZRMytx2N1f3Q', 'https://www.youtube.com/embed?listType=user_uploads&list=UCIVpKvhY09EZRMytx2N1f3Q', 'Official ISEP channel with professional development and sustainability skills content.', NULL, TRUE, TRUE, 100)
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  resource_type = EXCLUDED.resource_type,
  official_url = EXCLUDED.official_url,
  embed_url = EXCLUDED.embed_url,
  short_summary = EXCLUDED.short_summary,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_resources (provider_id, slug, title, resource_type, official_url, embed_url, short_summary, thumbnail_url, is_featured, is_active, sort_order)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'efrag'), 'efrag-esrs-knowledge-hub-resource', 'EFRAG ESRS Knowledge Hub', 'standards_hub', 'https://knowledgehub.efrag.org/', NULL, 'Official ESRS knowledge and implementation hub.', NULL, TRUE, TRUE, 110)
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  resource_type = EXCLUDED.resource_type,
  official_url = EXCLUDED.official_url,
  embed_url = EXCLUDED.embed_url,
  short_summary = EXCLUDED.short_summary,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_resources (provider_id, slug, title, resource_type, official_url, embed_url, short_summary, thumbnail_url, is_featured, is_active, sort_order)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'tnfd'), 'tnfd-knowledge-hub-resource', 'TNFD Knowledge Hub', 'standards_hub', 'https://tnfd.global/knowledge-hub/', NULL, 'Official TNFD knowledge and implementation hub.', NULL, TRUE, TRUE, 120)
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  resource_type = EXCLUDED.resource_type,
  official_url = EXCLUDED.official_url,
  embed_url = EXCLUDED.embed_url,
  short_summary = EXCLUDED.short_summary,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO ch_resources (provider_id, slug, title, resource_type, official_url, embed_url, short_summary, thumbnail_url, is_featured, is_active, sort_order)
VALUES ((SELECT id FROM ch_providers WHERE slug = 'ifrs-foundation'), 'ifrs-sustainability-knowledge-hub-resource', 'IFRS Sustainability Knowledge Hub', 'standards_hub', 'https://www.ifrs.org/sustainability/knowledge-hub/', NULL, 'Official IFRS sustainability knowledge resource hub.', NULL, TRUE, TRUE, 130)
ON CONFLICT (slug) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  title = EXCLUDED.title,
  resource_type = EXCLUDED.resource_type,
  official_url = EXCLUDED.official_url,
  embed_url = EXCLUDED.embed_url,
  short_summary = EXCLUDED.short_summary,
  thumbnail_url = EXCLUDED.thumbnail_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- ============================================================
-- ch_program_roles
-- ============================================================
INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ifrs-sustainability-knowledge-hub-courses'),
  (SELECT id FROM ch_roles WHERE slug = 'esg-manager'),
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'gri-professional-certification-program'),
  (SELECT id FROM ch_roles WHERE slug = 'esg-manager'),
  TRUE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ghg-protocol-e-learning-opportunities'),
  (SELECT id FROM ch_roles WHERE slug = 'esg-manager'),
  FALSE,
  30
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'tnfd-learning-lab'),
  (SELECT id FROM ch_roles WHERE slug = 'esg-manager'),
  FALSE,
  40
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ifrs-sustainability-knowledge-hub-courses'),
  (SELECT id FROM ch_roles WHERE slug = 'reporting-disclosure-specialist'),
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'gri-professional-certification-program'),
  (SELECT id FROM ch_roles WHERE slug = 'reporting-disclosure-specialist'),
  TRUE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'efrag-esrs-knowledge-hub'),
  (SELECT id FROM ch_roles WHERE slug = 'reporting-disclosure-specialist'),
  FALSE,
  30
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'cdp-disclosure-preparation-resources'),
  (SELECT id FROM ch_roles WHERE slug = 'reporting-disclosure-specialist'),
  FALSE,
  40
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ghg-protocol-e-learning-opportunities'),
  (SELECT id FROM ch_roles WHERE slug = 'climate-carbon-analyst'),
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ifrs-sustainability-knowledge-hub-courses'),
  (SELECT id FROM ch_roles WHERE slug = 'climate-carbon-analyst'),
  FALSE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'tnfd-learning-lab'),
  (SELECT id FROM ch_roles WHERE slug = 'climate-carbon-analyst'),
  FALSE,
  30
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'cfa-sustainable-investing-certificate'),
  (SELECT id FROM ch_roles WHERE slug = 'sustainable-investing-analyst'),
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'pri-understanding-esg'),
  (SELECT id FROM ch_roles WHERE slug = 'sustainable-investing-analyst'),
  TRUE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'pri-applied-responsible-investment'),
  (SELECT id FROM ch_roles WHERE slug = 'sustainable-investing-analyst'),
  FALSE,
  30
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'cfa-climate-risk-valuation-investing-certificate'),
  (SELECT id FROM ch_roles WHERE slug = 'sustainable-investing-analyst'),
  FALSE,
  40
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'garp-scr-certificate'),
  (SELECT id FROM ch_roles WHERE slug = 'climate-risk-professional'),
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'tnfd-learning-lab'),
  (SELECT id FROM ch_roles WHERE slug = 'climate-risk-professional'),
  TRUE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'cfa-climate-risk-valuation-investing-certificate'),
  (SELECT id FROM ch_roles WHERE slug = 'climate-risk-professional'),
  FALSE,
  30
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ifrs-sustainability-knowledge-hub-courses'),
  (SELECT id FROM ch_roles WHERE slug = 'internal-audit-assurance-professional'),
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'gri-academy'),
  (SELECT id FROM ch_roles WHERE slug = 'internal-audit-assurance-professional'),
  FALSE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'efrag-esrs-knowledge-hub'),
  (SELECT id FROM ch_roles WHERE slug = 'internal-audit-assurance-professional'),
  FALSE,
  30
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'cdp-disclosure-preparation-resources'),
  (SELECT id FROM ch_roles WHERE slug = 'supply-chain-sustainability-professional'),
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ghg-protocol-e-learning-opportunities'),
  (SELECT id FROM ch_roles WHERE slug = 'supply-chain-sustainability-professional'),
  TRUE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ifrs-sustainability-knowledge-hub-courses'),
  (SELECT id FROM ch_roles WHERE slug = 'supply-chain-sustainability-professional'),
  FALSE,
  30
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'gri-professional-certification-program'),
  (SELECT id FROM ch_roles WHERE slug = 'esg-consultant'),
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ifrs-sustainability-knowledge-hub-courses'),
  (SELECT id FROM ch_roles WHERE slug = 'esg-consultant'),
  TRUE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'tnfd-learning-lab'),
  (SELECT id FROM ch_roles WHERE slug = 'esg-consultant'),
  FALSE,
  30
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'garp-scr-certificate'),
  (SELECT id FROM ch_roles WHERE slug = 'esg-consultant'),
  FALSE,
  40
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'pri-responsible-investment-for-boards-and-trustees'),
  (SELECT id FROM ch_roles WHERE slug = 'cso-executive'),
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ifrs-sustainability-knowledge-hub-courses'),
  (SELECT id FROM ch_roles WHERE slug = 'cso-executive'),
  FALSE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'tnfd-learning-lab'),
  (SELECT id FROM ch_roles WHERE slug = 'cso-executive'),
  FALSE,
  30
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ifrs-sustainability-knowledge-hub-courses'),
  (SELECT id FROM ch_roles WHERE slug = 'early-career-career-switcher'),
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'tnfd-learning-lab'),
  (SELECT id FROM ch_roles WHERE slug = 'early-career-career-switcher'),
  TRUE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'pri-responsible-investment-in-60-minutes'),
  (SELECT id FROM ch_roles WHERE slug = 'early-career-career-switcher'),
  FALSE,
  30
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_roles (program_id, role_id, is_primary, recommendation_rank)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'gri-academy'),
  (SELECT id FROM ch_roles WHERE slug = 'early-career-career-switcher'),
  FALSE,
  40
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ch_program_tags
-- ============================================================
INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'fsa-credential'),
  (SELECT id FROM ch_tags WHERE slug = 'issb')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'fsa-credential'),
  (SELECT id FROM ch_tags WHERE slug = 'disclosure')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'fsa-credential'),
  (SELECT id FROM ch_tags WHERE slug = 'sustainable-finance')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ifrs-sustainability-knowledge-hub-courses'),
  (SELECT id FROM ch_tags WHERE slug = 'issb')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ifrs-sustainability-knowledge-hub-courses'),
  (SELECT id FROM ch_tags WHERE slug = 'ifrs-s1')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ifrs-sustainability-knowledge-hub-courses'),
  (SELECT id FROM ch_tags WHERE slug = 'ifrs-s2')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ifrs-sustainability-knowledge-hub-courses'),
  (SELECT id FROM ch_tags WHERE slug = 'esg-fundamentals')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'gri-professional-certification-program'),
  (SELECT id FROM ch_tags WHERE slug = 'gri')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'gri-professional-certification-program'),
  (SELECT id FROM ch_tags WHERE slug = 'sustainability-reporting')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'gri-professional-certification-program'),
  (SELECT id FROM ch_tags WHERE slug = 'materiality')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'cfa-sustainable-investing-certificate'),
  (SELECT id FROM ch_tags WHERE slug = 'sustainable-finance')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'cfa-sustainable-investing-certificate'),
  (SELECT id FROM ch_tags WHERE slug = 'responsible-investment')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'cfa-climate-risk-valuation-investing-certificate'),
  (SELECT id FROM ch_tags WHERE slug = 'climate-risk')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'cfa-climate-risk-valuation-investing-certificate'),
  (SELECT id FROM ch_tags WHERE slug = 'sustainable-finance')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'garp-scr-certificate'),
  (SELECT id FROM ch_tags WHERE slug = 'climate-risk')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'garp-scr-certificate'),
  (SELECT id FROM ch_tags WHERE slug = 'transition-planning')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ghg-protocol-e-learning-opportunities'),
  (SELECT id FROM ch_tags WHERE slug = 'carbon-accounting')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ghg-protocol-e-learning-opportunities'),
  (SELECT id FROM ch_tags WHERE slug = 'ghg-accounting')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'ghg-protocol-e-learning-opportunities'),
  (SELECT id FROM ch_tags WHERE slug = 'scope-3')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'tnfd-learning-lab'),
  (SELECT id FROM ch_tags WHERE slug = 'nature-risk')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'tnfd-learning-lab'),
  (SELECT id FROM ch_tags WHERE slug = 'biodiversity')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'pri-understanding-esg'),
  (SELECT id FROM ch_tags WHERE slug = 'responsible-investment')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'pri-understanding-esg'),
  (SELECT id FROM ch_tags WHERE slug = 'esg-fundamentals')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'pri-applied-responsible-investment'),
  (SELECT id FROM ch_tags WHERE slug = 'responsible-investment')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'pri-applied-responsible-investment'),
  (SELECT id FROM ch_tags WHERE slug = 'sustainable-finance')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'efrag-esrs-knowledge-hub'),
  (SELECT id FROM ch_tags WHERE slug = 'esrs')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'efrag-esrs-knowledge-hub'),
  (SELECT id FROM ch_tags WHERE slug = 'csrd')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'efrag-esrs-knowledge-hub'),
  (SELECT id FROM ch_tags WHERE slug = 'disclosure')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'cdp-disclosure-preparation-resources'),
  (SELECT id FROM ch_tags WHERE slug = 'disclosure')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'cdp-disclosure-preparation-resources'),
  (SELECT id FROM ch_tags WHERE slug = 'supplier-disclosure')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'isep-certificate-in-sustainability-and-environmental-management'),
  (SELECT id FROM ch_tags WHERE slug = 'esg-fundamentals')
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_program_tags (program_id, tag_id)
VALUES (
  (SELECT id FROM ch_programs WHERE slug = 'isep-certificate-in-sustainability-and-environmental-management'),
  (SELECT id FROM ch_tags WHERE slug = 'sustainability-reporting')
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ch_role_recommended_programs
-- ============================================================
INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'esg-manager'),
  (SELECT id FROM ch_programs WHERE slug = 'ifrs-sustainability-knowledge-hub-courses'),
  'starter',
  'beginner',
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'esg-manager'),
  (SELECT id FROM ch_programs WHERE slug = 'gri-professional-certification-program'),
  'advance',
  'intermediate',
  FALSE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'esg-manager'),
  (SELECT id FROM ch_programs WHERE slug = 'ghg-protocol-e-learning-opportunities'),
  'specialize',
  'intermediate',
  FALSE,
  30
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'reporting-disclosure-specialist'),
  (SELECT id FROM ch_programs WHERE slug = 'ifrs-sustainability-knowledge-hub-courses'),
  'starter',
  'beginner',
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'reporting-disclosure-specialist'),
  (SELECT id FROM ch_programs WHERE slug = 'gri-professional-certification-program'),
  'advance',
  'intermediate',
  FALSE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'reporting-disclosure-specialist'),
  (SELECT id FROM ch_programs WHERE slug = 'efrag-esrs-knowledge-hub'),
  'specialize',
  'intermediate',
  TRUE,
  30
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'climate-carbon-analyst'),
  (SELECT id FROM ch_programs WHERE slug = 'ghg-protocol-e-learning-opportunities'),
  'starter',
  'beginner',
  FALSE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'climate-carbon-analyst'),
  (SELECT id FROM ch_programs WHERE slug = 'ifrs-sustainability-knowledge-hub-courses'),
  'supporting',
  'beginner',
  TRUE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'climate-carbon-analyst'),
  (SELECT id FROM ch_programs WHERE slug = 'tnfd-learning-lab'),
  'specialize',
  'intermediate',
  TRUE,
  30
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'sustainable-investing-analyst'),
  (SELECT id FROM ch_programs WHERE slug = 'pri-understanding-esg'),
  'starter',
  'beginner',
  FALSE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'sustainable-investing-analyst'),
  (SELECT id FROM ch_programs WHERE slug = 'cfa-sustainable-investing-certificate'),
  'advance',
  'intermediate',
  FALSE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'sustainable-investing-analyst'),
  (SELECT id FROM ch_programs WHERE slug = 'cfa-climate-risk-valuation-investing-certificate'),
  'specialize',
  'advanced',
  FALSE,
  30
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'climate-risk-professional'),
  (SELECT id FROM ch_programs WHERE slug = 'tnfd-learning-lab'),
  'starter',
  'beginner',
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'climate-risk-professional'),
  (SELECT id FROM ch_programs WHERE slug = 'garp-scr-certificate'),
  'advance',
  'intermediate',
  FALSE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'climate-risk-professional'),
  (SELECT id FROM ch_programs WHERE slug = 'cfa-climate-risk-valuation-investing-certificate'),
  'specialize',
  'advanced',
  FALSE,
  30
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'early-career-career-switcher'),
  (SELECT id FROM ch_programs WHERE slug = 'ifrs-sustainability-knowledge-hub-courses'),
  'starter',
  'beginner',
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'early-career-career-switcher'),
  (SELECT id FROM ch_programs WHERE slug = 'tnfd-learning-lab'),
  'starter',
  'beginner',
  TRUE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_recommended_programs (role_id, program_id, recommendation_type, progression_stage, is_free_priority, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'early-career-career-switcher'),
  (SELECT id FROM ch_programs WHERE slug = 'pri-responsible-investment-in-60-minutes'),
  'explore',
  'beginner',
  FALSE,
  30
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ch_role_resources
-- ============================================================
INSERT INTO ch_role_resources (role_id, resource_id, is_featured, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'esg-manager'),
  (SELECT id FROM ch_resources WHERE slug = 'ifrs-sustainability-knowledge-hub-resource'),
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_resources (role_id, resource_id, is_featured, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'esg-manager'),
  (SELECT id FROM ch_resources WHERE slug = 'gri-official-youtube-channel'),
  TRUE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_resources (role_id, resource_id, is_featured, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'reporting-disclosure-specialist'),
  (SELECT id FROM ch_resources WHERE slug = 'ifrs-foundation-official-youtube-channel'),
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_resources (role_id, resource_id, is_featured, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'reporting-disclosure-specialist'),
  (SELECT id FROM ch_resources WHERE slug = 'efrag-esrs-knowledge-hub-resource'),
  TRUE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_resources (role_id, resource_id, is_featured, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'reporting-disclosure-specialist'),
  (SELECT id FROM ch_resources WHERE slug = 'gri-official-youtube-channel'),
  TRUE,
  30
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_resources (role_id, resource_id, is_featured, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'climate-carbon-analyst'),
  (SELECT id FROM ch_resources WHERE slug = 'ghg-protocol-official-youtube-channel'),
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_resources (role_id, resource_id, is_featured, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'climate-carbon-analyst'),
  (SELECT id FROM ch_resources WHERE slug = 'tnfd-knowledge-hub-resource'),
  FALSE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_resources (role_id, resource_id, is_featured, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'sustainable-investing-analyst'),
  (SELECT id FROM ch_resources WHERE slug = 'pri-official-youtube-channel'),
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_resources (role_id, resource_id, is_featured, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'sustainable-investing-analyst'),
  (SELECT id FROM ch_resources WHERE slug = 'cfa-institute-official-youtube-channel'),
  TRUE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_resources (role_id, resource_id, is_featured, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'climate-risk-professional'),
  (SELECT id FROM ch_resources WHERE slug = 'garp-official-youtube-channel'),
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_resources (role_id, resource_id, is_featured, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'climate-risk-professional'),
  (SELECT id FROM ch_resources WHERE slug = 'tnfd-official-youtube-channel'),
  TRUE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_resources (role_id, resource_id, is_featured, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'early-career-career-switcher'),
  (SELECT id FROM ch_resources WHERE slug = 'ifrs-foundation-official-youtube-channel'),
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_resources (role_id, resource_id, is_featured, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'early-career-career-switcher'),
  (SELECT id FROM ch_resources WHERE slug = 'tnfd-official-youtube-channel'),
  TRUE,
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_resources (role_id, resource_id, is_featured, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'early-career-career-switcher'),
  (SELECT id FROM ch_resources WHERE slug = 'pri-official-youtube-channel'),
  FALSE,
  30
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ch_role_progression_paths
-- ============================================================
INSERT INTO ch_role_progression_paths (from_role_id, to_role_id, transition_summary, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'early-career-career-switcher'),
  (SELECT id FROM ch_roles WHERE slug = 'esg-manager'),
  'Move from broad ESG literacy and entry-level experience into cross-functional sustainability program ownership.',
  10
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_progression_paths (from_role_id, to_role_id, transition_summary, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'early-career-career-switcher'),
  (SELECT id FROM ch_roles WHERE slug = 'reporting-disclosure-specialist'),
  'Develop framework and disclosure fluency to move into a specialist reporting role.',
  20
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_progression_paths (from_role_id, to_role_id, transition_summary, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'reporting-disclosure-specialist'),
  (SELECT id FROM ch_roles WHERE slug = 'esg-manager'),
  'Expand from reporting execution into broader program and stakeholder ownership.',
  30
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_progression_paths (from_role_id, to_role_id, transition_summary, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'climate-carbon-analyst'),
  (SELECT id FROM ch_roles WHERE slug = 'climate-risk-professional'),
  'Move from emissions accounting and data work into broader climate and enterprise risk management.',
  40
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_progression_paths (from_role_id, to_role_id, transition_summary, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'sustainable-investing-analyst'),
  (SELECT id FROM ch_roles WHERE slug = 'cso-executive'),
  'Broaden from investment-side sustainability integration into enterprise leadership and governance roles.',
  50
)
ON CONFLICT DO NOTHING;

INSERT INTO ch_role_progression_paths (from_role_id, to_role_id, transition_summary, sort_order)
VALUES (
  (SELECT id FROM ch_roles WHERE slug = 'esg-consultant'),
  (SELECT id FROM ch_roles WHERE slug = 'cso-executive'),
  'Shift from advisory and framework translation into internal strategic leadership.',
  60
)
ON CONFLICT DO NOTHING;

COMMIT;
