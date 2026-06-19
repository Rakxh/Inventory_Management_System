import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import { createOrder, getErrorMessage, listCustomers, listProducts } from "../api";

function emptyLine() {
  return { product_id: "", quantity: 1 };
}

export default function NewOrderModal({ onClose, onSaved }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState([emptyLine()]);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([listCustomers(), listProducts()])
      .then(([c, p]) => {
        setCustomers(c);
        setProducts(p);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoadingData(false));
  }, []);

  const productById = useMemo(() => {
    const map = {};
    products.forEach((p) => (map[p.id] = p));
    return map;
  }, [products]);

  const total = lines.reduce((sum, line) => {
    const product = productById[line.product_id];
    if (!product || !line.quantity) return sum;
    return sum + Number(product.price) * Number(line.quantity);
  }, 0);

  function updateLine(index, field, value) {
    setLines((current) => current.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function addLine() {
    setLines((current) => [...current, emptyLine()]);
  }

  function removeLine(index) {
    setLines((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!customerId) {
      setError("Pick a customer for this order.");
      return;
    }
    const items = lines.filter((l) => l.product_id);
    if (items.length === 0) {
      setError("Add at least one product to the order.");
      return;
    }
    for (const line of items) {
      const product = productById[line.product_id];
      const qty = Number(line.quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        setError(`Enter a valid quantity for "${product?.name}".`);
        return;
      }
      if (product && qty > product.quantity) {
        setError(`Only ${product.quantity} of "${product.name}" left in stock.`);
        return;
      }
    }

    setSaving(true);
    try {
      await createOrder({
        customer_id: Number(customerId),
        items: items.map((l) => ({ product_id: Number(l.product_id), quantity: Number(l.quantity) })),
      });
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

  return (
    <Modal title="New order" onClose={onClose} wide>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <div className="form-error-banner">{error}</div>}

          {loadingData ? (
            <div className="loading-row">
              <span className="spinner" /> Loading customers and products…
            </div>
          ) : customers.length === 0 || products.length === 0 ? (
            <p className="muted">
              You need at least one customer and one product before you can create an order.
            </p>
          ) : (
            <>
              <div className="field">
                <label htmlFor="o-customer">Customer</label>
                <select id="o-customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Select a customer…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <p className="section-title" style={{ marginTop: 4 }}>
                Items
              </p>

              {lines.map((line, i) => {
                const product = productById[line.product_id];
                return (
                  <div className="order-line" key={i}>
                    <div className="field" style={{ marginBottom: 0 }}>
                      {i === 0 && <label htmlFor={`order-product-${i}`}>Product</label>}
                      <select
                        id={`order-product-${i}`}
                        aria-label="Product"
                        value={line.product_id}
                        onChange={(e) => updateLine(i, "product_id", e.target.value)}
                      >
                        <option value="">Select…</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                            {p.name} {p.quantity === 0 ? "(out of stock)" : `(${p.quantity} left)`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      {i === 0 && <label htmlFor={`order-qty-${i}`}>Qty</label>}
                      <input
                        id={`order-qty-${i}`}
                        aria-label="Qty"
                        type="number"
                        min="1"
                        max={product?.quantity ?? undefined}
                        value={line.quantity}
                        onChange={(e) => updateLine(i, "quantity", e.target.value)}
                      />
                    </div>
                    <div style={{ alignSelf: "end", paddingBottom: 9 }}>
                      {i === 0 && <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Subtotal</label>}
                      <span className="mono">
                        {product ? currency.format(Number(product.price) * Number(line.quantity || 0)) : "—"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="remove-line"
                      onClick={() => removeLine(i)}
                      disabled={lines.length === 1}
                      aria-label="Remove item"
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}

              <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
                + Add another item
              </button>

              <div className="order-total">
                <span>Order total</span>
                <span className="value">{currency.format(total)}</span>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || loadingData}>
            {saving ? "Placing order…" : "Place order"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
