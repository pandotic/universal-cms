---
name: ui-kit
version: "1.0.0"
description: "Use this skill when building UI — any time the user asks to create a page, panel, modal, form, settings screen, admin interface, dashboard, or any React/Tailwind interface. This skill provides a component library with consistent design patterns. Trigger on: 'build a page', 'create a modal', 'settings panel', 'admin', 'dashboard', 'UI', 'component', 'layout', or when the user references any of the components by name (Modal, Card, SearchInput, Tabs, CopyBlock, Badge)."
---

# UI Kit — Component Library

A set of reusable React + Tailwind components for building consistent interfaces. When building any UI, prefer these components over writing raw HTML/JSX from scratch.

## Available Components

### Modal

Full-screen overlay with header, scrollable body, and optional footer.

```jsx
import Modal from './components/modal/Modal';

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Settings"
  subtitle="Configure your preferences"
  size="lg"       // 'sm' | 'md' | 'lg'
  footer={
    <>
      <button className="btn-secondary" onClick={onCancel}>Cancel</button>
      <button className="btn-primary" onClick={onSave}>Save</button>
    </>
  }
>
  {/* Scrollable content here */}
</Modal>
```

### Card

Content card with icon, title, badge, description, and tags. Good for grid layouts.

```jsx
import Card from './components/card/Card';

<Card
  title="Word Documents"
  description="Create and edit .docx files"
  icon={<div className="p-2.5 rounded-xl bg-blue-50 text-blue-500">{icon}</div>}
  badge="Documents"
  badgeColor={{ bg: 'bg-blue-50', text: 'text-blue-700' }}
  tags={['.docx', 'report', 'memo']}
  selected={isSelected}
  onClick={() => handleClick()}
/>
```

### SearchInput

Input with icon prefix, focus ring, and rounded style.

```jsx
import SearchInput from './components/search-input/SearchInput';

<SearchInput
  value={query}
  onChange={setQuery}
  placeholder="Search by name, keyword..."
/>
```

### Tabs

Underline-style tab navigation.

```jsx
import Tabs from './components/tabs/Tabs';

<Tabs
  tabs={[
    { key: 'general', label: 'General' },
    { key: 'advanced', label: 'Advanced' },
    { key: 'danger', label: 'Danger Zone' },
  ]}
  activeTab={currentTab}
  onChange={setCurrentTab}
/>
```

### CopyBlock

Code/text display with copy-to-clipboard button. Shows a check icon for 2 seconds after copying.

```jsx
import CopyBlock from './components/copy-block/CopyBlock';

<CopyBlock
  text="npm install pando-skillo"
  label="Install command:"
/>
```

### Badge

Inline pill for status, category, or version labels.

```jsx
import Badge from './components/badge/Badge';

<Badge variant="blue">Documents</Badge>
<Badge variant="purple" mono>v1.0.0</Badge>
<Badge variant="green">Active</Badge>
<Badge variant="red" size="md">Danger</Badge>
```

Variants: `default`, `blue`, `purple`, `amber`, `green`, `red`

---

## Design System Rules

When building UI with these components, follow these conventions:

### Colors
- **Brand/accent**: Purple (`purple-500` through `purple-700`)
- **Surface/neutral**: Gray scale (`gray-50` through `gray-900`)
- **Category colors**: Blue (documents), Purple (AI/automation), Amber (dev tools), Green (success), Red (danger)

### Typography
- **Font**: Inter (400, 500, 600, 700)
- **Headings**: `font-semibold` or `font-bold`, `text-gray-900`
- **Body**: `text-sm`, `text-gray-600` or `text-gray-700`
- **Labels/captions**: `text-xs`, `text-gray-500`
- **Code**: `font-mono`, `text-xs`

### Spacing
- **Card padding**: `p-5`
- **Modal padding**: `p-5` for header, body, footer
- **Gap between cards**: `gap-4`
- **Gap between inline items**: `gap-2` or `gap-3`

### Borders & Radius
- **Cards/modals**: `rounded-2xl`
- **Inputs/buttons**: `rounded-xl` or `rounded-lg`
- **Badges**: `rounded-full`
- **Border color**: `border-gray-200` (default), `border-gray-100` (subtle dividers)

### Interactive States
- **Hover on cards**: `-translate-y-0.5` + `shadow-lg`
- **Hover on buttons**: Darken by one shade (e.g., `hover:bg-purple-700`)
- **Focus on inputs**: `focus:ring-2 focus:ring-purple-500 focus:border-transparent`
- **Selected state**: Purple ring shadow (`shadow-[0_0_0_2px_#9333ea]`)
- **Disabled**: `opacity-40` or `opacity-60`

### Layout Patterns

**Page layout:**
```jsx
<div className="min-h-screen">
  <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
    <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
      {/* Logo + title on left, actions on right */}
    </div>
  </header>
  <main className="max-w-5xl mx-auto px-5 py-7">
    {/* Content */}
  </main>
</div>
```

**Grid of cards:**
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

**Search + filter bar:**
```jsx
<div className="flex flex-col sm:flex-row gap-3 mb-5">
  <SearchInput value={query} onChange={setQuery} className="flex-1" />
  <div className="flex gap-2 flex-wrap">
    {categories.map(c => (
      <button key={c} className={`px-3 py-2 rounded-lg text-sm font-medium ...`}>{c}</button>
    ))}
  </div>
</div>
```

**Settings/form layout:**
```jsx
<div className="space-y-6">
  <div>
    <label className="block text-sm font-medium text-gray-900 mb-1">Setting Name</label>
    <p className="text-xs text-gray-500 mb-2">Description of what this does.</p>
    <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500" />
  </div>
</div>
```

**Sticky bottom action bar:**
```jsx
<div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 shadow-xl z-40">
  <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
    {/* Status on left, buttons on right */}
  </div>
</div>
```

### Button Styles

```jsx
// Primary
<button className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
  Action
</button>

// Secondary
<button className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
  Cancel
</button>

// Dark
<button className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
  Sign in
</button>
```

---

## When to Use Each Component

| Need | Component |
|------|-----------|
| Overlay dialog, form, confirmation | **Modal** |
| Grid item, content preview, selectable item | **Card** |
| Filter/search input | **SearchInput** |
| Section navigation within a page or modal | **Tabs** |
| Show a command, URL, or code snippet | **CopyBlock** |
| Status label, category tag, version pill | **Badge** |

## Important

- Always import components from the `components/` directory
- Use Tailwind classes — do not write custom CSS unless absolutely necessary
- Follow the color, spacing, and typography conventions above
- When building a new page, start with the page layout pattern and compose from these components
- If you need a component that doesn't exist yet, build it following the same patterns (rounded-2xl, gray borders, purple accents, Inter font)
