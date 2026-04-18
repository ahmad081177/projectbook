# AutoProjectBook — מדריך למורה

**גרסה 1.0 | אפריל 2026**

---

## תוכן עניינים

1. [מה זה AutoProjectBook?](#מה-זה-autoprojectbook)
2. [למי זה מיועד?](#למי-זה-מיועד)
3. [מה כולל המסמך שנוצר?](#מה-כולל-המסמך-שנוצר)
4. [איך משתמשים — שלב אחר שלב](#איך-משתמשים--שלב-אחר-שלב)
   - [שלב 1 — בחירת שפה](#שלב-1--בחירת-שפה)
   - [שלב 2 — הגדרות](#שלב-2--הגדרות)
   - [שלב 3 — ייבוא קוד](#שלב-3--ייבוא-קוד)
   - [שלב 4 — ייבוא מסד נתונים](#שלב-4--ייבוא-מסד-נתונים)
   - [שלב 5 — ייבוא צילומי מסך](#שלב-5--ייבוא-צילומי-מסך)
   - [שלב 6 — יצירת המסמך](#שלב-6--יצירת-המסמך)
   - [שלב 7 — סקירת פרקים](#שלב-7--סקירת-פרקים)
   - [שלב 8 — ייצוא: הורדה](#שלב-8--ייצוא-הורדה)
5. [תכונות תיעוד הקוד](#תכונות-תיעוד-הקוד)
   - [פאנל קטעי הקוד](#פאנל-קטעי-הקוד)
   - [פונקציות מפתח (הפונקציות שלי)](#פונקציות-מפתח-הפונקציות-שלי)
   - [הסבר הקריאה](#הסבר-הקריאה)
   - [רקורסיה ועץ הרקורסיה](#רקורסיה-ועץ-הרקורסיה)
   - [אלגוריתמי מיון](#אלגוריתמי-מיון)
   - [מחסנית הקריאות (Call Stack)](#מחסנית-הקריאות-call-stack)
6. [פרטי ייבוא וייצוא](#פרטי-ייבוא-וייצוא)
7. [הוספת פונקציה ידנית](#הוספת-פונקציה-ידנית)
8. [תמיכת שפות](#תמיכת-שפות)
9. [כל התכונות הפעילות](#כל-התכונות-הפעילות)

---

## מה זה AutoProjectBook?

**AutoProjectBook** הוא כלי חינמי מבוסס דפדפן, שנועד לעזור לתלמידים במגמת הנדסת תוכנה (5 יחידות לימוד) ליצור את **ספר הפרויקט** המנדטורי — התיעוד הרשמי הנדרש על ידי משרד החינוך.

במקום לכתוב מסמך של 40–60 עמודים מאפס, התלמיד מעלה את קבצי הפרויקט שלו, סכמת מסד הנתונים, וצילומי מסך — והכלי **יוצר אוטומטית מסמך Word מלא ומעוצב** (docx.) בעברית או ערבית, מוכן לסקירה, להשלמה ולהגשה.

הכלי משתמש ב**בינה מלאכותית (Google Gemini או Azure OpenAI)** כדי לנתח את מבנה הקוד ולכתוב טקסט רלוונטי ומקצועי עבור כל פרק אוטומטית. לא מועלה קוד מלא לרשת — רק שמות מחלקות, חתימות מתודות ומבנה טבלאות נשלחים לבינה המלאכותית.

> **נקודה חשובה למורים:** הכלי מייצר כ-80% מהמסמך באופן אוטומטי. התלמיד עדיין נדרש להשלים בעצמו את סעיף ההתבוננות האישית ולהוסיף את שמו לעמוד השער ב-Microsoft Word לפני ההגשה.

---

## למי זה מיועד?

<table dir="rtl" style="border-collapse:collapse;width:100%;margin:8px 0;">
<thead><tr>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">משתמש</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">תפקיד</th>
</tr></thead><tbody>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>תלמידים (ראשוני)</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">כיתות י"א–י"ב, מגמת הנדסת תוכנה. סיימו את פרויקט ה-C# שלהם וצריכים לכתוב תיעוד רשמי.</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>מורים</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">מנחים את התלמידים בתהליך, מוודאים שכל הסעיפים הנדרשים קיימים ומעריכים את המסמך שהוגש.</td>
</tr>
</tbody></table>

הכלי פועל לחלוטין בדפדפן — אין צורך בהתקנה. ניתן להשתמש בו מכל מחשב בבית הספר או מחשב אישי עם חיבור לאינטרנט (Chrome או Edge מומלצים).

---

## מה כולל המסמך שנוצר?

הכלי מייצר מסמך Word בנוי לפי הנחיות משרד החינוך. כל הפרקים המנדטוריים נוצרים אוטומטית:

<table dir="rtl" style="border-collapse:collapse;width:100%;margin:8px 0;">
<thead><tr>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">#</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">פרק</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">מה מכיל</th>
</tr></thead><tbody>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">1</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>מבוא</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">מטרות הפרויקט, קהל יעד, הנמקת הצורך</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">2</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>סקירת טכנולוגיות</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">פריימוורקים, שפות וכלים בהם השתמש התלמיד</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">3</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>ניתוח מערכת</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">דרישות פונקציונליות ואי-פונקציונליות</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">4</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>מסד נתונים</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">תיאור טבלאות, עמודות, דיאגרמת ERD</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">5</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>מימוש צד שרת</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">מחלקות לוגיקה עסקית, קטעי קוד מרכזיים, הסברי מתודות</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">6</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>מימוש צד לקוח</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">מבנה ממשק המשתמש, רכיבים ותיאורי מסכים</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">7</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>מדריך משתמש</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">הוראות שלב-אחר-שלב עם צילומי מסך</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">8</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>רפלקציה</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">התבוננות אישית של התלמיד (מושלמת ידנית ב-Word)</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">9</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>קשיים ופתרונות</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">אתגרים טכניים ואיך פתרו אותם</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">10</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>פיתוחים עתידיים</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">שיפורים מוצעים ושלב הבא</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">11</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>נספחים</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">תיעוד מחלקות נוסף</td>
</tr>
</tbody></table>

---

## איך משתמשים — שלב אחר שלב

הכלי בנוי כאשף עם 8 שלבים. סרגל התקדמות בראש הדף מראה באיזה שלב נמצאים. שלבים שהושלמו ניתנים ללחיצה לחזרה ולביצוע תיקונים.

---

### שלב 1 — בחירת שפה

המסך הראשון מבקש מהתלמיד לבחור את שפת הפלט של המסמך:

- **עברית** — המסמך כולו ייכתב בעברית
- **العربية (ערבית)** — המסמך כולו ייכתב בערבית

ממשק האפליקציה גם עובר לשפה שנבחרה עם תמיכה מלאה בפריסה מימין לשמאל (RTL).

---

### שלב 2 — הגדרות

בשלב זה התלמיד ממלא את הפרטים הבסיסיים הדרושים:

<table dir="rtl" style="border-collapse:collapse;width:100%;margin:8px 0;">
<thead><tr>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">שדה</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">תיאור</th>
</tr></thead><tbody>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>שם התלמיד</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">מופיע בכותרת המסמך</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>מפתח API של Gemini</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">נדרש לייצור טקסט באמצעות AI. המפתח נשמר בדפדפן בלבד.</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>מודל AI</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">בחירת מודל Gemini — ברירת מחדל: <code dir="ltr">gemini-1.5-pro</code></td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>סוג הפרויקט</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">ASP.NET / Blazor / WPF / Windows Forms / Android / אחר</td>
</tr>
</tbody></table>

כפתור **"בדוק מפתח"** מאמת את מפתח ה-API לפני המשך — כדי לא לבזבז זמן אם המפתח שגוי.

> הכלי תומך גם ב**Azure OpenAI** עבור בתי ספר שמשתמשים בשירותי Microsoft Azure.

---

### שלב 3 — ייבוא קוד

זהו שלב הייבוא הראשי, בו התלמיד מביא את קוד המקור של הפרויקט שלו.

**איך זה עובד:**
1. התלמיד לוחץ על אזור ההעלאה או גורר ומשחרר את **תיקיית הפרויקט**
2. הכלי קורא אוטומטית את כל קבצי ה-<code dir="ltr">.cs</code> (וקבצים נלווים כגון <code dir="ltr">.aspx</code>, <code dir="ltr">.cshtml</code>, <code dir="ltr">.config</code>)
3. תוך שניות מופיעה רשימה של כל **המחלקות, המתודות, המאפיינים והשדות** שזוהו

**מה התלמיד רואה בפאנל קטעי הקוד:**
- כל המחלקות שנותחו, מפורטת לפי שם
- עבור כל מחלקה: המתודות שלה, פרמטרים, סוגי החזר ומגדירי גישה
- תיבת סימון **לכלול או להוציא** כל מחלקה מהתיעוד
- קבצים אוטומטיים (כגון קבצי migration) מוסרים אוטומטית

**סימון פונקציות מפתח (הפונקציות שלי):**
ברשימת המחלקות, התלמיד יכול לסמן מתודות כ**"קטעי מפתח"** — הפונקציות החשובות ביותר בפרויקט. אלה יטופלו בצורה מיוחדת במסמך הסופי (ראו [פונקציות מפתח](#פונקציות-מפתח-הפונקציות-שלי) בהמשך).

ניתן להוסיף מספר תיקיות אם הפרויקט מפוצל על פני תיקיות שונות.

---

### שלב 4 — ייבוא מסד נתונים

התלמיד מייבא את מבנה מסד הנתונים שלו, כדי שהכלי יוכל לתעד טבלאות, עמודות וקשרים.

**פורמטים נתמכים:**

<table dir="rtl" style="border-collapse:collapse;width:100%;margin:8px 0;">
<thead><tr>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">פורמט</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">פרטים</th>
</tr></thead><tbody>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">MS Access</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">קובץ <code dir="ltr">.mdb</code> או <code dir="ltr">.accdb</code> — הטבלאות מחולצות אוטומטית</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">SQL Server / T-SQL</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">קובץ <code dir="ltr">.sql</code> — פקודות <code dir="ltr">CREATE TABLE</code> מנותחות אוטומטית</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">הזנה ידנית</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">אין צורך בקובץ — מקלידים טבלאות ועמודות ישירות בטופס</td>
</tr>
</tbody></table>

**מה הכלי מחלץ:**
- שמות טבלאות ותיאורים
- שמות עמודות, סוגי נתונים, nullability
- מפתחות ראשיים (PK) וקשרי מפתח זר (FK)

**לאחר ההעלאה**, התלמיד יכול לסקור ולתקן הכל:
- לערוך שמות עמודות או סוגים
- להוסיף ולמחוק עמודות
- לכתוב תיאור קריא לכל טבלה ושדה
- לסמן ולבטל סימון של PK/FK

נתונים אלה משמשים ליצירת **פרק מסד הנתונים** ואת **דיאגרמת ה-ERD**.

---

### שלב 5 — ייבוא צילומי מסך

התלמיד מעלה צילומי מסך של האפליקציה שלו לצורך הכללתם בפרק **מדריך המשתמש**.

**איך זה עובד:**
- גרור ושחרר קבצי תמונה (PNG, JPG, WEBP) או השתמש בכלי בחירת קבצים
- עד **30 צילומי מסך**, מקסימום 5 MB לכל אחד
- **קרוסלת צילומי מסך** נפתחת אוטומטית ומציגה כל תמונה בגודל מלא

**לכל צילום מסך התלמיד ממלא:**

<table dir="rtl" style="border-collapse:collapse;width:100%;margin:8px 0;">
<thead><tr>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">שדה</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">תיאור</th>
</tr></thead><tbody>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">כיתוב</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">מה מוצג בצילום המסך</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">שם המסך</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">שם של אותו מסך (לדוגמה: "דף כניסה")</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">סוג משתמש</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">מנהל / משתמש רגיל / שניהם</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">תגית פרק</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">לאיזה פרק שייך צילום המסך הזה</td>
</tr>
</tbody></table>

צילומי המסך מוטמעים ישירות לתוך מסמך ה-Word בפרק מדריך המשתמש, עם הכיתובים שלהם כתוויות איורים.

---

### שלב 6 — יצירת המסמך

לאחר שכל הנתונים מוכנים, התלמיד לוחץ **"צור מסמך"**. הכלי אז:

1. בונה סיכום של הפרויקט (שם, סוג פרויקט, שמות מחלקות, שמות טבלאות, כיתובי צילומי מסך)
2. שולח את הקשר של כל פרק לבינה המלאכותית — פרק אחד בכל פעם
3. הבינה המלאכותית כותבת את הטקסט של הפרק בעברית או ערבית
4. **רשימת התקדמות** מציגה את סטטוס יצירת כל פרק בזמן אמת
5. היצירה לוקחת בדרך כלל **2–5 דקות** בהתאם לגודל הפרויקט

> **מה נשלח לבינה המלאכותית:** רק סיכום הפרויקט (שמות מחלקות, חתימות מתודות, מבנה טבלאות) — לא תוכן הקוד עצמו. זה מגן על פרטיות התלמיד.
>
> אם הגבלת הקצב של API מגיעה, הכלי ממתין באופן אוטומטי ומנסה שוב.

---

### שלב 7 — סקירת פרקים

לאחר סיום היצירה, התלמיד נכנס לשלב הסקירה:

- **סרגל צד** מציג את כל 11 הפרקים עם תגיות סטטוס: ✓ הושלם / ⚠ נכשל / ○ ממתין
- לחיצה על פרק מציגה את הטקסט המלא שנוצר בבינה מלאכותית
- אם פרק דורש שיפור, לחיצה על **"צור מחדש"** גורמת לבינה המלאכותית לכתוב אותו שוב
- ניווט בין פרקים מתבצע דרך סרגל הצד

תצוגה נפרדת של **דיאגרמות** מציגה:
- **דיאגרמת ERD** (מסכמת מסד הנתונים)
- **דיאגרמת UML class** (ממבנה מחלקות ה-C#)

שתי הדיאגרמות נכתבות בפורמט Mermaid ומוטמעות כתמונות בתוך מסמך ה-Word.

---

### שלב 8 — ייצוא: הורדה

השלב הסופי מאפשר לתלמיד להוריד את המסמך המוגמר:

1. **רשימת ציות** מציגה אילו פרקים מנדטוריים הושלמו ואילו עדיין חסרים
2. לאחר שביעות רצון, התלמיד לוחץ **"הורד .docx"**
3. מסמך ה-Word נבנה לחלוטין בדפדפן
4. הקובץ נפתח ישירות ב-Microsoft Word לעריכה סופית

**מה להשלים ב-Word:**
- עמוד השער (מספר תעודת זהות, שם בית הספר, שם המורה, תאריך הגשה)
- סעיף ההתבוננות האישית (חייב להיכתב על ידי התלמיד — הבינה המלאכותית אינה יכולה לכתוב זאת לפי כללי משרד החינוך)
- ביבליוגרפיה

---

## תכונות תיעוד הקוד

### פאנל קטעי הקוד

**פאנל קטעי הקוד** מופיע לאחר שהתלמיד מעלה את קבצי ה-C# שלו (שלב 3). זהו המקום המרכזי שבו מתקבלות כל ההחלטות הקשורות לקוד.

הפאנל מציג:
- כל מחלקה שזוהתה בקוד שהועלה
- **המתודות**, **המאפיינים** ו**השדות** של כל מחלקה ברשימה קריאה
- מגדירי גישה (<code dir="ltr">public</code>, <code dir="ltr">private</code>, <code dir="ltr">protected</code>)
- סוגי החזר ורשימות פרמטרים עבור כל מתודה

התלמיד יכול לגלול בכל בסיס הקוד מחלקה אחר מחלקה ולהחליט מה לכלול במסמך שנוצר.

---

### פונקציות מפתח (הפונקציות שלי)

בתוך פאנל קטעי הקוד, התלמיד יכול לסמן כל מתודה כ**"קטע מפתח"** — אלה הפונקציות שהוא רוצה להדגיש כחלקים החשובים ביותר במימוש שלו. חשוב על כך כ: **"הפונקציות שלי — אלתה שאני כתבתי ורוצה להסביר."**

**איך לסמן פונקציית מפתח:**
- ברשימת המחלקות, מוצאים את המתודה ומסמנים את תיבת הסימון **"קטע מפתח"**
- ניתן לסמן עד **20 פונקציות**

**מה קורה במסמך שנוצר:**
- פונקציות מפתח מוצגות עם סמל **★** בפרק המימוש
- כל פונקציית מפתח מקבלת סעיף ייעודי משלה עם:
  - חתימת המתודה המלאה
  - ה**הסבר לקריאה** שלה (ראו להלן)
  - תיאור תפקידה במערכת

---

### הסבר הקריאה

עבור כל פונקציה שנסמנה כקטע מפתח, הבינה המלאכותית מייצרת **הסבר קריאה** — תיאור ברור בשפה פשוטה, כתוב בעברית או ערבית:

- **מה הפונקציה עושה** — מטרתה במערכת
- **מה היא מקבלת** (פרמטרים) ומה הם מייצגים
- **מה היא מחזירה** או אילו שינויים היא גורמת
- **מדוע הפונקציה חשובה** לאפליקציה הכוללת

הסבר זה מוצב ישירות לצד קטע הקוד במסמך, ועושה את הקוד קריא גם לאנשים שאינם מתכנתים.

---

### רקורסיה ועץ הרקורסיה

אם פרויקט התלמיד כולל **מתודות רקורסיביות** (פונקציות שקוראות לעצמן), הכלי מטפל בהן עם תיעוד מיוחד.

**בפרק המימוש, פונקציות רקורסיביות כוללות:**
- תיאור **תבנית הרקורסיה** שנמצאה בקוד
- **המקרה הבסיסי** — התנאי שמסיים את הרקורסיה
- ה**מקרה הרקורסיבי** — כיצד הפונקציה קוראת לעצמה שלב אחר שלב
- מטרת הרקורסיה ותוצאתה

**עץ הרקורסיה:**
מבנה עץ ויזואלי כלול בתיעוד המראה כיצד הקריאות הרקורסיביות מתרחבות מהקריאה הראשונית כלפי מטה דרך כל רמה — לדוגמה, המציג <code dir="ltr">factorial(5) → factorial(4) → factorial(3)</code> וכן הלאה. זה הופך את מבנה האלגוריתם גלוי מיידית לבוחנים.

---

### אלגוריתמי מיון

אם הפרויקט של התלמיד מכיל **אלגוריתמי מיון** (מיון בועות, מיון בחירה, מיון מהיר, מיון מיזוג וכו'), הבינה המלאכותית תבצע:

- זיהוי לוגיקת המיון מהקוד שהועלה
- **שם והסבר** של האלגוריתם שנמצא בשימוש
- תיאור כיצד הנתונים עוברים דרך המיון
- כולל מעקב שלב-אחר-שלב אחר קלט לדוגמה דרך האלגוריתם בתיעוד

זה מבטיח שפרק המימוש משקף במדויק את העבודה האלגוריתמית שהתלמיד ביצע — אחד מקריטריוני ההערכה המרכזיים.

---

### מחסנית הקריאות (Call Stack)

עבור פונקציות שקוראות למספר פונקציות אחרות, המסמך כולל סעיף **מחסנית קריאות** המראה את שרשרת הקריאות למתודות:

- ה**מתודה ההתחלתית** (נקודת הכניסה)
- אילו מתודות היא קוראת ובאיזה סדר
- כל קריאות מקוננות בתוך מתודות אלה
- התוצאה הסופית או ערך ההחזר

סעיף זה מקל על הבוחנים לעקוב אחרי נתיב ביצוע התוכנה ולהבין כיצד חלקי המערכת השונים עובדים יחד.

---

## פרטי ייבוא וייצוא

### ייבוא — העלאת קבצים

הכלי תומך בשלושה זרימות ייבוא נפרדות:

**ייבוא קוד (שלב 3):**
- העלאת תיקיית פרויקט C# (כל קבצי ה-<code dir="ltr">.cs</code> מזוהים אוטומטית)
- סוגי קבצים נוספים נתמכים: <code dir="ltr">.aspx</code>, <code dir="ltr">.cshtml</code>, <code dir="ltr">.config</code>, <code dir="ltr">.css</code>, <code dir="ltr">.js</code>
- ניתן להוסיף מספר תיקיות לשילוב פרויקט מרובה תיקיות
- עיבוד הקבצים מתבצע לחלוטין בדפדפן — שום דבר לא מועלה לשרת

**ייבוא מסד נתונים (שלב 4):**
- קבצי MS Access (<code dir="ltr">.mdb</code>, <code dir="ltr">.accdb</code>) — טבלאות וקשרים מחולצים אוטומטית
- סקריפטי T-SQL של SQL Server (<code dir="ltr">.sql</code>) — פרסור של פקודות <code dir="ltr">CREATE TABLE</code>
- אפשרות הזנה ידנית לתלמידים ללא קובץ מסד נתונים

**ייבוא צילומי מסך (שלב 5):**
- קבצי תמונה: PNG, JPG, WEBP
- עד 30 תמונות, מקסימום 5 MB לכל אחת
- גרור ושחרר או כלי בחירת קבצים
- עורך קרוסלה לכיתוב

---

### ייצוא — הורדת המסמך

כשהתלמיד לוחץ על **"הורד .docx"**, הכלי:

1. מרכיב את כל טקסט הפרקים שנוצר למסמך Word מבנותי
2. מוטמעים מבני מחלקות C# וקטעי קוד עם עיצוב נכון
3. מוכנסות דיאגרמות ERD ו-UML כתמונות
4. מוטמעים צילומי מסך בפרק מדריך המשתמש
5. מוחל עיצוב RTL מלא (מימין לשמאל) לאורך כל המסמך
6. בשימוש גופן David MT, גודל 12, רווח שורות 1.5 עם שוליים 2.5 ס"מ

התוצאה היא קובץ <code dir="ltr">.docx</code> מוכן-לעריכה שנפתח ב-Microsoft Word.

---

## הוספת פונקציה ידנית

לפעמים תלמיד רוצה לוודא ידנית שפונקציה ספציפית מתועדת — לדוגמה, פונקציה שלא זוהתה אוטומטית או כזו שהוא מחשיב לחשובה ביותר בפרויקט.

**איך לעשות זאת:**

1. חזרו ל**שלב 3 — העלאת קוד** (לחצו על השלב שהושלם בכותרת האשף)
2. ב**פאנל קטעי הקוד**, מצאו את המחלקה שמכילה את הפונקציה
3. אם המחלקה הוחרגה, בטלו את סימון **"הוצא"** כדי לכלול אותה
4. מצאו את המתודה הספציפית ברשימת המתודות של המחלקה
5. סמנו את תיבת הסימון **"קטע מפתח"** לצד אותה מתודה
6. המשיכו באשף — הבינה המלאכותית תייצר **הסבר קריאה** ייעודי לאותה פונקציה בפרק המימוש

> ניתן להוסיף מספר פונקציות בהתאמה אישית. המקסימום הוא 20 קטעי מפתח סה"כ בכל המחלקות.

---

## תמיכת שפות

AutoProjectBook תומך בשתי שפות פלט, שתיהן עם פריסה מלאה מימין לשמאל (RTL):

<table dir="rtl" style="border-collapse:collapse;width:100%;margin:8px 0;">
<thead><tr>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">שפה</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">ממשק</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">מסמך</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">כיוון</th>
</tr></thead><tbody>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>עברית</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">✅ ממשק בעברית</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">✅ טקסט מסמך בעברית</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">RTL</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>ערבית (العربية)</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">✅ ממשק בערבית</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">✅ טקסט מסמך בערבית</td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">RTL</td>
</tr>
</tbody></table>

**מה משתנה עם הגדרת השפה:**
- כל תוויות ממשק המשתמש, כפתורים והודעות עוברים לשפה שנבחרה
- הבינה המלאכותית כותבת את כל טקסט הפרקים בשפה זו
- כותרות פרקים עוקבות אחר מוסכמות שמות רשמיות של משרד החינוך בשפת היעד
- מסמך ה-Word מעוצב עם כיוון פסקה RTL לאורכו
- מספרים ושורות קוד שומרים על כיוון שמאל-לימין בתוך טקסט RTL (כנהוג)

ניתן לשנות שפה בכל שלב על ידי חזרה לשלב 1 (לחיצה על מעגל השלב בכותרת).

---

## כל התכונות הפעילות

התכונות הבאות מיושמות לחלוטין ופעילות ב-AutoProjectBook:

<table dir="rtl" style="border-collapse:collapse;width:100%;margin:8px 0;">
<thead><tr>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">תכונה</th>
  <th style="border:1px solid #ccc; padding:8px; text-align:right; background:#f0f0f0; font-weight:bold;">תיאור</th>
</tr></thead><tbody>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>בחירת שפה</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">בחירה בין עברית לערבית בהפעלה</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>ממשק RTL</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">פריסה מימין לשמאל מלאה לשתי השפות</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>הזנת שם תלמיד</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">בשימוש בכותרת המסמך</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>הגדרת מפתח Gemini API</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">עם כפתור בדיקה בזמן חי וקלט מוסתר</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>תמיכת Azure OpenAI</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">ספק AI חלופי לשימוש בביה"ס</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>בחירת מודל Gemini</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">בחירה ממודלים ידועים או הזנת שם מודל מותאם</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>בחירת סוג פרויקט</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">ASP.NET / Blazor / WPF / WinForms / Android / אחר</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>העלאת תיקיית קוד C#</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">גרור ושחרר או כלי בחירת תיקייה</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>חילוץ מחלקות ומתודות C#</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">ניתוח אוטומטי של כל קבצי ה-<code dir="ltr">.cs</code></td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>פאנל קטעי הקוד</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">צפייה בכל המחלקות והמתודות שנותחו</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>פקדי כלול/הוצא מחלקה</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">הסרת קבצים שנוצרו אוטומטית או לא רלוונטיים</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>סימון קטעי מפתח (הפונקציות שלי)</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">סימון עד 20 פונקציות לתיעוד מפורט</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>תמיכה בפרויקט רב-תיקיות</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">שילוב קבצים ממספר תיקיות</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>העלאת קובץ מסד נתונים</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">MS Access <code dir="ltr">.mdb/.accdb</code> ו-SQL Server <code dir="ltr">.sql</code></td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>הזנת מסד נתונים ידנית</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">הקלדת טבלאות ועמודות אם אין קובץ מסד נתונים</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>עורך סקירת טבלאות ועמודות</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">עריכת הסכמה שחולצה לפני יצירת המסמך</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>העלאת צילומי מסך</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">PNG, JPG, WEBP — עד 30 תמונות</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>עורך קרוסלת צילומי מסך</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">תצוגה בגודל מלא עם הזנת כיתוב ומטא-נתונים</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>יצירת מסמך AI</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">11 פרקים נוצרים אוטומטית באמצעות Gemini או Azure</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>התקדמות יצירה בזמן אמת</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">רשימת התקדמות פרק-אחר-פרק</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>ניסיון חוזר אוטומטי בהגבלת קצב</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">ניסיון חוזר עד 3 פעמים עם עיכוב</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>תיעוד רקורסיה</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">AI מתאר אלגוריתמים רקורסיביים עם מקרה בסיסי ורקורסיבי</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>עץ רקורסיה</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">עץ ויזואלי של קריאות רקורסיביות בפרק המימוש</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>תיעוד אלגוריתמי מיון</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">AI מזהה ומסביר לוגיקת מיון</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>תיעוד מחסנית קריאות</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">שרשראות קריאות מתודות מתועדות בפרק המימוש</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>הסבר קריאה (לפי פונקציה)</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">הסבר AI עבור כל קטע מפתח</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>דף סקירת פרקים</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">קריאת טקסט שנוצר, ניווט בין פרקים</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>יצירה מחדש של פרק</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">הפעלה מחדש של AI עבור כל פרק בנפרד</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>יצירת דיאגרמת ERD</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">דיאגרמת קשר-ישות מסכמת מסד הנתונים (Mermaid)</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>יצירת דיאגרמת UML class</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">דיאגרמת מחלקות ממבנה קוד C# (Mermaid)</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>תצוגה מקדימה של דיאגרמות</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">צפייה בדיאגרמות Mermaid שנוצרו לפני הייצוא</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>רשימת ציות</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">בדיקת אילו פרקים מנדטוריים הושלמו לפני ההורדה</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>ייצוא Word (.docx)</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">הורדת מסמך Word מעוצב ב-RTL</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>תיעוד מחלקות C# ב-Word</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">מחלקות ומתודות מעוצבות ב-Courier New בפרק המימוש</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>הטמעת צילומי מסך ב-Word</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">צילומי מסך כלולים בפרק מדריך המשתמש עם כיתובים</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>ניווט שלבים לחיץ</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">קפיצה לכל שלב שהושלם מכותרת האשף</td>
</tr>
<tr>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;"><strong>טיפול שגיאות ותיבות הודעה</strong></td>
  <td style="border:1px solid #ccc; padding:8px; text-align:right; vertical-align:top;">משוב ברור על שגיאות העלאה וכשלי API</td>
</tr>
</tbody></table>

---

*מדריך זה הוכן כדי לעזור למורים להבין, להנחות ולהעריך את שימוש התלמידים ב-AutoProjectBook.*

*לתמיכה טכנית או הצעות, פנו לרכז הנדסת התוכנה בבית הספר.*
