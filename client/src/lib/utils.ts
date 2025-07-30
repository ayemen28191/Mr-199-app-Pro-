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
  // استخدام التاريخ الإنجليزي مع الأرقام الإنجليزية
  return new Intl.DateTimeFormat("en-US", {
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
