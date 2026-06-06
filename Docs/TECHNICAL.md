# מסמך טכני — אפליקציית אלבום תמונות

---

## 1. סטאק טכנולוגי

| רכיב | טכנולוגיה | גרסה |
|------|-----------|------|
| Frontend Framework | Next.js (App Router, Turbopack) | 16.2.4 |
| שפה | TypeScript | 5+ |
| עיצוב | Tailwind CSS | 4+ |
| גלריה | react-photo-album | עדכנית |
| מציג מלא | yet-another-react-lightbox (YARL) | עדכנית |
| Drag & Drop | @dnd-kit | עדכנית |
| Google Drive API | googleapis | עדכנית |

---

## 2. אירוח ופריסה

- **פלטפורמה:** Vercel
- **Production URL:** https://photo-album-beryl.vercel.app
- **CI/CD:** `vercel deploy --prod` ידני (אין חיבור אוטומטי ל-GitHub)
- **GitHub:** https://github.com/atldoron/photo-album (`main` branch)

---

## 3. מסד נתונים — Vercel KV

- **טכנולוגיה:** Vercel KV (Redis Managed)
- **מה נשמר:** רשימת האלבומים ומאפייניהם בלבד (לא קבצי מדיה)

### מבנה נתוני אלבום (JSON)

```json
{
  "id": "family-trip-2024",
  "name": "טיול משפחתי 2024",
  "description": "חופשה בדרום הארץ",
  "driveFolder": "https://drive.google.com/drive/folders/FOLDER_ID",
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
| `driveFolder` | string | קישור לתיקיית Google Drive (או `"mock"` בפיתוח מקומי) |
| `defaultSort` | `"date-desc"` / `"date-asc"` | מיון ברירת מחדל |
| `createdAt` | ISO string | תאריך יצירה |
| `order` | number | סדר הצגה ידני |

---

## 4. אחסון מדיה — Google Drive

- **גישה:** Service Account עם הרשאות Read-Only
- **תנאי:** תיקיית Drive בהרשאת "Anyone with link can view"
- **API:** `drive.files.list` — pageSize 1000, pagination

### קבצים נתמכים

**תמונות:** JPEG, PNG, GIF, WebP, HEIC, HEIF

**סרטונים:** MP4, MOV, AVI

### Mock לפיתוח מקומי

כאשר `driveFolder === "mock"`, הפונקציה `getMockMedia()` ב-`lib/drive.ts`
מחזירה 80 תמונות מ-picsum.photos (ללא קריאה ל-Google Drive).

### URLים של מדיה

| שימוש | URL |
|-------|-----|
| thumbnail (גלרייה) | `https://drive.google.com/thumbnail?id={id}&sz=w400` |
| תצוגה מלאה | `https://drive.google.com/thumbnail?id={id}&sz=w1600` |
| הורדה | `https://drive.google.com/uc?id={id}&export=download` |
| וידאו (iframe) | `https://drive.google.com/file/d/{id}/preview` |

---

## 5. ניהול מצב — Client Side

### 5.1 כיוון מכשיר (Orientation)

```tsx
// useSyncExternalStore — מתעדכן ב: matchMedia change, resize, orientationchange
function getOrientationSnapshot(): 'portrait' | 'landscape' {
  return window.innerHeight >= window.innerWidth ? 'portrait' : 'landscape'
}
```

### 5.2 מספר עמודות (Columns)

**ברירות מחדל:**
| כיוון | ברירת מחדל | טווח |
|-------|-----------|------|
| portrait | 2 | 2 – 5 |
| landscape | 5 | 2 – 10 |

**מפתחות localStorage:**
```
cols_v2_portrait_{albumId}
cols_v2_landscape_{albumId}
```

**עדכון:** `localStorage.setItem(key, n)` + `window.dispatchEvent(new Event('photo-album-cols-changed'))`

`useSyncExternalStore` מאזין ל-`photo-album-cols-changed` ו-`storage` events.

### 5.3 מועדפים

```
fav_{albumId}_{itemId}  →  "1" / null
```

### 5.4 Hydration Skeleton

לפני טעינת React, מוצג `AlbumHydrationLoading` — CSS-only, ללא JavaScript.
ה-CSS משתמש ב-`@media (orientation: landscape)` להצגת מספר העמודות הנכון לפני hydration.

---

## 6. מבנה נתיבים (Routes)

| נתיב | תיאור | סוג |
|------|-------|-----|
| `/` | פאנל ניהול | Dynamic (SSR) |
| `/album/[slug]` | תצוגת אלבום | Dynamic (SSR) |
| `/api/albums` | CRUD אלבומים | API Route |
| `/api/albums/[id]` | פעולות על אלבום יחיד | API Route |
| `/api/albums/reorder` | שינוי סדר | API Route |
| `/api/media/[fileId]` | proxy הורדה | API Route |

---

## 7. ארכיטקטורת הגלרייה (AlbumView)

```
AlbumView (Client Component)
├── useSyncExternalStore(subscribeToOrientation)   → orientation
├── useSyncExternalStore(subscribeToStoredCols)    → [portraitCols, landscapeCols]
├── useState(layout)                               → 'masonry' (ברירת מחדל)
├── useState(groupMode)                            → 'continuous' / 'by-day'
├── useState(sort, filter, page, lightboxIndex)
│
├── Toolbar                  ← כלי שליטה
├── FilterPanel              ← פאנל סינון (כשפתוח)
├── GalleryGrid(key=galleryKey)  ← גלרייה (remount מלא בשינוי הגדרות)
│   └── galleryKey = `${orientation}-${layout}-${cols}-${groupMode}`
└── LightboxViewer           ← מציג מלא (כשתמונה נבחרת)
```

---

## 8. Lightbox (LightboxViewer)

- **ספרייה:** `yet-another-react-lightbox` (YARL), z-index 9999
- **header bar:** portal ל-`document.body`, z-index 10001
  - גרדיאנט כהה מלמעלה → שקוף
  - שם הקובץ (center)
  - כפתור ✕ (circle, dark bg) — קורא ל-`onClose`
- **כפתורים מותאמים** בtoolbar של YARL: fav, share, download, info, fullscreen
- **InfoPanel:** portal ל-body, z-index 10001, bottom-left
- **וידאו:** render.slide מותאם → iframe Google Drive
- **CSS override:**
  ```css
  :root { --yarl__color_backdrop: rgba(0,0,0,0.96); }
  .yarl__button { filter: drop-shadow(0 1px 4px rgba(0,0,0,0.85)); }
  ```

---

## 9. מבנה הפרויקט

```
PhotoAlbum/
├── app/
│   ├── layout.tsx              # Root layout — html.dark, dir=rtl, metadata, viewport
│   ├── page.tsx                # פאנל ניהול
│   ├── globals.css             # Tailwind 4 + YARL CSS overrides
│   └── album/[slug]/
│       ├── page.tsx            # טוען album + media מ-Drive, מרנדר AlbumView
│       └── loading.tsx         # Suspense fallback
│
├── components/
│   ├── admin/                  # AlbumList, AlbumCard, AlbumForm, ShareDialog
│   └── album/
│       ├── AlbumView.tsx       # לוגיקה + state + useSyncExternalStore
│       ├── Toolbar.tsx         # סרגל כלים (desktop + mobile)
│       ├── GalleryGrid.tsx     # react-photo-album + pinch handler
│       ├── LightboxViewer.tsx  # YARL + header portal + InfoPanel
│       ├── FilterPanel.tsx     # פאנל סינון
│       └── InfoPanel.tsx       # פרטי EXIF + geocoding
│
├── hooks/
│   └── useFavorites.ts         # CRUD מועדפים ב-localStorage
│
├── lib/
│   ├── drive.ts                # Google Drive API + getMockMedia()
│   ├── kv.ts                   # Vercel KV — getAlbum, listAlbums, saveAlbum, deleteAlbum
│   └── utils.ts                # sortMedia, formatFileSize, …
│
├── types/
│   └── index.ts                # Layout, SortOption, GroupMode, MediaItem, Album, FilterState…
│
├── Docs/
│   ├── REQUIREMENTS.md         # דרישות פונקציונליות
│   └── TECHNICAL.md            # מסמך זה
│
├── .claude/launch.json         # הגדרות שרת פיתוח ל-Claude Preview
├── .data/albums.json           # נתוני אלבומים מקומיים (gitignore)
└── .vercel/project.json        # projectId + orgId
```

---

## 10. משתני סביבה

```env
# Google Drive — JSON מלא של Service Account
GOOGLE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"..."}

# Vercel KV (מועתק מלוח הבקרה של Vercel)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
```

---

## 11. TypeScript Types

```typescript
type Layout    = 'rows' | 'masonry'
type SortOption = 'date-desc' | 'date-asc'
type GroupMode  = 'continuous' | 'by-day'
type MediaType  = 'all' | 'image' | 'video'

interface Album {
  id: string; name: string; description: string
  driveFolder: string; defaultSort: SortOption
  createdAt: string; order: number
}

interface MediaItem {
  id: string; name: string; mimeType: string
  type: 'image' | 'video'
  thumbnailUrl: string; viewUrl: string; downloadUrl: string
  width: number; height: number
  takenAt?: string; fileSize?: number
  latitude?: number; longitude?: number
}

interface FilterState {
  mediaType: MediaType; orientation: 'all' | 'landscape' | 'portrait'
  datePreset: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom'
  dateFrom: string; dateTo: string; search: string; favoritesOnly: boolean
}
```
