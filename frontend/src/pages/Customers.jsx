import { useEffect, useState } from "react";
import { deleteCustomer, getErrorMessage, listCustomers } from "../api";
import CustomerFormModal from "../components/CustomerFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../useToast";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const { push } = useToast();

  function load() {
    listCustomers()
      .then(setCustomers)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function handleSaved() {
    setAdding(false);
    load();
    push("Customer added.");
  }

  async function handleDelete() {
    try {
      await deleteCustomer(deleting.id);
      push("Customer deleted.");
      setDeleting(null);
      load();
    } catch (err) {
      push(getErrorMessage(err), "error");
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>People who've ordered, or are about to.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>
          + Add customer
        </button>
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-row">
            <span className="spinner" /> Loading customers…
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <strong>No customers yet</strong>
            Add a customer before you can create an order for them.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.full_name}</td>
                    <td className="cell-mono">{c.email}</td>
                    <td className="cell-mono">{c.phone}</td>
                    <td>
                      <div className="cell-actions">
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleting(c)}>
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

      {adding && <CustomerFormModal onClose={() => setAdding(false)} onSaved={handleSaved} />}

      {deleting && (
        <ConfirmDialog
          title="Delete customer?"
          message={`"${deleting.full_name}" will be permanently removed. This isn't possible if they have existing orders.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
