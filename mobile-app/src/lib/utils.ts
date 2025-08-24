export function formatCurrency(amount: number | string, currency = "ر.ي"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0 " + currency;
  
  // استخدام الأرقام الإنجليزية مع العملة اليمنية - مطابق للويب 100%
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

export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}