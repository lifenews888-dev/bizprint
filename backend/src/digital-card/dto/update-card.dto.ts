/** Whitelisted fields a user can update on their own card */
export const ALLOWED_UPDATE_FIELDS = [
  'display_name', 'job_title', 'company_name', 'company_message',
  'phone', 'email', 'website', 'address',
  'logo_url', 'avatar_url', 'social_links',
  'accent_color', 'bg_color',
] as const;

/** Strip unknown/dangerous fields from update body */
export function sanitizeCardUpdate(body: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (body[key] !== undefined) {
      clean[key] = body[key];
    }
  }
  // Sanitize social_links array
  if (clean.social_links) {
    if (!Array.isArray(clean.social_links)) {
      delete clean.social_links;
    } else {
      clean.social_links = clean.social_links
        .slice(0, 10)
        .filter((s: any) => s && typeof s.platform === 'string' && typeof s.value === 'string')
        .map((s: any) => ({ platform: s.platform.slice(0, 30), value: s.value.slice(0, 200) }));
    }
  }
  // Sanitize color fields
  if (clean.accent_color && !/^#[0-9A-Fa-f]{6}$/.test(clean.accent_color)) delete clean.accent_color;
  if (clean.bg_color && !/^#[0-9A-Fa-f]{6}$/.test(clean.bg_color)) delete clean.bg_color;
  // Sanitize string lengths
  for (const key of ['display_name', 'job_title', 'company_name', 'company_message', 'phone', 'email', 'website', 'address'] as const) {
    if (clean[key] && typeof clean[key] === 'string') {
      clean[key] = clean[key].slice(0, 200);
    }
  }
  return clean;
}

/** Public-facing card fields (no internal IDs, user_id, etc.) */
export function toPublicCard(card: any) {
  return {
    display_name: card.display_name,
    job_title: card.job_title,
    company_name: card.company_name,
    company_message: card.company_message,
    phone: card.phone,
    email: card.email,
    website: card.website,
    address: card.address,
    logo_url: card.logo_url,
    avatar_url: card.avatar_url,
    social_links: card.social_links || [],
    accent_color: card.accent_color,
    bg_color: card.bg_color,
  };
}

/** Owner-facing card fields (includes id, slug, stats) */
export function toOwnerCard(card: any) {
  return {
    id: card.id,
    slug: card.slug,
    ...toPublicCard(card),
    view_count: card.view_count,
    save_count: card.save_count,
    template_id: card.template_id,
    created_at: card.created_at,
  };
}
