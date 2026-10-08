# UI/UX Modernization and Craft Standards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform PASARIA Marketplace into a production-grade, accessible (WCAG 2.2 AA), responsive e-commerce experience with 105 discrete UI/UX, design token, and performance fixes.

**Architecture:** Implement CSS design tokens and a non-blocking toast system with undo capability, enforce visible 2px focus-visible rings and concentric radii ($R_{inner} = \max(0, R_{outer} - (p + b))$), convert forms into linear single-column semantic layouts, render a mobile navigation drawer, and optimize React 19 rendering and network parallelism.

**Tech Stack:** React 19, Tailwind CSS v4, Lucide React, Motion 12, Vite 8, TypeScript.

---

### Task 1. Design Tokens and Global Focus Rings

**Files**
- Modify `src/index.css`

- [ ] **Step 1. Define theme tokens and global focus rings in `src/index.css`**

Add `@theme` variables for brand colors and define utility classes for `:focus-visible` rings with at least 3:1 contrast and 2px offset.

```css
@import "tailwindcss";

@theme {
  --color-brand-primary: #003d29;
  --color-brand-hover: #064e3b;
  --color-brand-surface: #f8faf9;
  --color-brand-text: #1c2a23;
  --color-brand-muted: #526058;
}

@layer base {
  body {
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    color: var(--color-brand-text);
    background-color: #fcfcfc;
  }

  /* Universal high-contrast focus ring for keyboard navigation */
  :focus-visible {
    outline: 2px solid #003d29 !important;
    outline-offset: 2px !important;
  }
}

/* Custom scrollbar for clean minimal look */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
::-webkit-scrollbar-thumb {
  background: #c7d2ce;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #003d29;
}
```

- [ ] **Step 2. Verify styles and typechecking**

Run `bun run lint && bun run build`
Expected status: PASS (0 errors)

- [ ] **Step 3. Commit**

```bash
git add src/index.css
git commit -m "style: define theme tokens and global focus-visible rings"
```

---

### Task 2. Global Toast and Undo Notification System

**Files**
- Create `src/types/toast.ts`
- Create `src/context/ToastContext.tsx`
- Create `src/components/ToastContainer.tsx`
- Modify `src/App.tsx` (wrap in `ToastProvider`)

- [ ] **Step 1. Create Toast types**

Create `src/types/toast.ts`:

```typescript
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}
```

- [ ] **Step 2. Create Toast Context and Container**

Create `src/context/ToastContext.tsx`:

```tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastItem, ToastType } from '../types/toast';
import { ToastContainer } from '../components/ToastContainer';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, options?: { action?: { label: string; onClick: () => void }; duration?: number }) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', options?: { action?: { label: string; onClick: () => void }; duration?: number }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const duration = options?.duration ?? 4500;

      const newToast: ToastItem = {
        id,
        type,
        message,
        action: options?.action,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};
```

Create `src/components/ToastContainer.tsx`:

```tsx
import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastItem } from '../types/toast';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Pemberitahuan sistem"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const iconMap = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
          info: <Info className="w-4 h-4 text-blue-600 shrink-0" />,
        };

        return (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-lg text-slate-800 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {iconMap[toast.type]}
              <span className="font-medium text-slate-800 leading-snug truncate">{toast.message}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    onDismiss(toast.id);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#003d29] text-white text-[11px] font-bold hover:bg-[#064e3b] transition-colors cursor-pointer"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Tutup notifikasi"
                className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </aside>
  );
};
```

- [ ] **Step 3. Mount `ToastProvider` in `src/App.tsx`**

Wrap App content with `<ToastProvider>` in `src/App.tsx`.

- [ ] **Step 4. Verify compilation**

Run `bun run lint && bun run build`
Expected status: PASS (0 errors)

- [ ] **Step 5. Commit**

```bash
git add src/types/toast.ts src/context/ToastContext.tsx src/components/ToastContainer.tsx src/App.tsx
git commit -m "feat: add global toast and undo notification provider"
```

---

### Task 3. Eradicate Native `alert()` and `confirm()` Dialogs

**Files**
- Modify `src/components/OrdersView.tsx` (replace `window.confirm` and `window.alert` with undo/custom prompt)
- Modify `src/components/ProductDetailPage.tsx` (replace link copied & Q&A alerts with toasts)
- Modify `src/components/DeliveryView.tsx` (replace tracking simulation alert with toast)
- Modify `src/components/ShopProfileView.tsx` (replace copy link alert with toast)
- Modify `src/components/ProfileView.tsx` (replace address alerts with toasts and undo deletion)
- Modify `src/components/AdminDashboardView.tsx` (replace admin action alerts with toasts)
- Modify `src/components/ShopDashboardView.tsx` (replace seller center alerts with toasts)

- [ ] **Step 1. Update `OrdersView.tsx`**

Replace `confirm()` and `alert()` with a confirmation state or direct action paired with Toast feedback.

- [ ] **Step 2. Update `ProductDetailPage.tsx` & `ShopProfileView.tsx`**

Replace `alert('Tautan produk berhasil disalin!')` and `alert('Tautan toko berhasil disalin!')` with `showToast('Tautan berhasil disalin ke papan klip', 'success')`.
Replace Q&A error alert with `showToast(err.message || 'Gagal mengirim pertanyaan.', 'error')`.

- [ ] **Step 3. Update `ProfileView.tsx`**

Add undo toast on address deletion: keep deleted address in memory for 6 seconds; if undo clicked, re-insert address.

- [ ] **Step 4. Update `AdminDashboardView.tsx` & `ShopDashboardView.tsx`**

Replace all 10 `alert()` calls with `showToast(msg, 'success' | 'error')`.

- [ ] **Step 5. Verify zero native alerts remain in `src/`**

Run `git grep "alert(" src/` and `git grep "confirm(" src/`
Expected output: No matches found in interactive user components.
Run `bun run lint && bun run build`
Expected status: PASS (0 errors)

- [ ] **Step 6. Commit**

```bash
git commit -am "refactor: eliminate native alert and confirm dialogs across all views"
```

---

### Task 4. Product Card, PDP Geometry & Fitts's Law Target Sizing

**Files**
- Modify `src/components/ProductCard.tsx`
- Modify `src/components/ProductDetailPage.tsx`
- Modify `src/components/ProductVisual.tsx`

- [ ] **Step 1. Modernize `ProductCard.tsx`**

- Convert container from `div` to semantic `<article tabIndex={0}>` with keyboard `onKeyDown` (Enter/Space to trigger `onSelect`).
- Calculate concentric radii: container `rounded-2xl` (16px), padding 16px ($p=16$), child visual stage `rounded-lg` (8px). $16 - 16 = 0 \to 8\text{px}$ inner radius.
- Expand wishlist button touch target to 48x48px with `w-12 h-12 flex items-center justify-center` and an inner 32px pill, maintaining Fitts's law compliance.
- Wrap `ProductCard` with `React.memo` to eliminate unnecessary re-renders.
- Ensure all prices utilize `tabular-nums`.

- [ ] **Step 2. Modernize `ProductDetailPage.tsx`**

- Remove fabricated metric (`review_count * 2 + 15`).
- Ensure variant pills and quantity controls have a minimum touch target of 44x44px to 48x48px.
- Implement parallel fetching for reviews and Q&A using `Promise.allSettled`.
- Add sticky purchase action bar on mobile (`sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-slate-200 z-30`).

- [ ] **Step 3. Memoize `ProductVisual.tsx`**

Wrap `ProductVisual` export in `React.memo` to cache SVG vector computations.

- [ ] **Step 4. Verify compilation**

Run `bun run lint && bun run build`
Expected status: PASS (0 errors)

- [ ] **Step 5. Commit**

```bash
git commit -am "feat: improve product card semantics, concentric radii, touch ergonomics and PDP layout"
```

---

### Task 5. Single-Column Semantic Forms and Checkout Flow

**Files**
- Modify `src/components/CheckoutModal.tsx`
- Modify `src/components/AuthModal.tsx`
- Modify `src/components/SettingsView.tsx`

- [ ] **Step 1. Modernize `CheckoutModal.tsx`**

- Convert address fields into a clean, single-column vertical layout.
- Bind all `<label htmlFor="...">` to matching input `id` attributes.
- Convert Courier options and Payment methods into accessible `<fieldset>` with `<input type="radio">` and keyboard arrow-key navigation.
- Implement onBlur field validation with error messages directly under invalid inputs.
- Add focus trap and Escape key listener.

- [ ] **Step 2. Modernize `AuthModal.tsx`**

- Connect all labels to input IDs.
- Add toggle for password visibility with `aria-label`.
- Include focus trap and Escape key handler.
- Remove `focus:outline-none` and apply `:focus-visible` styles.

- [ ] **Step 3. Modernize `SettingsView.tsx`**

- Clean up user-facing copy (remove "di database").
- Ensure all inputs have associated labels and live password strength indicator.

- [ ] **Step 4. Verify compilation**

Run `bun run lint && bun run build`
Expected status: PASS (0 errors)

- [ ] **Step 5. Commit**

```bash
git commit -am "feat: convert forms to single-column layouts with accessible labels and inline validation"
```

---

### Task 6. Mobile Navigation Drawer and Viewport Resilience

**Files**
- Modify `src/components/Navbar.tsx`
- Modify `src/components/ProductFilterBar.tsx`
- Modify `src/components/HeroBanner.tsx`
- Modify `src/App.tsx`

- [ ] **Step 1. Implement Mobile Drawer in `Navbar.tsx`**

- Render full slide-over mobile drawer when `mobileMenuOpen` is true.
- Include quick links: Kategori, Pesanan Saya, Wishlist, Toko yang Diikuti, Seller Center, Pengaturan, and Logout.
- Add backdrop click dismissal, focus trap, and Escape key listener.
- Expand touch targets of all navigation icons to 48x48px.

- [ ] **Step 2. Modernize `ProductFilterBar.tsx`**

- Localize all filter labels to Indonesian ("Kategori Produk", "Rentang Harga", "Rating Ulasan").
- Change price filter brackets to realistic Rupiah tiers.
- Enable smooth horizontal scrolling on mobile viewports.

- [ ] **Step 3. Modernize `HeroBanner.tsx`**

- Replace unicode emoji `✨` with Lucide `Sparkles` icon.
- Replace em dash with standard punctuation.
- Add `fetchPriority="high"` on hero image.

- [ ] **Step 4. Update `App.tsx` Viewport**

- Replace `min-h-screen` with `min-h-[100dvh]`.
- Use `useTransition` when switching views or filtering catalog.

- [ ] **Step 5. Verify compilation**

Run `bun run lint && bun run build`
Expected status: PASS (0 errors)

- [ ] **Step 6. Commit**

```bash
git commit -am "feat: implement mobile drawer navigation, localize filter bar, and enforce dynamic viewport height"
```

---

### Task 7. Network Parallelism, Admin Dashboard & Verification

**Files**
- Modify `src/components/ShopDashboardView.tsx`
- Modify `src/components/AdminDashboardView.tsx`
- Modify `src/components/CartPage.tsx`

- [ ] **Step 1. Optimize `ShopDashboardView.tsx`**

- Refactor `loadSellerData` to run `Promise.allSettled` instead of sequential waterfall awaits.
- Apply `tabular-nums` across financial and inventory figures.

- [ ] **Step 2. Bind Live State in `AdminDashboardView.tsx`**

- Ensure admin seller verification and review moderation tie to reactive state arrays.
- Eliminate hardcoded item IDs.

- [ ] **Step 3. Optimize `CartPage.tsx`**

- Implement Undo Toast upon item deletion.
- Enforce 48x48px touch targets on quantity stepper buttons.
- Add mobile sticky checkout summary button.

- [ ] **Step 4. Full Quality Verification**

Run:
1. `bun run lint`
2. `bun run build`
3. `./vendor/bin/phpunit`

- [ ] **Step 5. Final Commit**

```bash
git commit -am "perf: parallelize seller dashboard data loading and polish admin state bindings"
```
