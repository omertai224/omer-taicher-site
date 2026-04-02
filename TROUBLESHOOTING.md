# תקלות נפוצות בהדרכות אינטראקטיביות - פתרונות מוכחים

**קרא את הקובץ הזה בתחילת כל עבודה על הדרכות!**
כל תקלה כאן כבר קרתה ונפתרה. לא צריך להמציא מחדש.

---

## 1. תמונות נחתכות / חורגות מתחת לפס הניווט

### סימפטום
התמונה יורדת מתחת לפס הניווט (80px), שורת המשימות של Windows לא נראית.

### סיבות ופתרונות

#### א. גרש/תו תלוש ב-HTML (הכי נפוץ!)
**סיבה:** תו בודד (גרש, רווח, טקסט) בין `</script>` ל-`<div class="slideshow-container">` מרנדר כטקסט ודוחף את כל התוכן למטה.
**בדיקה:** חפש כל תו בין `</script>` ל-`<div class="slideshow-container">`. צריך להיות רק שורה ריקה.
**פתרון:**
```
</script>

		<div class="slideshow-container">
```
**ללא שום תו** בין השניים (מלבד whitespace של הזחה).

#### ב. height במקום max-height על תמונות
**סיבה:** תמונות עם `style="height:calc(100vh - 80px)"` לא מתכווצות כשיש אלמנטים נוספים (בועות, boxes).
**פתרון:** להחליף `height` ב-`max-height` על כל תגי img:
```
style="max-height:calc(100vh - 80px);width:auto;max-width:100%;"
```
**בדיקה:** `grep -c 'style="height:calc' index.html` - צריך להיות 0.

#### ג. slideshow-container עם min-height:100vh
**סיבה:** ה-container תופס את כל המסך כולל האזור של פס הניווט.
**פתרון:** להשאיר `min-height: 100vh` (כמו ב-Everything). הגבלת הגובה נעשית ברמת `.image-center`.

---

## 2. אייקוני SVG חסרים בפס הניווט

### סימפטום
עיגול כתום ריק (בלי אייקון בתוכו) בפס הניווט.

### סיבה
ה-`specialIcons` ב-script.js לא מכיל את כל האייקונים שה-`slideMap` מפנה אליהם.

### פתרון - רשימת אייקונים שחייבים להיות ב-specialIcons:
```javascript
var specialIcons = {
  home:     '...', // בית - מסך פתיחה
  play:     '...', // משולש play - סרטון
  download: '...', // חץ למטה - שקף הורדה
  monitor:  '...', // מסך - שקף מעבר/שימוש
  install:  '...', // גלגל שיניים - התקנה
  usage:    '...', // מסך עם V - שימוש בתוכנה
  warning:  '...', // משולש אזהרה - UAC
  search:   '...', // זכוכית מגדלת - חיפוש
  mic:      '...', // מיקרופון - תמלול/אודיו
  finish:   '...', // נורה - מסך סיום
};
```

### בדיקה
לכל icon ב-slideMap, לוודא שקיים ב-specialIcons. הקוד המלא של כל SVG נמצא ב-`Everything/script.js`.

---

## 3. slideMap לא מעודכן אחרי הוספת שקפים

### סימפטום
עיגולים ממוספרים במקום אייקונים, או אייקונים במקום הלא נכון.

### כלל
אחרי כל הוספה/הסרה של שקף - לעדכן את slideMap:
- **הוספת שקף לפני אינדקס X** = כל אינדקסים >= X עולים ב-1
- **אינדקסים הם 0-based** - שקף ראשון = 0
- **מונה צעדים /N** = סה"כ שקפים - מספר שקפים מיוחדים (slideMap entries)

### בדיקה
```javascript
// סה"כ שקפים = document.getElementsByClassName("mySlides").length
// מספר מיוחדים = Object.keys(slideMap).length
// צעדים ממוספרים = סה"כ - מיוחדים
// לוודא שהמונה /N בכל בועה תואם
```

---

## 4. מקפים ארוכים (em dash / en dash)

### סימפטום
מקפים ארוכים (--) בטקסט העברי במקום מקפים רגילים (-).

### פתרון
```
// בדיקה:
grep -P '[--]' index.html

// תיקון - החלפת כל em dash ו-en dash למקף רגיל
```
**כלל:** בכל הדרכה, להשתמש רק במקפים קצרים (-). לא em dash, לא en dash.

---

## 5. צבעי עיגולים בפס ניווט

### מפרט
- **צעדים ממוספרים (1,2,3...):** כחול בהיר `#a8c5d6` -> כחול כהה `#1e5f74` (active)
- **עיגולים מיוחדים (אייקונים):** כתום בהיר `#f6a67e` -> כתום כהה `#e8834e` (active)

### CSS נדרש
```css
.nav-dot-icon { padding: 0; background-color: #f6a67e; }
.nav-dot-icon:hover { background-color: #e8834e; }
.nav-dot-icon.active { background-color: #e8834e; }
```
**חובה** שה-CSS הזה יופיע **אחרי** `.nav-dot.active` כדי לדרוס אותו.

---

## 6. שקפי SmartScreen / אזהרות Windows

### עיקרון
אנשים מפחדים מחלונות אזהרה של Windows. חייב טקסט מרגיע.

### שקף SmartScreen ("מידע נוסף")
```
"אל דאגה! זה מסך הגנה רגיל של Windows - התוכנה בטוחה לחלוטין.
לחצו על מידע נוסף כדי להמשיך."
```

### שקף "הפעל בכל מקרה"
```
"מעולה! עכשיו לחצו על הפעל בכל מקרה -
זה בסדר גמור, Windows פשוט לא מכיר את התוכנה עדיין."
```

### שקף UAC (בקרת חשבון משתמש) - רק כשרלוונטי
- לא כל תוכנה מפעילה UAC (למשל Vibe לא)
- Everything כן מפעיל -> יש שקף UAC מיוחד
- ראה `Everything/index.html` שקף 7 לדוגמה מלאה

---

## 7. git - multiple merge bases

### סימפטום
```
fatal: multiple merge bases found
```

### סיבה
rebase + merge על אותו בראנצ' יוצר מספר common ancestors.

### פתרון
```bash
git fetch origin main
git checkout origin/main
git checkout -B claude/branch-name
git cherry-pick <commit-hash>  # רק הקומיטים החדשים
git push -u origin claude/branch-name --force-with-lease
```

---

## 8. העתקת תבנית - מה חייבים להעתיק מ-Everything

### בעיה
כשמעתיקים style.css ו-script.js מ-Everything להדרכה חדשה, חלק מהדברים חסרים.

### רשימת מה שחייב להיות בכל הדרכה:

#### style.css - לוודא שקיים:
- CSS לעיגולים כתומים (`.nav-dot-icon` עם `background-color: #f6a67e`)
- `.image-center` עם `height: calc(100vh - 80px)`
- `.image-center img` עם `max-height: 100%`

#### script.js - לוודא שקיים:
- **כל 10 האייקונים** ב-specialIcons (home, play, download, monitor, install, usage, warning, search, mic, finish)
- slideMap מותאם להדרכה הספציפית
- buildNavDots עם חישוב grid נכון

#### images/ - לוודא שקיים:
- logo.png, right.png, left.png, right-disabled.png, left-disabled.png

### טעות נפוצה
Vibe הישן היה עם specialIcons חלקי (חסרו install ו-usage). תמיד להעתיק את כל 10 האייקונים.

---

## 9. ההבדל בין מבנה HTML של Everything ל-Vibe

### Everything (המבנה המומלץ)
```html
<div class="image">
  <div class="image-container" style="height:calc(100vh - 80px);display:flex;align-items:center;justify-content:center;">
    <img src="..." style="max-height:100%;max-width:100%;">
    <div class="box ...">...</div>
    <div class="text ...">...</div>
  </div>
</div>
```

### Vibe (מבנה ישן - שונה)
```html
<div class="image">
  <div class="image-center">
    <img src="..." style="max-height:calc(100vh - 80px);width:auto;max-width:100%;">
    <div class="box ...">...</div>
    <div class="text ...">...</div>
  </div>
</div>
```

### ההבדל העיקרי
- Everything: ה-container מגביל גובה, התמונה מתכווצת בתוכו
- Vibe: התמונה עצמה מוגבלת עם max-height
- **שניהם עובדים**, אבל ב-Vibe חייבים `max-height` (לא `height`!) על התמונות

---

## 10. שקפי מעבר (transition slides)

### מתי צריך
- בין "הורדה" ל"התקנה"
- בין "התקנה" ל"שימוש"
- בהדרכה גולמית: שקפים ריקים (בלי תמונה) = שקפי מעבר

### מבנה HTML
```html
<div class="mySlides fade">
<style>
.partb-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;
  height:calc(100vh - 80px);background:linear-gradient(135deg,#0f2a3a 0%,#1a4a6b 100%);
  text-align:center;padding:20px 40px;box-sizing:border-box;gap:10px;}
/* ... CSS classes ... */
</style>
<div class="partb-wrap">
  <div class="partb-check"><!-- SVG icon --></div>
  <div class="partb-badge">התקנה</div>
  <div class="partb-title">בואו נתקין את <span>שם התוכנה</span></div>
  <div class="partb-sub">תיאור קצר</div>
  <button class="partb-btn" onclick="nextSlide()">המשך</button>
</div>
</div>
```

### slideMap
שקף מעבר חייב להופיע ב-slideMap עם icon מתאים (install/monitor/usage).

---

## 11. כפתור UAC - עיצוב עדין ונקי

### גרסה שעובדת (לא גרסת glow מוגזמת!)
```css
/* כפתור עדין - רקע שקוף, טקסט כתום, V ירוק */
background: transparent;
border: 2px solid #f6a67e;
color: #f6a67e;
/* V ירוק פשוט בלי glow */
```
**לא** להוסיף אנימציית glow מוגזמת - עומר מעדיף עדין ונקי.

---

## 12. בדיקת תקינות מהירה (סקריפט מנטלי)

כשעומר אומר "משהו לא עובד בהדרכה", לעבור על זה בסדר:

1. **תווים תלושים?** חפש בין `</script>` ל-`slideshow-container`
2. **height vs max-height?** חפש `style="height:calc` על תמונות
3. **אייקונים חסרים?** השווה slideMap מול specialIcons
4. **slideMap indices?** ספור שקפים ידנית, וודא 0-based
5. **CSS חסר?** בדוק שיש `.nav-dot-icon` עם כתום
6. **מקפים?** חפש em/en dash

---

## 13. קובץ נתקע כל הזמן בזמן עריכה (קובץ גדול מדי)

### סימפטום
סשן נתקע או נופל באמצע עריכת קובץ. קורה שוב ושוב על אותו קובץ.

### סיבה
קובץ HTML גדול מדי (הרבה שורות) — הסשן לא מצליח לקרוא/לערוך אותו בלי להיתקע.

### פתרון — פיצול!
לפצל את הקובץ לקבצים קטנים לפי תפקיד:
- **HTML** — רק המבנה (שקפים, תוכן)
- **CSS** — קובץ נפרד (`style.css` או `video-slides.css`)
- **JS** — קובץ נפרד (`script.js` או `video-slides.js`)

### דוגמה מוכחת: video-slides (HowTo)
הקובץ המקורי היה HTML אחד ענקי עם CSS ו-JS בתוכו. פוצל ל-3 קבצים:
- `video-slides.html` — מבנה השקפים בלבד
- `video-slides.css` — כל העיצוב
- `video-slides.js` — לוגיקת ניווט

**התוצאה:** עריכה חלקה, סשנים לא נתקעים, קל לתחזק.

### כלל אצבע
- קובץ מעל 500 שורות שצריך עריכה תכופה? **לפצל.**
- עדיף 3 קבצים קטנים מקובץ אחד ענקי שכל הזמן נתקע.
- CSS ו-JS תמיד אפשר להוציא לקבצים נפרדים בלי לשבור פונקציונליות.

---

### תקלות מסשן מרץ 2026 — פיצול קבצים ו-shared

**14. slides.json חילוץ כולל זבל מסוף ה-HTML**
- **בעיה:** כשמחלצים שקפים מ-index.html ל-slides.json, השקף האחרון (outro) עלול לכלול בטעות את הלוגו, החיצים, פס הניווט, event listeners, ואפילו </body></html>
- **תסמין:** הפס ניווט לא מופיע (נדחף ע"י עותק שני של position:fixed בתוך השקף)
- **פתרון:** בדוק את ה-HTML של השקף האחרון ב-slides.json. אם הוא מכיל logo.png, left-arrow, nav-background, addEventListener — חתוך הכל מסוף ה-outro-wrap div
- **מניעה:** אחרי חילוץ, תמיד בדוק: `python3 -c "import json; d=json.load(open('slides.json')); print(len(d['slides'][-1].get('html','')))"` — אם מעל 8000 תווים, כנראה יש זבל

**15. z-index של קבצים משותפים — לא לשנות!**
- **כלל:** אם הדרכה אחת לא עובדת אבל השאר כן — הבעיה בהדרכה, לא ב-shared
- **z-index hierarchy:** nav-background(1) < arrows(2) < logo(3) < magnifier/tts(10)
- **לא לשנות z-index ב-shared בגלל הדרכה אחת** — זה ישבור את השאר

**16. שמות תמונות — לשנות מיד בשלב 0!**
- **בעיה:** FlowShare יוצר שמות כמו How_to_copy_Amazon_order_details_and_images_and_paste_them_into_Microsoft_Word_using_clipboard_history_1.png
- **פתרון:** שינוי שמות ל-{tutorial}-{step:02d}.png (למשל clipboard-01.png, vibe-05.png)
- **חובה לעדכן:** slides.json, slide-map.json, index.html (אם לא דינמי)

**17. קבצי ניווט בתיקיית images/ — מיותרים!**
- **כלל:** logo.png, left.png, right.png — נמצאים ב-shared/images/ בלבד
- **לא להעתיק לתיקיית images/ של הדרכה** — רק לקשר ל-../../shared/images/
- **אם חסר קובץ — תמיד ללכת ל-shared**, לא להעתיק

**18. DOMContentLoaded ב-shared/script.js — אסור!**
- **בעיה:** DOMContentLoaded ב-shared קורא ל-buildNavDots() לפני שהשקפים נבנים (מ-fetch)
- **פתרון:** כל הדרכה קוראת ל-buildNavDots() מתוך initApp() שלה, אחרי buildSlides()
- **shared/script.js לא צריך DOMContentLoaded** — רק פונקציות + keyboard/resize listeners

---

## צ'קליסט לפני דחיפה של הדרכה

- [ ] אין תווים תלושים בין `</script>` ל-`slideshow-container`
- [ ] כל תמונות: `max-height:calc(100vh - 80px)` (לא height!)
- [ ] כל אייקוני slideMap קיימים ב-specialIcons
- [ ] slideMap indices = 0-based ונכונים
- [ ] מונה צעדים /N תואם (סה"כ שקפים - מיוחדים)
- [ ] אין מקפים ארוכים
- [ ] CSS כתום לעיגולים מיוחדים קיים
- [ ] שקפי SmartScreen עם טקסט מרגיע

---

## 12. הדרכה חדשה בתת-תיקייה (Chrome/X, Gmail/X) לא עובדת

### סימפטום
הדרכה חדשה בתת-תיקייה (כמו Chrome/WebApp) מציגה שקפים שבורים, בלי עיצוב, בלי ניווט.

### סיבה
נתיב ל-shared לא נכון. הדרכות בתת-תיקייה (interactive/tutorials/Chrome/WebApp/) צריכות **3 רמות** למעלה, לא 4.

### פתרון
```html
<!-- נכון (3 רמות): -->
<link rel="stylesheet" href="../../../shared/style.css">
<script src="../../../shared/script.js"></script>
<img src="../../../shared/images/logo.png">

<!-- לא נכון (4 רמות): -->
<link rel="stylesheet" href="../../../../shared/style.css">
```

### מניעה
בכל יצירת הדרכה חדשה, לבדוק את העומק:
- `tutorials/Clipboard/` = 2 רמות = `../../shared/`
- `tutorials/Gmail/Stars/` = 3 רמות = `../../../shared/`
- `tutorials/Chrome/WebApp/` = 3 רמות = `../../../shared/`

---

## 13. slides.json ריק גורם לשגיאה בעורך

### סימפטום
`Cannot read properties of undefined (reading 'step')` כשפותחים הדרכה חדשה ריקה בעורך.

### סיבה
slides.json עם מערך slides ריק (`"slides": []`). העורך מנסה לקרוא step מהשקף הראשון שלא קיים.

### פתרון
תמיד ליצור הדרכה חדשה עם שקף placeholder אחד לפחות:
```json
{
  "title": "שם ההדרכה",
  "subtitle": "קטגוריה",
  "totalSteps": 0,
  "slides": [
    {
      "index": 0,
      "type": "click",
      "step": 1,
      "text": "",
      "textPos": { "left": "50%", "top": "50%" }
    }
  ]
}
```

---

## 14. bubbleDesignWidth חייב להיות זהה בכל מקום

### סימפטום
בועות טקסט בגדלים שונים בין העורך לתצוגה החיה.

### סיבה
`bubbleDesignWidth` שונה בין script.js של ההדרכה לבין editor/render.js.

### פתרון
**הערך הנוכחי: 853** (150% scale על 4K@300%).
חייב להיות זהה ב:
1. כל script.js של הדרכה: `window.bubbleDesignWidth = 853;`
2. editor/render.js fallback: `var designW = window.bubbleDesignWidth || 853;`

ראו תיעוד מלא ב-`BUBBLE-SCALE.md`.
- [ ] שקף מעבר "התקנה" לפני שקפי SmartScreen
