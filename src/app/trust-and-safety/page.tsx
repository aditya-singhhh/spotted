import LegalPage, { Section } from '@/components/LegalPage';

export const metadata = { title: 'Trust & Safety — spotted.' };

export default function TrustSafety() {
  return (
    <LegalPage eyebrow="How we keep it real" title="Trust & Safety" updated="September 2026">
      <p>Trust is the whole product. Here is exactly how a listing earns its place, what the trust score means, and how to flag a problem.</p>
      <Section title="How a listing gets verified">
        <p>Every submission starts as <b>pending</b> and is never shown publicly until our team reviews it. We check the photo or video of the board, the plausibility of the rent and area, and whether the scout confirmed the details with the owner. Approved listings become <b>verified</b>; unclear ones may appear as <b>community</b> reported; fakes and duplicates are rejected. Review typically takes under a day.</p>
      </Section>
      <Section title="What the trust score means">
        <p>Each listing carries a trust score from 0–100. It rewards evidence and diligence: a video of the board counts most, then a clear photo, then whether the scout actually spoke to the owner and confirmed the home is still available, then the completeness of the details. A higher score means more proof behind the listing — and a larger reward for the scout.</p>
      </Section>
      <Section title="Your safety checklist">
        <p>Always confirm availability and terms with the owner directly. View the home in person before paying anything. Never transfer a deposit or token amount to someone you have not met. spotted never asks you to pay an owner through us.</p>
      </Section>
      <Section title="Report a listing or owner request">
        <p>Spotted something wrong, stale, or a listing of your own you want removed? Email <a className="text-accent underline" href="mailto:hello@spotted.app?subject=Trust%20%26%20Safety%20report">hello@spotted.app</a> and we will act promptly.</p>
      </Section>
    </LegalPage>
  );
}
