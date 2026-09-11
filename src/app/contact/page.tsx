import LegalPage, { Section } from '@/components/LegalPage';

export const metadata = { title: 'Contact — spotted.' };

export default function Contact() {
  return (
    <LegalPage eyebrow="Get in touch" title="Contact us">
      <p>We are a small team and we read everything. Whatever you need, email is the fastest way to reach us.</p>
      <Section title="General & support">
        <p><a className="text-accent underline" href="mailto:hello@spotted.app">hello@spotted.app</a> — questions, feedback, account help.</p>
      </Section>
      <Section title="Owners">
        <p>Want a listing of yours removed, or want to list directly? Email <a className="text-accent underline" href="mailto:hello@spotted.app?subject=Owner%20request">hello@spotted.app</a> with the area and details.</p>
      </Section>
      <Section title="Trust & Safety">
        <p>To report a stale, fake, or misleading listing, see <a className="text-accent underline" href="/trust-and-safety">Trust &amp; Safety</a>.</p>
      </Section>
      <Section title="Where we operate">
        <p>Currently live across Bengaluru, India. New neighbourhoods are added as scouts spot them.</p>
      </Section>
    </LegalPage>
  );
}
