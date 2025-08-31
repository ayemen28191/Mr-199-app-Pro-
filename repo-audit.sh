#!/usr/bin/env bash
# repo-audit.sh
# Usage: chmod +x repo-audit.sh && ./repo-audit.sh
# Produces ./audit-report.md and several auxiliary files in ./audit-results/

set -euo pipefail
OUTDIR="./audit-results"
REPORT="./audit-report.md"
rm -rf "$OUTDIR" "$REPORT"
mkdir -p "$OUTDIR"

echo "# تقرير تدقيق المشروع — $(date -u)" > "$REPORT"
echo "" >> "$REPORT"
echo "مسار الفحص: $(pwd)" >> "$REPORT"
echo "" >> "$REPORT"

echo "### 1) فحص بيئة البناء (TypeScript / build) — النتائج" >> "$REPORT"
# Detect tsconfig
if [ -f tsconfig.json ]; then
  echo "- وجد tsconfig.json — نفّذ فحص TypeScript (بدون إخراج ملفات):" >> "$REPORT"
  echo "\`\`\`" >> "$REPORT"
  if npx -y tsc --noEmit 2> "$OUTDIR/tsc-errors.txt"; then
    echo "TypeScript: لا أخطاء (tsc --noEmit انتهى بنجاح)." >> "$REPORT"
  else
    echo "TypeScript: ظهرت أخطاء (راجع audit-results/tsc-errors.txt)." >> "$REPORT"
  fi
  cat "$OUTDIR/tsc-errors.txt" >> "$REPORT" || true
  echo "\`\`\`" >> "$REPORT"
else
  echo "- لم أعثر على tsconfig.json — تم تخطي فحص TypeScript." >> "$REPORT"
fi
echo "" >> "$REPORT"

echo "### 2) ESLint (قواعد جودة الكود)" >> "$REPORT"
echo "تشغيل ESLint (إن وُجد). النتائج محفوظة في audit-results/eslint.txt" >> "$REPORT"
echo "\`\`\`" >> "$REPORT"
if npx -y eslint . --ext .js,.jsx,.ts,.tsx > "$OUTDIR/eslint.txt" 2>&1; then
  echo "ESLint: انتهى بدون أخطاء قابلة للعرض." >> "$REPORT"
else
  echo "ESLint: توجد تحذيرات/أخطاء — راجع audit-results/eslint.txt" >> "$REPORT"
fi
cat "$OUTDIR/eslint.txt" >> "$REPORT" || true
echo "\`\`\`" >> "$REPORT"
echo "" >> "$REPORT"

echo "### 3) الاعتمادات غير المستخدمة (dependencies) — depcheck" >> "$REPORT"
echo "تشغيل depcheck — النتائج في audit-results/depcheck.json" >> "$REPORT"
npx -y depcheck --json > "$OUTDIR/depcheck.json" 2> /dev/null || true
echo '```json' >> "$REPORT"
jq . "$OUTDIR/depcheck.json" 2> /dev/null || cat "$OUTDIR/depcheck.json" >> "$REPORT"
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "### 4) رسم تبعيات الوحدات والـ orphans (ملفات غير مستدعاة) — madge" >> "$REPORT"
echo "madge يبحث عن ملفات غير مستدعاة (orphans) ودوائر التبعيات (circular)." >> "$REPORT"
# try src then fallback to .
ENTRY="src"
if [ ! -d "$ENTRY" ]; then
  ENTRY="."
fi
npx -y madge --extensions ts,tsx,js,jsx --circular "$ENTRY" > "$OUTDIR/madge-circular.txt" 2>&1 || true
npx -y madge --extensions ts,tsx,js,jsx --orphans "$ENTRY" > "$OUTDIR/madge-orphans.txt" 2>&1 || true

echo "- دوائر التبعيات (إذا كانت موجودة) في: audit-results/madge-circular.txt" >> "$REPORT"
echo "- ملفات غير مستدعاة (orphans) في: audit-results/madge-orphans.txt" >> "$REPORT"
echo "" >> "$REPORT"

echo "### 5) ملفات Assets (صور، svg، فونت...) غير مستخدمة — فحص تقريبي" >> "$REPORT"
mkdir -p "$OUTDIR/assets-unused"
# list common image/font types
find . -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.svg' -o -iname '*.gif' -o -iname '*.webp' -o -iname '*.woff' -o -iname '*.woff2' \) -not -path "./node_modules/*" -not -path "./.git/*" > "$OUTDIR/all-assets.txt"
> "$OUTDIR/assets-unused.txt"
while IFS= read -r asset; do
  # remove leading ./
  asset_trim="${asset#./}"
  # escape for rg
  if rg --hidden --no-ignore -n --no-messages --fixed-strings -- "$asset_trim" > /dev/null; then
    :
  else
    echo "$asset_trim" >> "$OUTDIR/assets-unused.txt"
  fi
done < "$OUTDIR/all-assets.txt"

echo "قائمة الأصول التي لم يتم العثور على إشاراتها في الكود: audit-results/assets-unused.txt" >> "$REPORT"
echo '```' >> "$REPORT"
head -n 200 "$OUTDIR/assets-unused.txt" || true
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "### 6) ملفات كبيرة (>1MB) — قد تحتاج تنظيف أو أرشفة" >> "$REPORT"
echo '```' >> "$REPORT"
find . -type f -not -path "./node_modules/*" -not -path "./.git/*" -size +1M -exec ls -lh {} \; | sort -k5 -h | tee "$OUTDIR/large-files.txt" || true
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "### 7) ملفات باسماء متكررة (قد تكون نسخ/مخفية) — تفحص التكرارات" >> "$REPORT"
git ls-files | awk -F/ '{print $NF}' | sort | uniq -d > "$OUTDIR/duplicate-names.txt" || true
echo "- الأسماء المتكررة (قد تكون ملفات في مسارات مختلفة): audit-results/duplicate-names.txt" >> "$REPORT"
echo '```' >> "$REPORT"
cat "$OUTDIR/duplicate-names.txt" || echo "(لا توجد أسماء مكررة)"
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "### 8) TODO / FIXME / XXX — نقاط العمل المؤجلة" >> "$REPORT"
rg --hidden --no-ignore -n --no-messages "TODO|FIXME|XXX" > "$OUTDIR/todos.txt" || true
echo '```' >> "$REPORT"
head -n 300 "$OUTDIR/todos.txt" || true
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "### 9) إحصائيات الكود (cloc)" >> "$REPORT"
if command -v cloc > /dev/null; then
  cloc --json . > "$OUTDIR/cloc.json" || true
  jq . "$OUTDIR/cloc.json" 2> /dev/null || cat "$OUTDIR/cloc.json" >> "$REPORT"
else
  echo "- cloc غير مثبت. لإضافة إحصائيات: 'sudo apt install cloc' أو استخدم 'brew install cloc'." >> "$REPORT"
fi
echo "" >> "$REPORT"

echo "### 10) Git status سريعة (ملفات غير ملتزم بها / محلية)" >> "$REPORT"
echo '```' >> "$REPORT"
git status --porcelain | sed -n '1,200p' >> "$REPORT" || true
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "### 11) ملخص تنبيهات حرجة (توصيات فورية)" >> "$REPORT"
echo "- افحص أولاً: audit-results/tsc-errors.txt و audit-results/eslint.txt و audit-results/madge-circular.txt" >> "$REPORT"
echo "- تحقق يدوياً من audit-results/madge-orphans.txt قبل حذف أي ملف (قد تكون ملفات اختبار/قوالب/ستايل غير مستدعاة برمجياً لكنها لازمة)." >> "$REPORT"
echo "- راجع audit-results/depcheck.json لإزالة الحزم غير المستخدمة (لكن تحقق يدوياً لأن depcheck لا يكتشف الاستعمال الديناميكي أو الـ require بقيم ديناميكية)." >> "$REPORT"
echo "" >> "$REPORT"

echo "### 12) اقتراحات عملية لتنظيف/تحسين الهيكلة" >> "$REPORT"
cat >> "$REPORT" <<'EOT'
1) إصلاح أخطاء البناء (TypeScript/ESLint) كأولوية — لأن أخطاء التايب قد تمنع التحليل الدقيق لملفات orphan أو ts-prune.
2) مراجعة الـ "orphans" من madge يدوياً:
   - إن كانت ملفات واجهة (components) غير مستدعاة => هل كانت جزءًا من ميزة ملغاة؟ انقلها إلى /archive أو احذفها بعد مراجعة الـ git history.
   - إن كانت أدوات/سكربتات build => ضعها في /scripts أو حدث package.json.
3) إزالة أو أرشفة الصور الكبيرة غير المستخدمة (audit-results/assets-unused.txt).
4) إزالة الحزم من package.json و run npm prune أو npm uninstall بعد مراجعة depcheck.
5) تشغيل ts-prune (أداة لإيجاد exports غير مستخدمة) بعد بناء المشروع: npx -y ts-prune
6) أضف فحوصات CI تحظر الدمج إذا فشل tsc أو eslint أو ظهرت orphan-critical.
7) أتمتة: جدولة audit شهريًا أو on-push باستخدام GitHub Actions لملف audit-report.md أو نشره كـ artifact.
EOT

echo "" >> "$REPORT"

echo "### 13) ملفات النتائج (مكانها)" >> "$REPORT"
echo "جميع ملفات النتائج في: $OUTDIR" >> "$REPORT"
echo "" >> "$REPORT"

# Final note
echo "انتهى الفحص — راجع ./audit-report.md وادرس الملفات الموجودة في ./audit-results/". >> "$REPORT"

# run final echo to console
echo "=== تم إنشاء التقرير: $REPORT  ==="
echo "النتائج التفصيلية في: $OUTDIR"
echo ""
echo "نصائح سريعة:"
echo "- ابدأ بإصلاح أخطاء tsc و eslint."
echo "- افتح audit-results/madge-orphans.txt وافحص كل مسار قبل الحذف."
echo "- استخدم depcheck مع الحذر (تحقق من الاستخدام الديناميكي)."