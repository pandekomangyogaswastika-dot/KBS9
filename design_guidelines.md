{
  "brand_attributes": {
    "tone": ["trustworthy", "technical", "calm", "space-grade precision"],
    "ux_principles": [
      "Clarity > completeness in sidebar (progressive disclosure)",
      "Group by job-to-be-done, not internal org chart",
      "Keep CMS scannable: Pages vs Blocks vs Collections",
      "Minimize scroll in nav; prefer collapsible groups",
      "Role-appropriate language for client portal"
    ]
  },
  "design_tokens": {
    "note": "DO NOT change KTI branding colors; only refine structure + usage. Keep background #03040A, indigo #7C68E1, teal #73D1AD.",
    "css_custom_properties": {
      "colors": {
        "--kti-space-975": "#03040A",
        "--kti-indigo": "#7C68E1",
        "--kti-teal": "#73D1AD",
        "--kti-text-strong": "#E8EAF2",
        "--kti-text-dim": "#9AA0B5",
        "--kti-space-900": "#0B0D17",
        "--kti-glass-bg": "rgba(255,255,255,0.06)",
        "--kti-glass-border": "rgba(255,255,255,0.12)",
        "--kti-ring": "rgba(124, 104, 225, 0.55)",
        "--kti-success": "#73D1AD",
        "--kti-warning": "#F2C879",
        "--kti-danger": "#FF5C7A"
      },
      "radius": {
        "--radius": "0.875rem",
        "--kti-radius-soft": "14px",
        "--kti-radius-card": "20px",
        "--kti-radius-pill": "999px"
      },
      "shadows": {
        "--kti-glass-shadow": "0 18px 60px rgba(0, 0, 0, 0.55)",
        "--kti-glass-shadow-hover": "0 26px 80px rgba(0, 0, 0, 0.62)",
        "--kti-glow-indigo": "0 0 0 1px rgba(124, 104, 225, 0.18), 0 0 40px rgba(124, 104, 225, 0.18)",
        "--kti-glow-teal": "0 0 0 1px rgba(115, 209, 173, 0.16), 0 0 44px rgba(115, 209, 173, 0.14)"
      },
      "typography": {
        "--font-body": "Inter, system-ui, sans-serif",
        "--font-display": "Space Grotesk, Inter, system-ui, sans-serif",
        "--font-hud": "Space Grotesk, ui-monospace, SFMono-Regular, monospace"
      }
    },
    "tailwind_usage_notes": [
      "Use existing dark tokens from index.css; prefer bg-[color:var(--kti-space-950)] / text-[color:var(--kti-text-strong)]",
      "Avoid large gradients; if needed, only subtle aurora overlay (already defined as --kti-aurora-accent) and keep it decorative",
      "No 'transition-all'; use transition-colors, transition-opacity, transition-shadow"
    ]
  },
  "typography": {
    "fonts": {
      "body": "Inter (existing constraint)",
      "display": "Space Grotesk (existing constraint)",
      "mono_labels": "Space Grotesk for HUD labels (existing constraint)"
    },
    "scale": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl",
      "h2": "text-base md:text-lg",
      "body": "text-sm md:text-base",
      "small": "text-xs",
      "sidebar_section_label": "text-[11px] uppercase tracking-[0.28em] (use .kti-hud-label)",
      "sidebar_item": "text-sm"
    },
    "sidebar_copy_rules": [
      "Use Bahasa Indonesia labels for client portal (more approachable)",
      "Use concise nouns for admin/staff (Dashboard, CRM, Projects, Product, Content, System)",
      "Avoid ambiguous labels like 'Support' for discovery tools"
    ]
  },
  "information_architecture": {
    "admin_staff_sidebar": {
      "width": "w-64 fixed (256px) — do not change",
      "structure": [
        {
          "section_id": "main",
          "label": "Main",
          "items": [
            {"label": "Dashboard", "route": "(existing)", "icon": "LayoutDashboard", "data_testid": "admin-nav-dashboard"}
          ]
        },
        {
          "section_id": "crm",
          "label": "CRM",
          "items": [
            {"label": "Leads", "route": "(existing)", "icon": "UserPlus", "data_testid": "admin-nav-leads"},
            {"label": "Assessments", "route": "(existing)", "icon": "ClipboardList", "data_testid": "admin-nav-assessments"},
            {"label": "Clients", "route": "(existing)", "icon": "Building2", "data_testid": "admin-nav-crm-clients"}
          ],
          "notes": [
            "Move Assessments here (discovery/qualification fits CRM)",
            "Keep Demo Sessions OUT of CRM"
          ]
        },
        {
          "section_id": "delivery",
          "label": "Delivery",
          "items": [
            {"label": "Projects", "route": "(existing)", "icon": "FolderKanban", "data_testid": "admin-nav-projects"},
            {"label": "Messages", "route": "(existing)", "icon": "MessagesSquare", "data_testid": "admin-nav-messages"},
            {"label": "AI Conversations", "route": "(existing)", "icon": "Sparkles", "data_testid": "admin-nav-ai-conversations"}
          ]
        },
        {
          "section_id": "product",
          "label": "Product",
          "items": [
            {"label": "Demo Sessions", "route": "(existing)", "icon": "CalendarClock", "data_testid": "admin-nav-demo-sessions"},
            {"label": "Analytics", "route": "(existing)", "icon": "BarChart3", "data_testid": "admin-nav-analytics"},
            {"label": "SEO", "route": "(existing)", "icon": "Search", "data_testid": "admin-nav-seo"}
          ],
          "notes": [
            "Analytics + SEO are not Projects; keep them in Product/Insights"
          ]
        },
        {
          "section_id": "content",
          "label": "Content",
          "type": "collapsible_group",
          "top_level_item": {"label": "CMS Hub", "route": "(new page optional)", "icon": "PanelsTopLeft", "data_testid": "admin-nav-cms-hub"},
          "subgroups": [
            {
              "group_id": "website",
              "label": "Website",
              "default_state": "expanded",
              "items": [
                {"label": "Home", "route": "(existing: Home Blocks)", "icon": "Home", "data_testid": "admin-nav-cms-home"},
                {"label": "Services", "route": "(existing)", "icon": "Wrench", "data_testid": "admin-nav-cms-services"},
                {"label": "Cases", "route": "(existing)", "icon": "Briefcase", "data_testid": "admin-nav-cms-cases"},
                {"label": "Tech", "route": "(existing)", "icon": "Cpu", "data_testid": "admin-nav-cms-tech"},
                {"label": "Team", "route": "(existing)", "icon": "Users", "data_testid": "admin-nav-cms-team"},
                {"label": "Careers", "route": "(existing)", "icon": "BadgeCheck", "data_testid": "admin-nav-cms-careers"},
                {"label": "Blog", "route": "(existing)", "icon": "Newspaper", "data_testid": "admin-nav-cms-blog"},
                {"label": "Resources", "route": "(existing)", "icon": "BookOpen", "data_testid": "admin-nav-cms-resources"},
                {"label": "Legal", "route": "(existing)", "icon": "Scale", "data_testid": "admin-nav-cms-legal"}
              ]
            },
            {
              "group_id": "components",
              "label": "Components",
              "default_state": "collapsed",
              "items": [
                {"label": "Testimonials", "route": "(existing)", "icon": "Quote", "data_testid": "admin-nav-cms-testimonials"},
                {"label": "FAQ", "route": "(existing)", "icon": "HelpCircle", "data_testid": "admin-nav-cms-faq"},
                {"label": "Packages", "route": "(existing)", "icon": "Package", "data_testid": "admin-nav-cms-packages"}
              ],
              "notes": [
                "This subgroup is for reusable UI blocks/sections"
              ]
            },
            {
              "group_id": "showcase",
              "label": "Showcase",
              "default_state": "collapsed",
              "items": [
                {"label": "Client Logos", "route": "(existing: CMS Clients)", "icon": "GalleryHorizontalEnd", "data_testid": "admin-nav-cms-client-logos"},
                {"label": "Partners", "route": "(existing)", "icon": "Handshake", "data_testid": "admin-nav-cms-partners"}
              ],
              "notes": [
                "Rename CMS 'Clients' to 'Client Logos' to avoid confusion with CRM Clients"
              ]
            },
            {
              "group_id": "media",
              "label": "Media",
              "default_state": "collapsed",
              "items": [
                {"label": "Media Library", "route": "(existing)", "icon": "Image", "data_testid": "admin-nav-media-library"}
              ],
              "notes": [
                "Media Library should live under Content, not as its own top-level section"
              ]
            }
          ]
        },
        {
          "section_id": "system",
          "label": "System",
          "items": [
            {"label": "Users", "route": "(existing)", "icon": "UserCog", "data_testid": "admin-nav-users"},
            {"label": "Integrations", "route": "(existing)", "icon": "Plug", "data_testid": "admin-nav-integrations"},
            {"label": "Email Outbox", "route": "(existing)", "icon": "Send", "data_testid": "admin-nav-email-outbox"},
            {"label": "Settings", "route": "(existing)", "icon": "Settings", "data_testid": "admin-nav-settings"}
          ],
          "notes": [
            "Move Settings OUT of CMS"
          ]
        }
      ],
      "interaction_rules": [
        "Only one CMS subgroup expanded at a time on mobile (accordion behavior); allow multiple expanded on desktop",
        "Persist expanded/collapsed state in localStorage per role (key: kti.sidebar.admin.contentState)",
        "Active route highlight: left 2px indigo bar + subtle glass background",
        "If sidebar scrolls, keep section labels sticky within scroll area for orientation"
      ]
    },
    "client_sidebar": {
      "structure": [
        {
          "section_id": "main",
          "label": "Main",
          "items": [
            {"label": "Dashboard", "route": "(existing)", "icon": "LayoutDashboard", "data_testid": "client-nav-dashboard"}
          ]
        },
        {
          "section_id": "proyek",
          "label": "Proyek",
          "items": [
            {"label": "Proyek Saya", "route": "(existing: My Projects)", "icon": "FolderKanban", "data_testid": "client-nav-my-projects"},
            {"label": "Invoice", "route": "(existing: Invoices)", "icon": "Receipt", "data_testid": "client-nav-invoices"}
          ]
        },
        {
          "section_id": "discovery",
          "label": "Discovery",
          "items": [
            {"label": "Assessment", "route": "(existing)", "icon": "ClipboardList", "data_testid": "client-nav-assessment"}
          ],
          "notes": [
            "Discovery is clearer than Support; Assessment is a discovery/briefing tool"
          ]
        },
        {
          "section_id": "komunikasi",
          "label": "Komunikasi",
          "items": [
            {"label": "Pesan", "route": "(existing: Messages)", "icon": "MessagesSquare", "data_testid": "client-nav-messages"},
            {"label": "AI Assistant", "route": "(existing)", "icon": "Sparkles", "data_testid": "client-nav-ai-assistant"}
          ]
        }
      ],
      "copy_notes": [
        "Use Indonesian section labels; keep item labels short",
        "Avoid 'Support' unless you actually have ticketing/helpdesk"
      ]
    }
  },
  "login_page": {
    "goal": "Single login form for all roles with clear role context (non-breaking).",
    "layout": {
      "pattern": "Centered card on dark space canvas with subtle aurora + star noise (decorative only)",
      "grid": "Mobile-first: single column; Desktop: optional split with left brand panel (max 40%) and right form (60%)",
      "card": "Use .kti-glass-premium-highlight with max-w-md, generous padding"
    },
    "role_context_ui": {
      "component": "Segmented control (Tabs) above the form",
      "tabs": [
        {"value": "client", "label": "Client", "helper": "Akses proyek, invoice, dan komunikasi", "data_testid": "login-role-tab-client"},
        {"value": "staff", "label": "Staff", "helper": "Kelola delivery, konten, dan komunikasi", "data_testid": "login-role-tab-staff"},
        {"value": "admin", "label": "Admin", "helper": "Akses penuh: CRM, system, dan CMS", "data_testid": "login-role-tab-admin"}
      ],
      "behavior": [
        "Role tabs only change helper copy + subtle accent (indigo/teal) — authentication remains same endpoint",
        "Remember last selected role in localStorage (key: kti.login.roleHint)",
        "After login, backend/route guard still determines actual role; tab is a hint, not authority"
      ]
    },
    "form_fields": {
      "primary": [
        {"type": "email", "label": "Email", "data_testid": "login-email-input"},
        {"type": "password", "label": "Password", "data_testid": "login-password-input"}
      ],
      "secondary": [
        {"type": "checkbox", "label": "Remember me", "data_testid": "login-remember-checkbox"},
        {"type": "link", "label": "Forgot password?", "data_testid": "login-forgot-password-link"}
      ],
      "submit": {"label": "Sign in", "data_testid": "login-submit-button"},
      "error_area": {"data_testid": "login-error-message"}
    },
    "micro_interactions": [
      "Primary button: hover -> subtle indigo glow (shadow), active -> scale-95 (transition-transform only on active state)",
      "Inputs: focus-visible ring uses --kti-ring; show inline validation message under field",
      "Tabs: active indicator slides (Framer Motion optional)"
    ]
  },
  "cms_hub_page": {
    "concept": "A landing page when clicking 'CMS Hub' that provides a scannable grid of CMS areas (Pages, Components, Showcase, Media) to reduce sidebar hunting.",
    "layout": {
      "header": {
        "title": "Content Hub",
        "subtitle": "Kelola website, komponen, dan aset dalam satu tempat.",
        "data_testid": "cms-hub-header"
      },
      "content": {
        "pattern": "Bento grid of cards (2 columns on md, 3 on lg)",
        "cards": [
          {"title": "Website", "desc": "Home, Services, Cases, Blog, Careers…", "cta": "Open", "data_testid": "cms-hub-card-website"},
          {"title": "Components", "desc": "Testimonials, FAQ, Packages", "cta": "Open", "data_testid": "cms-hub-card-components"},
          {"title": "Showcase", "desc": "Client Logos, Partners", "cta": "Open", "data_testid": "cms-hub-card-showcase"},
          {"title": "Media", "desc": "Media Library", "cta": "Open", "data_testid": "cms-hub-card-media"}
        ]
      }
    },
    "search": {
      "pattern": "Command palette style search for CMS items",
      "data_testid": "cms-hub-search"
    }
  },
  "components": {
    "component_path": {
      "sidebar": [
        "/app/frontend/src/components/ui/collapsible.jsx",
        "/app/frontend/src/components/ui/accordion.jsx (optional for mobile-only single-open behavior)",
        "/app/frontend/src/components/ui/scroll-area.jsx",
        "/app/frontend/src/components/ui/separator.jsx",
        "/app/frontend/src/components/ui/tooltip.jsx (for collapsed sidebar icon-only mode if exists)",
        "/app/frontend/src/components/ui/badge.jsx (optional: small counts)",
        "/app/frontend/src/components/ui/button.jsx"
      ],
      "login": [
        "/app/frontend/src/components/ui/card.jsx",
        "/app/frontend/src/components/ui/tabs.jsx",
        "/app/frontend/src/components/ui/input.jsx",
        "/app/frontend/src/components/ui/label.jsx",
        "/app/frontend/src/components/ui/checkbox.jsx",
        "/app/frontend/src/components/ui/button.jsx",
        "/app/frontend/src/components/ui/sonner.jsx (toast feedback)"
      ],
      "cms_hub": [
        "/app/frontend/src/components/ui/card.jsx",
        "/app/frontend/src/components/ui/command.jsx (search)",
        "/app/frontend/src/components/ui/breadcrumb.jsx",
        "/app/frontend/src/components/ui/badge.jsx"
      ]
    },
    "icon_library": {
      "use": "lucide-react",
      "note": "Do not use emoji icons. Keep icon stroke 1.75–2.0 for crispness on dark UI."
    }
  },
  "layout_and_grid": {
    "sidebar": {
      "container": "w-64 fixed left-0 top-0 h-screen",
      "inner": "Use ScrollArea for nav list; keep bottom utility pinned (flex-col with mt-auto)",
      "spacing": "Section padding px-3; item height 36–40px; section gap 14–18px"
    },
    "content_area": {
      "pattern": "Main content uses padding p-4 sm:p-6; avoid centered text blocks; keep max-w for reading pages only",
      "breadcrumbs": "Use Breadcrumb component for CMS pages to reduce reliance on sidebar"
    }
  },
  "component_states": {
    "nav_item": {
      "default": "text-[color:var(--kti-text-dim)] hover:text-[color:var(--kti-text-strong)]",
      "hover": "bg-white/[0.04] (no gradient), border border-white/10",
      "active": "bg-white/[0.06] text-[color:var(--kti-text-strong)] + left indicator (bg-[color:var(--kti-indigo)])",
      "focus": "use .kti-focus"
    },
    "collapsible_group": {
      "chevron": "rotate-90 on open (transition-transform duration-200)",
      "group_label": "use .kti-hud-label; keep sticky if scrollable"
    },
    "buttons": {
      "primary": {
        "shape": "rounded-[14px]",
        "surface": "bg-[color:var(--kti-indigo)] text-[color:var(--kti-space-975)]",
        "hover": "hover:shadow-[var(--kti-glow-indigo)] hover:brightness-105",
        "active": "active:scale-[0.98]",
        "transition": "transition-colors transition-shadow duration-200"
      },
      "secondary": {
        "surface": "bg-white/[0.06] border border-white/10 text-[color:var(--kti-text-strong)]",
        "hover": "hover:bg-white/[0.09] hover:border-white/[0.16]",
        "transition": "transition-colors duration-200"
      },
      "ghost": {
        "surface": "bg-transparent text-[color:var(--kti-text-dim)]",
        "hover": "hover:text-[color:var(--kti-text-strong)] hover:bg-white/[0.04]",
        "transition": "transition-colors duration-200"
      }
    }
  },
  "motion": {
    "principles": [
      "Use motion to clarify hierarchy: expand/collapse, active route, role context",
      "Keep durations 160–220ms for UI; 280–360ms for page-level transitions",
      "Respect prefers-reduced-motion"
    ],
    "recommended_library": {
      "name": "framer-motion (optional)",
      "install": "npm i framer-motion",
      "usage": [
        "Animate Tabs indicator on login role switch",
        "Animate Collapsible content height + opacity for CMS groups"
      ]
    }
  },
  "accessibility": {
    "requirements": [
      "WCAG AA contrast: ensure nav text-dim still readable on bg; use text-strong for active",
      "Keyboard navigation: Collapsible triggers must be focusable; Enter/Space toggles",
      "Visible focus ring: use .kti-focus on all interactive elements",
      "ARIA: Collapsible uses aria-expanded; Tabs uses proper roles (shadcn handles)"
    ]
  },
  "image_urls": {
    "note": "No new branding imagery required for IA-only redesign. Keep existing space theme assets. Optional: add subtle SVG starfield background (CSS-only already exists: .kti-starlayer).",
    "categories": [
      {
        "category": "login_background",
        "description": "Prefer CSS-only aurora + noise overlay; avoid heavy images for performance.",
        "urls": []
      }
    ]
  },
  "instructions_to_main_agent": [
    "Implement new sidebar IA without changing routes: only labels, grouping, and collapsible structure.",
    "Rename CMS 'Clients' to 'Client Logos' in UI only; keep route unchanged.",
    "Move Media Library under Content group.",
    "Move Settings to System section.",
    "Add CMS Hub page (optional) and link it from Content top-level item; if not implementing page, still keep Content collapsible groups.",
    "All interactive elements must include data-testid (kebab-case) as specified above.",
    "Use shadcn/ui components from /src/components/ui (Collapsible, ScrollArea, Tabs, Card, Button, Input, etc.).",
    "Do not change sidebar width (w-64).",
    "Do not introduce new gradients beyond existing subtle aurora overlay; keep gradients decorative and under 20% viewport."
  ],
  "general_ui_ux_design_guidelines": "<General UI UX Design Guidelines>  \n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
