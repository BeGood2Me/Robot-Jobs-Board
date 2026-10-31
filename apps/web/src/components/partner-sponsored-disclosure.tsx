import { PARTNER_SPONSORED_DISCLOSURE } from '@/lib/partner-listing';

export function PartnerSponsoredDisclosure({ className = '' }: { className?: string }) {
  return (
    <p className={`max-w-3xl text-sm text-muted ${className}`.trim()}>{PARTNER_SPONSORED_DISCLOSURE}</p>
  );
}
