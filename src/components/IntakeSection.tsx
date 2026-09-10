import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  ProductCatalogItem,
  HarvestLog,
  FarmMember,
  ProductionBatch,
  isQualityInspector,
  isProductionLead,
  canLogRawMaterialIntake,
  canStartProductionBatch,
  canInspectRawMaterial,
  isRawMaterialApproved,
  RawMaterialQcStatus,
  RawMaterialQcInspection,
} from '../types';
import { addHarvestLog, addProduct, updateHarvestLog, inspectRawMaterialIntake } from '../lib/farmService';
import { cleanUnit, formatUnitDisplay, formatQuantityWithUnit } from '../lib/unitUtils';
import {
  ClipboardList,
  PlusCircle,
  Search,
  Filter,
  Layers,
  Calendar,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  PackageCheck,
  Scale,
  Boxes,
  Pencil,
  ShieldCheck,
  ShieldAlert,
  Info,
  Droplets,
  Thermometer,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  FileCheck,
  X,
} from 'lucide-react';

interface IntakeSectionProps {
  farmId: string;
  user: User;
  member: FarmMember;
  products: ProductCatalogItem[];
  harvestLogs: HarvestLog[];
  batches?: ProductionBatch[];
  onLogAdded: (newLog: HarvestLog) => void;
  onLogUpdated?: (updatedLog: HarvestLog) => void;
  onProductAdded: (newProd: ProductCatalogItem) => void;
  onStartBatchWithLogs: (selectedLogs: HarvestLog[], product: ProductCatalogItem) => void;
  preselectedProduct?: ProductCatalogItem | null;
  onSelectBatch?: (batchId: string) => void;
  onNavigateTab?: (tab: 'dashboard' | 'intake' | 'batches' | 'catalog' | 'history' | 'team') => void;
}

export const IntakeSection: React.FC<IntakeSectionProps> = ({
  farmId,
  user,
  member,
  products,
  harvestLogs,
  batches = [],
  onLogAdded,
  onLogUpdated,
  onProductAdded,
  onStartBatchWithLogs,
  preselectedProduct,
  onSelectBatch,
  onNavigateTab,
}) => {
  const isLead = isProductionLead(member.roleLabel, member.permissionTier);
  const isQC = isQualityInspector(member.roleLabel, member.permissionTier);
  const isAdmin = member.permissionTier === 'admin';
  const canLogIntake = canLogRawMaterialIntake(member.roleLabel, member.permissionTier);
  const canStartBatch = canStartProductionBatch(member.roleLabel, member.permissionTier);
  const canInspect = canInspectRawMaterial(member.roleLabel, member.permissionTier);

  const [showLogForm, setShowLogForm] = useState(!!preselectedProduct && canLogIntake);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    preselectedProduct?.id || (products.length > 0 ? products[0].id : '')
  );
  const [quantity, setQuantity] = useState<string>('50');
  const [notes, setNotes] = useState<string>('');

  // Inline new product modal/drawer state
  const [isInlineAddingProduct, setIsInlineAddingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('kg');
  const [newProductProcess, setNewProductProcess] = useState('drying');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter states
  const [filterProductId, setFilterProductId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'ready' | 'processing' | 'exhausted'>('all');
  const [filterQcStatus, setFilterQcStatus] = useState<'all' | 'pending_qc' | 'qc_approved' | 'quarantined' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selection for batch creation
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);

  // Raw Material Inward QC Inspection Modal State
  const [qcModalLog, setQcModalLog] = useState<HarvestLog | null>(null);
  const [qcDecision, setQcDecision] = useState<RawMaterialQcStatus>('qc_approved');
  const [qcMoisture, setQcMoisture] = useState<string>('75');
  const [qcVisualQuality, setQcVisualQuality] = useState<'Excellent' | 'Good' | 'Fair' | 'Poor'>('Good');
  const [qcDefectRate, setQcDefectRate] = useState<string>('1.0');
  const [qcTemperature, setQcTemperature] = useState<string>('20');
  const [qcNotes, setQcNotes] = useState<string>('');
  const [qcRejectionReason, setQcRejectionReason] = useState<string>('');
  const [isSubmittingQc, setIsSubmittingQc] = useState<boolean>(false);

  // View QC Inspection findings modal state (read-only)
  const [viewingQcLog, setViewingQcLog] = useState<HarvestLog | null>(null);

  const openQcInspection = (log: HarvestLog) => {
    setQcModalLog(log);
    setQcDecision(log.qcStatus === 'quarantined' || log.qcStatus === 'rejected' ? log.qcStatus : 'qc_approved');
    setQcMoisture(log.qcInspection?.moisturePercent !== undefined ? String(log.qcInspection.moisturePercent) : '75');
    setQcVisualQuality(log.qcInspection?.visualQuality || 'Good');
    setQcDefectRate(log.qcInspection?.defectRatePercent !== undefined ? String(log.qcInspection.defectRatePercent) : '1.0');
    setQcTemperature(log.qcInspection?.temperatureCelsius !== undefined ? String(log.qcInspection.temperatureCelsius) : '20');
    setQcNotes(log.qcInspection?.notes || '');
    setQcRejectionReason(log.qcInspection?.rejectionReason || '');
    setFeedback(null);
  };

  const handleSubmitQcInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canInspect) {
      setFeedback({
        type: 'error',
        message: 'Permission Restricted: Raw material quality inspection is restricted to Quality Inspectors and Facility Admins.',
      });
      return;
    }
    if (!qcModalLog) return;
    if ((qcDecision === 'rejected' || qcDecision === 'quarantined') && !qcRejectionReason.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please provide a justification or rejection reason when quarantining or rejecting raw material.',
      });
      return;
    }

    setIsSubmittingQc(true);
    try {
      const inspectionData: RawMaterialQcInspection = {
        inspectedByUid: user.uid,
        inspectedByName: user.displayName || user.email || 'Quality Inspector',
        inspectedByRole: member.roleLabel || member.permissionTier,
        inspectedAt: new Date().toISOString(),
        status: qcDecision,
        moisturePercent: qcMoisture ? parseFloat(qcMoisture) : undefined,
        visualQuality: qcVisualQuality,
        defectRatePercent: qcDefectRate ? parseFloat(qcDefectRate) : undefined,
        temperatureCelsius: qcTemperature ? parseFloat(qcTemperature) : undefined,
        notes: qcNotes.trim(),
        rejectionReason: (qcDecision === 'rejected' || qcDecision === 'quarantined') ? qcRejectionReason.trim() : undefined,
      };

      const updated = await inspectRawMaterialIntake(farmId, qcModalLog.id, inspectionData);
      if (onLogUpdated) {
        onLogUpdated(updated);
      }
      setFeedback({
        type: 'success',
        message:
          qcDecision === 'qc_approved'
            ? `Raw material lot #${qcModalLog.id.slice(-6)} (${qcModalLog.productName}) certified and APPROVED for batch processing.`
            : qcDecision === 'quarantined'
            ? `Raw material lot #${qcModalLog.id.slice(-6)} placed under QUARANTINE. Production batch allocation blocked.`
            : `Raw material lot #${qcModalLog.id.slice(-6)} REJECTED. Production batch allocation blocked.`,
      });
      setQcModalLog(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to submit raw material quality inspection.',
      });
    } finally {
      setIsSubmittingQc(false);
    }
  };

  // Edit Intake Log state
  const [editingLog, setEditingLog] = useState<HarvestLog | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [editUnit, setEditUnit] = useState<string>('kg');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isEditingLog, setIsEditingLog] = useState(false);

  const startEditLog = (log: HarvestLog) => {
    setEditingLog(log);
    setEditQuantity(String(log.quantity));
    setEditUnit(cleanUnit(log.unit));
    setEditNotes(log.notes || '');
    setFeedback(null);
  };

  const handleUpdateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canLogIntake) {
      setFeedback({
        type: 'error',
        message: 'Permission Restricted: Raw material intake updates are restricted to the Production Lead or Facility Admin.',
      });
      return;
    }
    if (!editingLog) return;
    const num = parseFloat(editQuantity);
    if (isNaN(num) || num <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid positive quantity.' });
      return;
    }
    setIsEditingLog(true);
    try {
      const sanitizedUnit = cleanUnit(editUnit) || 'kg';
      const updated = await updateHarvestLog(farmId, editingLog.id, {
        quantity: num,
        unit: sanitizedUnit,
        notes: editNotes.trim(),
      });
      if (onLogUpdated) {
        onLogUpdated(updated);
      }
      setFeedback({
        type: 'success',
        message: `Updated intake record for ${updated.productName}: ${updated.quantity} ${formatUnitDisplay(updated.unit)}.`,
      });
      setEditingLog(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to update intake entry.',
      });
    } finally {
      setIsEditingLog(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Analyze intake log against batches to compute live lifecycle and inventory balances
  const getLogAnalysis = (log: HarvestLog) => {
    const linkedBatches = (batches || []).filter((b) => b.linkedHarvestLogIds?.includes(log.id));

    // Dynamic derivation of allocated and remaining quantities
    let totalAllocated = 0;
    if (log.allocatedQuantity !== undefined) {
      totalAllocated = log.allocatedQuantity;
    } else {
      totalAllocated = linkedBatches.reduce((acc, b) => {
        const specific = b.intakeAllocations?.find((a) => a.harvestLogId === log.id)?.quantityUsed;
        return acc + (specific !== undefined ? specific : (b.totalQuantity || 0));
      }, 0);
    }
    totalAllocated = Math.min(log.quantity, Math.max(0, totalAllocated));
    const remainingQuantity = Math.max(0, log.quantity - totalAllocated);

    const isFullyAllocated = remainingQuantity <= 0;
    const isPartiallyAllocated = totalAllocated > 0 && remainingQuantity > 0;
    const isFresh = totalAllocated === 0;

    const readyBatches = linkedBatches.filter((b) => b.status === 'ready');
    const processingBatches = linkedBatches.filter((b) => b.status === 'processing');
    const packagedBatches = linkedBatches.filter((b) => b.status === 'packaged');
    const latestBatch = linkedBatches[linkedBatches.length - 1];

    return {
      linkedBatches,
      totalAllocated,
      remainingQuantity,
      isFullyAllocated,
      isPartiallyAllocated,
      isFresh,
      readyBatches,
      processingBatches,
      packagedBatches,
      latestBatch,
    };
  };

  const handleInlineProductSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    try {
      const sanitizedUnit = cleanUnit(newProductUnit.trim()) || 'kg';
      const created = await addProduct(
        farmId,
        newProductName.trim(),
        sanitizedUnit,
        newProductProcess.trim() || 'processing',
        user.uid
      );
      onProductAdded(created);
      setSelectedProductId(created.id);
      setIsInlineAddingProduct(false);
      setNewProductName('');
      setFeedback({
        type: 'success',
        message: `Created product "${created.name}" and selected for intake (Unit: ${formatUnitDisplay(created.unit)}).`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to create inline product.' });
    }
  };

  const handleLogIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!canLogIntake) {
      setFeedback({
        type: 'error',
        message: 'Permission Restricted: Raw Material intake entry is performed by the Production Lead or Facility Admin.',
      });
      return;
    }

    if (!selectedProduct) {
      setFeedback({ type: 'error', message: 'Please select or add a product to log intake.' });
      return;
    }

    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid positive quantity.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const sanitizedUnit = cleanUnit(selectedProduct.unit) || 'kg';
      const logData = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: numQty,
        unit: sanitizedUnit,
        notes: notes.trim(),
        loggedByUid: user.uid,
        loggedByName: user.displayName || user.email || 'Team Member',
        loggedByRole: member.roleLabel || member.permissionTier,
      };

      const logId = await addHarvestLog(farmId, logData);
      const newLog: HarvestLog = {
        id: logId,
        ...logData,
        harvestedAt: new Date(),
      };

      onLogAdded(newLog);
      setFeedback({
        type: 'success',
        message: `Logged ${numQty} ${formatUnitDisplay(sanitizedUnit)} of ${selectedProduct.name} successfully.`,
      });
      setNotes('');
      setShowLogForm(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to log raw material intake.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute Inward QC statistics across all harvest logs
  const qcStats = React.useMemo(() => {
    let pendingCount = 0;
    let pendingQty = 0;
    let approvedCount = 0;
    let approvedQty = 0;
    let quarantinedCount = 0;
    let quarantinedQty = 0;
    let rejectedCount = 0;
    let rejectedQty = 0;

    harvestLogs.forEach((log) => {
      const isApproved = isRawMaterialApproved(log);
      const analysis = getLogAnalysis(log);
      const remaining = analysis.remainingQuantity;

      if (log.qcStatus === 'rejected') {
        rejectedCount++;
        rejectedQty += remaining;
      } else if (log.qcStatus === 'quarantined') {
        quarantinedCount++;
        quarantinedQty += remaining;
      } else if (isApproved) {
        approvedCount++;
        approvedQty += remaining;
      } else {
        pendingCount++;
        pendingQty += remaining;
      }
    });

    return {
      pendingCount,
      pendingQty: Math.round(pendingQty * 100) / 100,
      approvedCount,
      approvedQty: Math.round(approvedQty * 100) / 100,
      quarantinedCount,
      quarantinedQty: Math.round(quarantinedQty * 100) / 100,
      rejectedCount,
      rejectedQty: Math.round(rejectedQty * 100) / 100,
      totalCount: harvestLogs.length,
    };
  }, [harvestLogs, batches]);

  const filteredLogs = harvestLogs.filter((log) => {
    const matchesProduct = filterProductId === 'all' || log.productId === filterProductId;
    const matchesSearch =
      log.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.loggedByName && log.loggedByName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesProduct || !matchesSearch) return false;

    if (filterStatus !== 'all') {
      const analysis = getLogAnalysis(log);
      if (filterStatus === 'available') return analysis.remainingQuantity > 0;
      if (filterStatus === 'ready') return analysis.readyBatches.length > 0;
      if (filterStatus === 'processing') return analysis.processingBatches.length > 0;
      if (filterStatus === 'exhausted') return analysis.isFullyAllocated;
    }

    if (filterQcStatus !== 'all') {
      const isApproved = isRawMaterialApproved(log);
      if (filterQcStatus === 'qc_approved' && !isApproved) return false;
      if (
        filterQcStatus === 'pending_qc' &&
        (isApproved || log.qcStatus === 'quarantined' || log.qcStatus === 'rejected')
      )
        return false;
      if (filterQcStatus === 'quarantined' && log.qcStatus !== 'quarantined') return false;
      if (filterQcStatus === 'rejected' && log.qcStatus !== 'rejected') return false;
    }

    return true;
  });

  const toggleLogSelection = (id: string) => {
    const targetLog = harvestLogs.find((l) => l.id === id);
    if (targetLog) {
      if (!isRawMaterialApproved(targetLog)) {
        setFeedback({
          type: 'error',
          message: `Quality Gate Warning: "${targetLog.productName}" (Lot #${targetLog.id.slice(-6)}) must be verified and approved by the Quality Inspector or Facility Admin before it can be processed into a batch.`,
        });
        return;
      }
      const analysis = getLogAnalysis(targetLog);
      if (analysis.isFullyAllocated) {
        setFeedback({
          type: 'error',
          message: `Intake delivery record for ${targetLog.productName} is 100% allocated. Record new raw material intake or draw from available deliveries.`,
        });
        return;
      }
    }
    setSelectedLogIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStartBatchFromSelected = () => {
    const selected = harvestLogs.filter((l) => selectedLogIds.includes(l.id));
    if (selected.length === 0) return;

    // Strict Quality Gate: All selected logs must be QC approved
    const unapproved = selected.filter((l) => !isRawMaterialApproved(l));
    if (unapproved.length > 0) {
      setFeedback({
        type: 'error',
        message: `Quality Gate Warning: Cannot start production batch with unverified raw material. ${unapproved
          .map((u) => u.productName)
          .join(', ')} must be verified and approved by the Quality Inspector or Admin first.`,
      });
      return;
    }

    const firstProduct = products.find((p) => p.id === selected[0].productId);
    if (!firstProduct) return;

    // Attach current calculated remaining quantities
    const enrichedSelected = selected.map((l) => {
      const analysis = getLogAnalysis(l);
      return {
        ...l,
        remainingQuantity: analysis.remainingQuantity,
      };
    });

    onStartBatchWithLogs(enrichedSelected, firstProduct);
  };

  // Compute total available from selected logs
  const selectedTotalAvailable = selectedLogIds.reduce((sum, id) => {
    const log = harvestLogs.find((l) => l.id === id);
    if (!log) return sum;
    const analysis = getLogAnalysis(log);
    return sum + analysis.remainingQuantity;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-emerald-500" />
            <span>Raw Material Intake &amp; Lineage</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time delivery stock, partial intake allocation, and live batch production lifecycle
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {selectedLogIds.length > 0 && (
            <button
              onClick={handleStartBatchFromSelected}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow transition animate-in fade-in"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>
                Start Batch from {selectedLogIds.length} Intake{selectedLogIds.length > 1 ? 's' : ''} ({selectedTotalAvailable.toLocaleString()} Available)
              </span>
            </button>
          )}

          <button
            onClick={() => {
              setShowLogForm(!showLogForm);
              setFeedback(null);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Intake Entry</span>
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Log Intake Form Drawer */}
      {showLogForm && (
        <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-xl border border-emerald-500/40 dark:border-emerald-500/30 shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-800 dark:text-white">
              <Scale className="w-4 h-4 text-emerald-500" />
              <span>Record Incoming Raw Material Delivery</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Logged by: <strong className="text-slate-700 dark:text-slate-300">{member.roleLabel || member.permissionTier}</strong>
            </span>
          </div>

          <form onSubmit={handleLogIntake} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Product Select */}
              <div className="space-y-1 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Product from Catalog
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsInlineAddingProduct(!isInlineAddingProduct)}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    + Add New Product
                  </button>
                </div>

                {products.length > 0 ? (
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.unit} • {p.processingType})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400 py-1">
                    Catalog empty. Please add a product first!
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Quantity ({formatUnitDisplay(selectedProduct?.unit || 'units')})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="e.g. 100"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none pr-14"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 uppercase font-mono">
                    {formatUnitDisplay(selectedProduct?.unit || 'kg')}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Notes / Source Batch / Grade
                </label>
                <input
                  type="text"
                  placeholder="e.g. Supplier Lot #412, fresh unblemished Grade A"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Inline New Product Subform */}
            {isInlineAddingProduct && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-2 text-xs">
                <div className="font-semibold text-emerald-900 dark:text-emerald-300">
                  Quick-Define New Product
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Product Name (e.g. Papad Dough)"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Unit (e.g. kg)"
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value.replace(/[\d\.\,\-]+/g, ''))}
                    onBlur={() => setNewProductUnit(cleanUnit(newProductUnit))}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Process (e.g. drying, fermenting)"
                    value={newProductProcess}
                    onChange={(e) => setNewProductProcess(e.target.value)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsInlineAddingProduct(false)}
                    className="px-2 py-1 text-slate-600 dark:text-slate-400 hover:underline"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleInlineProductSave}
                    disabled={!newProductName.trim()}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-semibold"
                  >
                    Save &amp; Select
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogForm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedProduct}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow transition"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Intake Record...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Save Intake Log</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inward QC Oversight & Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Raw Inward */}
        <div
          onClick={() => setFilterQcStatus('all')}
          className={`cursor-pointer p-3.5 rounded-xl border shadow-xs flex items-center space-x-3 transition ${
            filterQcStatus === 'all'
              ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 ring-2 ring-slate-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Total Raw Inward</div>
            <div className="text-base font-bold text-slate-900 dark:text-white">{qcStats.totalCount} Lots</div>
          </div>
        </div>

        {/* Pending Inward QC */}
        <div
          onClick={() => setFilterQcStatus(filterQcStatus === 'pending_qc' ? 'all' : 'pending_qc')}
          className={`cursor-pointer p-3.5 rounded-xl border shadow-xs flex items-center space-x-3 transition ${
            filterQcStatus === 'pending_qc'
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/50'
              : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/50 hover:border-amber-300'
          }`}
        >
          <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-amber-800 dark:text-amber-400 truncate flex items-center space-x-1">
              <span>Pending Inward QC</span>
              {qcStats.pendingCount > 0 && (
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
            <div className="text-base font-bold text-amber-900 dark:text-amber-200">
              {qcStats.pendingCount} Lots <span className="text-xs font-normal">({qcStats.pendingQty.toLocaleString()})</span>
            </div>
          </div>
        </div>

        {/* QC Approved (Ready) */}
        <div
          onClick={() => setFilterQcStatus(filterQcStatus === 'qc_approved' ? 'all' : 'qc_approved')}
          className={`cursor-pointer p-3.5 rounded-xl border shadow-xs flex items-center space-x-3 transition ${
            filterQcStatus === 'qc_approved'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/50'
              : 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-300'
          }`}
        >
          <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400 truncate">QC Approved (Ready)</div>
            <div className="text-base font-bold text-emerald-900 dark:text-emerald-200">
              {qcStats.approvedCount} Lots <span className="text-xs font-normal">({qcStats.approvedQty.toLocaleString()})</span>
            </div>
          </div>
        </div>

        {/* Quarantine / Rejected */}
        <div
          onClick={() =>
            setFilterQcStatus(
              filterQcStatus === 'quarantined' || filterQcStatus === 'rejected' ? 'all' : 'quarantined'
            )
          }
          className={`cursor-pointer p-3.5 rounded-xl border shadow-xs flex items-center space-x-3 transition ${
            filterQcStatus === 'quarantined' || filterQcStatus === 'rejected'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-600 ring-2 ring-rose-400/50'
              : 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900/50 hover:border-rose-300'
          }`}
        >
          <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-rose-800 dark:text-rose-400 truncate">Quarantined / Rejected</div>
            <div className="text-base font-bold text-rose-900 dark:text-rose-200">
              {qcStats.quarantinedCount + qcStats.rejectedCount} Lots
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterProductId}
            onChange={(e) => setFilterProductId(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Products ({harvestLogs.length})</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* QC Status filter */}
          <select
            value={filterQcStatus}
            onChange={(e: any) => setFilterQcStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="all">All Quality Approvals</option>
            <option value="pending_qc">⏳ Pending Inward QC ({qcStats.pendingCount})</option>
            <option value="qc_approved">✓ QC Approved ({qcStats.approvedCount})</option>
            <option value="quarantined">⚠️ Quarantined ({qcStats.quarantinedCount})</option>
            <option value="rejected">✕ Rejected ({qcStats.rejectedCount})</option>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e: any) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="all">All Inventory Statuses</option>
            <option value="available">Available in Stock</option>
            <option value="ready">Ready for Distribution</option>
            <option value="processing">In Processing</option>
            <option value="exhausted">Fully Allocated</option>
          </select>

          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search intake records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="text-slate-500 dark:text-slate-400 text-[11px] self-end sm:self-center">
          Showing {filteredLogs.length} intake entries
        </div>
      </div>

      {/* Intake Records Table */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-8">
          <ClipboardList className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No intake entries found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Log your incoming raw materials to start tracking batches and schedules.
          </p>
          <button
            onClick={() => setShowLogForm(true)}
            className="mt-3 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition"
          >
            + Record First Intake
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 w-8">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="p-3">Product &amp; Production Lineage</th>
                  <th className="p-3">Quantity &amp; Inventory Balance</th>
                  <th className="p-3">Inward Quality (QC)</th>
                  <th className="p-3">Logged By</th>
                  <th className="p-3">Date &amp; Time</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredLogs.map((log) => {
                  const isSelected = selectedLogIds.includes(log.id);
                  const isApproved = isRawMaterialApproved(log);
                  const logDate = log.harvestedAt?.toDate
                    ? log.harvestedAt.toDate()
                    : new Date(log.harvestedAt || Date.now());

                  const analysis = getLogAnalysis(log);
                  const pctUsed = Math.min(100, Math.round((analysis.totalAllocated / log.quantity) * 100));

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
                        isSelected ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={analysis.isFullyAllocated || !isApproved}
                          onChange={() => toggleLogSelection(log.id)}
                          title={
                            !isApproved
                              ? 'Quality Inspector verification required before this lot can be processed'
                              : analysis.isFullyAllocated
                              ? 'All raw material allocated to batches'
                              : 'Select to start batch'
                          }
                          className={`rounded text-emerald-600 focus:ring-emerald-500 ${
                            analysis.isFullyAllocated || !isApproved
                              ? 'opacity-30 cursor-not-allowed'
                              : 'cursor-pointer'
                          }`}
                        />
                      </td>
                      <td className="p-3 max-w-sm">
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">
                          {log.productName}
                        </div>

                        {/* Intake Stock & Production Linkage Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {/* Stock Status Badge */}
                          {analysis.isFresh ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              100% In Stock ({log.quantity} {formatUnitDisplay(log.unit)} available)
                            </span>
                          ) : analysis.isPartiallyAllocated ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Partially Allocated ({analysis.totalAllocated} {formatUnitDisplay(log.unit)} in batch • {analysis.remainingQuantity} {formatUnitDisplay(log.unit)} available)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                              Fully Allocated ({log.quantity} {formatUnitDisplay(log.unit)} in batch runs)
                            </span>
                          )}

                          {/* Linked Production Batches with LIVE Status */}
                          {analysis.linkedBatches.map((batch) => {
                            const qtyAllocated = batch.intakeAllocations?.find((a) => a.harvestLogId === log.id)?.quantityUsed;
                            const qtyLabel = qtyAllocated !== undefined ? `${qtyAllocated} ${formatUnitDisplay(log.unit)}` : `${batch.totalQuantity} ${formatUnitDisplay(batch.unit)}`;

                            if (batch.status === 'ready') {
                              return (
                                <button
                                  key={batch.id}
                                  type="button"
                                  onClick={() => {
                                    if (onSelectBatch) onSelectBatch(batch.id);
                                    else if (onNavigateTab) onNavigateTab('batches');
                                  }}
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition"
                                  title="Click to view ready batch in Batches tab"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Batch #{batch.id.slice(-6)}: Ready for Distribution ({qtyLabel})</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              );
                            }

                            if (batch.status === 'processing') {
                              return (
                                <button
                                  key={batch.id}
                                  type="button"
                                  onClick={() => {
                                    if (onSelectBatch) onSelectBatch(batch.id);
                                    else if (onNavigateTab) onNavigateTab('batches');
                                  }}
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900 transition"
                                  title="Click to view in-progress batch in Batches tab"
                                >
                                  <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                                  <span>Batch #{batch.id.slice(-6)}: In Processing ({qtyLabel})</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              );
                            }

                            return (
                              <button
                                key={batch.id}
                                type="button"
                                onClick={() => {
                                  if (onNavigateTab) onNavigateTab('history');
                                }}
                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              >
                                <PackageCheck className="w-3 h-3 text-purple-600" />
                                <span>Batch #{batch.id.slice(-6)}: Packaged</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Quantity & Inventory Balance Column */}
                      <td className="p-3">
                        <div className="flex items-baseline space-x-1 font-mono">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {analysis.remainingQuantity.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            / {log.quantity.toLocaleString()} {formatUnitDisplay(log.unit)} left
                          </span>
                        </div>

                        {/* Progress balance bar */}
                        <div className="w-32 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full ${analysis.isFullyAllocated ? 'bg-slate-400' : 'bg-emerald-500'}`}
                            style={{ width: `${pctUsed}%` }}
                            title={`${pctUsed}% allocated to batches`}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {analysis.totalAllocated > 0
                            ? `${analysis.totalAllocated.toLocaleString()} ${formatUnitDisplay(log.unit)} in batch runs`
                            : 'No batches drawn yet'}
                        </div>
                      </td>

                      {/* Inward Quality (QC) Column */}
                      <td className="p-3 min-w-[170px]">
                        <div className="space-y-1.5">
                          {isApproved ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>QC Approved</span>
                              </span>
                              {log.qcInspection && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                                  <div>
                                    {log.qcInspection.moisturePercent !== undefined && (
                                      <span>Moist: {log.qcInspection.moisturePercent}% • </span>
                                    )}
                                    <span>Defects: {log.qcInspection.defectRatePercent ?? 0}%</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setViewingQcLog(log)}
                                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
                                  >
                                    <Eye className="w-2.5 h-2.5" />
                                    <span>View Findings ({log.qcInspection.inspectedByName})</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : log.qcStatus === 'quarantined' ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>Quarantined</span>
                              </span>
                              {log.qcInspection?.rejectionReason && (
                                <p className="text-[10px] text-amber-700 dark:text-amber-400 line-clamp-1" title={log.qcInspection.rejectionReason}>
                                  {log.qcInspection.rejectionReason}
                                </p>
                              )}
                              <button
                                type="button"
                                onClick={() => setViewingQcLog(log)}
                                className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
                              >
                                <Eye className="w-2.5 h-2.5" />
                                <span>Review Hold Report</span>
                              </button>
                            </div>
                          ) : log.qcStatus === 'rejected' ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                                <span>Rejected</span>
                              </span>
                              {log.qcInspection?.rejectionReason && (
                                <p className="text-[10px] text-rose-700 dark:text-rose-400 line-clamp-1" title={log.qcInspection.rejectionReason}>
                                  {log.qcInspection.rejectionReason}
                                </p>
                              )}
                              <button
                                type="button"
                                onClick={() => setViewingQcLog(log)}
                                className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline flex items-center space-x-1"
                              >
                                <Eye className="w-2.5 h-2.5" />
                                <span>Review Rejection</span>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>Pending Inward QC</span>
                              </span>
                              <div className="text-[10px] text-slate-400">
                                Batches blocked until certified
                              </div>
                            </div>
                          )}

                          {/* Quality Inspector & Admin Certification Trigger */}
                          {canInspect && (
                            <button
                              type="button"
                              onClick={() => openQcInspection(log)}
                              className={`mt-1 inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition shadow-xs ${
                                isApproved
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }`}
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>{log.qcInspection ? 'Re-Inspect' : 'Inspect Quality'}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center space-x-1">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          <span>{log.loggedByName || 'Team Member'}</span>
                          <span className="text-[10px] text-slate-400 px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800">
                            {log.loggedByRole}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{logDate.toLocaleDateString()} {logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {log.notes || '—'}
                      </td>

                      {/* Dynamic Lifecycle Actions Column */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end space-y-1.5">
                          {analysis.remainingQuantity > 0 ? (
                            isApproved ? (
                              <button
                                onClick={() => {
                                  const prod = products.find((p) => p.id === log.productId) || {
                                    id: log.productId,
                                    name: log.productName,
                                    unit: log.unit,
                                    processingType: 'processing',
                                    createdByUid: user.uid,
                                  };
                                  onStartBatchWithLogs([{ ...log, remainingQuantity: analysis.remainingQuantity }], prod);
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-300 dark:border-emerald-700 transition inline-flex items-center space-x-1 shadow-sm"
                              >
                                <span>
                                  {analysis.isPartiallyAllocated
                                    ? `+ Draw Batch (${analysis.remainingQuantity} ${formatUnitDisplay(log.unit)} left)`
                                    : `+ Start Batch (${log.quantity} ${formatUnitDisplay(log.unit)})`}
                                </span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <div
                                title="Incoming raw material must be tested and approved by the Quality Inspector or Admin before processing."
                                className="inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-800"
                              >
                                <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>QC Approval Required</span>
                              </div>
                            )
                          ) : null}

                          <div className="flex items-center space-x-1.5">
                            {/* Edit Intake Entry Button */}
                            <button
                              type="button"
                              onClick={() => startEditLog(log)}
                              className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition inline-flex items-center space-x-1 text-[11px]"
                              title="Edit intake quantity, unit, or notes to correct any errors"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            {/* Secondary link to active batch if exists */}
                            {analysis.readyBatches.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectBatch) onSelectBatch(analysis.readyBatches[0].id);
                                  else if (onNavigateTab) onNavigateTab('batches');
                                }}
                                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Batch #{analysis.readyBatches[0].id.slice(-6)} Ready</span>
                              </button>
                            ) : analysis.processingBatches.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectBatch) onSelectBatch(analysis.processingBatches[0].id);
                                  else if (onNavigateTab) onNavigateTab('batches');
                                }}
                                className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                              >
                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                <span>Batch #{analysis.processingBatches[0].id.slice(-6)} Processing</span>
                              </button>
                            ) : analysis.packagedBatches.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onNavigateTab) onNavigateTab('history');
                                }}
                                className="text-[10px] font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1"
                              >
                                <PackageCheck className="w-2.5 h-2.5" />
                                <span>Batch #{analysis.packagedBatches[0].id.slice(-6)} Packaged</span>
                              </button>
                            ) : analysis.remainingQuantity <= 0 ? (
                              <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                                Fully Allocated
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Intake Log Modal */}
      {editingLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Edit Intake Record: {editingLog.productName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateLog} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Quantity
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none pr-14"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 uppercase font-mono">
                    {formatUnitDisplay(editUnit)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Unit of Measure
                </label>
                <input
                  type="text"
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  placeholder="e.g. kg, g, l, pieces"
                  required
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400">
                  Typo protection active: numbers in unit field are automatically cleaned (e.g. "100kg" becomes "kg").
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Notes / Source Batch / Grade
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Supplier Lot #412"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditingLog}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isEditingLog ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Raw Material Inward QC Inspection Modal */}
      {qcModalLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Raw Material Quality Inspection Gate
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verify incoming food safety &amp; quality standards before batch allocation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQcModalLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Material Summary Card */}
            <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {qcModalLog.productName}
                </div>
                <span className="font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px]">
                  Lot #{qcModalLog.id.slice(-6)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                <div>
                  <span className="text-slate-400">Received Quantity: </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {qcModalLog.quantity} {formatUnitDisplay(qcModalLog.unit)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Inward Logged By: </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {qcModalLog.loggedByName} ({qcModalLog.loggedByRole})
                  </span>
                </div>
                {qcModalLog.notes && (
                  <div className="col-span-2 text-slate-500 dark:text-slate-400 italic">
                    Intake Notes: &ldquo;{qcModalLog.notes}&rdquo;
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmitQcInspection} className="mt-4 space-y-4 text-xs">
              {/* Decision Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Quality Inspector Verification Decision <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Approved */}
                  <div
                    onClick={() => setQcDecision('qc_approved')}
                    className={`cursor-pointer p-3 rounded-xl border transition flex flex-col items-center text-center space-y-1 ${
                      qcDecision === 'qc_approved'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-400/40 text-emerald-950 dark:text-emerald-200'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 ${qcDecision === 'qc_approved' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs">Approve &amp; Certify</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Releases lot for production batches
                    </span>
                  </div>

                  {/* Quarantined */}
                  <div
                    onClick={() => setQcDecision('quarantined')}
                    className={`cursor-pointer p-3 rounded-xl border transition flex flex-col items-center text-center space-y-1 ${
                      qcDecision === 'quarantined'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 ring-2 ring-amber-400/40 text-amber-950 dark:text-amber-200'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <AlertTriangle className={`w-5 h-5 ${qcDecision === 'quarantined' ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs">Quarantine Hold</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Holds lot for lab re-test or review
                    </span>
                  </div>

                  {/* Rejected */}
                  <div
                    onClick={() => setQcDecision('rejected')}
                    className={`cursor-pointer p-3 rounded-xl border transition flex flex-col items-center text-center space-y-1 ${
                      qcDecision === 'rejected'
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 ring-2 ring-rose-400/40 text-rose-950 dark:text-rose-200'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <XCircle className={`w-5 h-5 ${qcDecision === 'rejected' ? 'text-rose-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs">Reject Delivery</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Blocks lot due to contamination / defects
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical & Lab Inspection Parameters */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Physical &amp; Quality Parameters Checklist</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Visual &amp; Sensory Quality
                    </label>
                    <select
                      value={qcVisualQuality}
                      onChange={(e: any) => setQcVisualQuality(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Excellent">Excellent (Optimal freshness, uniform, no bruising)</option>
                      <option value="Good">Good (Acceptable grade, within tolerance)</option>
                      <option value="Fair">Fair (Minor blemishes, requires sorting)</option>
                      <option value="Poor">Poor (Significant deterioration / off-odor)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Moisture Content (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={qcMoisture}
                      onChange={(e) => setQcMoisture(e.target.value)}
                      placeholder="e.g. 75"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Defect / Foreign Matter Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={qcDefectRate}
                      onChange={(e) => setQcDefectRate(e.target.value)}
                      placeholder="e.g. 1.0"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Arrival Temp (°C)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={qcTemperature}
                      onChange={(e) => setQcTemperature(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Mandatory Reason for Quarantine or Rejection */}
              {(qcDecision === 'quarantined' || qcDecision === 'rejected') && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl space-y-1.5">
                  <label className="block text-[11px] font-bold text-rose-900 dark:text-rose-300">
                    Justification &amp; Hold / Rejection Reason <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={qcRejectionReason}
                    onChange={(e) => setQcRejectionReason(e.target.value)}
                    placeholder="Specify why raw material is quarantined or rejected (e.g. High moisture above threshold, visible mold, pest infestation, broken seal)"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              {/* Inspector Certification Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quality Inspector Verification Notes &amp; Observations
                </label>
                <textarea
                  rows={2}
                  value={qcNotes}
                  onChange={(e) => setQcNotes(e.target.value)}
                  placeholder="Additional observations on packaging cleanliness, sensory evaluation, lab kit batch number, supplier compliance..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Inspector Badge Sign-off */}
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Certifying Inspector: <strong className="text-slate-900 dark:text-white">{user.displayName || member.email || 'Quality Inspector'}</strong></span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold text-[10px]">
                  {member.roleLabel || 'Quality Inspector'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setQcModalLog(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQc || ((qcDecision === 'quarantined' || qcDecision === 'rejected') && !qcRejectionReason.trim())}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 text-white disabled:opacity-50 ${
                    qcDecision === 'qc_approved'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : qcDecision === 'quarantined'
                      ? 'bg-amber-600 hover:bg-amber-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {isSubmittingQc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>
                    {qcDecision === 'qc_approved'
                      ? 'Confirm & Release for Batches'
                      : qcDecision === 'quarantined'
                      ? 'Confirm Quarantine Hold'
                      : 'Confirm Rejection'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View QC Inspection Findings Modal (Read-Only) */}
      {viewingQcLog && viewingQcLog.qcInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`p-2 rounded-lg ${
                    viewingQcLog.qcStatus === 'qc_approved'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : viewingQcLog.qcStatus === 'quarantined'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Inward QC Certification Findings
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lot #{viewingQcLog.id.slice(-6)} • {viewingQcLog.productName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingQcLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Banner */}
            <div className="mt-4">
              {viewingQcLog.qcStatus === 'qc_approved' ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>QC Approved &amp; Certified:</strong> Material meets quality specifications. Fully released for production batch processing.
                  </span>
                </div>
              ) : viewingQcLog.qcStatus === 'quarantined' ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center space-x-2 text-amber-800 dark:text-amber-300 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Quarantined / Hold:</strong> Material locked from batch allocation pending secondary testing.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center space-x-2 text-rose-800 dark:text-rose-300 text-xs">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Rejected:</strong> Material does not satisfy safety or grading thresholds. Cannot be used in production.
                  </span>
                </div>
              )}
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-500 dark:text-slate-300 text-[11px] font-medium">Visual / Sensory Quality</div>
                <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  {viewingQcLog.qcInspection.visualQuality || 'Good'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-500 dark:text-slate-300 text-[11px] font-medium">Moisture Content</div>
                <div className="font-bold text-slate-800 dark:text-slate-100 font-mono mt-0.5">
                  {viewingQcLog.qcInspection.moisturePercent !== undefined
                    ? `${viewingQcLog.qcInspection.moisturePercent}%`
                    : 'Not recorded'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-500 dark:text-slate-300 text-[11px] font-medium">Defect Rate</div>
                <div className="font-bold text-slate-800 dark:text-slate-100 font-mono mt-0.5">
                  {viewingQcLog.qcInspection.defectRatePercent !== undefined
                    ? `${viewingQcLog.qcInspection.defectRatePercent}%`
                    : '0%'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-500 dark:text-slate-300 text-[11px] font-medium">Arrival Temp</div>
                <div className="font-bold text-slate-800 dark:text-slate-100 font-mono mt-0.5">
                  {viewingQcLog.qcInspection.temperatureCelsius !== undefined
                    ? `${viewingQcLog.qcInspection.temperatureCelsius}°C`
                    : 'Not recorded'}
                </div>
              </div>
            </div>

            {/* Rejection / Hold Reason if exists */}
            {viewingQcLog.qcInspection.rejectionReason && (
              <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs space-y-1">
                <div className="font-bold text-rose-800 dark:text-rose-300">Inspector Hold / Rejection Reason:</div>
                <p className="text-rose-700 dark:text-rose-400">{viewingQcLog.qcInspection.rejectionReason}</p>
              </div>
            )}

            {/* Inspection Notes */}
            {viewingQcLog.qcInspection.notes && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-1">
                <div className="font-bold text-slate-700 dark:text-slate-300">Inspector Notes:</div>
                <p className="text-slate-600 dark:text-slate-400">{viewingQcLog.qcInspection.notes}</p>
              </div>
            )}

            {/* Inspector Attribution */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Inspected by <strong>{viewingQcLog.qcInspection.inspectedByName}</strong> ({viewingQcLog.qcInspection.inspectedByRole})
                </span>
              </div>
              <div>
                {viewingQcLog.qcInspection.inspectedAt?.toDate
                  ? viewingQcLog.qcInspection.inspectedAt.toDate().toLocaleDateString()
                  : new Date(viewingQcLog.qcInspection.inspectedAt || Date.now()).toLocaleDateString()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-5 flex justify-end space-x-2">
              {canInspect && (
                <button
                  type="button"
                  onClick={() => {
                    const targetLog = viewingQcLog;
                    setViewingQcLog(null);
                    openQcInspection(targetLog);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg border border-emerald-300 dark:border-emerald-800 transition flex items-center space-x-1"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Re-Inspect This Lot</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewingQcLog(null)}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
