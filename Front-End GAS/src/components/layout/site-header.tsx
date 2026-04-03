import Link from "next/link";

const navItems = [
  { href: "/", label: "Beranda" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/presence", label: "Presensi" },
  { href: "/presence/status", label: "Status" },
  { href: "/tracking", label: "Tracking" },
];

export function SiteHeader() {
  return (
    <header className="card" style={{ marginBottom: "1rem" }}>
      <nav className="cluster" aria-label="Main navigation">
        {navItems.map((item) => (
          <Link key={item.href} className="btn" href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
