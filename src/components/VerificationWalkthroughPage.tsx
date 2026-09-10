import React, { useState } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Shield,
  Bot,
  Boxes,
  Users,
  ClipboardList,
  Sparkles,
  Lock,
  Truck,
  Package,
  CreditCard,
  ArrowRight,
  RotateCcw,
  Factory,
  ShieldCheck,
  CheckSquare,
  Square,
  Search,
  LogIn,
} from 'lucide-react';

export interface TestCaseItem {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  precondition: string;
  steps: string[];
  expectedResult: string;
  roleRequired?: string;
}

export const TEST_CASES: TestCaseItem[] = [
  {
    id: 'TC-01',
    title: 'Google Sign-In & Zero-Password Identity',
    category: 'Authentication',
    icon: Lock,
    roleRequired: 'Any (Worker / Admin)',
    precondition: 'User visits the web application root URL.',
    steps: [
      'Observe the landing screen: federated Google Authentication is the single verified entry point (no manual registration forms, no plaintext email/password inputs).',
      'Click "Continue with Google". Complete the Google OAuth popup with your Google account (e.g. bharathpypro@gmail.com).',
      'Verify that the Firebase Authentication token automatically supplies your verified email without any secondary verification steps.',
    ],
    expectedResult:
      'User is authenticated securely. If user has no existing facility membership, the Organization Setup modal appears immediately.',
  },
  {
    id: 'TC-02',
    title: 'Facility Creation & Name Collision Rejection',
    category: 'Onboarding & ABAC',
    icon: Shield,
    roleRequired: 'Founding Admin',
    precondition: 'User is authenticated and opens Organization Setup modal.',
    steps: [
      'In the "Create New Facility" tab, type the name of an existing business (e.g. "Sunrise Dehydrated Botanicals").',
      'Click "Create Organization". Verify the application checks the reservation document in "farmNames" collection.',
      'Verify the exact error message appears: "A farm with this name already exists" and creation is blocked.',
      'Enter a fresh unique facility name (e.g. "Papad & Spice Artisan Mill #1") and click "Create Organization".',
      'Observe the confirmation banner: "You\'re now the admin of [Farm Name]." with the founding user bound as Admin.',
    ],
    expectedResult:
      'Unique facility created in Firestore with initial catalog items; user is assigned permissionTier="admin" with roleLabel="Admin".',
  },
  {
    id: 'TC-03',
    title: 'Team Invitations & Email-Gated Membership',
    category: 'Access Control',
    icon: Users,
    roleRequired: 'Plant Admin',
    precondition: 'Signed in as Admin with at least one active facility.',
    steps: [
      'Navigate to the "Team & Access" section.',
      'Enter an invitee Google email (e.g. coworker@gmail.com), select or enter a custom role label (e.g. "Supervisor" or "Packer"), and select "Worker Tier".',
      'Click "Send Invite". Verify the document is created under "farms/{farmId}/invites/{email}".',
      'When that coworker signs in with that exact Google email, open "Organization Setup" -> "Pending Invites".',
      'Click "Accept & Join". Confirm the new member record copies the tier and label strictly from the invite, with no self-assigned role privileges.',
    ],
    expectedResult:
      'Worker joins the facility with permissionTier="worker" and roleLabel="Supervisor". Security rules prevent privilege escalation.',
  },
  {
    id: 'TC-04',
    title: 'Dynamic Product Catalog (No Hardcoded Crops/Processes)',
    category: 'Catalog Management',
    icon: Boxes,
    roleRequired: 'Any (Worker / Admin)',
    precondition: 'Active in facility dashboard (Worker or Admin).',
    steps: [
      'Open the "Product Catalog" section.',
      'Click "+ Add Product". Enter a non-agricultural or artisan item, such as "Mango Pickle Mix", unit "kg", and processing type "fermenting".',
      'Save the product and verify it appears in the catalog grid with custom badges.',
      'Add a second product: "Papad Dough", unit "kg", processing type "drying".',
    ],
    expectedResult:
      'Products are saved to "farms/{farmId}/products" and instantly available across raw intake logs and batch creation.',
  },
  {
    id: 'TC-05',
    title: 'Raw Material Intake Logging & Traceability',
    category: 'Operations',
    icon: ClipboardList,
    roleRequired: 'Worker or Admin',
    precondition: 'At least one product configured in catalog.',
    steps: [
      'Open the "Raw Material Intake" section.',
      'Click "Log Intake Entry". Select "Mango Pickle Mix", quantity "120", and enter delivery notes: "Fresh green mangoes, 15% salt pre-brine".',
      'Click "Save Intake Log".',
      'Verify the record appears in the intake table showing quantity, timestamp, and loggedBy with your role label.',
    ],
    expectedResult:
      'Intake record persisted under "farms/{farmId}/harvestLogs" with loggedByUid bound to authenticated user.',
  },
  {
    id: 'TC-06',
    title: 'Gemini 3.6 Flash AI Schedule Generation with Fallback Ladder',
    category: 'AI Engine',
    icon: Sparkles,
    roleRequired: 'Plant Admin',
    precondition: 'Product created in catalog.',
    steps: [
      'Open the "Production Batches" section and click "New Production Batch".',
      'Select product "Mango Pickle Mix". Configure conditions: Temperature "Ambient 28°C", Humidity "60%", Method "Anaerobic ceramic crock fermentation", Duration "14 days".',
      'Click "Generate Schedule".',
      'Verify the server calls Gemini 3.6 Flash (with automated fallback ladder to 3.1-flash-lite/flash-latest).',
      'Review the generated schedule: process overview, monitoring intervals, critical control points, and readiness criteria.',
      'Click "Launch Production Batch".',
    ],
    expectedResult:
      'Batch is stored in Firestore with the full Gemini schedule and environmental conditions.',
  },
  {
    id: 'TC-07',
    title: 'Multi-Turn "Ask AI" Technical Batch Chat',
    category: 'AI Engine',
    icon: Bot,
    roleRequired: 'Worker or Admin',
    precondition: 'At least one batch created in the facility.',
    steps: [
      'On an active batch card, click "Ask AI".',
      'Click the suggestion chip: "Why is this temperature recommended for Mango Pickle Mix?"',
      'Verify Gemini responds using the batch conditions and schedule as context, and that both the user message and model response are stored in Firestore under "messages" subcollection.',
      'Type a follow-up: "What if ambient humidity rises significantly next week during fermentation?"',
      'Verify Gemini acknowledges the prior question and gives specific contingency adjustments for that batch.',
    ],
    expectedResult:
      'Real multi-turn conversation thread persisted in Firestore; subsequent questions maintain conversational memory.',
  },
  {
    id: 'TC-08',
    title: 'Worker vs Admin Attribute-Based Access Control (ABAC)',
    category: 'Security & Permissions',
    icon: Shield,
    roleRequired: 'Comparison across Roles',
    precondition: 'Tested across Worker and Admin accounts.',
    steps: [
      'As a Worker: open an active batch card, expand details, and log a progress reading: Metric "Moisture: 14%", Note "Trays turned, aroma pungent". Verify reading is saved.',
      'As a Worker: attempt to mark the batch "Ready" or "Packaged". Verify the button is disabled or rejected by ABAC security rules.',
      'As an Admin: open the batch details. Click "Mark Ready".',
      'Verify the batch status transitions to "Ready for Distribution" and records readyAt timestamp.',
    ],
    expectedResult:
      'Workers are permitted only to add readings; status changes to "ready" or "packaged" are strictly restricted to Admins in both UI and Firestore rules.',
  },
  {
    id: 'TC-09',
    title: 'External Logistics Notification via Secret Manager / Env',
    category: 'Integrations',
    icon: Truck,
    roleRequired: 'Plant Admin',
    precondition: 'Admin marks a batch "Ready".',
    steps: [
      'Admin clicks "Mark Ready" on an active batch.',
      'Server invokes /api/batches/notify-ready with server-validated fields (product name, quantity, facility name, timestamp).',
      'If SLACK_WEBHOOK_URL is configured, dispatch webhook; if not configured, safely handle non-blocking response without failing batch status.',
    ],
    expectedResult:
      'Webhook URL remains isolated server-side. Notification failure does not roll back the database transaction.',
  },
  {
    id: 'TC-10',
    title: 'Operational History & Dynamic Product Filter',
    category: 'Traceability',
    icon: BookOpenCheck,
    roleRequired: 'Worker or Admin',
    precondition: 'Multiple intake entries and batches recorded.',
    steps: [
      'Navigate to "Operational History".',
      'Switch between "Batches" and "Intakes" sub-tabs.',
      'Select a specific product in the product filter (e.g. "Mango Pickle Mix").',
      'Verify all displayed records dynamically filter to only that product.',
      'Search for specific terms in the search bar (e.g. "anaerobic", "Grade A").',
    ],
    expectedResult:
      'Instantaneous, responsive filtering of historical records by product and status.',
  },
  {
    id: 'TC-11',
    title: 'Grade Output at Mark Ready Stage (Grade A & Grade B Dried Weight)',
    category: 'Production Batches & QC',
    icon: Sparkles,
    roleRequired: 'Plant Admin',
    precondition: 'An active batch is in "In Chamber Processing" status.',
    steps: [
      'As an Admin, navigate to "Production Batches" and locate an active batch.',
      'Click "Mark Ready for Distribution". The Grade Output & Dried Weight modal appears.',
      'Enter Grade A Output dried weight (e.g. "12.5" kg) and Grade B Output dried weight (e.g. "3.5" kg).',
      'Inspect the real-time calculated total dried output (16.0 kg) and yield recovery percentage.',
      'Enter optional QC Notes (e.g. "Top trays crisp and vibrant green, slight sun-spotting on lower racks sorted to Grade B").',
      'Click "Confirm & Transition to Ready".',
      'Verify the batch card header displays: Grade A: 12.5 kg, Grade B: 3.5 kg with custom grade tags.',
    ],
    expectedResult:
      'Batch status transitions to Ready with gradeAOutputQuantity and gradeBOutputQuantity safely persisted in Firestore.',
  },
  {
    id: 'TC-12',
    title: 'Packaging & Storage Module (Grade A & B Dried Stock & Gram Bags)',
    category: 'Packaging & Storage',
    icon: Package,
    roleRequired: 'Worker or Admin',
    precondition: 'At least one batch marked Ready with Grade A and Grade B output.',
    steps: [
      'Click the "Packaging & Storage" tab in the main navigation bar.',
      'Observe the top inventory overview cards: Total Available Dried Bulk Stock, Grade A Stock, Grade B Stock, and Finished Packaged Inventory.',
      'Review the Dried Bulk Stock by Grade summary cards showing exact available weight (in kg and grams) broken down by product.',
      'Click "+ Pack & Store Bags" or click "Pack This Grade" on a specific grade card.',
      'Select the Product (e.g. Moringa Leaves), choose the Grade ("Grade A" or "Grade B"), and enter the package size in grams (e.g. "100" grams or "250" grams).',
      'Enter the Number of Bags/Packages to pack (e.g. "50" bags).',
      'Verify the modal calculates the required bulk dried weight (5.00 kg / 5,000 g) and validates against available bulk stock.',
      'Select or enter the Storage Location / Bin ID (e.g. "Bin A-04 (Dehumidified Cold Room)") and click "Confirm & Store Packages".',
      'Observe the new record in the "Finished Goods & Storage Inventory" table with remaining units and dispatch action.',
    ],
    expectedResult:
      'Packaging record is stored under "farms/{farmId}/packagingLogs" with exact gram bag size, grade, barcode/SKU, and location metadata.',
  },
  {
    id: 'TC-13',
    title: 'Outbound Dispatching, Order Details & Payment Tracking',
    category: 'Dispatch & Logistics',
    icon: CreditCard,
    roleRequired: 'Worker or Admin',
    precondition: 'Stored packaged goods available in Packaging module.',
    steps: [
      'Click "Dispatching" in the navigation bar (or click "Dispatch Bags" directly from the Packaging module).',
      'Observe the Dispatch KPI metrics: Total Dispatched Orders, Total Gross Dispatch Value (₹), Amount Received / Collected (₹), and Pending / COD Receivable (₹).',
      'Click "+ New Dispatch Order".',
      'Enter Order Number (e.g. "ORD-2026-089") and select Where we got order / Source (e.g. "WhatsApp Direct", "B2B Distributor", "Shopify Store", "Amazon").',
      'Fill Customer & Destination Details: Customer Name ("Aarav Patel"), Phone ("+91 98200 44551"), Delivery Address ("Flat 402, Lotus Tower, SG Highway"), Destination City ("Ahmedabad"), and Pincode ("380054").',
      'In the "Dispatch Line Items" section, select the stored package item (e.g. "Moringa Leaves - Grade A [100g bags]"), specify units (e.g. "20" bags), and Unit Price (e.g. "₹180"). Verify total weight and subtotal calculate automatically.',
      'In "Payment & Settlement", choose Payment Status ("Prepaid" or "Amount Received"), enter Amount Received (e.g. "₹3,600"), and Payment Method ("UPI / Google Pay").',
      'Enter Courier Name ("Delhivery Express") and AWB Tracking Number ("DEL778899221").',
      'Click "Confirm & Generate Dispatch".',
      'Verify the order appears in the Dispatch Log table. Click "View Slip" to inspect the printable packing slip and delivery invoice.',
    ],
    expectedResult:
      'Dispatch record is stored in Firestore with all contact, destination, line-item, courier, and payment details.',
  },
];

interface VerificationWalkthroughPageProps {
  onGoToLogin?: () => void;
  onPreviewLogin?: () => void;
  isStandalonePage?: boolean;
}

export const VerificationWalkthroughPage: React.FC<VerificationWalkthroughPageProps> = ({
  onGoToLogin,
  onPreviewLogin,
  isStandalonePage = true,
}) => {
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const categories = ['All', ...Array.from(new Set(TEST_CASES.map((tc) => tc.category)))];

  const filteredCases = TEST_CASES.filter((tc) => {
    const matchesCategory = selectedCategory === 'All' || tc.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      tc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.steps.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const currentCase = filteredCases[activeCaseIndex] || TEST_CASES[0];

  const toggleStep = (stepKey: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepKey]: !prev[stepKey],
    }));
  };

  const totalStepsCount = TEST_CASES.reduce((sum, tc) => sum + tc.steps.length, 0);
  const checkedStepsCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((checkedStepsCount / totalStepsCount) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header / Navigation Bar on Index Page */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 shadow-md">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner shrink-0">
            <Factory className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-bold text-white text-sm sm:text-base">
                <span className="sm:hidden">Smart Harvest</span>
                <span className="hidden sm:inline">Smart Harvest &amp; Processing Tracker</span>
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                TEST SPECS
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Comprehensive Verification &amp; Test Walkthrough Specifications (TC-01 through TC-13)
            </p>
          </div>
        </div>

        {/* Action Buttons: Jump directly into Preview or Login */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {onPreviewLogin && (
            <button
              onClick={onPreviewLogin}
              id="btn-walkthrough-preview-login"
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition flex items-center space-x-1.5 cursor-pointer min-h-[38px]"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>
                <span className="hidden sm:inline">Launch Live Demo (Preview)</span>
                <span className="sm:hidden">Live Demo</span>
              </span>
            </button>
          )}

          {onGoToLogin && (
            <button
              onClick={onGoToLogin}
              id="btn-walkthrough-goto-login"
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer min-h-[38px]"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>
                <span className="hidden sm:inline">Sign In with Google</span>
                <span className="sm:hidden">Sign In</span>
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Executive Summary Hero Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <BookOpenCheck className="w-4 h-4" />
                <span>Verification &amp; Test Walkthrough Specifications</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                System Quality &amp; Security Validation Matrix
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
                Review all test specifications, step-by-step procedures, attribute-based access control (ABAC) rules,
                and threat model mitigations prior to signing in. Use the interactive checklist to track verification.
              </p>
            </div>

            {/* Test Progress Indicator */}
            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl flex items-center space-x-4 shrink-0">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Verification Progress
                </div>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {checkedStepsCount} / {totalStepsCount} Steps
                </div>
                <div className="text-[10px] text-slate-500">{progressPercent}% verified</div>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-emerald-500 flex items-center justify-center font-bold text-xs text-white">
                {progressPercent}%
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-xl flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">Total Test Cases</div>
                <div className="font-bold text-white text-sm font-mono">13 Test Cases</div>
              </div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-xl flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">Gemini 3.6 Flash</div>
                <div className="font-bold text-white text-sm">Adaptive Schedules</div>
              </div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-xl flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">Inventory Engine</div>
                <div className="font-bold text-white text-sm">Grade A &amp; B Storage</div>
              </div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-xl flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">Dispatch &amp; Payment</div>
                <div className="font-bold text-white text-sm">Fulfillment Slips</div>
              </div>
            </div>
          </div>
        </div>

        {/* Threat Modeling & OWASP Top 10 Summary Section */}
        <details className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group">
          <summary className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-850/60 transition">
            <div className="flex items-center space-x-2.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-white">
                Threat Modeling &amp; Security Architecture Reference (OWASP Mitigations)
              </span>
            </div>
            <span className="text-xs text-slate-400 group-open:rotate-90 transition-transform">
              &rarr;
            </span>
          </summary>
          <div className="p-5 border-t border-slate-800 bg-slate-950/50 text-xs text-slate-300 space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-200 font-semibold bg-slate-900/60">
                    <th className="py-2.5 px-3">Threat Vector</th>
                    <th className="py-2.5 px-3">Identified Risk</th>
                    <th className="py-2.5 px-3">Enforced Countermeasure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-2 px-3 font-semibold text-white">Zero Password Storage</td>
                    <td className="py-2 px-3 text-slate-400">Credential theft, brute-force dictionary attacks</td>
                    <td className="py-2 px-3 text-emerald-300">
                      Federated Google OAuth 2.0 via Firebase Auth exclusively. No passwords ever touched or stored.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-white">Privilege Escalation (OWASP A01)</td>
                    <td className="py-2 px-3 text-slate-400">Workers marking batches ready or granting self-admin</td>
                    <td className="py-2 px-3 text-emerald-300">
                      Authoritative server verification + Firestore rules gating <code>permissionTier</code>.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-white">Facility Multi-Tenancy Leakage</td>
                    <td className="py-2 px-3 text-slate-400">Data bleeding across distinct processing facilities</td>
                    <td className="py-2 px-3 text-emerald-300">
                      Every batch, intake, catalog item, and dispatch is namespaced under <code>farms/{`{farmId}`}</code>.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-white">API Key Exfiltration</td>
                    <td className="py-2 px-3 text-slate-400">Client-side scraping of Gemini / Slack Webhooks</td>
                    <td className="py-2 px-3 text-emerald-300">
                      Secrets are 100% server-side in <code>server.ts</code>. The browser receives only proxied responses.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </details>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Filter Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setActiveCaseIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search test specifications..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Master-Detail Test Specification Explorer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          {/* Left Navigation: Test Cases List */}
          <div className="w-full md:w-80 bg-slate-950/70 border-b md:border-b-0 md:border-r border-slate-800 overflow-y-auto p-2 space-y-1.5 max-h-56 sm:max-h-72 md:max-h-[600px]">
            <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              {filteredCases.length} Test Specifications
            </div>
            {filteredCases.map((tc, idx) => {
              const Icon = tc.icon;
              const isActive = (filteredCases[activeCaseIndex]?.id || currentCase.id) === tc.id;
              const stepCount = tc.steps.length;
              const completedInCase = tc.steps.filter((_, sIdx) => completedSteps[`${tc.id}-${sIdx}`]).length;
              const isCaseDone = completedInCase === stepCount && stepCount > 0;

              return (
                <button
                  key={tc.id}
                  onClick={() => setActiveCaseIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white font-semibold shadow-md'
                      : 'text-slate-300 hover:bg-slate-850 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : isCaseDone
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="text-[10px] opacity-75 font-mono">
                        {tc.id} &bull; {tc.category}
                      </div>
                      <div className="truncate text-xs">{tc.title}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    {isCaseDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    ) : (
                      <span className="text-[10px] opacity-70 font-mono">
                        {completedInCase}/{stepCount}
                      </span>
                    )}
                    <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Detail Pane: Active Test Case Details */}
          <div className="flex-1 p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[600px] bg-slate-900 text-xs">
            {/* Header of Active Test Case */}
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-bold font-mono">
                    {currentCase.id}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    {currentCase.category}
                  </span>
                  {currentCase.roleRequired && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span className="text-amber-400 text-[10px] font-medium">
                        Role: {currentCase.roleRequired}
                      </span>
                    </>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white">{currentCase.title}</h2>
              </div>

              {/* Action Jump to App */}
              <div className="flex items-center space-x-2 shrink-0">
                {onPreviewLogin && (
                  <button
                    onClick={onPreviewLogin}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <span>Execute in Live App</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Precondition Box */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-slate-300 block text-[11px] uppercase tracking-wider">
                System Pre-Condition:
              </span>
              <p className="text-slate-400 leading-relaxed">{currentCase.precondition}</p>
            </div>

            {/* Verification Steps with Checkbox */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
                  Verification Execution Steps:
                </span>
                <span className="text-[10px] text-slate-500">
                  Click steps to check them off as you test
                </span>
              </div>

              <div className="space-y-2">
                {currentCase.steps.map((step, sIdx) => {
                  const stepKey = `${currentCase.id}-${sIdx}`;
                  const isChecked = !!completedSteps[stepKey];

                  return (
                    <div
                      key={sIdx}
                      onClick={() => toggleStep(stepKey)}
                      className={`p-3 rounded-xl border transition flex items-start space-x-3 cursor-pointer select-none ${
                        isChecked
                          ? 'bg-emerald-950/30 border-emerald-800 text-slate-300'
                          : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-emerald-400 shrink-0 focus:outline-none"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>

                      <div className="leading-relaxed">
                        <span className="font-mono text-slate-500 mr-2 font-bold">{sIdx + 1}.</span>
                        <span className={isChecked ? 'line-through text-slate-400' : ''}>{step}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expected Functional Outcome */}
            <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-800/80 text-emerald-100 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Expected Verification Result:</span>
              </div>
              <p className="leading-relaxed text-xs text-emerald-200/90">{currentCase.expectedResult}</p>
            </div>
          </div>
        </div>

        {/* Bottom Call to Action */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-center sm:text-left">
            <div className="font-bold text-white text-sm">Ready to execute tests on the live system?</div>
            <div className="text-xs text-slate-400">
              Sign in with your Google account or explore immediately using the preloaded Preview account.
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {onPreviewLogin && (
              <button
                onClick={onPreviewLogin}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center space-x-2 shadow-md cursor-pointer"
              >
                <span>Launch Live Preview Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {onGoToLogin && (
              <button
                onClick={onGoToLogin}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Go to Google Sign-In</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
