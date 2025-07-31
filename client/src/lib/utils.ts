import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = "ر.ي"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0 " + currency;
  
  // استخدام الأرقام الإنجليزية مع العملة اليمنية
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(num) + " " + currency;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  // استخدام التاريخ الميلادي بصيغة dd/MM/yyyy
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit", 
    day: "2-digit",
  }).format(d);
}

export function formatTime(time: string): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  return `${hours}:${minutes}`;
}

export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function calculateWorkHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60); // Convert to hours
}

export function formatYemeniPhone(phone: string): string {
  if (!phone) return "";
  // تنسيق أرقام الهواتف اليمنية (مثال: +967-1-234567 أو 777-123-456)
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.startsWith('967')) {
    // رقم دولي
    return `+967-${cleanPhone.slice(3, 4)}-${cleanPhone.slice(4)}`;
  } else if (cleanPhone.length === 9) {
    // رقم محلي
    return `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
  } else if (cleanPhone.length === 7) {
    // رقم أرضي
    return `${cleanPhone.slice(0, 1)}-${cleanPhone.slice(1)}`;
  }
  
  return phone;
}

export function generateYemeniPhoneExample(): string {
  const prefixes = ['77', '73', '71', '70'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 9000000) + 1000000;
  return `${prefix}${number}`;
}

// Storage utilities for autocomplete data
export const autocompleteKeys = {
  // Worker transfers
  SENDER_NAMES: 'senderNames',
  RECIPIENT_NAMES: 'recipientNames',
  RECIPIENT_PHONES: 'recipientPhones',
  
  // Material purchases
  SUPPLIER_NAMES: 'supplierNames',
  MATERIAL_CATEGORIES: 'materialCategories',
  MATERIAL_UNITS: 'materialUnits',
  MATERIAL_NAMES: 'materialNames',
  INVOICE_NUMBERS: 'invoiceNumbers',
  
  // Transportation
  TRANSPORT_DESCRIPTIONS: 'transportDescriptions',
  
  // Fund transfers
  TRANSFER_NUMBERS: 'transferNumbers',
  FUND_TRANSFER_TYPES: 'fundTransferTypes',
  
  // Worker attendance
  WORK_DESCRIPTIONS: 'workDescriptions',
  
  // Projects and Workers
  PROJECT_NAMES: 'projectNames',
  WORKER_NAMES: 'workerNames',
  
  // General
  NOTES: 'generalNotes',
  PHONE_NUMBERS: 'phoneNumbers',
} as const;

export function saveToAutocomplete(key: string, value: string): void {
  if (!value || value.trim().length === 0) return;
  
  try {
    const existing = getAutocompleteData(key);
    const trimmedValue = value.trim();
    
    if (!existing.includes(trimmedValue)) {
      const updated = [trimmedValue, ...existing].slice(0, 20); // Keep only last 20 entries
      localStorage.setItem(key, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Error saving autocomplete data:', error);
  }
}

export function getAutocompleteData(key: string): string[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading autocomplete data:', error);
    return [];
  }
}

export function removeFromAutocomplete(key: string, value: string): void {
  try {
    const existing = getAutocompleteData(key);
    const updated = existing.filter(item => item !== value);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Error removing autocomplete data:', error);
  }
}
