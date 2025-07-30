import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // استنساخ الاستجابة لتجنب خطأ "body stream already read"
      const clonedResponse = res.clone();
      const errorData = await clonedResponse.json();
      
      // التحقق من نوع الخطأ وإعطاء رسالة مناسبة
      if (res.status === 400 && errorData.message) {
        // خطأ في البيانات المدخلة - عرض الرسالة الفعلية من الخادم
        throw new Error(errorData.message);
      } else if (res.status === 500) {
        throw new Error("حدث خطأ في الخادم، يرجى المحاولة مرة أخرى");
      } else {
        throw new Error(errorData.message || "حدث خطأ غير متوقع");
      }
    } catch (jsonError) {
      // إذا فشل تحليل JSON، حدد نوع الخطأ حسب status code
      if (res.status === 400) {
        throw new Error("البيانات المدخلة غير صحيحة");
      } else if (res.status === 404) {
        throw new Error("العنصر المطلوب غير موجود");
      } else if (res.status === 500) {
        throw new Error("حدث خطأ في الخادم");
      } else {
        throw new Error("حدث خطأ في الاتصال");
      }
    }
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<any> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // إذا كانت استجابة DELETE فارغة، لا نحاول تحليل JSON
  if (method === "DELETE" && res.status === 204) {
    return {};
  }
  
  return await res.json();
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
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
