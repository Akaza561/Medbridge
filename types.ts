
export enum UserRole {
  DONOR = 'DONOR',
  NGO = 'NGO',
  ADMIN = 'ADMIN'
}

export enum DonationStatus {
  UPLOADED = 'Uploaded',
  VERIFIED = 'Verified',
  ACCEPTED = 'Accepted',
  PICKED_UP = 'Picked Up',
  DELIVERED = 'Delivered'
}

export interface MedicineData {
  id: string;
  name: string;
  dosage: string;
  manufacturer: string;
  expiryDate: string;
  isSealed: boolean;
  isUnexpired: boolean;
  confidence: number;
  imageUrl?: string;
}

export interface WishlistItem {
  id: string;
  medicineName: string;
  quantityNeeded: number;
  quantityFulfilled: number;
  urgency: 'Critical' | 'High' | 'Standard';
}

export interface Donation {
  id: string;
  donorId: string;
  medicine: MedicineData;
  status: DonationStatus;
  timestamp: number;
  ngoId?: string;
  ngoName?: string;
  address: string;
}

export interface Claim {
  id: string;
  donationId: string;
  ngoName: string;
  shippingAddress: string;
  paymentMethod: string;
  status: DonationStatus;
  timestamp: number;
  medicineName: string;
}

export interface NGO {
  id: string;
  name: string;
  location: string;
  verified: boolean;
  wishlist: WishlistItem[];
  impactScore: number;
  logo: string;
}
