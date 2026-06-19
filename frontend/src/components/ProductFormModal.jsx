import { useState } from "react";
import Modal from "./Modal";
import { createProduct, getErrorMessage, updateProduct } from "../api";

const emptyForm = { name: "", sku: "", price: "", quantity: "" };

export default function ProductFormModal({ product, onClose, onSaved }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState(
    product
      ? { name: product.name, sku: product.sku, price: product.price, quantity: product.quantity }
      : emptyForm
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.sku.trim()) {
      setError("Name and SKU can't be empty.");
      return;
    }
    const price = Number(form.price);
    const quantity = Number(form.quantity);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Price must be a number greater than 0.");
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      setError("Quantity must be a whole number, 0 or more.");
      return;
    }

    setSaving(true);
    try {
      const payload = { name: form.name.trim(), sku: form.sku.trim(), price, quantity };
      if (isEdit) {
        await updateProduct(product.id, payload);
      } else {
        await createProduct(payload);
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit product" : "Add product"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <div className="form-error-banner">{error}</div>}

          <div className="field">
            <label htmlFor="p-name">Product name</label>
            <input
              id="p-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Rudraksha Mala 108 Beads"
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="p-sku">SKU / code</label>
            <input
              id="p-sku"
              value={form.sku}
              onChange={(e) => update("sku", e.target.value)}
              placeholder="e.g. RUD-108"
              className="mono"
            />
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="p-price">Price</label>
              <input
                id="p-price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="field">
              <label htmlFor="p-qty">Quantity in stock</label>
              <input
                id="p-qty"
                type="number"
                step="1"
                min="0"
                value={form.quantity}
                onChange={(e) => update("quantity", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
