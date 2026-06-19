import { useEffect, useState } from "react";
import { deleteProduct, getErrorMessage, listProducts } from "../api";
import StockGauge from "../components/StockGauge";
import ProductFormModal from "../components/ProductFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../useToast";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { push } = useToast();

  function load() {
    listProducts()
      .then(setProducts)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function handleSaved() {
    setEditing(null);
    load();
    push("Product saved.");
  }

  async function handleDelete() {
    try {
      await deleteProduct(deleting.id);
      push("Product deleted.");
      setDeleting(null);
      load();
    } catch (err) {
      push(getErrorMessage(err), "error");
      setDeleting(null);
    }
  }

  const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p>Everything you stock, with current price and quantity.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>
          + Add product
        </button>
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-row">
            <span className="spinner" /> Loading products…
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <strong>No products yet</strong>
            Add your first product to start tracking stock.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="cell-mono">{p.sku}</td>
                    <td className="cell-mono">{currency.format(p.price)}</td>
                    <td>
                      <StockGauge quantity={p.quantity} />
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(p)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleting(p)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <ProductFormModal
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete product?"
          message={`"${deleting.name}" will be permanently removed. This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
