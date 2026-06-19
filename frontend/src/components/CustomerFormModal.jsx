import { useState } from "react";
import Modal from "./Modal";
import { createCustomer, getErrorMessage } from "../api";

const emptyForm = { full_name: "", email: "", phone: "" };

export default function CustomerFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.full_name.trim()) {
      setError("Name can't be empty.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (form.phone.trim().length < 4) {
      setError("Enter a valid phone number.");
      return;
    }

    setSaving(true);
    try {
      await createCustomer({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Add customer" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {error && <div className="form-error-banner">{error}</div>}

          <div className="field">
            <label htmlFor="c-name">Full name</label>
            <input
              id="c-name"
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              placeholder="e.g. Anjali Sharma"
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="c-email">Email address</label>
            <input
              id="c-email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="anjali@example.com"
            />
          </div>

          <div className="field">
            <label htmlFor="c-phone">Phone number</label>
            <input
              id="c-phone"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="9876543210"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Add customer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
