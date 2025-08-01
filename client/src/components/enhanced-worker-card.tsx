import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Worker } from "@shared/schema";

interface EnhancedWorkerCardProps {
  worker: Worker;
  attendance: {
    isPresent: boolean;
    startTime?: string;
    endTime?: string;
    workDescription?: string;
    workDays?: number;
    paidAmount?: string;
    paymentType?: string;
  };
  onAttendanceChange: (attendance: {
    isPresent: boolean;
    startTime?: string;
    endTime?: string;
    workDescription?: string;
    workDays?: number;
    paidAmount?: string;
    paymentType?: string;
  }) => void;
}

export default function EnhancedWorkerCard({ worker, attendance, onAttendanceChange }: EnhancedWorkerCardProps) {
  const dailyWage = parseFloat(worker.dailyWage);
  const workDays = attendance.workDays || 1.0;
  const actualWage = dailyWage * workDays;
  const paidAmount = parseFloat(attendance.paidAmount || "0");
  const remainingAmount = attendance.paymentType === 'credit' ? actualWage : (actualWage - paidAmount);

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ر.ي`;
  };

  return (
    <Card className="border border-border/40 bg-card/50">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Worker Info Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground">{worker.name}</h3>
              <p className="text-sm text-muted-foreground">
                {worker.type} • الأجر اليومي: {formatCurrency(dailyWage)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={attendance.isPresent}
                onCheckedChange={(checked) => 
                  onAttendanceChange({ ...attendance, isPresent: checked === true })
                }
              />
              <Label className="text-sm font-medium">حاضر</Label>
            </div>
          </div>

          {attendance.isPresent && (
            <div className="space-y-3 bg-muted/30 p-3 rounded-lg">
              {/* Time and Work Days Fields */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">وقت البدء</Label>
                  <Input
                    type="time"
                    value={attendance.startTime || ""}
                    onChange={(e) => 
                      onAttendanceChange({ ...attendance, startTime: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">وقت الانتهاء</Label>
                  <Input
                    type="time"
                    value={attendance.endTime || ""}
                    onChange={(e) => 
                      onAttendanceChange({ ...attendance, endTime: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">عدد الأيام</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0.1"
                    max="2.0"
                    placeholder="1.0"
                    value={attendance.workDays || 1.0}
                    onChange={(e) => 
                      onAttendanceChange({ ...attendance, workDays: parseFloat(e.target.value) || 1.0 })
                    }
                    className="mt-1 arabic-numbers"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    الأجر: {formatCurrency(actualWage)}
                  </p>
                </div>
              </div>

              {/* Payment Section */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">نوع الدفع</Label>
                <Select
                  value={attendance.paymentType || "partial"}
                  onValueChange={(value) => 
                    onAttendanceChange({ ...attendance, paymentType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">دفع كامل</SelectItem>
                    <SelectItem value="partial">دفع جزئي</SelectItem>
                    <SelectItem value="credit">على الحساب</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {attendance.paymentType !== "credit" && (
                <div>
                  <Label className="text-xs text-muted-foreground">المبلغ المدفوع</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={attendance.paidAmount || ""}
                    onChange={(e) => 
                      onAttendanceChange({ ...attendance, paidAmount: e.target.value })
                    }
                    className="mt-1 arabic-numbers"
                    max={actualWage}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>المدفوع: {formatCurrency(paidAmount)}</span>
                    <span>المتبقي: {formatCurrency(remainingAmount)}</span>
                  </div>
                </div>
              )}

              {attendance.paymentType === "credit" && (
                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    سيتم إضافة {formatCurrency(actualWage)} إلى حساب العامل
                  </p>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">وصف العمل</Label>
                <Textarea
                  placeholder="اكتب وصف العمل المنجز..."
                  value={attendance.workDescription || ""}
                  onChange={(e) => 
                    onAttendanceChange({ ...attendance, workDescription: e.target.value })
                  }
                  className="mt-1 min-h-[60px]"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}