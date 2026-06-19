import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardSummary, getErrorMessage } from "../api";
import StockGauge from "../components/StockGauge";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>A quick read on stock, customers, and orders.</p>
        </div>
      </div>

      {loading && (
        <div className="loading-row">
          <span className="spinner" /> Loading summary…
        </div>
      )}

      {error && <div className="form-error-banner">{error}</div>}

      {summary && (
        <>
          <div className="stat-grid">
            <div className="card stat-tile">
              <div className="label">Total products</div>
              <div className="value">{summary.total_products}</div>
            </div>
            <div className="card stat-tile">
              <div className="label">Total customers</div>
              <div className="value">{summary.total_customers}</div>
            </div>
            <div className="card stat-tile">
              <div className="label">Total orders</div>
              <div className="value">{summary.total_orders}</div>
            </div>
            <div className="card stat-tile">
              <div className="label">Low stock items</div>
              <div className="value" style={{ color: summary.low_stock_products.length ? "var(--accent)" : undefined }}>
                {summary.low_stock_products.length}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-pad">
              <p className="section-title">
                Needs attention &middot; below {summary.low_stock_threshold} units
              </p>

              {summary.low_stock_products.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>
                  Nothing is running low right now.
                </p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.low_stock_products.map((p) => (
                        <tr key={p.id}>
                          <td>{p.name}</td>
                          <td className="cell-mono">{p.sku}</td>
                          <td>
                            <StockGauge quantity={p.quantity} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p style={{ marginTop: 16, marginBottom: 0 }}>
                <Link to="/products">Go to Products →</Link>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
