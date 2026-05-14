# FooterCTA Component Specification

The `FooterCTA` component is a high-conversion, enterprise-grade brand ad and call-to-action module architected per VersaLabs design principles. It leverages high contrast text, dynamic spring physics animations, and immersive glassmorphic layers to convert discovery attendees and prospective organizers.

## Key Capabilities

- **High Contrast Easing:** Crisp white text rendering atop dark ambient platforms ensures WCAG AA compliance.
- **Glassmorphic Radiance:** Embedded backdrop blur effects create distinct foreground separation from the underlying layout stream.
- **Gradient Accents:** Title strings render with dual-tone silver/white clipping paths to command maximum focus.
- **Framer Motion Easing:** Native hover/tap responses use precise VersaLabs Spring constant profiles (`{ stiffness: 300, damping: 30 }`).

## Integration Properties

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | `"Ready to Build Something Extraordinary?"` | Primary gradient display headline. |
| `description` | `string` | Default architect copy | Narrative text providing core value propositions. |
| `primaryButton` | `ButtonProps` | Start Your Project defaults | Main internal/external link setup object. |
| `secondaryButton` | `ButtonProps` | Explore Our Work defaults | Auxiliary navigation trigger configuration. |
| `showGlow` | `boolean` | `true` | Renders a custom floating background ambient gradient aura. |

## Usage Code Snippets

```tsx
import FooterCTA from "@/components/ui/FooterCTA";

// Standard automatic instantiation
export function Shell() {
  return <FooterCTA />;
}

// Custom parameterized deployment
export function CustomAd() {
  return (
    <FooterCTA
      title="Scale Your Event Horizon Nationwide"
      description="Deploy custom event registration flows, real-time metrics, and verified QR entry management systems instantly."
      primaryButton={{
        label: "Launch Organizer Dashboard",
        href: "/org/dashboard",
        variant: "primary"
      }}
      secondaryButton={{
        label: "Explore Discovery Grid",
        href: "/events",
        variant: "secondary"
      }}
    />
  );
}
```
