import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Flashlight, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface QrScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanResult?: (data: any) => void;
}

interface ScanResult {
  type: string;
  id: string;
  name?: string;
  sku?: string;
  timestamp?: number;
  valid: boolean;
  tool?: any;
}

const QrScanner: React.FC<QrScannerProps> = ({ open, onOpenChange, onScanResult }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // Start camera
  const startCamera = async () => {
    try {
      setError(null);
      
      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        startScanning();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('لا يمكن الوصول إلى الكاميرا. تأكد من السماح بالوصول للكاميرا.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  };

  // Toggle flash (if supported)
  const toggleFlash = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && 'torch' in track.getCapabilities()) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !flashEnabled } as any]
          });
          setFlashEnabled(!flashEnabled);
        } catch (err) {
          console.error('Flash toggle error:', err);
          toast({
            title: 'خطأ في الفلاش',
            description: 'لا يمكن التحكم في الفلاش على هذا الجهاز',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'الفلاش غير مدعوم',
          description: 'هذا الجهاز لا يدعم ميزة الفلاش',
          variant: 'destructive',
        });
      }
    }
  };

  // Switch camera
  const switchCamera = () => {
    stopCamera();
    setCameraFacing(cameraFacing === 'user' ? 'environment' : 'user');
  };

  // Simple QR code detection using canvas and image processing
  const detectQrCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Check if video dimensions are available
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      // Video not ready yet
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Verify canvas has valid dimensions before proceeding
    if (canvas.width === 0 || canvas.height === 0) {
      return;
    }
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simple QR detection simulation (in real app, use library like jsQR)
    // For demo purposes, we'll simulate QR detection with manual input
    // In production, use a library like jsQR: https://github.com/cozmo/jsQR
    
    // Simulate QR detection (replace with actual QR library)
    simulateQrDetection();
  };

  // Simulate QR code detection (replace with actual QR library in production)
  const simulateQrDetection = () => {
    // This is a simulation - in real implementation, use jsQR or similar library
    // For demo, we'll show manual input option
  };

  // Start scanning process
  const startScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    scanIntervalRef.current = setInterval(() => {
      detectQrCode();
    }, 500); // Scan every 500ms
  };

  // Process scanned QR data
  const processQrData = async (qrData: string) => {
    try {
      setIsScanning(false);
      
      // Try to parse JSON data
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch {
        // If not JSON, treat as simple text
        parsedData = { type: 'TEXT', data: qrData };
      }

      // Validate and process based on type
      if (parsedData.type === 'TOOL' && parsedData.id) {
        // Fetch tool details
        try {
          const tool = await apiRequest(`/api/tools/${parsedData.id}`, 'GET');
          
          const result: ScanResult = {
            type: 'TOOL',
            id: parsedData.id,
            name: tool.name,
            sku: tool.sku,
            timestamp: Date.now(),
            valid: true,
            tool: tool
          };
          
          setScanResult(result);
          
          toast({
            title: 'تم مسح الأداة بنجاح',
            description: `تم العثور على: ${tool.name}`,
          });
          
          if (onScanResult) {
            onScanResult(result);
          }
        } catch (error) {
          const result: ScanResult = {
            type: 'TOOL',
            id: parsedData.id,
            timestamp: Date.now(),
            valid: false
          };
          
          setScanResult(result);
          setError('لم يتم العثور على الأداة في النظام');
        }
      } else {
        // Unknown QR type
        const result: ScanResult = {
          type: 'UNKNOWN',
          id: qrData,
          timestamp: Date.now(),
          valid: false
        };
        
        setScanResult(result);
        setError('رمز QR غير مدعوم أو غير صحيح');
      }
    } catch (error) {
      console.error('QR processing error:', error);
      setError('خطأ في معالجة رمز QR');
    }
  };

  // Manual QR input for testing
  const handleManualInput = () => {
    const testQrData = JSON.stringify({
      type: 'TOOL',
      id: 'test-tool-id',
      name: 'أداة تجريبية',
      sku: 'TEST-001',
      timestamp: Date.now()
    });
    
    processQrData(testQrData);
  };

  // Reset scanner
  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    if (open) {
      setIsScanning(true);
      startScanning();
    }
  };

  // Effect to handle camera when dialog opens/closes
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setScanResult(null);
      setError(null);
    }

    return () => {
      stopCamera();
    };
  }, [open, cameraFacing]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            ماسح رمز QR
          </DialogTitle>
          <DialogDescription>
            وجه الكاميرا نحو رمز QR الخاص بالأداة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera View */}
          {!scanResult && !error && (
            <Card>
              <CardContent className="p-4">
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  
                  {/* Scanning overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-white rounded-lg w-48 h-48 relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                            جاري المسح...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Camera Controls */}
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={toggleFlash}>
                    <Flashlight className={`h-4 w-4 ${flashEnabled ? 'text-yellow-500' : ''}`} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={switchCamera}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleManualInput}>
                    اختبار
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scan Result */}
          {scanResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {scanResult.valid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  نتيجة المسح
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <Badge 
                    variant={scanResult.valid ? "default" : "destructive"}
                    className="mb-2"
                  >
                    {scanResult.valid ? 'صحيح' : 'خطأ'}
                  </Badge>
                  
                  {scanResult.valid && scanResult.tool && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">{scanResult.tool.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        SKU: {scanResult.tool.sku || 'غير محدد'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        الحالة: {scanResult.tool.status}
                      </p>
                    </div>
                  )}
                  
                  {!scanResult.valid && (
                    <p className="text-sm text-red-600">
                      رمز QR غير صحيح أو غير مدعوم
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={resetScanner}>
                    مسح آخر
                  </Button>
                  <Button className="flex-1" onClick={() => onOpenChange(false)}>
                    إغلاق
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card>
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                  <p className="text-sm text-red-600">{error}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={resetScanner}>
                      إعادة المحاولة
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                      إغلاق
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QrScanner;