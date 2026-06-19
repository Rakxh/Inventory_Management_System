import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewOrderModal from "./NewOrderModal";
import * as api from "../api";

vi.mock("../api");

const customers = [{ id: 1, full_name: "Anjali Sharma", email: "anjali@example.com", phone: "9876543210" }];
const products = [
  { id: 1, name: "Rudraksha Mala 108 Beads", sku: "RUD-108", price: "499.00", quantity: 47 },
  { id: 2, name: "Brass Ganesh Idol", sku: "IDOL-GANESH-01", price: "1299.00", quantity: 3 },
];

beforeEach(() => {
  api.listCustomers.mockResolvedValue(customers);
  api.listProducts.mockResolvedValue(products);
});

function submitForm(container) {
  fireEvent.submit(container.querySelector("form"));
}

describe("NewOrderModal", () => {
  it("computes the running total as items are added", async () => {
    const user = userEvent.setup();
    render(<NewOrderModal onClose={() => {}} onSaved={() => {}} />);

    await waitFor(() => expect(screen.getByLabelText("Customer")).toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText("Customer"), "1");
    await user.selectOptions(screen.getByLabelText("Product"), "1");
    const qtyInput = screen.getByLabelText("Qty");
    await user.clear(qtyInput);
    await user.type(qtyInput, "2");

    const totalRow = document.querySelector(".order-total .value");
    await waitFor(() => expect(totalRow).toHaveTextContent("₹998.00"));
  });

  it("blocks submission when the requested quantity exceeds available stock", async () => {
    const user = userEvent.setup();
    const { container } = render(<NewOrderModal onClose={() => {}} onSaved={() => {}} />);

    await waitFor(() => expect(screen.getByLabelText("Customer")).toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText("Customer"), "1");
    await user.selectOptions(screen.getByLabelText("Product"), "2");
    const qtyInput = screen.getByLabelText("Qty");
    await user.clear(qtyInput);
    await user.type(qtyInput, "10");

    submitForm(container);

    expect(await screen.findByText(/only 3 of/i)).toBeInTheDocument();
    expect(api.createOrder).not.toHaveBeenCalled();
  });

  it("submits the order with the right payload when everything is valid", async () => {
    api.createOrder.mockResolvedValue({ id: 1 });
    const onSaved = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<NewOrderModal onClose={() => {}} onSaved={onSaved} />);

    await waitFor(() => expect(screen.getByLabelText("Customer")).toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText("Customer"), "1");
    await user.selectOptions(screen.getByLabelText("Product"), "1");
    const qtyInput = screen.getByLabelText("Qty");
    await user.clear(qtyInput);
    await user.type(qtyInput, "3");

    submitForm(container);

    await waitFor(() =>
      expect(api.createOrder).toHaveBeenCalledWith({
        customer_id: 1,
        items: [{ product_id: 1, quantity: 3 }],
      })
    );
    expect(onSaved).toHaveBeenCalled();
  });
});
