# מערכת Scale של בועות טקסט — תיעוד מצב עובד (אפריל 2026)

## מה עובד עכשיו

הבועות בהדרכות נראות **בדיוק אותו דבר** בעורך ובתצוגה החיה:
- אותו גודל
- אותו מיקום
- בכל רזולוציה ומרחק תצוגה

## המספר הקריטי: `bubbleDesignWidth = 853`

זה המספר שקובע את ה-scale של הבועה. הנוסחה:

```
scale = containerWidth / 853
```

### איך הגענו ל-853:
- עומר עובד על מסך **4K (3840x2160) ב-300% DPI**
- זה נותן viewport CSS של **1280x720 pixels**
- עומר רוצה scale של **150%** (בועה גדולה ונוחה למבוגרים)
- **1280 / 1.5 = 853**

### מה קורה במסכים שונים:
| מסך | Viewport CSS | Image Width | Scale | תוצאה |
|-----|-------------|-------------|-------|--------|
| 4K@300% (עומר עורך) | 1280px | ~1000px | 1.17 | גודל נוח |
| 1080p@100% | 1920px | ~1440px | 1.69 | גודל גדול ונוח |
| 1080p@150% | 1280px | ~960px | 1.13 | גודל נוח |

## שני הקבצים הקריטיים

### 1. shared/script.js — התצוגה החיה (scaleBubbles)

```javascript
function scaleBubbles() {
  // ...
  var scale = w / designW;  // w = image width, designW = 853
  // ...
  t.style.transform = 'scale(' + scale + ')';
  t.style.transformOrigin = 'left top';
  // ...
  // מיקום: פשוט textPos כמו שנשמר מהעורך, רק clamp לגבולות מסך
  var tL = parseFloat(t.style.left) || 0;
  var tT = parseFloat(t.style.top) || 0;
  var newL = Math.max(0.5, Math.min(tL, 99 - twPct));
  var newT = Math.max(0.5, Math.min(tT, 98 - thPct));
  t.style.left = newL + '%';
  t.style.top = newT + '%';
}
```

**חשוב:** אין פיצוי מיקום (grow compensation). ה-textPos מהעורך הוא המיקום הסופי.

### 2. editor/render.js — העורך (renderBubble)

```javascript
function renderBubble(slide) {
  // ...
  var designW = window.bubbleDesignWidth || 853;  // MUST match!
  var scale = cw / designW;  // cw = container width in editor
  bubble.style.transform = 'scale(' + scale + ')';
  bubble.style.transformOrigin = 'left top';
  // ...
}
```

**חשוב:** העורך משתמש באותה נוסחה בדיוק: `containerWidth / 853`

### 3. כל ההדרכות — script.js מקומי

כל הדרכה מגדירה בקובץ script.js שלה:

```javascript
window.bubbleDesignWidth = 853;
```

קבצים:
- `interactive/tutorials/Clipboard/script.js`
- `interactive/tutorials/Everything/script.js`
- `interactive/tutorials/Vibe/script.js`
- `interactive/tutorials/Gmail/Schedule/script.js`
- `interactive/tutorials/Gmail/Stars/script.js`

## מה אסור לשנות

1. **אסור להוסיף פיצוי מיקום (grow compensation)** — כל ניסיון לפצות על ה-scale growth שובר את ההתאמה בין העורך ללייב
2. **אסור לשנות את designW במקום אחד בלי השני** — חייב להיות זהה בכל ההדרכות + ב-editor/render.js
3. **אסור להסיר את ה-scale** — בלי scale הבועה קטנה מדי במסכים גדולים
4. **אסור לשנות transformOrigin** — חייב להיות `left top` בשניהם

## אם רוצים לשנות את הגודל

פשוט לשנות את המספר 853 **בכל 6 המקומות**:
- 5 קבצי script.js של הדרכות
- 1 fallback ב-editor/render.js

| scale רצוי | designW |
|-----------|---------|
| 125% | 1024 |
| 150% | 853 |
| 175% | 731 |
| 200% | 640 |

נוסחה: `designW = 1280 / scale`

## היסטוריה — מה נשבר ולמה

### ניסיון 1: 8 כיוונים / 360 מעלות
ניסינו לשפר את מיקום הבועה ביחס ל-box עם חישובי זווית ומרחק. **נשבר** כי ה-scale משנה את מרכז הבועה והחישובים לא התאימו.

### ניסיון 2: הסרת scale
הסרנו את ה-transform:scale לגמרי. **נשבר** כי הבועה נראתה שונה במסכים שונים.

### ניסיון 3: פיצוי מיקום (grow compensation)
הוספנו חישוב שמזיז את הבועה כדי לפצות על ה-scale growth. **נשבר** כי זה יצר הבדל בין העורך (שלא עשה פיצוי) ללייב (שכן עשה).

### הפתרון שעובד:
1. **אותה נוסחת scale** בעורך ובלייב: `containerWidth / 853`
2. **אין פיצוי מיקום** — textPos כמו שהוא
3. **designW = 853** בכל מקום
