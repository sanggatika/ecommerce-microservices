import logo from './assets/brand/logo.png';

/**
 * Placeholder frontend (m0.2) — memverifikasi setup Tailwind + token brand +
 * aset logo tampil. Halaman nyata (login/dashboard) dibangun di Modul 4.
 */
export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-subtle">
      <img src={logo} alt="Inixindo Bandung" className="h-16 w-auto" />
      <h1 className="text-3xl font-semibold text-primary">E-Commerce Microservices</h1>
      <p className="text-muted">Brand & shared infrastructure siap (m0.2).</p>
      <div className="flex gap-3">
        <span className="h-8 w-8 rounded" style={{ backgroundColor: 'var(--color-primary)' }} />
        <span className="h-8 w-8 rounded" style={{ backgroundColor: 'var(--color-secondary)' }} />
        <span className="h-8 w-8 rounded" style={{ backgroundColor: 'var(--color-accent)' }} />
        <span className="h-8 w-8 rounded" style={{ backgroundColor: 'var(--color-success)' }} />
        <span className="h-8 w-8 rounded" style={{ backgroundColor: 'var(--color-danger)' }} />
      </div>
    </div>
  );
}
