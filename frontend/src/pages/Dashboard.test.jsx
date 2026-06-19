import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";
import * as api from "../api";

vi.mock("../api");

describe("Dashboard", () => {
  it("renders summary stats and the low-stock table once data loads", async () => {
    api.getDashboardSummary.mockResolvedValue({
      total_products: 12,
      total_customers: 4,
      total_orders: 7,
      low_stock_threshold: 10,
      low_stock_products: [{ id: 2, name: "Brass Ganesh Idol", sku: "IDOL-GANESH-01", quantity: 3 }],
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("12")).toBeInTheDocument());
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Brass Ganesh Idol")).toBeInTheDocument();
    expect(screen.getByText("IDOL-GANESH-01")).toBeInTheDocument();
  });

  it("shows a friendly message when nothing is low on stock", async () => {
    api.getDashboardSummary.mockResolvedValue({
      total_products: 3,
      total_customers: 1,
      total_orders: 0,
      low_stock_threshold: 10,
      low_stock_products: [],
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/nothing is running low/i)).toBeInTheDocument()
    );
  });
});
