import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ClipboardList,
  Package,
  Truck,
  Menu,
} from 'lucide-react';
import { NavTabType } from './NavigationSlider';

interface MobileBottomNavProps {
  activeTab: NavTabType;
  onNavigateTab: (tab: NavTabType) => void;
  onOpenSlider: () => void;
  isAdmin: boolean;
  isQC?: boolean;
  isLead?: boolean;
  batchesCount: number;
  harvestLogsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onNavigateTab,
  onOpenSlider,
  isAdmin,
  isQC = false,
  isLead = false,
  batchesCount,
  harvestLogsCount,
}) => {
  return (
    <nav
      id="mobile-bottom-nav-bar"
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 px-1 py-1.5 shadow-lg pb-safe"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* Tab 1: Dashboard (if Admin, QC, or Lead) */}
        {(isAdmin || isQC || isLead) && (
          <button
            onClick={() => onNavigateTab('dashboard')}
            id="mobile-nav-btn-dashboard"
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition min-h-[44px] cursor-pointer ${
              activeTab === 'dashboard'
                ? isQC
                  ? 'text-blue-400 font-bold'
                  : isLead
                  ? 'text-sky-400 font-bold'
                  : 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] tracking-tight truncate">
              {isQC ? 'QC Dash' : isLead ? 'Lead' : 'Dashboard'}
            </span>
            {activeTab === 'dashboard' && (
              <span
                className={`w-1 h-1 rounded-full ${
                  isQC ? 'bg-blue-400' : isLead ? 'bg-sky-400' : 'bg-emerald-400'
                } mt-0.5`}
              />
            )}
          </button>
        )}

        {/* Tab 2: Batches */}
        <button
          onClick={() => onNavigateTab('batches')}
          id="mobile-nav-btn-batches"
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition min-h-[44px] cursor-pointer relative ${
            activeTab === 'batches'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Boxes className="w-4 h-4 mb-0.5" />
            {batchesCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 text-[8px] font-bold rounded-full bg-emerald-600 text-white font-mono">
                {batchesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight truncate">Batches</span>
          {activeTab === 'batches' && (
            <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />
          )}
        </button>

        {/* Tab 3: Intake */}
        <button
          onClick={() => onNavigateTab('intake')}
          id="mobile-nav-btn-intake"
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition min-h-[44px] cursor-pointer relative ${
            activeTab === 'intake'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ClipboardList className="w-4 h-4 mb-0.5" />
            {harvestLogsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 text-[8px] font-bold rounded-full bg-teal-600 text-white font-mono">
                {harvestLogsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight truncate">Intake</span>
          {activeTab === 'intake' && (
            <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />
          )}
        </button>

        {/* Tab 4: Packaging */}
        <button
          onClick={() => onNavigateTab('packaging')}
          id="mobile-nav-btn-packaging"
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition min-h-[44px] cursor-pointer ${
            activeTab === 'packaging'
              ? 'text-purple-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] tracking-tight truncate">Packaging</span>
          {activeTab === 'packaging' && (
            <span className="w-1 h-1 rounded-full bg-purple-400 mt-0.5" />
          )}
        </button>

        {/* Tab 5: Dispatch */}
        <button
          onClick={() => onNavigateTab('dispatch')}
          id="mobile-nav-btn-dispatch"
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition min-h-[44px] cursor-pointer ${
            activeTab === 'dispatch'
              ? 'text-sky-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] tracking-tight truncate">Dispatch</span>
          {activeTab === 'dispatch' && (
            <span className="w-1 h-1 rounded-full bg-sky-400 mt-0.5" />
          )}
        </button>

        {/* Tab 6: Slider Menu (Drawer trigger) */}
        <button
          onClick={onOpenSlider}
          id="mobile-nav-btn-more-menu"
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-slate-400 hover:text-emerald-400 transition min-h-[44px] cursor-pointer"
          title="Open Full Navigation Menu & Actions"
        >
          <Menu className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] tracking-tight font-medium truncate">More</span>
        </button>
      </div>
    </nav>
  );
};
