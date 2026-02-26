# Premium Dashboard & Industrial UI Design Guide 2025-2026
**Research Date:** February 15, 2026
**Brand Colors:** Primary Blue #005B97, Light Blue #6497B0, Navy #193D6B, Dark Navy #152148

---

## 1. Dashboard Card Designs

### Card Container Styling
```css
/* Premium Card - Light Mode */
.premium-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px; /* rounded-xl */
  padding: 24px; /* p-6 */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg */
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.premium-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 8px 10px -6px rgba(0, 0, 0, 0.1); /* shadow-xl */
}
```

**Tailwind Classes:**
```html
<div class="bg-white/95 rounded-xl p-6 shadow-lg border border-black/5
            transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
```

### Glass Effect Cards (Subtle, Light Mode)
```css
.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16px; /* rounded-2xl */
  padding: 32px; /* p-8 */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

**Tailwind Classes:**
```html
<div class="bg-white/15 backdrop-blur-md rounded-2xl p-8
            shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/30">
```

### Subtle Gradient Cards
```css
.gradient-card {
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  /* Or with brand colors: */
  background: linear-gradient(135deg, #ffffff 0%, rgba(100, 151, 176, 0.05) 100%);
}
```

**Tailwind Classes:**
```html
<!-- Neutral gradient -->
<div class="bg-gradient-to-br from-white to-gray-50">

<!-- Brand color gradient (very subtle) -->
<div class="bg-gradient-to-br from-white to-[#6497B0]/5">
```

### KPI Metric Card Structure
```html
<div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100
            hover:-translate-y-1 hover:shadow-xl transition-all duration-300">

  <!-- Card Header -->
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-sm font-semibold text-gray-600 uppercase tracking-wide">
      Total Orders
    </h3>
    <svg class="w-5 h-5 text-gray-400"><!-- Icon --></svg>
  </div>

  <!-- Main Metric -->
  <div class="mb-2">
    <span class="text-4xl font-bold text-gray-900">1,247</span>
  </div>

  <!-- Change Indicator -->
  <div class="flex items-center text-sm">
    <span class="text-green-600 font-semibold">+12.5%</span>
    <span class="text-gray-500 ml-2">vs last week</span>
  </div>
</div>
```

### Progress Indicators

**Linear Progress Bar:**
```html
<div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
  <div class="bg-gradient-to-r from-[#005B97] to-[#6497B0] h-full rounded-full
              transition-all duration-500 ease-out"
       style="width: 65%">
  </div>
</div>
```

**Circular Progress (Dashboard Style):**
```html
<!-- Use libraries like react-circular-progressbar with these values -->
<CircularProgressbar
  value={75}
  strokeWidth={8}
  styles={{
    path: { stroke: '#005B97', strokeLinecap: 'round' },
    trail: { stroke: '#E5E7EB' },
    text: { fill: '#111827', fontSize: '24px', fontWeight: 600 }
  }}
/>
```

---

## 2. Data Table/Grid Designs

### Table Container
```css
.premium-table-container {
  background: white;
  border-radius: 12px; /* rounded-xl */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg */
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
}
```

**Tailwind:**
```html
<div class="bg-white rounded-xl shadow-lg border border-black/5 overflow-hidden">
```

### Column Headers (Sticky + Sortable)
```css
.table-header {
  position: sticky;
  top: 0;
  background: #F9FAFB; /* gray-50 */
  z-index: 10;
  border-bottom: 2px solid #E5E7EB; /* gray-200 */
}

.table-header th {
  padding: 16px 24px; /* py-4 px-6 */
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em; /* tracking-wider */
  color: #6B7280; /* gray-500 */
}

.table-header th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.table-header th.sortable:hover {
  background-color: #F3F4F6; /* gray-100 */
}
```

**Tailwind:**
```html
<thead class="sticky top-0 bg-gray-50 z-10 border-b-2 border-gray-200">
  <tr>
    <th class="py-4 px-6 text-left text-xs font-semibold uppercase tracking-wider
               text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors">
      Order ID
      <svg class="inline w-4 h-4 ml-1"><!-- Sort icon --></svg>
    </th>
  </tr>
</thead>
```

### Alternating Row Colors
```html
<tbody>
  <tr class="odd:bg-white even:bg-gray-50 border-b border-gray-100
             hover:bg-blue-50/50 transition-colors duration-150 cursor-pointer">
    <td class="py-4 px-6">...</td>
  </tr>
</tbody>
```

**Advanced Hover Effect:**
```css
tbody tr:hover {
  background-color: rgba(100, 151, 176, 0.08); /* Light Blue #6497B0 at 8% opacity */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transform: scaleX(1.002);
  transition: all 0.15s ease;
}
```

**Tailwind:**
```html
<tr class="hover:bg-[#6497B0]/8 hover:shadow-sm transition-all duration-150">
```

### Touch-Friendly Row Actions
```html
<td class="py-4 px-6">
  <div class="flex items-center gap-3">
    <!-- Touch target minimum 44px height -->
    <button class="min-h-[44px] min-w-[44px] flex items-center justify-center
                   rounded-lg bg-gray-100 hover:bg-gray-200
                   active:scale-95 transition-all">
      <svg class="w-5 h-5"><!-- Icon --></svg>
    </button>
  </div>
</td>
```

### Empty State Design
```html
<div class="flex flex-col items-center justify-center py-16 px-4">
  <svg class="w-24 h-24 text-gray-300 mb-4"><!-- Empty icon --></svg>
  <h3 class="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
  <p class="text-sm text-gray-500 text-center mb-6 max-w-sm">
    There are no orders matching your filters. Try adjusting your search criteria.
  </p>
  <button class="px-6 py-3 bg-[#005B97] text-white rounded-lg
                 hover:bg-[#004577] active:scale-95 transition-all">
    Clear Filters
  </button>
</div>
```

---

## 3. Header/Navigation Bars

### Premium Header Structure
```css
.premium-header {
  height: 72px;
  background: white;
  border-bottom: 1px solid #E5E7EB; /* gray-200 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 50;
}
```

**Tailwind:**
```html
<header class="h-18 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
  <div class="h-full px-6 flex items-center justify-between">

    <!-- Left: Logo + Breadcrumbs -->
    <div class="flex items-center gap-6">
      <!-- Logo -->
      <div class="flex items-center">
        <img src="/logo.svg" alt="Logo" class="h-10" />
      </div>

      <!-- Breadcrumbs -->
      <nav class="flex items-center gap-2 text-sm">
        <a href="/" class="text-gray-500 hover:text-gray-900 transition-colors">
          Dashboard
        </a>
        <svg class="w-4 h-4 text-gray-400"><!-- Chevron --></svg>
        <span class="font-semibold text-gray-900">Orders</span>
      </nav>
    </div>

    <!-- Right: Clock + Status + User -->
    <div class="flex items-center gap-6">
      <!-- Clock Display -->
      <div class="flex items-center gap-2 text-sm">
        <svg class="w-5 h-5 text-gray-400"><!-- Clock icon --></svg>
        <span class="font-medium text-gray-700">2:45 PM EST</span>
      </div>

      <!-- Status Indicator -->
      <div class="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span class="text-sm font-medium text-green-700">All Systems Operational</span>
      </div>

      <!-- User Menu -->
      <button class="flex items-center gap-3 pl-3 pr-4 py-2 rounded-lg
                     hover:bg-gray-50 transition-colors">
        <div class="w-9 h-9 rounded-full bg-[#005B97] flex items-center justify-center">
          <span class="text-sm font-semibold text-white">SF</span>
        </div>
        <svg class="w-4 h-4 text-gray-400"><!-- Chevron down --></svg>
      </button>
    </div>
  </div>
</header>
```

### Breadcrumb Styling
```css
.breadcrumb-item {
  font-size: 14px;
  color: #6B7280; /* gray-500 */
  transition: color 0.2s;
}

.breadcrumb-item:hover {
  color: #111827; /* gray-900 */
}

.breadcrumb-item.active {
  color: #111827; /* gray-900 */
  font-weight: 600;
}

.breadcrumb-separator {
  color: #D1D5DB; /* gray-300 */
  margin: 0 8px;
}
```

---

## 4. Status Indicators and Badges

### Status Badge Component
```html
<!-- Success/Done -->
<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
             bg-green-50 text-green-700 text-sm font-medium border border-green-200">
  <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
  Done
</span>

<!-- Warning/Hold -->
<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
             bg-yellow-50 text-yellow-700 text-sm font-medium border border-yellow-200">
  <div class="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
  Hold
</span>

<!-- Error/Missing -->
<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
             bg-red-50 text-red-700 text-sm font-medium border border-red-200">
  <div class="w-1.5 h-1.5 rounded-full bg-red-500"></div>
  Missing
</span>

<!-- Info/Rush -->
<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
             bg-blue-50 text-blue-700 text-sm font-medium border border-blue-200">
  <div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
  Rush
</span>
```

### Status Badge Exact Values
```css
/* Success Badge */
.badge-success {
  background: #ECFDF5; /* green-50 */
  color: #047857; /* green-700 */
  border: 1px solid #A7F3D0; /* green-200 */
  border-radius: 9999px; /* rounded-full */
  padding: 4px 12px; /* px-3 py-1 */
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

/* Warning Badge */
.badge-warning {
  background: #FFFBEB; /* yellow-50 */
  color: #B45309; /* yellow-700 */
  border: 1px solid #FDE68A; /* yellow-200 */
}

/* Error Badge */
.badge-error {
  background: #FEF2F2; /* red-50 */
  color: #B91C1C; /* red-700 */
  border: 1px solid #FECACA; /* red-200 */
}

/* Info Badge */
.badge-info {
  background: #EFF6FF; /* blue-50 */
  color: #1D4ED8; /* blue-700 */
  border: 1px solid #BFDBFE; /* blue-200 */
}
```

### Status Color System
```javascript
const statusColors = {
  done: {
    bg: '#ECFDF5',      // green-50
    text: '#047857',    // green-700
    border: '#A7F3D0',  // green-200
    dot: '#10B981'      // green-500
  },
  hold: {
    bg: '#FFFBEB',      // yellow-50
    text: '#B45309',    // yellow-700
    border: '#FDE68A',  // yellow-200
    dot: '#F59E0B'      // yellow-500
  },
  missing: {
    bg: '#FEF2F2',      // red-50
    text: '#B91C1C',    // red-700
    border: '#FECACA',  // red-200
    dot: '#EF4444'      // red-500
  },
  rush: {
    bg: '#EFF6FF',      // blue-50
    text: '#1D4ED8',    // blue-700
    border: '#BFDBFE',  // blue-200
    dot: '#3B82F6'      // blue-500
  }
};
```

### Toggle Switch (Status Changer)
```html
<button role="switch"
        class="relative inline-flex h-6 w-11 items-center rounded-full
               transition-colors focus:outline-none focus:ring-2
               focus:ring-[#005B97] focus:ring-offset-2
               bg-gray-200 data-[state=checked]:bg-[#005B97]">
  <span class="inline-block h-4 w-4 transform rounded-full bg-white
               transition-transform translate-x-1
               data-[state=checked]:translate-x-6 shadow-sm">
  </span>
</button>
```

---

## 5. Typography and Spacing

### Font Family
**Primary:** Inter or Roboto (system fonts for dashboard legibility)

```css
:root {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
               'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
}
```

**Tailwind Config:**
```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

### Type Scale
```css
/* Page Title */
.text-page-title {
  font-size: 28px;      /* text-3xl */
  font-weight: 700;     /* font-bold */
  line-height: 1.2;
  letter-spacing: -0.02em; /* tracking-tight */
  color: #111827;       /* gray-900 */
}

/* Section Title */
.text-section-title {
  font-size: 20px;      /* text-xl */
  font-weight: 600;     /* font-semibold */
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: #1F2937;       /* gray-800 */
}

/* Card Title */
.text-card-title {
  font-size: 16px;      /* text-base */
  font-weight: 600;     /* font-semibold */
  line-height: 1.4;
  letter-spacing: 0;
  color: #374151;       /* gray-700 */
}

/* Metric/KPI Value */
.text-metric {
  font-size: 36px;      /* text-4xl */
  font-weight: 700;     /* font-bold */
  line-height: 1;
  letter-spacing: -0.02em;
  color: #111827;       /* gray-900 */
}

/* Body Text */
.text-body {
  font-size: 14px;      /* text-sm */
  font-weight: 400;     /* font-normal */
  line-height: 1.5;
  letter-spacing: 0;
  color: #6B7280;       /* gray-500 */
}

/* Label/Caption */
.text-label {
  font-size: 12px;      /* text-xs */
  font-weight: 600;     /* font-semibold */
  line-height: 1.4;
  letter-spacing: 0.05em; /* tracking-wider */
  text-transform: uppercase;
  color: #6B7280;       /* gray-500 */
}

/* Table Text */
.text-table {
  font-size: 14px;      /* text-sm */
  font-weight: 500;     /* font-medium */
  line-height: 1.5;
  color: #374151;       /* gray-700 */
}
```

### Spacing Scale (Tailwind Default)
```javascript
spacing: {
  '0': '0px',
  '1': '4px',      // 0.25rem
  '2': '8px',      // 0.5rem
  '3': '12px',     // 0.75rem
  '4': '16px',     // 1rem
  '5': '20px',     // 1.25rem
  '6': '24px',     // 1.5rem
  '8': '32px',     // 2rem
  '10': '40px',    // 2.5rem
  '12': '48px',    // 3rem
  '16': '64px',    // 4rem
  '20': '80px',    // 5rem
  '24': '96px',    // 6rem
}
```

**Dashboard Component Spacing Recommendations:**
- Card padding: `p-6` (24px)
- Card gap in grid: `gap-6` (24px)
- Section spacing: `mb-8` or `mb-12` (32-48px)
- Table cell padding: `py-4 px-6` (16px vertical, 24px horizontal)
- Button padding: `px-6 py-3` (24px horizontal, 12px vertical)
- Form input padding: `px-4 py-3` (16px horizontal, 12px vertical)

---

## 6. Color Palettes

### Brand Colors (Provided)
```css
:root {
  --primary-blue: #005B97;
  --light-blue: #6497B0;
  --navy: #193D6B;
  --dark-navy: #152148;
}
```

### Extended Light Mode Dashboard Palette
```javascript
const dashboardColors = {
  // Brand Colors
  primary: {
    DEFAULT: '#005B97',  // Primary Blue
    light: '#6497B0',    // Light Blue
    dark: '#004577',     // Darker shade for hover
  },

  navy: {
    DEFAULT: '#193D6B',  // Navy
    dark: '#152148',     // Dark Navy
  },

  // Neutral Grays (Tailwind default - perfect for enterprise)
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Status Colors
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',
    700: '#047857',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    700: '#B45309',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    700: '#B91C1C',
  },

  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    700: '#1D4ED8',
  },

  // Accent Colors (complement brand blues)
  accent: {
    orange: '#F97316',   // For urgent/rush items
    teal: '#14B8A6',     // For positive metrics
    purple: '#A855F7',   // For special categories
    amber: '#F59E0B',    // For warnings/holds
  },
};
```

### Complementary Accent Usage Patterns

**With Primary Blue (#005B97):**
- **Teal (#14B8A6):** Use for positive growth indicators, completion rates
- **Orange (#F97316):** Use for urgent actions, rush orders, high priority
- **Amber (#F59E0B):** Use for warnings, pending states, holds
- **Purple (#A855F7):** Use for premium features, special designations

**Color Combinations:**
```css
/* Primary action button */
background: #005B97;
hover: #004577;

/* Secondary button with accent */
background: white;
border: 2px solid #6497B0;
color: #193D6B;

/* Urgent/Rush card accent */
border-left: 4px solid #F97316;

/* Success metric accent */
background: linear-gradient(135deg, #005B97 0%, #14B8A6 100%);
```

### Background Patterns for Premium Look
```css
/* Subtle pattern on dashboard background */
.dashboard-bg {
  background-color: #F9FAFB;
  background-image:
    radial-gradient(circle at 1px 1px, rgba(0, 91, 151, 0.03) 1px, transparent 0);
  background-size: 24px 24px;
}

/* Card with subtle gradient background */
.premium-card-bg {
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 1) 0%,
    rgba(100, 151, 176, 0.02) 100%
  );
}
```

---

## 7. Micro-Animations

### Card Hover Animation
```css
.card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 8px 10px -6px rgba(0, 0, 0, 0.1);
}
```

**Tailwind:**
```html
<div class="transition-all duration-300 ease-out
            hover:-translate-y-1 hover:shadow-xl">
```

### Button Press Effect
```css
.button {
  transition: all 0.15s ease;
}

.button:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.button:active {
  transform: scale(0.98);
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}
```

**Tailwind:**
```html
<button class="transition-all duration-150
               hover:scale-102 hover:shadow-md
               active:scale-95 active:shadow-sm">
```

### Status Badge Transition
```css
.status-badge {
  transition: all 0.2s ease;
}

.status-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

### Data Loading Skeleton
```html
<div class="animate-pulse space-y-4">
  <div class="h-4 bg-gray-200 rounded w-3/4"></div>
  <div class="h-4 bg-gray-200 rounded w-1/2"></div>
  <div class="h-8 bg-gray-200 rounded"></div>
</div>
```

**Custom Loading Animation:**
```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.loading-skeleton {
  background: linear-gradient(
    90deg,
    #F3F4F6 0%,
    #E5E7EB 50%,
    #F3F4F6 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
```

### Status Change Animation
```css
@keyframes statusChange {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.status-badge.changing {
  animation: statusChange 0.4s ease;
}
```

### Table Row Hover
```css
tbody tr {
  transition: all 0.15s ease;
}

tbody tr:hover {
  background-color: rgba(100, 151, 176, 0.08);
  transform: scaleX(1.002);
}
```

**Tailwind:**
```html
<tr class="transition-all duration-150 hover:bg-[#6497B0]/8 hover:scale-x-[1.002]">
```

### Smooth Number Counter (for KPIs)
```javascript
// React example for animated number counter
const AnimatedNumber = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        setCount(Math.floor(value * progress));
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
};
```

### Focus Ring (Accessibility)
```css
.focus-ring {
  transition: box-shadow 0.2s;
}

.focus-ring:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 91, 151, 0.3);
}
```

**Tailwind:**
```html
<button class="focus:outline-none focus:ring-4 focus:ring-[#005B97]/30">
```

---

## 8. Premium Shadow System

### Complete Shadow Scale
```javascript
boxShadow: {
  'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Custom premium shadows
  'premium-card': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  'premium-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
  'inner-subtle': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
}
```

---

## 9. Border Radius System

### Complete Border Radius Scale
```javascript
borderRadius: {
  'none': '0px',
  'sm': '2px',      // Subtle rounding for inputs
  'DEFAULT': '4px', // Standard elements
  'md': '6px',      // Small cards, buttons
  'lg': '8px',      // Medium cards
  'xl': '12px',     // Large cards, modals
  '2xl': '16px',    // Extra large containers
  '3xl': '24px',    // Massive containers
  'full': '9999px', // Pills, badges, avatars
}
```

**Usage Recommendations:**
- **Badges/Pills:** `rounded-full` (9999px)
- **Buttons:** `rounded-lg` (8px)
- **Cards:** `rounded-xl` (12px)
- **Modals:** `rounded-2xl` (16px)
- **Inputs:** `rounded-md` (6px)
- **Tables:** `rounded-xl` (12px) on container, no rounding on cells
- **Avatar/Status Dots:** `rounded-full`

---

## 10. Real-World Component Examples

### Premium KPI Dashboard Grid
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

  <!-- KPI Card 1 -->
  <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100
              hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Total Orders
      </h3>
      <svg class="w-5 h-5 text-gray-400"><!-- Icon --></svg>
    </div>
    <div class="mb-2">
      <span class="text-4xl font-bold text-gray-900">1,247</span>
    </div>
    <div class="flex items-center text-sm">
      <span class="text-green-600 font-semibold">+12.5%</span>
      <span class="text-gray-500 ml-2">vs last week</span>
    </div>
  </div>

  <!-- Repeat for other KPIs -->
</div>
```

### Manufacturing Data Table
```html
<div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
  <!-- Table Header with Filters -->
  <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">Production Orders</h2>
      <div class="flex items-center gap-3">
        <input type="search" placeholder="Search orders..."
               class="px-4 py-2 border border-gray-300 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-[#005B97]/30">
        <button class="px-4 py-2 bg-[#005B97] text-white rounded-lg
                       hover:bg-[#004577] active:scale-95 transition-all">
          Export
        </button>
      </div>
    </div>
  </div>

  <!-- Table -->
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="sticky top-0 bg-gray-50 z-10 border-b-2 border-gray-200">
        <tr>
          <th class="py-4 px-6 text-left text-xs font-semibold uppercase
                     tracking-wider text-gray-500">
            Order ID
          </th>
          <th class="py-4 px-6 text-left text-xs font-semibold uppercase
                     tracking-wider text-gray-500">
            Customer
          </th>
          <th class="py-4 px-6 text-left text-xs font-semibold uppercase
                     tracking-wider text-gray-500">
            Status
          </th>
          <th class="py-4 px-6 text-left text-xs font-semibold uppercase
                     tracking-wider text-gray-500">
            Due Date
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="odd:bg-white even:bg-gray-50 border-b border-gray-100
                   hover:bg-[#6497B0]/8 transition-all duration-150 cursor-pointer">
          <td class="py-4 px-6 text-sm font-medium text-gray-900">#ORD-1247</td>
          <td class="py-4 px-6 text-sm text-gray-700">Acme Corp</td>
          <td class="py-4 px-6">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                         bg-green-50 text-green-700 text-sm font-medium
                         border border-green-200">
              <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              Done
            </span>
          </td>
          <td class="py-4 px-6 text-sm text-gray-700">Feb 20, 2026</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## Summary: What Makes It Look Like $200k-$300k

1. **Consistent spacing using 4/8/12/24px scale** - Never arbitrary spacing
2. **Subtle shadows (shadow-lg/xl)** - Not too heavy, layered properly
3. **Micro-interactions on everything** - Hover states, active states, smooth transitions
4. **Professional typography** - Inter/Roboto at 14-16px body, proper letter-spacing
5. **Muted color palette** - Gray 50-900 scale with brand blue accents
6. **Proper status system** - Color-coded with background, border, and dot
7. **Glass effects done subtly** - 15px blur, 15-30% opacity, white tint
8. **Touch-friendly hit targets** - Minimum 44px for tablet
9. **Sticky headers** - Keep context visible
10. **Empty states** - Never show blank screens
11. **Loading states** - Skeleton screens, not spinners
12. **Rounded corners at 8-12px** - Modern but not playful
13. **One pixel borders** - Very subtle, black/5 opacity
14. **Proper breadcrumbs** - Always show navigation path
15. **Consistent component sizing** - Cards same height, tables aligned perfectly

---

## Research Sources

- [Dribbble KPI Dashboard Designs](https://dribbble.com/tags/kpi-dashboard)
- [Behance Industrial Dashboard Projects](https://www.behance.net/search/projects/industrial%20dashboard)
- [Top Dashboard Design Trends for 2025 | Fuselab Creative](https://fuselabcreative.com/top-dashboard-design-trends-2025/)
- [Enterprise Data Table UX Patterns | Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables)
- [Glassmorphism UI Features & Best Practices](https://uxpilot.ai/blogs/glassmorphism-ui)
- [Status Indicator Patterns | Carbon Design System](https://carbondesignsystem.com/patterns/status-indicator-pattern/)
- [Tailwind CSS Box Shadow Documentation](https://tailwindcss.com/docs/box-shadow)
- [Tailwind CSS Border Radius Documentation](https://tailwindcss.com/docs/border-radius)
- [Best Fonts for Web Design in 2025 | Shakuro](https://shakuro.com/blog/best-fonts-for-web-design)
- [CSS Hover Effects: 40+ Examples & Tutorials (2025)](https://cssauthor.com/css-hover-effects/)
- [Empty State UX Examples & Best Practices | Pencil & Paper](https://www.pencilandpaper.io/articles/empty-states)
