import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", exact: true },
  { to: "/products", label: "Products" },
  { to: "/customers", label: "Customers" },
  { to: "/orders", label: "Orders" },
];

function NavLinks({ className }) {
  return links.map((l) => (
    <NavLink
      key={l.to}
      to={l.to}
      end={l.exact}
      className={({ isActive }) => `${className} ${isActive ? "active" : ""}`}
    >
      {l.label}
    </NavLink>
  ));
}

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="mark">IO</span>
          Inventory &amp; Orders
        </div>
        <nav>
          <NavLinks className="nav-link" />
        </nav>
      </aside>

      <div className="mobile-topbar">
        <span className="sidebar-brand" style={{ padding: "0 8px 0 0" }}>
          <span className="mark">IO</span>
        </span>
        <NavLinks className="nav-link" />
      </div>

      <main className="main-area">
        <Outlet />
      </main>
    </div>
  );
}
