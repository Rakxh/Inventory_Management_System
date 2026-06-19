import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Products from "./Products";
import { ToastProvider } from "../ToastContext";
import * as api from "../api";

vi.mock("../api");

function renderProducts() {
  return render(
    <ToastProvider>
      <Products />
    </ToastProvider>
  );
}

describe("Products page", () => {
  it("shows an empty state when there are no products", async () => {
    api.listProducts.mockResolvedValue([]);
    renderProducts();
    await waitFor(() => expect(screen.getByText("No products yet")).toBeInTheDocument());
  });

  it("lists products and asks for confirmation before deleting", async () => {
    api.listProducts.mockResolvedValue([
      { id: 1, name: "Rudraksha Mala 108 Beads", sku: "RUD-108", price: "499.00", quantity: 47 },
    ]);
    api.deleteProduct.mockResolvedValue({});

    renderProducts();

    await waitFor(() => expect(screen.getByText("Rudraksha Mala 108 Beads")).toBeInTheDocument());

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByText(/will be permanently removed/i)).toBeInTheDocument();
    expect(api.deleteProduct).not.toHaveBeenCalled();

    // Two "Delete" buttons exist now: the row action and the confirm dialog's.
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => expect(api.deleteProduct).toHaveBeenCalledWith(1));
  });
});
