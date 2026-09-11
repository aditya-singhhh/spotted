import LegalPage, { Section } from '@/components/LegalPage';

export const metadata = { title: 'Privacy Policy — spotted.' };

export default function Privacy() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" updated="September 2026">
      <p>This policy explains what we collect, why, and the choices you have. We keep it short and plain because trust is the point of spotted.</p>
      <Section title="What we collect">
        <p>Account details you provide (email or phone number), the listings and searches you interact with, and — if you scout — the details and media you submit about a rental board. We store approximate coordinates publicly and exact coordinates privately.</p>
      </Section>
      <Section title="How we use it">
        <p>To run the marketplace: authenticate you, show relevant listings, process unlocks, credit scouts, and prevent abuse. We do not sell your personal data.</p>
      </Section>
      <Section title="Owner contact details">
        <p>Phone numbers and names shown on public rental boards are submitted by scouts. If you are an owner and want a listing removed, email us and we will take it down promptly — see Trust &amp; Safety.</p>
      </Section>
      <Section title="Your choices">
        <p>You can request access to, correction of, or deletion of your data at any time by contacting us. Deleting your account removes your profile and shortlist; transaction records may be retained where required for accounting and fraud prevention.</p>
      </Section>
      <Section title="Contact">
        <p>Questions about privacy? Email <a className="text-accent underline" href="mailto:hello@spotted.app">hello@spotted.app</a>.</p>
      </Section>
    </LegalPage>
  );
}
