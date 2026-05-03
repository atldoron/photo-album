# מסמך טכני — אפליקציית אלבום תמונות

---

## 1. סטאק טכנולוגי

| רכיב | טכנולוגיה | גרסה |
|------|-----------|------|
| Frontend Framework | Next.js (App Router) | 16.x |
| שפה | TypeScript | 5+ |
| עיצוב | Tailwind CSS | 4+ |
| גלריה | react-photo-album | עדכנית |
| מציג מלא | yet-another-react-lightbox | עדכנית |
| אנימציות | framer-motion | עדכנית |
| Drag & Drop | @dnd-kit | עדכנית |
| Google Drive API | googleapis | עדכנית |
| קריאת EXIF | exifr | עדכנית |

---

## 2. אירוח ופריסה

- **פלטפורמה:** Vercel (חינמי)
- **CI/CD:** חיבור לגיטהאב — כל push לענף main מפרס אוטומטית
- **דומיין:** ברירת מחדל של Vercel (`your-app.vercel.app`), ניתן לחבר דומיין מותאם אישית

---

## 3. מסד נתונים — Vercel KV

- **טכנולוגיה:** Vercel KV (Redis Managed)
- **מגבלות חינמיות:** 256MB אחסון, 30,000 בקשות ביום — מספיק לשימוש אישי
- **מה נשמר:** רשימת האלבומים ומאפייניהם בלבד (לא קבצי מדיה)

### מבנה הנתונים (JSON לכל אלבום)

```json
{
  "id": "family-trip-2024",
  "name": "טיול משפחתי 2024",
  "description": "חופשה בדרום הארץ",
  "driveFolder": "https://drive.google.com/drive/folders/FOLDER_ID",
  "defaultLayout": "rows",
  "defaultSize": 50,
  "defaultSort": "date-desc",
  "createdAt": "2024-08-15T10:00:00Z",
  "order": 3
}
```

### שדות האלבום

| שדה | סוג | תיאור |
|-----|-----|-------|
| `id` | string | מזהה URL (slug) — אנגלית בלבד |
| `name` | string | שם לתצוגה בעברית |
| `description` | string | תיאור חופשי |
| `driveFolder` | string | קישור לתיקיית Google Drive |
| `defaultLayout` | `rows` / `masonry` / `grid` | פריסת ברירת מחדל |
| `defaultSize` | number (1–100) | ערך ה-Slider לגודל תמונות |
| `defaultSort` | `date-desc` / `date-asc` / `name-asc` / `name-desc` | מיון ברירת מחדל |
| `createdAt` | ISO string | תאריך יצירה |
| `order` | number | סדר הצגה ידני |

---

## 4. אחסון מדיה — Google Drive

- **עקרון:** הבעלים מארגן את הקבצים בתיקיות Google Drive — האפליקציה קוראת אותם בלבד
- **גישה:** Service Account של Google עם הרשאות Read-Only
- **תנאי:** תיקיית ה-Drive חייבת להיות מוגדרת כ-"Anyone with link can view" (שיתוף פומבי לפי קישור)

### קבצים נתמכים

**תמונות:** JPEG, PNG, GIF, WebP, HEIC

**סרטונים:** MP4, MOV, AVI

### נתוני EXIF

האפליקציה קוראת נתוני EXIF מהתמונות באמצעות ספריית `exifr`:
- **תאריך ושעת צילום** (`DateTimeOriginal`)
- **נתוני GPS** — קו רוחב, קו אורך

### Reverse Geocoding

- **ספק:** OpenStreetMap Nominatim (חינמי, ללא API Key)
- **שימוש:** המרת קואורדינטות GPS לשם מקום בעברית/אנגלית
- **הגבלה:** עד 1 בקשה לשנייה (מספיק לשימוש אישי)

---

## 5. מבנה הנתיבים (Routes)

| נתיב | תיאור | גישה |
|------|-------|------|
| `/` | פאנל ניהול האלבומים | פרטי (ללא הגנה טכנית) |
| `/album/[slug]` | תצוגת אלבום ספציפי | ציבורי — דרך קישור ישיר |

---

## 6. Client-Side Storage

- **מועדפים (כוכבים):** נשמרים ב-`localStorage` לפי מזהה פריט
- **הגדרות תצוגה (פריסה, גודל, מיון):** לא נשמרות — מתאפסות לברירת מחדל של האלבום בכל טעינה

---

## 7. כיווניות ושפה

- **כיווניות:** RTL (Right-to-Left) — הגדרה ב-`<html dir="rtl">`
- **שפת ממשק:** עברית בלבד
- **פונט:** תומך בעברית (Geist / system fonts)

---

## 8. מבנה הפרויקט

```
PhotoAlbum/
├── app/
│   ├── layout.tsx              # Root layout, RTL, dark theme
│   ├── page.tsx                # Admin panel (/)
│   ├── globals.css             # Global styles, Tailwind
│   └── album/
│       └── [slug]/
│           └── page.tsx        # Album view (/album/[slug])
├── components/
│   ├── admin/                  # Admin panel components
│   └── album/                  # Album view components
├── lib/
│   ├── drive.ts                # Google Drive API integration
│   ├── kv.ts                   # Vercel KV operations
│   └── geocoding.ts            # Nominatim reverse geocoding
├── types/
│   └── index.ts                # TypeScript type definitions
└── public/
```

---

## 9. משתני סביבה

```env
# Google Drive Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=

# Vercel KV (מוגדר אוטומטית ע"י Vercel)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
```
