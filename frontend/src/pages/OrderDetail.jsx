import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cancelOrder, getErrorMessage, getOrder } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../useToast";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const { push } = useToast();

  function load() {
    getOrder(id)
      .then(setOrder)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function handleCancel() {
    try {
      await cancelOrder(id);
      push("Order cancelled, stock restored.");
      setConfirmingCancel(false);
      load();
    } catch (err) {
      push(getErrorMessage(err), "error");
      setConfirmingCancel(false);
    }
  }

  const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
  const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

  if (loading) {
    return (
      <div className="loading-row">
        <span className="spinner" /> Loading order…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <div className="form-error-banner">{error || "Order not found."}</div>
        <Link to="/orders">← Back to orders</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p style={{ margin: "0 0 6px" }}>
            <Link to="/orders">← Back to orders</Link>
          </p>
          <h1>
            Order <span className="mono">#{order.id}</span>
          </h1>
          <p>
            Placed by {order.customer_name} on {dateFmt.format(new Date(order.created_at))}
          </p>
        </div>
        {order.status !== "cancelled" && (
          <button className="btn btn-danger" onClick={() => setConfirmingCancel(true)}>
            Cancel order
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-pad" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div>
            <p className="section-title" style={{ marginBottom: 4 }}>
              Status
            </p>
            <span className={`tag ${order.status === "cancelled" ? "tag-muted" : "tag-success"}`}>
              {order.status}
            </span>
          </div>
          <div>
            <p className="section-title" style={{ marginBottom: 4 }}>
              Total
            </p>
            <span className="mono" style={{ fontSize: 16, fontWeight: 700 }}>
              {currency.format(order.total_amount)}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name}</td>
                  <td className="cell-mono">{item.quantity}</td>
                  <td className="cell-mono">{currency.format(item.unit_price)}</td>
                  <td className="cell-mono">{currency.format(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmingCancel && (
        <ConfirmDialog
          title="Cancel this order?"
          message="Stock for every item in this order will be added back to inventory. This can't be undone."
          confirmLabel="Cancel order"
          onConfirm={handleCancel}
          onCancel={() => setConfirmingCancel(false)}
        />
      )}
    </div>
  );
}
