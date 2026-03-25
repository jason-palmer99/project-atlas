import { Routes, Route, NavLink } from "react-router-dom";
import { CatalogListPage } from "./pages/CatalogListPage";
import { SoftwareDetailPage } from "./pages/SoftwareDetailPage";
import { ReviewQueuePage } from "./pages/ReviewQueuePage";
import { ObservationsPage } from "./pages/ObservationsPage";

export function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Atlas</h2>
        <nav>
          <NavLink to="/" end>Software Catalog</NavLink>
          <NavLink to="/observations">Observations</NavLink>
          <NavLink to="/review">Review Queue</NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<CatalogListPage />} />
          <Route path="/titles/:id" element={<SoftwareDetailPage />} />
          <Route path="/observations" element={<ObservationsPage />} />
          <Route path="/review" element={<ReviewQueuePage />} />
        </Routes>
      </main>
    </div>
  );
}
