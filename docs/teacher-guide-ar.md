# AutoProjectBook — دليل المعلم

**الإصدار 1.0 | أبريل 2026**

---

## جدول المحتويات

1. [ما هو AutoProjectBook؟](#ما-هو-autoprojectbook)
2. [لمن هو مخصص؟](#لمن-هو-مخصص)
3. [ما الذي يحتويه المستند المُنشأ؟](#ما-الذي-يحتويه-المستند-المنشأ)
4. [كيفية الاستخدام — خطوة بخطوة](#كيفية-الاستخدام--خطوة-بخطوة)
   - [الخطوة 1 — اختيار اللغة](#الخطوة-1--اختيار-اللغة)
   - [الخطوة 2 — الإعداد](#الخطوة-2--الإعداد)
   - [الخطوة 3 — استيراد: رفع الكود](#الخطوة-3--استيراد-رفع-الكود)
   - [الخطوة 4 — استيراد: رفع قاعدة البيانات](#الخطوة-4--استيراد-رفع-قاعدة-البيانات)
   - [الخطوة 5 — استيراد: لقطات الشاشة](#الخطوة-5--استيراد-لقطات-الشاشة)
   - [الخطوة 6 — إنشاء المستند](#الخطوة-6--إنشاء-المستند)
   - [الخطوة 7 — مراجعة الفصول](#الخطوة-7--مراجعة-الفصول)
   - [الخطوة 8 — التصدير: التنزيل](#الخطوة-8--التصدير-التنزيل)
5. [ميزات توثيق الكود](#ميزات-توثيق-الكود)
   - [لوحة مقاطع الكود](#لوحة-مقاطع-الكود)
   - [الدوال الرئيسية (دوالي أنا)](#الدوال-الرئيسية-دوالي-أنا)
   - [شرح الاستدعاء](#شرح-الاستدعاء)
   - [التكرار التعاودي وشجرة التكرار](#التكرار-التعاودي-وشجرة-التكرار)
   - [خوارزميات الفرز](#خوارزميات-الفرز)
   - [مكدس الاستدعاءات (Call Stack)](#مكدس-الاستدعاءات-call-stack)
6. [تفاصيل الاستيراد والتصدير](#تفاصيل-الاستيراد-والتصدير)
7. [إضافة دالة يدويًا](#إضافة-دالة-يدويًا)
8. [دعم اللغات](#دعم-اللغات)
9. [جميع الميزات العاملة](#جميع-الميزات-العاملة)

---

## ما هو AutoProjectBook؟

**AutoProjectBook** هو أداة مجانية تعمل عبر المتصفح، مصممة لمساعدة طلاب تخصص هندسة البرمجيات (5 وحدات دراسية) في إعداد **كتاب المشروع (ספר פרויקט)** الإلزامي — التوثيق الرسمي المطلوب من وزارة التربية والتعليم الإسرائيلية.

بدلاً من كتابة وثيقة تتراوح بين 40 و60 صفحة من الصفر، يقوم الطالب برفع ملفات مشروعه المكتمل، مخطط قاعدة البيانات، ولقطات الشاشة — وتقوم الأداة **تلقائيًا بإنشاء مستند Word كامل ومنسق** (docx.) باللغة العبرية أو العربية، جاهزًا للمراجعة والإتمام والتسليم.

تستخدم الأداة **الذكاء الاصطناعي (Google Gemini أو Azure OpenAI)** لتحليل بنية كود الطالب وكتابة نص طبيعي ومناسب لكل فصل تلقائيًا. لا يغادر أي كود كامل المتصفح — يُرسَل إلى الذكاء الاصطناعي أسماء الفئات وتوقيعات الطرق وبنية الجداول فقط.

> **نقطة مهمة للمعلمين:** تنتج الأداة حوالي 80% من المستند تلقائيًا. لا يزال الطالب بحاجة إلى إكمال قسم التأمل الشخصي بنفسه وإضافة اسمه إلى صفحة الغلاف في Microsoft Word قبل التسليم.

---

## لمن هو مخصص؟

<table dir="rtl" style="border-collapse:collapse;width:100%;margin:8px 0;">
<thead><tr>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">المستخدم</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">الدور</th>
</tr></thead><tbody>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>الطلاب (المستخدم الأساسي)</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">الصفوف 11-12، تخصص هندسة البرمجيات. أتموا مشروع C# الخاص بهم ويحتاجون إلى إنتاج توثيق رسمي.</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>المعلمون</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">يرشدون الطلاب خلال العملية، ويتحققون من وجود جميع الأقسام المطلوبة، ويقيّمون المستند المُسلَّم.</td>
</tr>
</tbody></table>

تعمل الأداة بالكامل في المتصفح — لا حاجة لأي تثبيت. يمكن للطلاب استخدامها من أي جهاز كمبيوتر في المدرسة أو حاسوب شخصي متصل بالإنترنت (يُنصح باستخدام Chrome أو Edge).

---

## ما الذي يحتويه المستند المُنشأ؟

تُنشئ الأداة مستند Word منظمًا وفقًا لإرشادات وزارة التربية والتعليم. يتم إنشاء جميع الفصول الإلزامية تلقائيًا:

<table dir="rtl" style="border-collapse:collapse;width:100%;margin:8px 0;">
<thead><tr>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">#</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">الفصل</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">ما يحتويه</th>
</tr></thead><tbody>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">1</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>المقدمة</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">أهداف المشروع، الجمهور المستهدف، سبب الحاجة</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">2</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>نظرة عامة على التقنيات</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">الأطر واللغات والأدوات المستخدمة</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">3</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>تحليل النظام</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">المتطلبات الوظيفية وغير الوظيفية</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">4</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>قاعدة البيانات</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">تفاصيل الجداول، الأعمدة، مخطط ERD</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">5</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>تنفيذ جانب الخادم</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">فئات منطق الأعمال، مقاطع الكود الرئيسية، شرح الطرق</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">6</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>تنفيذ جانب العميل</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">بنية واجهة المستخدم، المكونات، الشاشات</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">7</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>دليل المستخدم</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">تعليمات خطوة بخطوة مع لقطات الشاشة</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">8</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>التأمل الذاتي</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">تأمل الطالب الشخصي (يُكمله الطالب في Word)</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">9</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>الصعوبات والحلول</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">التحديات التقنية وكيف تم التعامل معها</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">10</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>التطويرات المستقبلية</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">التحسينات المقترحة والخطوات التالية</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">11</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>الملاحق</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">توثيق إضافي للفئات</td>
</tr>
</tbody></table>

---

## كيفية الاستخدام — خطوة بخطوة

الأداة منظمة كمعالج (Wizard) من 8 خطوات. يُظهر شريط التقدم في الأعلى الخطوة الحالية. يمكن النقر على الخطوات المكتملة للعودة وإجراء تعديلات.

---

### الخطوة 1 — اختيار اللغة

تطلب الشاشة الأولى من الطالب اختيار لغة الإخراج للمستند المُنشأ:

- **عברית (العبرية)** — سيُكتب المستند بالكامل باللغة العبرية
- **العربية** — سيُكتب المستند بالكامل باللغة العربية

تتحول واجهة التطبيق أيضًا إلى اللغة المختارة مع دعم كامل للتخطيط من اليمين إلى اليسار (RTL).

---

### الخطوة 2 — الإعداد

في هذه الخطوة، يملأ الطالب المعلومات الأساسية اللازمة للبدء:

<table dir="rtl" style="border-collapse:collapse;width:100%;margin:8px 0;">
<thead><tr>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">الحقل</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">الوصف</th>
</tr></thead><tbody>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>اسم الطالب</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">يظهر في رأس المستند</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>مفتاح Gemini API</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">مطلوب لإنشاء النصوص بالذكاء الاصطناعي. المفتاح يبقى في المتصفح فقط.</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>نموذج الذكاء الاصطناعي</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">اختيار نموذج Gemini — الافتراضي: <code dir="ltr">gemini-1.5-pro</code></td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>نوع المشروع</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">ASP.NET / Blazor / WPF / Windows Forms / Android / أخرى</td>
</tr>
</tbody></table>

زر **"اختبر المفتاح"** يتحقق من مفتاح API قبل المتابعة — لتجنب إضاعة الوقت إذا كان المفتاح خاطئًا.

> تدعم الأداة أيضًا **Azure OpenAI** للمدارس التي تستخدم خدمات Microsoft Azure.

---

### الخطوة 3 — استيراد: رفع الكود

هذه هي خطوة الاستيراد الرئيسية، حيث يُحضر الطالب كود المصدر لمشروعه.

**كيف يعمل:**
1. ينقر الطالب على منطقة الرفع أو يسحب ويُسقط **مجلد المشروع**
2. تقرأ الأداة تلقائيًا جميع ملفات <code dir="ltr">.cs</code> (وملفات <code dir="ltr">.aspx</code> و<code dir="ltr">.cshtml</code> و<code dir="ltr">.config</code>)
3. في غضون ثوانٍ تظهر قائمة بجميع **الفئات والطرق والخصائص والحقول** المكتشفة

**ما يراه الطالب في لوحة مقاطع الكود:**
- جميع الفئات المحللة مدرجة حسب الاسم
- لكل فئة: طرقها، معاملاتها، أنواع الإرجاع، ومحددات الوصول
- مربع اختيار **لتضمين أو استبعاد** كل فئة من التوثيق
- الملفات التي تُولَّد تلقائيًا تُستبعد بشكل تلقائي

**تمييز الدوال الرئيسية (دوالي أنا):**
في قائمة الفئات، يمكن للطالب تمييز الطرق كـ**"مقاطع رئيسية"** — الدوال الأكثر أهمية في مشروعه. هذه ستُعامَل بشكل خاص في المستند النهائي (راجع [الدوال الرئيسية](#الدوال-الرئيسية-دوالي-أنا) أدناه).

يمكن إضافة مجلدات متعددة إذا كان المشروع موزعًا على عدة مجلدات.

---

### الخطوة 4 — استيراد: رفع قاعدة البيانات

يستورد الطالب بنية قاعدة بياناته حتى تتمكن الأداة من توثيق الجداول والأعمدة والعلاقات.

**التنسيقات المدعومة:**

<table dir="rtl" style="border-collapse:collapse;width:100%;margin:8px 0;">
<thead><tr>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">التنسيق</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">التفاصيل</th>
</tr></thead><tbody>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">MS Access</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">ملف <code dir="ltr">.mdb</code> أو <code dir="ltr">.accdb</code> — تُستخرج الجداول تلقائيًا</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">SQL Server / T-SQL</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">ملف <code dir="ltr">.sql</code> — يتم تحليل عبارات <code dir="ltr">CREATE TABLE</code></td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">إدخال يدوي</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">لا حاجة لملف — يكتب الجداول والأعمدة مباشرة في النموذج</td>
</tr>
</tbody></table>

**ما تستخرجه الأداة:**
- أسماء الجداول والأوصاف
- أسماء الأعمدة وأنواع البيانات وقابلية الإهمال (nullability)
- المفاتيح الأساسية (PK) وعلاقات المفاتيح الخارجية (FK)

**بعد الرفع**، يمكن للطالب مراجعة وتصحيح كل شيء:
- تعديل أسماء الأعمدة أو أنواعها
- إضافة أعمدة أو حذفها
- كتابة وصف مقروء لكل جدول وحقل
- تمييز أو إلغاء تمييز PK/FK

تُستخدم هذه البيانات المراجَعة لإنشاء **فصل قاعدة البيانات** و**مخطط ERD**.

---

### الخطوة 5 — استيراد: لقطات الشاشة

يرفع الطالب لقطات شاشة من تطبيقه لتضمينها في فصل **دليل المستخدم**.

**كيف يعمل:**
- يسحب ويُسقط ملفات الصور (PNG, JPG, WEBP) أو يستخدم أداة اختيار الملفات
- حتى **30 لقطة شاشة**، بحد أقصى 5 ميغابايت لكل منها
- تفتح **عارضة لقطات الشاشة (Carousel)** تلقائيًا لعرض كل صورة بحجمها الكامل

**لكل لقطة شاشة يملأ الطالب:**

<table dir="rtl" style="border-collapse:collapse;width:100%;margin:8px 0;">
<thead><tr>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">الحقل</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">الوصف</th>
</tr></thead><tbody>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">التسمية التوضيحية</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">ما يُظهره هذا اللقطة</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">اسم الشاشة</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">اسم هذه الشاشة (مثل: "صفحة تسجيل الدخول")</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">نوع المستخدم</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">مدير / مستخدم عادي / كلاهما</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">تاغ الفصل</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">أي فصل تنتمي إليه هذه اللقطة</td>
</tr>
</tbody></table>

تُدمج لقطات الشاشة مباشرةً في مستند Word في فصل دليل المستخدم، مع تسمياتها التوضيحية كعناوين للأشكال.

---

### الخطوة 6 — إنشاء المستند

بمجرد أن تصبح جميع المدخلات جاهزة، ينقر الطالب على **"إنشاء"**. تعمل الأداة بعد ذلك على:

1. بناء ملخص للمشروع (الاسم، نوع المشروع، أسماء الفئات، أسماء الجداول، تسميات لقطات الشاشة)
2. إرسال سياق كل فصل إلى الذكاء الاصطناعي — فصل واحد في كل مرة
3. يكتب الذكاء الاصطناعي نص الفصل بالعربية أو العبرية
4. تُعرض **قائمة التقدم** حالة إنشاء كل فصل في الوقت الفعلي
5. يستغرق الإنشاء عادةً **2-5 دقائق** حسب حجم المشروع

> **ما يُرسَل إلى الذكاء الاصطناعي:** ملخص المشروع فقط (أسماء الفئات، توقيعات الطرق، بنية الجداول) — لا محتوى الكود الفعلي. هذا يحمي خصوصية الطالب.
>
> إذا تم الوصول إلى حد معدل الاستدعاء، تنتظر الأداة تلقائيًا وتُعيد المحاولة.

---

### الخطوة 7 — مراجعة الفصول

بعد اكتمال الإنشاء، يدخل الطالب في مرحلة المراجعة:

- يسرد **شريط جانبي** جميع الفصول الـ11 مع شارات الحالة: ✓ مكتمل / ⚠ فشل / ○ معلق
- النقر على أي فصل يعرض النص الكامل الذي أنشأه الذكاء الاصطناعي
- إذا كان الفصل يحتاج إلى تحسين، يُنقر على **"أعد الإنشاء"** لطلب إعادة كتابته من الذكاء الاصطناعي
- التنقل بين الفصول يتم من خلال الشريط الجانبي

تعرض **صفحة المخططات** المنفصلة:
- **مخطط ERD** (من مخطط قاعدة البيانات)
- **مخطط UML للفئات** (من بنية فئات C#)

كلا المخططين مكتوبان بصيغة Mermaid ومدمجان كصور داخل مستند Word.

---

### الخطوة 8 — التصدير: التنزيل

تتيح الخطوة الأخيرة للطالب تنزيل مستنده النهائي:

1. تُعرض **قائمة التحقق من الامتثال** الفصول الإلزامية المكتملة والناقصة
2. بمجرد الرضا، ينقر الطالب على **"تنزيل .docx"**
3. يُجمَّع مستند Word بالكامل في المتصفح
4. يفتح الملف مباشرةً في Microsoft Word للتحرير النهائي

**ما يجب إكماله في Word:**
- صفحة الغلاف (رقم الهوية، اسم المدرسة، اسم المعلم، تاريخ التسليم)
- قسم التأمل الشخصي (يجب أن يكتبه الطالب — لا يمكن للذكاء الاصطناعي كتابته وفق قواعد وزارة التربية)
- قائمة المراجع

---

## ميزات توثيق الكود

### لوحة مقاطع الكود

تظهر **لوحة مقاطع الكود** بعد أن يرفع الطالب ملفات C# الخاصة به (الخطوة 3). وهي المكان المركزي لاتخاذ جميع القرارات المتعلقة بالكود.

تُعرض اللوحة:
- كل فئة تم اكتشافها في الكود المرفوع
- **الطرق** و**الخصائص** و**الحقول** الخاصة بكل فئة في قائمة مقروءة
- محددات الوصول (<code dir="ltr">public</code>, <code dir="ltr">private</code>, <code dir="ltr">protected</code>)
- أنواع الإرجاع وقوائم المعاملات لكل طريقة

يمكن للطالب التمرير عبر قاعدة الكود بأكملها فئة تلو الأخرى، مقررًا ما يجب تضمينه في المستند المُنشأ.

---

### الدوال الرئيسية (دوالي أنا)

داخل لوحة مقاطع الكود، يمكن للطالب تمييز أي طريقة كـ**"مقطع رئيسي"** — هذه هي الدوال التي يريد إبرازها كأهم أجزاء تطبيقه. فكر في الأمر كـ: **"دوالي أنا — أهم الدوال التي كتبتها وأريد شرحها."**

**كيفية تمييز دالة رئيسية:**
- في قائمة الفئات، ابحث عن الطريقة وضع علامة في مربع اختيار **"مقطع رئيسي"**
- يمكن تمييز ما يصل إلى **20 دالة**

**ما يحدث في المستند المُنشأ:**
- تُعرض الدوال الرئيسية برمز **★** في فصل التنفيذ
- تحصل كل دالة رئيسية على قسمها الخاص المخصص يحتوي على:
  - توقيع الطريقة الكامل
  - **شرح الاستدعاء** الخاص بها (انظر أدناه)
  - وصف دورها في النظام

---

### شرح الاستدعاء

لكل دالة يتم تمييزها كمقطع رئيسي، يُنشئ الذكاء الاصطناعي **شرح الاستدعاء** — وصف واضح بلغة بسيطة مكتوب بالعربية أو العبرية:

- **ما تفعله الدالة** — غرضها في النظام
- **ما يستقبله** (المعاملات) وما تمثله
- **ما تُرجعه** أو ما التغييرات التي تحدثها
- **لماذا هذه الدالة مهمة** للتطبيق الكلي

يُوضع هذا الشرح مباشرةً بجانب أو أسفل مقطع الكود في المستند، مما يجعل الكود مفهومًا حتى لغير المبرمجين.

---

### التكرار التعاودي وشجرة التكرار

إذا كان مشروع الطالب يتضمن **طرقًا تعاودية** (دوال تستدعي نفسها)، تتعامل الأداة معها بتوثيق خاص.

**في فصل التنفيذ، تتضمن الدوال التعاودية:**
- وصف **نمط التكرار التعاودي** المستخدم في الكود
- **الحالة الأساسية** — الشرط الذي يوقف التكرار
- **الحالة التعاودية** — كيف تستدعي الدالة نفسها خطوة بخطوة
- غرض التكرار التعاودي ونتيجته

**شجرة التكرار التعاودي:**
يُضمَّن هيكل شجري مرئي في التوثيق يُظهر كيف تتوسع الاستدعاءات التعاودية من الاستدعاء الأولي إلى الأسفل عبر كل مستوى — على سبيل المثال، يُظهر <code dir="ltr">factorial(5) → factorial(4) → factorial(3)</code> وهكذا. هذا يجعل بنية الخوارزمية مرئية فورًا للمقيّمين.

---

### خوارزميات الفرز

إذا كان مشروع الطالب يحتوي على **خوارزميات فرز** (فرز الفقاعات، فرز الاختيار، الفرز السريع، فرز الدمج، إلخ)، سيقوم الذكاء الاصطناعي بـ:

- تحديد منطق الفرز من الكود المرفوع
- **تسمية وشرح** الخوارزمية المستخدمة
- وصف كيفية تدفق البيانات عبر عملية الفرز
- تضمين تتبع خطوة بخطوة لعينة إدخال عبر الخوارزمية في التوثيق

هذا يضمن أن فصل التنفيذ يعكس بدقة العمل الخوارزمي الذي قام به الطالب — أحد معايير التقييم الرئيسية.

---

### مكدس الاستدعاءات (Call Stack)

بالنسبة للدوال التي تستدعي عدة دوال أخرى، يتضمن المستند قسم **مكدس الاستدعاءات** يُظهر سلسلة استدعاءات الطرق:

- **الطريقة الابتدائية** (نقطة الدخول)
- الطرق التي تستدعيها وبأي ترتيب
- أي استدعاءات متداخلة داخل تلك الطرق
- النتيجة النهائية أو قيمة الإرجاع

يُسهّل هذا القسم على المقيّمين متابعة مسار تنفيذ البرنامج وفهم كيفية عمل الأجزاء المختلفة من النظام معًا.

---

## تفاصيل الاستيراد والتصدير

### الاستيراد — رفع الملفات

تدعم الأداة ثلاثة تدفقات استيراد منفصلة:

**استيراد الكود (الخطوة 3):**
- رفع مجلد مشروع C# (يتم اكتشاف جميع ملفات <code dir="ltr">.cs</code> تلقائيًا)
- أنواع ملفات إضافية مدعومة: <code dir="ltr">.aspx</code>, <code dir="ltr">.cshtml</code>, <code dir="ltr">.config</code>, <code dir="ltr">.css</code>, <code dir="ltr">.js</code>
- يمكن إضافة مجلدات متعددة لدمج مشروع متعدد المجلدات
- تتم معالجة الملفات بالكامل في المتصفح — لا شيء يُرفع إلى خادم

**استيراد قاعدة البيانات (الخطوة 4):**
- ملفات MS Access (<code dir="ltr">.mdb</code>, <code dir="ltr">.accdb</code>) — تُستخرج الجداول والعلاقات تلقائيًا
- سكريبتات T-SQL لـ SQL Server (<code dir="ltr">.sql</code>) — تحليل عبارات <code dir="ltr">CREATE TABLE</code>
- خيار الإدخال اليدوي للطلاب الذين ليس لديهم ملف قاعدة بيانات

**استيراد لقطات الشاشة (الخطوة 5):**
- ملفات الصور: PNG, JPG, WEBP
- حتى 30 صورة، بحد أقصى 5 ميغابايت لكل منها
- سحب وإسقاط أو أداة اختيار الملفات
- محرر عارض لإضافة التسميات التوضيحية

---

### التصدير — تنزيل المستند

عند نقر الطالب على **"تنزيل .docx"**، تقوم الأداة بـ:

1. تجميع جميع نصوص الفصول المُنشأة في مستند Word منظم
2. دمج بنى فئات C# ومقاطع الكود مع التنسيق الصحيح
3. إدراج مخططات ERD وUML كصور
4. دمج لقطات الشاشة في فصل دليل المستخدم
5. تطبيق تنسيق RTL كامل (من اليمين إلى اليسار) خلال المستند
6. استخدام خط David MT، حجم 12، تباعد أسطر 1.5 مع هوامش 2.5 سم

والنتيجة ملف <code dir="ltr">.docx</code> جاهز للتحرير يفتح في Microsoft Word.

---

## إضافة دالة يدويًا

في بعض الأحيان يريد الطالب التأكد يدويًا من توثيق دالة معينة — على سبيل المثال، دالة لم يتم اكتشافها تلقائيًا أو دالة يعتبرها الأهم في مشروعه.

**كيفية القيام بذلك:**

1. ارجع إلى **الخطوة 3 — رفع الكود** (انقر على الخطوة المكتملة في رأس المعالج)
2. في **لوحة مقاطع الكود**، ابحث عن الفئة التي تحتوي على الدالة
3. إذا كانت الفئة مستبعدة، ألغِ تحديد **"استبعاد"** لتضمينها
4. ابحث عن الطريقة المحددة في قائمة طرق الفئة
5. حدد مربع الاختيار **"مقطع رئيسي"** بجانب تلك الطريقة
6. استمر في المعالج — سيُنشئ الذكاء الاصطناعي **شرح استدعاء** مخصصًا لتلك الدالة في فصل التنفيذ

> يمكنك إضافة عدة دوال مخصصة. الحد الأقصى هو 20 مقطعًا رئيسيًا إجمالًا عبر جميع الفئات.

---

## دعم اللغات

يدعم AutoProjectBook لغتين للإخراج، كلتاهما بتخطيط كامل من اليمين إلى اليسار (RTL):

<table dir="rtl" style="border-collapse:collapse;width:100%;margin:8px 0;">
<thead><tr>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">اللغة</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">الواجهة</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">المستند</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">الاتجاه</th>
</tr></thead><tbody>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>العربية</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">✅ واجهة عربية</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">✅ نص المستند بالعربية</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">RTL</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>العبرية (עברית)</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">✅ واجهة عبرية</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">✅ نص المستند بالعبرية</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">RTL</td>
</tr>
</tbody></table>

**ما الذي يتغير مع إعداد اللغة:**
- تنتقل جميع تسميات الواجهة والأزرار والرسائل إلى اللغة المختارة
- يكتب الذكاء الاصطناعي جميع نصوص الفصول بتلك اللغة
- تتبع عناوين الفصول اصطلاحات التسمية الرسمية لوزارة التربية باللغة المستهدفة
- يُنسَّق مستند Word باتجاه فقرة RTL خلاله
- تحتفظ الأرقام وأسطر الكود باتجاه من اليسار إلى اليمين داخل نص RTL (وهو المعتاد)

يمكن تغيير اللغة في أي وقت بالعودة إلى الخطوة 1 (نقر على دائرة الخطوة في الرأس).

---

## جميع الميزات العاملة

الميزات التالية مُطبَّقة بالكامل وتعمل في AutoProjectBook:

<table dir="rtl" style="border-collapse:collapse;width:100%;margin:8px 0;">
<thead><tr>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">الميزة</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">الوصف</th>
</tr></thead><tbody>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>اختيار اللغة</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">الاختيار بين العربية والعبرية عند بدء التشغيل</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>واجهة RTL</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">تخطيط كامل من اليمين إلى اليسار للغتين</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>إدخال اسم الطالب</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">يُستخدم في رأس المستند</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>إعداد مفتاح Gemini API</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">مع زر اختبار حي وإدخال مخفي</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>دعم Azure OpenAI</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">مزود ذكاء اصطناعي بديل للاستخدام المدرسي</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>اختيار نموذج Gemini</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">الاختيار من نماذج معروفة أو إدخال اسم نموذج مخصص</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>اختيار نوع المشروع</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">ASP.NET / Blazor / WPF / WinForms / Android / أخرى</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>رفع مجلد كود C#</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">سحب وإسقاط أو أداة اختيار الدليل</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>استخراج فئات وطرق C#</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">تحليل تلقائي لجميع ملفات <code dir="ltr">.cs</code></td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>لوحة مقاطع الكود</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">عرض جميع الفئات والطرق المحللة</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>عناصر تحكم تضمين/استبعاد الفئة</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">إزالة الملفات المُولَّدة تلقائيًا أو غير ذات الصلة</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>تمييز المقاطع الرئيسية (دوالي أنا)</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">تمييز ما يصل إلى 20 دالة للتوثيق المفصل</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>دعم المشروع متعدد المجلدات</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">دمج الملفات من مجلدات متعددة</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>رفع ملف قاعدة البيانات</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">MS Access <code dir="ltr">.mdb/.accdb</code> وSQL Server <code dir="ltr">.sql</code></td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>إدخال قاعدة البيانات يدويًا</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">كتابة الجداول والأعمدة إذا لم يكن يتوفر ملف قاعدة بيانات</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>محرر مراجعة الجداول والأعمدة</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">تعديل المخطط المستخرج قبل الإنشاء</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>رفع لقطات الشاشة</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">PNG, JPG, WEBP — حتى 30 صورة</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>محرر عارض لقطات الشاشة</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">عرض بالحجم الكامل مع إدخال التسمية والبيانات الوصفية</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>إنشاء مستند بالذكاء الاصطناعي</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">11 فصلاً تُنشأ تلقائيًا باستخدام Gemini أو Azure</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>تقدم الإنشاء في الوقت الفعلي</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">قائمة تقدم فصل تلو الآخر</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>إعادة المحاولة التلقائية عند تحديد المعدل</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">إعادة المحاولة ما يصل إلى 3 مرات مع تراجع</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>توثيق التكرار التعاودي</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">يصف الذكاء الاصطناعي الخوارزميات التعاودية مع الحالة الأساسية والتعاودية</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>شجرة التكرار التعاودي</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">شجرة مرئية للاستدعاءات التعاودية في فصل التنفيذ</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>توثيق خوارزميات الفرز</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">يحدد الذكاء الاصطناعي منطق الفرز ويشرحه</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>توثيق مكدس الاستدعاءات</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">سلاسل استدعاءات الطرق موثقة في فصل التنفيذ</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>شرح الاستدعاء (لكل دالة)</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">شرح الذكاء الاصطناعي لكل مقطع رئيسي</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>صفحة مراجعة الفصول</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">قراءة النص المُنشأ، التنقل بين الفصول</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>إعادة إنشاء الفصل</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">إعادة تشغيل الذكاء الاصطناعي لأي فصل فردي</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>إنشاء مخطط ERD</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">مخطط العلاقات-الكيانات من مخطط قاعدة البيانات (Mermaid)</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>إنشاء مخطط UML للفئات</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">مخطط الفئات من بنية كود C# (Mermaid)</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>معاينة المخططات</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">عرض مخططات Mermaid المُنشأة قبل التصدير</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>قائمة التحقق من الامتثال</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">رؤية الفصول الإلزامية المكتملة قبل التنزيل</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>تصدير Word (.docx)</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">تنزيل مستند Word مُنسَّق بـ RTL</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>توثيق فئات C# في Word</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">الفئات والطرق مُنسَّقة بخط Courier New في فصل التنفيذ</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>دمج لقطات الشاشة في Word</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">لقطات الشاشة مضمنة في فصل دليل المستخدم مع التسميات التوضيحية</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>التنقل بالنقر على الخطوات</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">القفز إلى أي خطوة مكتملة من رأس المعالج</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>معالجة الأخطاء وإشعارات Toast</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">ملاحظات واضحة على أخطاء الرفع وفشل الـ API</td>
</tr>
</tbody></table>

---

*تم إعداد هذا الدليل لمساعدة المعلمين على فهم AutoProjectBook وتوجيه الطلاب في استخدامه وتقييم استخدامهم له.*

*للحصول على الدعم الفني أو للاقتراحات، تواصل مع منسق هندسة البرمجيات في المدرسة.*
