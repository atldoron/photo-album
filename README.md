# אלבום תמונות — Photo Album

אפליקציית ווב לניהול והצגת אלבומי תמונות וסרטונים מ-Google Drive.

## טכנולוגיות

- **Next.js 16** (App Router, Turbopack)
- **TypeScript 5**, **Tailwind CSS 4**
- **react-photo-album** — גלרייה (Rows / Masonry)
- **yet-another-react-lightbox** — מציג מלא
- **Vercel KV** (Redis) — אחסון נתוני אלבומים
- **Google Drive API** — מקור התמונות והסרטונים
- **@dnd-kit** — גרירה ושחרור בפאנל הניהול

## הפעלה מקומית

```bash
npm install
npm run dev
```

פתח [http://localhost:3000](http://localhost:3000).

### משתני סביבה (.env.local)

```env
GOOGLE_SERVICE_ACCOUNT={"type":"service_account",...}   # JSON מלא של Service Account

# Vercel KV (מועתק מלוח הבקרה של Vercel)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
```

### פיתוח מקומי ללא Google Drive

ב-`lib/albums.json` (נתיב מקומי בלבד, ב-`.gitignore`), הגדר `driveFolder: "mock"` —
האפליקציה תטען 80 תמונות לדוגמה מ-picsum.photos.

## פריסה

```bash
vercel deploy --prod
```

## מבנה הפרויקט

```
app/
├── layout.tsx              # Root layout — RTL, dark theme, metadata
├── page.tsx                # פאנל ניהול (/)
├── globals.css             # Tailwind + YARL overrides
└── album/[slug]/
    └── page.tsx            # תצוגת אלבום (/album/[slug])

components/
├── admin/                  # רכיבי פאנל ניהול (AlbumList, AlbumForm…)
└── album/
    ├── AlbumView.tsx       # לוגיקת תצוגת אלבום + useSyncExternalStore
    ├── Toolbar.tsx         # סרגל כלים (layout, cols, groupMode, sort, filter)
    ├── GalleryGrid.tsx     # גלרייה (react-photo-album + pinch)
    ├── LightboxViewer.tsx  # מציג מלא (YARL) + header bar + close btn
    ├── FilterPanel.tsx     # פאנל סינון
    └── InfoPanel.tsx       # פאנל פרטי צילום (EXIF + מפה)

lib/
├── drive.ts                # Google Drive API + getMockMedia()
├── kv.ts                   # Vercel KV CRUD לאלבומים
└── utils.ts                # sortMedia, formatters

types/index.ts              # Layout, SortOption, GroupMode, MediaItem, Album…
```

## קישורים

- **Production:** https://photo-album-beryl.vercel.app
- **Vercel dashboard:** https://vercel.com/dorons-projects-6007b220/photo-album
