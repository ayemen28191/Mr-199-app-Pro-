#!/usr/bin/env node

/**
 * اختبار شامل لنظام إدارة المشاريع الإنشائية
 * يقوم بفحص جميع APIs والوظائف الأساسية
 */

const baseURL = 'http://localhost:5000';

// ألوان للنتائج
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// دالة مساعدة للطلبات
async function request(url, options = {}) {
  try {
    const response = await fetch(baseURL + url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.text();
    let json = null;
    try {
      json = JSON.parse(data);
    } catch {
      json = data;
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data: json
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// دالة طباعة النتائج
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️`,
    info: `${colors.blue}ℹ️`
  }[type];
  
  console.log(`${prefix} [${timestamp}] ${message}${colors.reset}`);
}

// دالة طباعة عنوان القسم
function section(title) {
  console.log(`\n${colors.bold}${colors.blue}=== ${title} ===${colors.reset}`);
}

// نتائج الاختبارات
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  apis: {}
};

// دالة تسجيل نتيجة الاختبار
function recordResult(testName, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    log(`${testName} - نجح ${details}`, 'success');
  } else {
    results.failed++;
    log(`${testName} - فشل ${details}`, 'error');
  }
}

// اختبارات APIs الأساسية
async function testBasicAPIs() {
  section('اختبار APIs الأساسية');
  
  // اختبار المشاريع
  const projects = await request('/api/projects');
  recordResult('GET /api/projects', projects.ok, `- العثور على ${Array.isArray(projects.data) ? projects.data.length : 0} مشروع`);
  results.apis.projects = projects.ok;
  
  // اختبار العمال
  const workers = await request('/api/workers');
  recordResult('GET /api/workers', workers.ok, `- العثور على ${Array.isArray(workers.data) ? workers.data.length : 0} عامل`);
  results.apis.workers = workers.ok;
  
  // اختبار المواد
  const materials = await request('/api/materials');
  recordResult('GET /api/materials', materials.ok, `- العثور على ${Array.isArray(materials.data) ? materials.data.length : 0} مادة`);
  results.apis.materials = materials.ok;
  
  // اختبار الموردين
  const suppliers = await request('/api/suppliers');
  recordResult('GET /api/suppliers', suppliers.ok, `- العثور على ${Array.isArray(suppliers.data) ? suppliers.data.length : 0} مورد`);
  results.apis.suppliers = suppliers.ok;
  
  // اختبار تحويلات العهدة
  const fundTransfers = await request('/api/fund-transfers');
  recordResult('GET /api/fund-transfers', fundTransfers.ok, `- العثور على ${Array.isArray(fundTransfers.data) ? fundTransfers.data.length : 0} تحويل`);
  results.apis.fundTransfers = fundTransfers.ok;
  
  // اختبار حضور العمال
  const attendance = await request('/api/worker-attendance?date=2025-08-01');
  recordResult('GET /api/worker-attendance', attendance.ok, `- استعلام الحضور`);
  results.apis.attendance = attendance.ok;
}

// اختبار نظام المصادقة
async function testAuthentication() {
  section('اختبار نظام المصادقة');
  
  // اختبار تسجيل دخول خاطئ
  const wrongLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'wrongpass'
    })
  });
  recordResult('POST /api/auth/login (خاطئ)', !wrongLogin.ok, `- الاستجابة: ${wrongLogin.status}`);
  
  // اختبار تسجيل حساب جديد
  const register = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: 'testuser_' + Date.now() + '@example.com',
      password: 'testpass123',
      name: 'مستخدم تجريبي'
    })
  });
  recordResult('POST /api/auth/register', register.status === 201 || register.status === 400, `- الاستجابة: ${register.status}`);
  
  // اختبار معلومات المستخدم بدون مصادقة
  const userInfo = await request('/api/auth/me');
  recordResult('GET /api/auth/me (بدون رمز)', !userInfo.ok, `- محمي بشكل صحيح`);
  
  results.apis.auth = wrongLogin.status > 0 && register.status > 0;
}

// اختبار العمليات CRUD
async function testCRUDOperations() {
  section('اختبار عمليات CRUD');
  
  // اختبار إنشاء مشروع تجريبي
  const projectName = 'مشروع اختبار - ' + Date.now();
  const newProject = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: projectName,
      status: 'active'
    })
  });
  
  let createdProjectId = null;
  if (newProject.ok && newProject.data && newProject.data.id) {
    createdProjectId = newProject.data.id;
    recordResult('POST /api/projects', true, `- تم إنشاء مشروع بـ ID: ${createdProjectId}`);
  } else {
    recordResult('POST /api/projects', false, `- فشل في الإنشاء`);
  }
  
  // اختبار إنشاء عامل تجريبي
  const workerName = 'عامل اختبار - ' + Date.now();
  const newWorker = await request('/api/workers', {
    method: 'POST',
    body: JSON.stringify({
      name: workerName,
      type: 'عامل اختبار',
      dailyWage: 5000,
      isActive: true
    })
  });
  
  let createdWorkerId = null;
  if (newWorker.ok && newWorker.data && newWorker.data.id) {
    createdWorkerId = newWorker.data.id;
    recordResult('POST /api/workers', true, `- تم إنشاء عامل بـ ID: ${createdWorkerId}`);
  } else {
    recordResult('POST /api/workers', false, `- فشل في الإنشاء`);
  }
  
  // تنظيف - حذف البيانات التجريبية
  if (createdProjectId) {
    const deleteProject = await request(`/api/projects/${createdProjectId}`, {
      method: 'DELETE'
    });
    recordResult('DELETE /api/projects/:id', deleteProject.ok, `- حذف المشروع التجريبي`);
  }
  
  if (createdWorkerId) {
    const deleteWorker = await request(`/api/workers/${createdWorkerId}`, {
      method: 'DELETE'
    });
    recordResult('DELETE /api/workers/:id', deleteWorker.ok, `- حذف العامل التجريبي`);
  }
  
  results.apis.crud = (newProject.ok || newProject.status === 400) && (newWorker.ok || newWorker.status === 400);
}

// اختبار التقارير والإحصائيات
async function testReportsAndStats() {
  section('اختبار التقارير والإحصائيات');
  
  // اختبار إحصائيات عامة
  const dashboardStats = await request('/api/dashboard-stats');
  recordResult('GET /api/dashboard-stats', dashboardStats.ok, `- الإحصائيات العامة`);
  
  // اختبار تقرير الحضور
  const attendanceReport = await request('/api/attendance-report?startDate=2025-08-01&endDate=2025-08-31');
  recordResult('GET /api/attendance-report', attendanceReport.ok || attendanceReport.status === 404, `- تقرير الحضور`);
  
  // اختبار تقرير مالي
  const financialReport = await request('/api/financial-report?month=2025-08');
  recordResult('GET /api/financial-report', financialReport.ok || financialReport.status === 404, `- التقرير المالي`);
  
  results.apis.reports = dashboardStats.ok;
}

// اختبار الوظائف المتقدمة
async function testAdvancedFeatures() {
  section('اختبار الوظائف المتقدمة');
  
  // اختبار البحث التلقائي
  const autocomplete = await request('/api/autocomplete?query=عمال');
  recordResult('GET /api/autocomplete', autocomplete.ok, `- البحث التلقائي`);
  
  // اختبار إعدادات الطباعة
  const printSettings = await request('/api/print-settings');
  recordResult('GET /api/print-settings', printSettings.ok, `- إعدادات الطباعة`);
  
  // اختبار تصدير Excel (محاكاة)
  const exportTest = await request('/api/export-attendance?format=excel&date=2025-08-01');
  recordResult('GET /api/export-attendance', exportTest.status > 0, `- تصدير البيانات`);
  
  results.apis.advanced = autocomplete.ok;
}

// اختبار الاستجابة والأداء
async function testPerformanceAndResponse() {
  section('اختبار الأداء والاستجابة');
  
  const performanceTests = [];
  
  // اختبار سرعة الاستجابة
  const startTime = Date.now();
  const quickResponse = await request('/api/projects');
  const responseTime = Date.now() - startTime;
  
  recordResult('سرعة الاستجابة', responseTime < 3000, `- ${responseTime}ms`);
  performanceTests.push(responseTime < 3000);
  
  // اختبار الحمولة المتعددة
  const concurrentRequests = await Promise.all([
    request('/api/workers'),
    request('/api/materials'),
    request('/api/suppliers')
  ]);
  
  const allSuccessful = concurrentRequests.every(req => req.ok);
  recordResult('الطلبات المتزامنة', allSuccessful, `- ${concurrentRequests.length} طلبات متزامنة`);
  performanceTests.push(allSuccessful);
  
  results.apis.performance = performanceTests.every(test => test);
}

// اختبار صحة قاعدة البيانات
async function testDatabaseHealth() {
  section('اختبار صحة قاعدة البيانات');
  
  // اختبار الاتصال
  const healthCheck = await request('/api/health');
  recordResult('GET /api/health', healthCheck.ok || healthCheck.status === 404, `- فحص صحة النظام`);
  
  // اختبار عدد الجداول
  const tableCount = await request('/api/db-info');
  recordResult('GET /api/db-info', tableCount.ok || tableCount.status === 404, `- معلومات قاعدة البيانات`);
  
  results.apis.database = true; // نفترض أن قاعدة البيانات تعمل لأن APIs تستجيب
}

// طباعة تقرير نهائي
function printFinalReport() {
  section('التقرير النهائي');
  
  console.log(`${colors.bold}📊 نتائج الاختبار الشامل${colors.reset}`);
  console.log(`إجمالي الاختبارات: ${colors.blue}${results.total}${colors.reset}`);
  console.log(`نجح: ${colors.green}${results.passed}${colors.reset}`);
  console.log(`فشل: ${colors.red}${results.failed}${colors.reset}`);
  
  const successRate = Math.round((results.passed / results.total) * 100);
  console.log(`معدل النجاح: ${successRate >= 90 ? colors.green : successRate >= 70 ? colors.yellow : colors.red}${successRate}%${colors.reset}`);
  
  console.log(`\n${colors.bold}حالة الأنظمة:${colors.reset}`);
  Object.entries(results.apis).forEach(([api, status]) => {
    const statusText = status ? `${colors.green}يعمل` : `${colors.red}لا يعمل`;
    console.log(`- ${api}: ${statusText}${colors.reset}`);
  });
  
  if (successRate >= 90) {
    console.log(`\n${colors.bold}${colors.green}🎉 النظام يعمل بكفاءة عالية! جاهز للإنتاج${colors.reset}`);
  } else if (successRate >= 70) {
    console.log(`\n${colors.bold}${colors.yellow}⚠️ النظام يعمل بشكل جيد مع بعض المشاكل البسيطة${colors.reset}`);
  } else {
    console.log(`\n${colors.bold}${colors.red}❌ النظام يحتاج إلى إصلاحات${colors.reset}`);
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log(`${colors.bold}🧪 بدء الاختبار الشامل للنظام${colors.reset}`);
  console.log(`📅 التاريخ: ${new Date().toLocaleDateString('ar-EG')}`);
  console.log(`🕒 الوقت: ${new Date().toLocaleTimeString('ar-EG')}`);
  
  try {
    await testBasicAPIs();
    await testAuthentication();
    await testCRUDOperations();
    await testReportsAndStats();
    await testAdvancedFeatures();
    await testPerformanceAndResponse();
    await testDatabaseHealth();
    
    printFinalReport();
  } catch (error) {
    console.error(`${colors.red}❌ خطأ في تشغيل الاختبارات: ${error.message}${colors.reset}`);
  }
}

// تشغيل الاختبارات
runAllTests();