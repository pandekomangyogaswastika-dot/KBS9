{
  "design_system_name": "Kubus Teknologi Indonesia — V2 Cosmic Cinematic Glass (Content Expansion)",
  "version": "2.1",
  "brand_attributes": [
    "cinematic",
    "premium",
    "technical/HUD",
    "trustworthy enterprise",
    "space-cosmic",
    "glassmorphic",
    "scroll-storytelling",
    "content-system-first",
    "CMS-friendly"
  ],
  "global_rules": {
    "theme": "Default dark theme only. No light theme variants.",
    "contrast": "All text must meet WCAG AA against near-black/media backdrops. Use overlays to guarantee legibility.",
    "bilingual": "Layouts must tolerate ID/EN length variance (±35%). Avoid fixed widths for nav items and CTAs.",
    "gradients": {
      "restriction": "Use gradients only as large background accents/overlays (<=20% viewport). Never on text-heavy reading areas or small UI elements (<100px). Never stack multiple gradients in same viewport.",
      "allowed": [
        "hero/section background overlays",
        "decorative aurora glows behind media",
        "large CTA background only (subtle)"
      ]
    },
    "testing": "All interactive and key informational elements MUST include data-testid (kebab-case, role-based).",
    "file_convention": "Project uses .js (not .tsx). Provide JS scaffolds only.",
    "content_system": {
      "must_be_cms_driven": true,
      "block_based": "All Portfolio/Case Study/Product pages render from a template + ordered blocks array.",
      "non_technical_admin": "Block builder must be understandable without dev knowledge: clear labels, previews, and safe defaults."
    }
  },
  "inspiration_refs": {
    "public_site_patterns": [
      {
        "name": "shadcn blocks — gallery grid with sidebar",
        "why": "Matches portfolio index: grid + filter sidebar + clean density.",
        "source": "https://www.shadcn.io/blocks/gallery-grid-with-sidebar"
      },
      {
        "name": "shadcn blocks — dialog reorder items",
        "why": "Matches CMS block reorder UX and drop indicators.",
        "source": "https://www.shadcn.io/blocks/dialog-reorder-items"
      },
      {
        "name": "Tiptap Notion-like editor template",
        "why": "Interaction model for block-based editing (slash insert, block handles).",
        "source": "https://tiptap.dev/docs/ui-components/templates/notion-like-editor"
      },
      {
        "name": "GSAP ScrollTrigger",
        "why": "Already in stack; use for pinned rails, crossfades, and subtle parallax.",
        "source": "https://gsap.com/docs/v3/Plugins/ScrollTrigger/"
      }
    ]
  },
  "typography": {
    "font_loading": {
      "google_fonts": [
        "Space Grotesk (display)",
        "Sora (body)",
        "Chakra Petch (mono/HUD)"
      ],
      "recommendation": {
        "display": {
          "name": "Space Grotesk",
          "usage": "All page titles, section headings, product names. Weight 600–700."
        },
        "body": {
          "name": "Sora",
          "usage": "Paragraphs, descriptions, CMS helper text. Weight 400–500."
        },
        "mono": {
          "name": "Chakra Petch",
          "usage": "Tags, metrics labels, filter chips, block type labels. Weight 500–600."
        }
      }
    },
    "text_size_hierarchy_tailwind": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl tracking-[-0.04em] leading-[1.02] font-bold",
      "h2": "text-base md:text-lg text-[color:var(--kti-text-dim)] leading-relaxed",
      "section_title": "text-2xl sm:text-3xl tracking-[-0.02em] leading-[1.15] font-semibold",
      "card_title": "text-lg sm:text-xl font-semibold tracking-[-0.01em]",
      "body": "text-sm sm:text-base leading-relaxed text-[color:var(--kti-text-strong)]",
      "small": "text-xs sm:text-sm text-[color:var(--kti-text-dim)]",
      "mono_label": "font-hud text-[11px] uppercase tracking-[0.28em] text-[color:var(--kti-text-dim)]"
    }
  },
  "color_tokens": {
    "notes": "Maintain existing KTI dark + indigo + teal. Add a few semantic tokens for content types and CMS surfaces.",
    "css_variables_to_add_in_index_css": {
      "content_type_accents": {
        "--kti-portfolio-accent": "rgba(115, 209, 173, 0.95)",
        "--kti-case-accent": "rgba(124, 104, 225, 0.95)",
        "--kti-product-accent": "rgba(183, 168, 255, 0.95)"
      },
      "cms": {
        "--kti-cms-canvas": "rgba(255,255,255,0.04)",
        "--kti-cms-inspector": "rgba(255,255,255,0.06)",
        "--kti-drop-indicator": "rgba(115,209,173,0.55)"
      }
    },
    "tailwind_usage_examples": {
      "portfolio_accent": "text-[color:var(--kti-teal)]",
      "case_accent": "text-[color:var(--kti-indigo)]",
      "product_accent": "text-[color:var(--kti-electric)]",
      "drop_indicator": "bg-[color:var(--kti-drop-indicator)]"
    }
  },
  "layout_and_grid": {
    "container": "Use .kti-container for reading areas; .kti-container-wide for grids. Avoid centered text blocks; align left for scanning.",
    "section_spacing": "Use .kti-section (py-16 sm:py-20 lg:py-28). For index pages with filters, use tighter top padding (pt-10) and generous bottom padding.",
    "index_pages": {
      "pattern": "Header (title + summary + quick stats) -> Filter rail -> Grid -> Pagination",
      "grid": {
        "portfolio": "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",
        "case_studies": "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6",
        "products": "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
      }
    },
    "detail_pages": {
      "pattern": "Hero block -> sticky meta rail (desktop) -> blocks stream",
      "meta_rail": "On lg+: use a 12-col grid with a 4-col sticky meta card and 8-col content stream. On mobile: meta collapses into Accordion."
    }
  },
  "component_path": {
    "shadcn_primary": [
      "/app/frontend/src/components/ui/button.jsx",
      "/app/frontend/src/components/ui/badge.jsx",
      "/app/frontend/src/components/ui/card.jsx",
      "/app/frontend/src/components/ui/navigation-menu.jsx",
      "/app/frontend/src/components/ui/sheet.jsx",
      "/app/frontend/src/components/ui/separator.jsx",
      "/app/frontend/src/components/ui/tabs.jsx",
      "/app/frontend/src/components/ui/tooltip.jsx",
      "/app/frontend/src/components/ui/dialog.jsx",
      "/app/frontend/src/components/ui/drawer.jsx",
      "/app/frontend/src/components/ui/dropdown-menu.jsx",
      "/app/frontend/src/components/ui/command.jsx",
      "/app/frontend/src/components/ui/accordion.jsx",
      "/app/frontend/src/components/ui/scroll-area.jsx",
      "/app/frontend/src/components/ui/pagination.jsx",
      "/app/frontend/src/components/ui/table.jsx",
      "/app/frontend/src/components/ui/resizable.jsx",
      "/app/frontend/src/components/ui/skeleton.jsx",
      "/app/frontend/src/components/ui/sonner.jsx"
    ],
    "custom_components_to_create": [
      "src/components/content/FilterRail.js",
      "src/components/content/TagChip.js",
      "src/components/content/PortfolioCard.js",
      "src/components/content/CaseStudyCard.js",
      "src/components/content/ProductCard.js",
      "src/components/content/TemplateBadge.js",
      "src/components/content/BlocksRenderer.js",
      "src/components/content/blocks/BlockHero.js",
      "src/components/content/blocks/BlockGallery.js",
      "src/components/content/blocks/BlockMetrics.js",
      "src/components/content/blocks/BlockFeatures.js",
      "src/components/content/blocks/BlockTestimonials.js",
      "src/components/content/blocks/BlockCTA.js",
      "src/components/content/blocks/BlockDemoEmbed.js",
      "src/components/cms/TemplatePickerDialog.js",
      "src/components/cms/BlockLibraryDrawer.js",
      "src/components/cms/BlockBuilderCanvas.js",
      "src/components/cms/BlockInspectorPanel.js",
      "src/components/cms/BlockRow.js",
      "src/components/cms/BlockReorderDialog.js"
    ]
  },
  "navigation_updates": {
    "menu_structure": {
      "portfolio_dropdown": [
        { "label": "Lihat Semua", "href": "/portfolio", "data-testid": "nav-portfolio-all-link" },
        { "label": "Studi Kasus", "href": "/case-studies", "data-testid": "nav-portfolio-case-studies-link" }
      ],
      "products_main": { "label": "Products", "href": "/products", "data-testid": "nav-products-link" }
    },
    "interaction": {
      "desktop": "Use shadcn NavigationMenu for dropdown; keep floating pill navbar styling.",
      "mobile": "Use Sheet with grouped links; Portfolio group expands via Collapsible/Accordion."
    }
  },
  "content_types_visual_hierarchy": {
    "portfolio": {
      "goal": "Visual-first browsing.",
      "signature": [
        "Large thumbnail dominance",
        "Minimal copy",
        "Teal dot tags",
        "Hover reveals quick meta"
      ],
      "accent": "--kti-portfolio-accent",
      "card_recipe": {
        "wrapper": "group relative overflow-hidden rounded-[var(--kti-radius-card)] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)]",
        "thumb": "aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]",
        "overlay": "absolute inset-0 bg-[image:var(--kti-media-overlay-top)] opacity-80",
        "meta": "absolute inset-x-0 bottom-0 p-4 sm:p-5"
      }
    },
    "case_studies": {
      "goal": "Technical credibility + outcomes.",
      "signature": [
        "Problem → Solution → Results structure",
        "Metrics chips",
        "Demo embed block",
        "Stack badges"
      ],
      "accent": "--kti-case-accent",
      "card_recipe": {
        "wrapper": "group rounded-[var(--kti-radius-card)] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)] hover:border-white/15",
        "inner": "p-5 sm:p-6",
        "top": "flex items-start justify-between gap-4",
        "metrics": "mt-4 grid grid-cols-2 gap-3"
      }
    },
    "products": {
      "goal": "Commercial clarity + CTA.",
      "signature": [
        "Clear positioning statement",
        "Feature bullets",
        "Pricing/plan hint (optional)",
        "External CTA emphasis"
      ],
      "accent": "--kti-product-accent",
      "card_recipe": {
        "wrapper": "group rounded-[var(--kti-radius-card)] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)]",
        "inner": "p-5 sm:p-6",
        "cta": "mt-5 inline-flex w-full items-center justify-between rounded-full bg-white/8 border border-white/14 px-5 py-3 text-sm font-semibold hover:bg-white/10"
      }
    }
  },
  "filter_system": {
    "ux_principles": [
      "Filters must be fast to scan: grouped, collapsible, searchable for tags.",
      "Show active filters as removable chips above the grid.",
      "Provide 'Reset' and 'Save view' (optional) actions.",
      "On mobile, filters open in a Sheet/Drawer; grid remains primary."
    ],
    "components": {
      "desktop": "Left sidebar (lg:w-[320px]) using Card + Accordion groups.",
      "mobile": "Sheet (from right) with same groups; sticky bottom bar with Apply/Reset."
    },
    "filter_groups": [
      { "key": "industry", "label": "Industry", "control": "Checkbox list + search", "data-testid": "filters-industry-group" },
      { "key": "technology", "label": "Technology", "control": "ToggleGroup or Checkbox list", "data-testid": "filters-technology-group" },
      { "key": "projectType", "label": "Project Type", "control": "RadioGroup or Checkbox", "data-testid": "filters-project-type-group" },
      { "key": "tags", "label": "Tags", "control": "Command palette multi-select", "data-testid": "filters-tags-group" }
    ],
    "active_filter_chips": {
      "chip": "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-hud uppercase tracking-[0.18em]",
      "remove_button": "size-7 rounded-full bg-white/8 border border-white/12 hover:bg-white/10",
      "data-testid": {
        "wrap": "active-filters-chip-row",
        "reset": "active-filters-reset-button"
      }
    }
  },
  "templates_and_blocks": {
    "template_picker": {
      "ui": "Dialog with 2-level selection: Content Type tabs (Portfolio / Case Study / Product) + template cards grid.",
      "template_card": {
        "wrapper": "group rounded-[18px] border border-white/10 bg-white/5 p-4 hover:border-white/15",
        "preview": "aspect-[16/9] rounded-[14px] bg-white/5 border border-white/10 overflow-hidden",
        "title": "mt-3 text-sm font-semibold",
        "desc": "mt-1 text-xs text-[color:var(--kti-text-dim)]"
      },
      "data_testids": {
        "open": "cms-template-picker-open-button",
        "dialog": "cms-template-picker-dialog",
        "confirm": "cms-template-picker-confirm-button"
      }
    },
    "block_builder": {
      "layout": "3-panel admin layout using shadcn Resizable: left Block Library, center Canvas, right Inspector.",
      "canvas": {
        "surface": "rounded-[var(--kti-radius-card)] bg-[color:var(--kti-cms-canvas)] border border-white/10",
        "empty_state": "Centered Card with suggested blocks (Hero, Gallery, Metrics) + 'Add block' CTA."
      },
      "block_row": {
        "wrapper": "group relative rounded-[16px] border border-white/10 bg-white/5 p-4",
        "handle": "absolute left-3 top-4 grid size-8 place-items-center rounded-full bg-white/6 border border-white/10 opacity-0 group-hover:opacity-100",
        "toolbar": "absolute right-3 top-4 flex items-center gap-2 opacity-0 group-hover:opacity-100",
        "drop_indicator": "h-0.5 rounded-full bg-[color:var(--kti-drop-indicator)]"
      },
      "interactions": [
        "Drag handle appears on hover (pointer-fine).",
        "Keyboard reorder: Move Up/Down actions in block menu.",
        "Inline add: between blocks show a subtle '+ Add block' row.",
        "Autosave toast via Sonner (debounced)."
      ],
      "data_testids": {
        "canvas": "cms-block-builder-canvas",
        "add_block": "cms-add-block-button",
        "block_row": "cms-block-row",
        "block_menu": "cms-block-row-menu-button",
        "inspector": "cms-block-inspector-panel"
      }
    },
    "blocks_catalog": [
      {
        "type": "hero",
        "label": "Hero",
        "purpose": "Title, summary, primary CTA, optional background media.",
        "recommended_for": ["portfolio", "case_studies", "products"],
        "data-testid": "block-hero"
      },
      {
        "type": "gallery",
        "label": "Gallery",
        "purpose": "Image grid/carousel with captions; lazy loaded.",
        "recommended_for": ["portfolio"],
        "data-testid": "block-gallery"
      },
      {
        "type": "metrics",
        "label": "Metrics",
        "purpose": "Outcome stats + optional sparkline.",
        "recommended_for": ["case_studies", "products"],
        "data-testid": "block-metrics"
      },
      {
        "type": "features",
        "label": "Features",
        "purpose": "Feature list with icons and short copy.",
        "recommended_for": ["products"],
        "data-testid": "block-features"
      },
      {
        "type": "testimonials",
        "label": "Testimonials",
        "purpose": "Client quotes; keep short; no gradients.",
        "recommended_for": ["portfolio", "case_studies", "products"],
        "data-testid": "block-testimonials"
      },
      {
        "type": "cta",
        "label": "CTA",
        "purpose": "Primary conversion block; external link allowed.",
        "recommended_for": ["products", "case_studies"],
        "data-testid": "block-cta"
      },
      {
        "type": "demoEmbed",
        "label": "Demo Embed",
        "purpose": "Embed Loom/Youtube/iframe demo with AspectRatio + overlay.",
        "recommended_for": ["case_studies", "products"],
        "data-testid": "block-demo-embed"
      }
    ]
  },
  "performance_and_media": {
    "portfolio_galleries": {
      "lazy_loading": "All images must use loading='lazy' and decoding='async'. Use blur placeholder (CSS) and AspectRatio to prevent layout shift.",
      "progressive": "Prefer responsive srcset if available; otherwise constrain max width and use object-cover.",
      "carousel": "Use shadcn Carousel for small sets; for large sets prefer masonry grid with pagination."
    },
    "demo_embeds": {
      "policy": "Embeds must be click-to-load on mobile to avoid heavy iframes. Show poster + play button; load iframe on click.",
      "reduced_motion": "No autoplay; respect prefers-reduced-motion."
    }
  },
  "motion_and_microinteractions": {
    "principles": [
      "Motion should feel cinematic but restrained: 180–260ms for hover, 320–520ms for section reveals.",
      "Never animate layout-critical properties on scroll for mobile; prefer opacity/transform.",
      "Disable heavy scroll effects for prefers-reduced-motion."
    ],
    "recipes": {
      "card_hover": "transition-shadow duration-200 hover:shadow-[0_26px_80px_rgba(0,0,0,0.62)]",
      "thumb_hover": "transition-transform duration-300 group-hover:scale-[1.03]",
      "chip_hover": "transition-colors duration-200 hover:bg-white/10",
      "filter_open": "Use Sheet/Accordion with subtle fade+slide (Framer Motion optional)."
    },
    "gsap_usage": {
      "portfolio_index": "Optional: subtle stagger reveal for cards on first load (no pin).",
      "case_study_detail": "Crossfade between blocks as they enter viewport; keep it subtle.",
      "products": "CTA block can have a gentle glow pulse (CSS keyframes) but disable on reduced motion."
    }
  },
  "accessibility": {
    "focus": "Use .kti-focus on all interactive elements. Ensure visible focus ring on dark glass.",
    "hit_targets": "Minimum 44px touch targets for mobile filter toggles and chip remove buttons.",
    "aria": "All dropdowns/sheets/dialogs must have proper aria labels (shadcn provides).",
    "color_contrast": "Avoid teal text on glass without sufficient contrast; use teal for accents/dots, not long paragraphs."
  },
  "image_urls": [
    {
      "category": "portfolio/index-hero-bg",
      "description": "Abstract teal/black waves for Portfolio hero background (use with overlay).",
      "url": "https://images.pexels.com/photos/12970447/pexels-photo-12970447.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
    },
    {
      "category": "portfolio/detail-gallery-bg",
      "description": "Dark teal circular abstract for gallery-focused template background accent (<=20% viewport).",
      "url": "https://images.pexels.com/photos/34270452/pexels-photo-34270452.png?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
    },
    {
      "category": "case-studies/index-hero-bg",
      "description": "Cinematic office/team working shot for credibility (use strong overlay for legibility).",
      "url": "https://images.unsplash.com/photo-1629904853716-f0bc54eea481?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwzfHxlbnRlcnByaXNlJTIwc29mdHdhcmUlMjB0ZWFtJTIwd29ya2luZyUyMG9mZmljZSUyMGNpbmVtYXRpYyUyMGRhcmt8ZW58MHx8fHwxNzgwMzAwODM0fDA&ixlib=rb-4.1.0&q=85"
    },
    {
      "category": "products/index-hero-bg",
      "description": "Modern dev office wide shot for Products hero background.",
      "url": "https://images.pexels.com/photos/6804068/pexels-photo-6804068.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
    }
  ],
  "instructions_to_main_agent": [
    "Keep existing V2 tokens and utilities; only ADD the new semantic tokens for content types + CMS surfaces.",
    "Implement new public pages: /portfolio, /portfolio/:slug, /case-studies, /case-studies/:slug, /products, /products/:slug using the content-type hierarchy rules (Portfolio visual-first, Case Studies technical-first, Products commercial-first).",
    "Build a reusable FilterRail component that can render different filter schemas (industry/technology/project type/tags) and supports mobile Sheet.",
    "Create BlocksRenderer that maps block.type -> block component; ensure each block root has data-testid like data-testid=\"content-block-<type>\".",
    "CMS: implement TemplatePickerDialog + BlockBuilderCanvas with Resizable panels; include drag handles + reorder + inspector. Provide keyboard reorder actions.",
    "Performance: lazy-load gallery images; click-to-load demo embeds; use AspectRatio to prevent CLS.",
    "Do not introduce raw HTML dropdowns/toasts; use shadcn components only. Ensure Sonner is used for autosave and publish toasts.",
    "Ensure every interactive element and key info has data-testid (kebab-case)."
  ],
  "general_ui_ux_design_guidelines_appendix": "<General UI UX Design Guidelines>  \n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
