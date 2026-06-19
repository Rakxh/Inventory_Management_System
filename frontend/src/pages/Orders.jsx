import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage, listOrders } from "../api";
import NewOrderModal from "../components/NewOrderModal";
import { useToast } from "../useToast";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const { push } = useToast();

  function load() {
    listOrders()
      .then((data) => setOrders([...data].reverse()))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function handleSaved() {
    setCreating(false);
    load();
    push("Order placed.");
  }

  const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
  const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Orders</h1>
          <p>Every order placed, with its status and total.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          + New order
        </button>
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-row">
            <span className="spinner" /> Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <strong>No orders yet</strong>
            Create one once you have customers and products set up.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Placed</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="cell-mono">#{o.id}</td>
                    <td>{o.customer_name}</td>
                    <td className="muted">{dateFmt.format(new Date(o.created_at))}</td>
                    <td>
                      <span className={`tag ${o.status === "cancelled" ? "tag-muted" : "tag-success"}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="cell-mono">{currency.format(o.total_amount)}</td>
                    <td>
                      <div className="cell-actions">
                        <Link className="btn btn-secondary btn-sm" to={`/orders/${o.id}`}>
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && <NewOrderModal onClose={() => setCreating(false)} onSaved={handleSaved} />}
    </div>
  );
}
