export type PermissionTier = 'admin' | 'worker';

export type BatchStatus = 'harvested' | 'processing' | 'ready' | 'packaged';

export interface FarmMember {
  uid: string;
  email: string;
  permissionTier: PermissionTier;
  roleLabel: string;
  joinedAt?: any;
}

export interface Farm {
  id: string;
  name: string;
  ownerUid: string;
  locationMetadata?: string;
  createdAt?: any;
}

export interface FarmInvite {
  email: string;
  permissionTier: PermissionTier;
  roleLabel: string;
  createdByUid: string;
  createdAt?: any;
  farmId?: string;
  farmName?: string;
}

export interface ProductCatalogItem {
  id: string;
  name: string;
  unit: string;
  processingType: string;
  createdByUid: string;
  createdAt?: any;
}

export interface IntakeAllocation {
  batchId: string;
  batchStatus?: BatchStatus;
  allocatedQuantity: number;
  allocatedAt?: any;
}

export type RawMaterialQcStatus = 'pending_qc' | 'qc_approved' | 'quarantined' | 'rejected';

export interface RawMaterialQcInspection {
  inspectedByUid: string;
  inspectedByName: string;
  inspectedByRole: string;
  inspectedAt: any;
  status: RawMaterialQcStatus;
  moisturePercent?: number;
  visualQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  defectRatePercent?: number;
  temperatureCelsius?: number;
  notes?: string;
  rejectionReason?: string;
}

export interface HarvestLog {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  harvestedAt: any;
  notes?: string;
  loggedByUid: string;
  loggedByName?: string;
  loggedByRole: string;
  batchId?: string;
  allocations?: IntakeAllocation[];
  allocatedQuantity?: number;
  remainingQuantity?: number;
  qcStatus?: RawMaterialQcStatus;
  qcInspection?: RawMaterialQcInspection;
}

export interface ProgressReading {
  id: string;
  timestamp: string;
  note: string;
  metric?: string;
  value?: string;
  loggedByUid: string;
  loggedByName: string;
  loggedByRole: string;
}

export interface BatchIntakeAllocation {
  harvestLogId: string;
  quantityUsed: number;
}

export interface ProductionBatch {
  id: string;
  productId: string;
  productName: string;
  processingType: string;
  linkedHarvestLogIds: string[];
  intakeAllocations?: BatchIntakeAllocation[];
  totalQuantity: number;
  unit: string;
  status: BatchStatus;
  conditions: {
    temperature: string;
    humidity: string;
    method: string;
    duration: string;
    targetCriteria: string;
    customNotes?: string;
  };
  schedule: string;
  scheduleModelUsed?: string;
  progressReadings: ProgressReading[];
  gradeAOutputQuantity?: number;
  gradeBOutputQuantity?: number;
  driedOutputQuantity?: number;
  driedOutputUnit?: string;
  yieldPercentage?: number;
  packagedAt?: any;
  statusNotes?: string;
  readyAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export type ProduceGrade = 'Grade A' | 'Grade B';

export type PackagingQCStatus = 'pending_qc' | 'qc_approved' | 'quarantined' | 'rejected';

export interface PackagingQCInspection {
  id: string;
  inspectedByUid: string;
  inspectedByName: string;
  inspectedByRole: string;
  inspectedAt: any;
  status: PackagingQCStatus;

  // Key Checklist Parameters
  sampleWeightGrams?: number;
  weightCompliant: boolean; // Declared net weight within standard tolerance (+/- 2%)
  sealIntegrityPassed: boolean; // Continuous hermetic heat-seal, no channels or leaks
  labelAccuracyPassed: boolean; // Batch lot code, expiry, net weight, FSSAI / regulatory info verified
  packagingCleanlinessPassed: boolean; // Pouch/container pristine, free of dust, grease, or crinkles
  aromaMoistureBarrierPassed: boolean; // Preserves characteristic herbal aroma, moisture barrier intact

  // Rejection or Quarantine Details
  rejectionReason?: string;
  notes?: string;
}

export interface PackagingRecord {
  id: string;
  productId: string;
  productName: string;
  batchId?: string;
  grade: ProduceGrade;
  packageSizeGrams: number;
  unitsPacked: number;
  totalGrams: number;
  totalKg: number;
  storageLocation?: string;
  batchCode?: string;
  notes?: string;
  packedByUid: string;
  packedByName: string;
  packedByRole: string;
  createdAt: any;
  unitsDispatched?: number;
  unitsRemaining?: number;

  // Packaging QC Verification Gate
  qcStatus?: PackagingQCStatus;
  qcInspection?: PackagingQCInspection;
}

export type OrderSource =
  | 'Amazon'
  | 'Shopify'
  | 'WhatsApp Direct'
  | 'B2B Distributor'
  | 'Retail Store'
  | 'Website / Online'
  | 'Phone / Direct Call'
  | 'Exhibition / Farmers Market'
  | 'Other';

export type PaymentStatus =
  | 'Prepaid'
  | 'Amount Received'
  | 'Pending / COD'
  | 'Partially Paid';

export interface DispatchItem {
  packagingId?: string;
  productId: string;
  productName: string;
  grade: ProduceGrade;
  packageSizeGrams: number;
  units: number;
  totalGrams: number;
  totalKg: number;
  unitPrice?: number;
  subtotal?: number;
}

export interface DispatchRecord {
  id: string;
  orderNumber: string;
  orderSource: OrderSource;
  orderDate: string;
  dispatchDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  destinationCity: string;
  destinationState?: string;
  pincode?: string;
  courierName?: string;
  trackingNumber?: string;
  items: DispatchItem[];
  totalUnits: number;
  totalWeightKg: number;
  totalAmount: number;
  amountReceived: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentReference?: string;
  status: 'Dispatched' | 'In Transit' | 'Delivered' | 'Returned';
  notes?: string;
  dispatchedByUid: string;
  dispatchedByName: string;
  dispatchedByRole: string;
  createdAt: any;
}

export interface BatchChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  senderUid?: string;
  senderName?: string;
  createdAt?: any;
}

export function isQualityInspector(roleLabel?: string, permissionTier?: PermissionTier): boolean {
  const label = (roleLabel || '').toLowerCase();
  return (
    label.includes('quality') ||
    label.includes('inspector') ||
    label.includes('qc') ||
    label.includes('controller') ||
    label.includes('qa')
  );
}

export function isProductionLead(roleLabel?: string, permissionTier?: PermissionTier): boolean {
  const label = (roleLabel || '').toLowerCase();
  return label.includes('production') || label.includes('lead');
}

export function canControlPacking(roleLabel?: string, permissionTier?: PermissionTier): boolean {
  if (permissionTier === 'admin') return true;
  return isQualityInspector(roleLabel, permissionTier);
}

// Quality Inspector, Production Lead, and Admin all have authority to mark a batch as Ready
export function canMarkBatchReady(roleLabel?: string, permissionTier?: PermissionTier): boolean {
  if (permissionTier === 'admin') return true;
  return isQualityInspector(roleLabel, permissionTier) || isProductionLead(roleLabel, permissionTier);
}

// Quality updates (logging QC checks, temperature inspections, condition audits) are restricted to Quality Inspectors and Admins. Production Leads cannot update quality.
export function canUpdateQuality(roleLabel?: string, permissionTier?: PermissionTier): boolean {
  if (permissionTier === 'admin') return true;
  return isQualityInspector(roleLabel, permissionTier);
}

// Production batch initiation: Production Leads and Admins can start production runs when raw material is available. Quality Inspectors oversee quality and readiness rather than starting batches.
export function canStartProductionBatch(roleLabel?: string, permissionTier?: PermissionTier): boolean {
  if (permissionTier === 'admin') return true;
  return isProductionLead(roleLabel, permissionTier);
}

// Raw Material entry: Production Leads and Admins log incoming raw material deliveries. Quality Inspectors inspect batches and certify quality/readiness.
export function canLogRawMaterialIntake(roleLabel?: string, permissionTier?: PermissionTier): boolean {
  if (permissionTier === 'admin') return true;
  return isProductionLead(roleLabel, permissionTier);
}

// Raw material QC inspection: Quality Inspectors and Facility Admins test and certify incoming raw material shipments
export function canInspectRawMaterial(roleLabel?: string, permissionTier?: PermissionTier): boolean {
  if (permissionTier === 'admin') return true;
  return isQualityInspector(roleLabel, permissionTier);
}

// Checks whether a raw material intake lot is QC-approved for processing
export function isRawMaterialApproved(log: HarvestLog): boolean {
  if (log.qcStatus === 'qc_approved') return true;
  if (log.qcStatus === 'quarantined' || log.qcStatus === 'rejected' || log.qcStatus === 'pending_qc') return false;
  // Legacy backward compatibility: if no qcStatus, but has allocations/batches, treat as approved
  if ((log.allocatedQuantity && log.allocatedQuantity > 0) || (log.allocations && log.allocations.length > 0)) {
    return true;
  }
  // Fresh un-allocated intake defaults to pending_qc
  return false;
}

// Packaging QC inspection authority: Quality Inspectors and Admins certify finished goods packets
export function canInspectPackaging(roleLabel?: string, permissionTier?: PermissionTier): boolean {
  if (permissionTier === 'admin') return true;
  return isQualityInspector(roleLabel, permissionTier);
}

// Checks whether a packaged lot is QC-approved before release to dispatch or active finished goods inventory
export function isPackagingApproved(pkg: PackagingRecord): boolean {
  if (pkg.qcStatus === 'qc_approved') return true;
  if (pkg.qcStatus === 'quarantined' || pkg.qcStatus === 'rejected' || pkg.qcStatus === 'pending_qc') return false;
  // Legacy backward compatibility: if existing record has units dispatched, treat as approved
  if (pkg.unitsDispatched && pkg.unitsDispatched > 0) {
    return true;
  }
  // Default to pending_qc
  return false;
}


