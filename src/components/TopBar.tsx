export default function TopBar({ eyebrow, title, action }: { eyebrow?: string; title?: string; action?: React.ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-4 mb-6 pt-6">
      <div>
        {eyebrow && <p className="section-label mb-1">{eyebrow}</p>}
        {title && <h1 className="text-3xl sm:text-4xl">{title}</h1>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
