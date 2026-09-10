import React, { useEffect } from 'react';
import { User } from 'firebase/auth';
import { Farm, FarmMember, isQualityInspector, isProductionLead } from '../types';
import { logoutUser } from '../lib/firebase';
import {
  Factory,
  X,
  LayoutDashboard,
  Boxes,
  ClipboardList,
  Package,
  Truck,
  Layers,
  History,
  Users,
  ShieldCheck,
  UserCheck,
  Building2,
  ChevronRight,
  RefreshCw,
  BookOpenCheck,
  LogOut,
  Plus,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export type NavTabType =
  | 'dashboard'
  | 'batches'
  | 'intake'
  | 'packaging'
  | 'dispatch'
  | 'catalog'
  | 'history'
  | 'team';

interface NavigationSliderProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  activeFarm: Farm | null;
  activeMember: FarmMember | null;
  allFarms: Array<{ farm: Farm; member: FarmMember }>;
  onSelectFarm: (farm: Farm, member: FarmMember) => void;
  activeTab: NavTabType;
  onNavigateTab: (tab: NavTabType) => void;
  batchesCount: number;
  harvestLogsCount: number;
  productsCount: number;
  onOpenOnboarding: () => void;
  onOpenWalkthrough: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  onQuickIntake?: () => void;
  onNewBatch?: () => void;
}

export const NavigationSlider: React.FC<NavigationSliderProps> = ({
  isOpen,
  onClose,
  user,
  activeFarm,
  activeMember,
  allFarms,
  onSelectFarm,
  activeTab,
  onNavigateTab,
  batchesCount,
  harvestLogsCount,
  productsCount,
  onOpenOnboarding,
  onOpenWalkthrough,
  onRefreshData,
  isRefreshing,
  onQuickIntake,
  onNewBatch,
}) => {
  const isAdmin = activeMember?.permissionTier === 'admin';
  const isQC = isQualityInspector(activeMember?.roleLabel, activeMember?.permissionTier);
  const isLead = isProductionLead(activeMember?.roleLabel, activeMember?.permissionTier);

  // Lock body scroll when slider is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTabClick = (tab: NavTabType) => {
    onNavigateTab(tab);
    onClose();
  };

  const navItems = [
    ...(isAdmin
      ? [
          {
            id: 'dashboard' as NavTabType,
            label: 'Admin Dashboard',
            icon: LayoutDashboard,
            badge: 'Admin',
            color: 'text-emerald-400',
            activeBg: 'bg-emerald-600 text-white',
          },
        ]
      : isQC
      ? [
          {
            id: 'dashboard' as NavTabType,
            label: 'Quality Inspector Dashboard',
            icon: LayoutDashboard,
            badge: 'QC',
            color: 'text-blue-400',
            activeBg: 'bg-blue-600 text-white',
          },
        ]
      : isLead
      ? [
          {
            id: 'dashboard' as NavTabType,
            label: 'Production Lead Dashboard',
            icon: LayoutDashboard,
            badge: 'Lead',
            color: 'text-sky-400',
            activeBg: 'bg-sky-600 text-white',
          },
        ]
      : []),
    {
      id: 'batches' as NavTabType,
      label: 'Production Batches',
      icon: Boxes,
      count: batchesCount,
      color: 'text-amber-400',
      activeBg: 'bg-emerald-600 text-white',
    },
    {
      id: 'intake' as NavTabType,
      label: isAdmin ? 'Raw Material Intake' : 'My Material Intake',
      icon: ClipboardList,
      count: harvestLogsCount,
      color: 'text-teal-400',
      activeBg: 'bg-emerald-600 text-white',
    },
    {
      id: 'packaging' as NavTabType,
      label: 'Packaging & Storage',
      icon: Package,
      color: 'text-purple-400',
      activeBg: 'bg-purple-600 text-white',
      badge: 'Grade A/B',
    },
    {
      id: 'dispatch' as NavTabType,
      label: 'Dispatch & Logistics',
      icon: Truck,
      color: 'text-sky-400',
      activeBg: 'bg-sky-600 text-white',
      badge: 'Orders & Slips',
    },
    {
      id: 'catalog' as NavTabType,
      label: 'Product Catalog',
      icon: Layers,
      count: productsCount,
      color: 'text-indigo-400',
      activeBg: 'bg-emerald-600 text-white',
    },
    {
      id: 'history' as NavTabType,
      label: isAdmin ? 'Operational History' : 'Delivery History',
      icon: History,
      color: 'text-slate-400',
      activeBg: 'bg-emerald-600 text-white',
    },
    ...(isAdmin
      ? [
          {
            id: 'team' as NavTabType,
            label: 'Team & Access Rules',
            icon: Users,
            color: 'text-rose-400',
            activeBg: 'bg-emerald-600 text-white',
          },
        ]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sliding Drawer Container */}
      <div className="fixed inset-y-0 left-0 max-w-full flex pr-10 pointer-events-auto">
        <div className="w-screen max-w-xs sm:max-w-sm bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-inner">
                <Factory className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-white leading-tight">
                  Smart Harvest
                </h2>
                <p className="text-[11px] text-slate-400 font-mono">
                  Processing &amp; Intake
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              id="btn-close-nav-slider"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile & Role Card */}
          <div className="p-3.5 bg-slate-950/40 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  (user.displayName || user.email || 'U')[0].toUpperCase()
                )}
              </div>
              <div className="truncate flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
              </div>
              {activeMember && (
                <div className="shrink-0">
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isAdmin
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    }`}
                  >
                    {isAdmin ? (
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <UserCheck className="w-3 h-3 text-sky-400" />
                    )}
                    <span>{activeMember.roleLabel || (isAdmin ? 'Admin' : 'Worker')}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Active Facility Card */}
            {activeFarm && (
              <div className="mt-3 p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 truncate">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-slate-200 truncate">
                    {activeFarm.name}
                  </span>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenOnboarding();
                  }}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold shrink-0 ml-1"
                >
                  Switch / Add
                </button>
              </div>
            )}
          </div>

          {/* Quick Action Shortcuts */}
          <div className="px-3 pt-3 pb-1 grid grid-cols-2 gap-2 text-xs">
            {onQuickIntake && (
              <button
                onClick={() => {
                  onQuickIntake();
                  onClose();
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white transition flex items-center space-x-1.5 cursor-pointer text-left"
              >
                <ClipboardList className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="font-semibold text-[11px] truncate">+ Intake Log</span>
              </button>
            )}

            {isAdmin && onNewBatch && (
              <button
                onClick={() => {
                  onNewBatch();
                  onClose();
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white transition flex items-center space-x-1.5 cursor-pointer text-left"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold text-[11px] truncate">+ New Batch</span>
              </button>
            )}
          </div>

          {/* Navigation Items List */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Navigation Menu
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  id={`nav-slider-tab-${item.id}`}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between cursor-pointer min-h-[44px] ${
                    isActive
                      ? item.activeBg
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-white' : item.color
                      } shrink-0`}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {item.count !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isActive
                            ? 'bg-black/20 text-white'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-black/20 text-white'
                            : 'bg-purple-950/60 text-purple-300 border border-purple-800/60'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight
                      className={`w-3.5 h-3.5 ${
                        isActive ? 'text-white' : 'text-slate-600'
                      }`}
                    />
                  </div>
                </button>
              );
            })}

            <div className="pt-3 pb-1">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                System &amp; Verification
              </div>

              {/* Test Walkthrough Link */}
              <button
                onClick={() => {
                  onClose();
                  onOpenWalkthrough();
                }}
                id="btn-nav-slider-walkthrough"
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium text-amber-300 hover:bg-amber-950/30 hover:text-amber-200 transition flex items-center justify-between cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center space-x-3">
                  <BookOpenCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Test Specs (TC-01 - TC-13)</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                  13 Specs
                </span>
              </button>

              {/* Refresh Data */}
              <button
                onClick={() => {
                  onRefreshData();
                }}
                disabled={isRefreshing}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center space-x-3 cursor-pointer min-h-[44px]"
              >
                <RefreshCw
                  className={`w-4 h-4 text-slate-400 shrink-0 ${
                    isRefreshing ? 'animate-spin text-emerald-400' : ''
                  }`}
                />
                <span>
                  {isRefreshing ? 'Refreshing data...' : 'Refresh Facility Data'}
                </span>
              </button>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <button
              onClick={() => {
                onClose();
                onOpenOnboarding();
              }}
              className="text-xs text-slate-400 hover:text-emerald-400 transition flex items-center space-x-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Facility Settings</span>
            </button>

            <button
              onClick={() => logoutUser()}
              id="btn-nav-slider-logout"
              className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
