export type Role = "SUPER_ADMIN" | "CLUB_ADMIN" | "EMPLOYEE" | "MEMBER";

export type MembershipStatus =
  | "ACTIVE"
  | "PENDING"
  | "EXPIRED"
  | "SUSPENDED"
  | "BLOCKED";

export interface Member {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  documentType: "DNI" | "NIE" | "PASSPORT";
  documentId: string;
  birthDate: string;
  status: MembershipStatus;
  membershipPlan: "BASIC" | "PREMIUM" | "VIP";
  joinedAt: string;
  expiresAt: string;
  qrCode: string;
  consumptionLimit: number;
  consumedThisMonth: number;
  signatureSigned: boolean;
  ageVerified: boolean;
  avatarSeed: string;
  avatarUrl?: string | null;
  walletBalance: number;
}

export type WalletMovementType = "TOPUP" | "WITHDRAW" | "ADJUST" | "PURCHASE";

export interface WalletMovement {
  id: string;
  amount: number;
  type: WalletMovementType;
  reason?: string;
  balanceAfter: number;
  createdAt: string;
}

export interface AccessLog {
  id: string;
  memberId: string;
  memberName: string;
  type: "CHECK_IN" | "CHECK_OUT";
  timestamp: string;
  method: "QR" | "MANUAL" | "NFC";
  location: string;
}

export interface ProductCategory {
  id: string;
  label: string;
  emoji: string;
  sortOrder: number;
  isCannabis: boolean;
  /** Color hex (#rrggbb) para fondos y badges. */
  color?: string | null;
}

export interface ProductFarm {
  id: string;
  name: string;
  description?: string | null;
  photos: string[];
  videoUrls: string[];
  sortOrder: number;
}

export interface FarmGenetic {
  id: string;
  farmId: string;
  name: string;
  description?: string | null;
  photos: string[];
  videoUrls: string[];
  pricePerUnit: number;
  compareAtPrice?: number | null;
  genetics?: "INDICA" | "SATIVA" | "HYBRID" | null;
  thcPercent?: number | null;
  origin?: "SPAIN" | "CALIFORNIA" | "NETHERLANDS" | "THAILAND" | "CANADA" | null;
  sortOrder: number;
  /** Stock agregado de productos vinculados (portal). */
  stock?: number;
  /** Producto de inventario para añadir al carrito. */
  productId?: string | null;
}

export interface ProductJar {
  id: string;
  name: string;
  description?: string | null;
  photos: string[];
  videoUrls: string[];
  sortOrder: number;
}

export interface JarItem {
  id: string;
  jarId: string;
  name: string;
  description?: string | null;
  photos: string[];
  videoUrls: string[];
  pricePerUnit: number;
  compareAtPrice?: number | null;
  genetics?: "INDICA" | "SATIVA" | "HYBRID" | null;
  thcPercent?: number | null;
  origin?: "SPAIN" | "CALIFORNIA" | "NETHERLANDS" | "THAILAND" | "CANADA" | null;
  sortOrder: number;
  stock?: number;
  productId?: string | null;
}

export interface PackItem {
  productId: string;
  productName?: string;
  qty: number;
  unit: "g" | "ud";
}

export type ProductUnit = "g" | "ud" | "pack";

export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  stock: number;
  unit: ProductUnit;
  lowStockThreshold: number;
  pricePerUnit: number;
  /** Precio anterior tachado cuando hay oferta. */
  compareAtPrice?: number | null;
  batch: string;
  expiresAt: string | null;
  isPack?: boolean;
  packItems?: PackItem[];
  photos?: string[];
  videoUrls?: string[];
  /** @deprecated Usa videoUrls */
  videoUrl?: string | null;
  grower?: string | null;
  extractor?: string | null;
  thcPercent?: number | null;
  genetics?: "INDICA" | "SATIVA" | "HYBRID" | null;
  origin?: "SPAIN" | "CALIFORNIA" | "NETHERLANDS" | "THAILAND" | "CANADA" | null;
  description?: string | null;
  /** Farm del catálogo (opcional). */
  farmId?: string | null;
  /** Genética del catálogo (opcional). */
  geneticId?: string | null;
  /** Jar del catálogo (opcional). */
  jarId?: string | null;
  /** Ítem del catálogo Jars (opcional). */
  jarItemId?: string | null;
  /** No visible en el menú del portal; solo staff puede dispensar. */
  hiddenFromMembers?: boolean;
}

export interface Sale {
  id: string;
  ticket: string;
  memberName: string;
  items: number;
  total: number;
  paymentMethod: "CASH" | "WALLET" | "CRYPTO";
  createdAt: string;
  status: "COMPLETED" | "REFUNDED";
}

export interface Reservation {
  id: string;
  memberName: string;
  space: string;
  date: string;
  startTime: string;
  endTime: string;
  guests: number;
  status: "CONFIRMED" | "PENDING" | "CANCELLED";
}

export interface KpiPoint {
  label: string;
  value: number;
}

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface MemberApplication {
  id: string;
  fullName: string;
  documentId: string;
  birthDate: string;
  locality: string;
  address: string;
  phone: string;
  email: string;
  facePhoto: string | null;
  dniFront: string | null;
  dniBack: string | null;
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  category: string;
  unit: ProductUnit;
  pricePerUnit: number;
  qty: number;
  packItems?: PackItem[];
  gramsPerPack?: number;
}

/** Línea de pedido persistida (incluye peso real servido). */
export interface OrderLineItem extends CartItem {
  id: string;
  actualQty?: number | null;
}

export type OrderStatus = "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

export interface Order {
  id: string;
  code: string;
  items: OrderLineItem[];
  total: number;
  grams: number;
  paymentMethod: "WALLET" | "CASH" | "CRYPTO";
  status: OrderStatus;
  createdAt: string;
}

export interface ClubOrder extends Order {
  memberId: string;
  memberName: string;
}
