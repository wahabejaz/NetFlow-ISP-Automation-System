
export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh', color: 'var(--text-light)' }}>
      <h1 style={{ fontSize: '2rem', color: 'var(--text-dark)', marginBottom: '1rem' }}>{title}</h1>
      <p>This module is currently under development or not explicitly detailed in the provided schema.</p>
    </div>
  );
}
