import LegalPage, { Section } from '@/components/LegalPage';

export const metadata = { title: 'Terms of Use — spotted.' };

export default function Terms() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Use" updated="September 2026">
      <p>By using spotted you agree to these terms. spotted is a discovery marketplace that connects renters with rental leads spotted by the community — we are not a broker and are not party to any rental agreement.</p>
      <Section title="What spotted does">
        <p>We surface rental opportunities, show verification status and an approximate area, and — after you unlock — reveal the owner contact submitted by a scout. We do not guarantee availability, price, or that a listing is current.</p>
      </Section>
      <Section title="Unlocks and fees">
        <p>Unlocking a listing costs a small, clearly-shown fee. A successful unlock reveals the owner contact and exact location and stays available in your profile. Always confirm details with the owner directly and never pay a deposit before viewing a home in person.</p>
      </Section>
      <Section title="Scouts">
        <p>Scouts submit genuine, first-hand rental boards. Submitting fake, duplicate, or misleading listings — or contact details without a lawful basis — is prohibited and forfeits any earnings. Payouts are subject to review and approval.</p>
      </Section>
      <Section title="Acceptable use">
        <p>Do not scrape, resell, or misuse listing data, attempt to bypass unlock payments, or harass owners. We may suspend accounts that break these rules.</p>
      </Section>
      <Section title="Liability">
        <p>spotted is provided "as is". We are not liable for disputes between renters and owners. Your statutory rights are unaffected.</p>
      </Section>
    </LegalPage>
  );
}
