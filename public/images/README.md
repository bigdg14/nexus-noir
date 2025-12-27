# Public Images Directory

This directory contains all public-facing images and assets for the ProNetwork application.

## Directory Structure

```
public/images/
├── logo/                    # Brand logos and marks
│   ├── pronetwork-logo.svg              # Main circular logo
│   └── pronetwork-logo-text.svg         # Logo with text
│
├── icons/                   # UI icons and symbols
│   └── (future icon assets)
│
└── placeholders/            # Placeholder images
    ├── avatar-placeholder.svg           # User avatar placeholder
    └── post-image-placeholder.svg       # Post media placeholder
```

## Usage Guidelines

### Logos
- **pronetwork-logo.svg**: Use for favicon, app icons, and standalone brand marks
- **pronetwork-logo-text.svg**: Use in navigation headers and marketing materials

### Placeholders
- **avatar-placeholder.svg**: Default image for users without profile pictures
- **post-image-placeholder.svg**: Default image for posts without media

## Best Practices

1. **File Naming**: Use lowercase with hyphens (kebab-case)
2. **Formats**:
   - Use SVG for logos and icons (scalable)
   - Use WebP/AVIF for photos with JPG fallback
   - Use PNG for graphics with transparency
3. **Optimization**: All images should be optimized before committing
4. **Organization**: Group related assets in subdirectories
5. **Accessibility**: Provide descriptive alt text when using images

## Future Additions

- Social media open graph images
- Email templates images
- Marketing banners
- User-generated content thumbnails
- Achievement badges
- Category icons
