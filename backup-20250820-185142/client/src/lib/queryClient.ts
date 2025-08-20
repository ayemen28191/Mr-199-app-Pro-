import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = "حدث خطأ غير متوقع";
    
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch (jsonError) {
      // إذا فشل تحليل JSON، استخدم رسائل افتراضية حسب status code
      if (res.status === 400) {
        errorMessage = "البيانات المدخلة غير صحيحة";
      } else if (res.status === 404) {
        errorMessage = "العنصر المطلوب غير موجود";
      } else if (res.status === 500) {
        errorMessage = "حدث خطأ في الخادم";
      } else {
        errorMessage = "حدث خطأ في الاتصال";
      }
    }
    
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<any> {
  // إضافة timeout 30 ثانية للطلبات
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    await throwIfResNotOk(res);
    
    // إذا كانت استجابة DELETE فارغة، لا نحاول تحليل JSON
    if (method === "DELETE" && res.status === 204) {
      return {};
    }
    
    return await res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('انتهت مهلة الطلب، يرجى المحاولة مرة أخرى');
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false, // تقليل إعادة التحميل
      staleTime: 1000 * 60 * 15, // 15 دقيقة للتخزين المؤقت
      retry: 1, // محاولة واحدة إضافية عند الفشل
      refetchOnReconnect: false, // منع إعادة التحميل عند الاتصال
    },
    mutations: {
      retry: 1, // تقليل المحاولات
    },
  },
});
