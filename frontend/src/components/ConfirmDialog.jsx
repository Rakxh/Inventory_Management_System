import Modal from "./Modal";

export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", onConfirm, onCancel, danger = true }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="modal-body">
        <p style={{ margin: 0 }}>{message}</p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
