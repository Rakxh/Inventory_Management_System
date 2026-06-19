const LOW_STOCK_THRESHOLD = 10;
const FULL_REFERENCE = LOW_STOCK_THRESHOLD * 3;

export default function StockGauge({ quantity }) {
  let color = "var(--success)";
  if (quantity === 0) color = "var(--danger)";
  else if (quantity < LOW_STOCK_THRESHOLD) color = "var(--accent)";

  const pct = Math.max(4, Math.min(100, (quantity / FULL_REFERENCE) * 100));

  return (
    <div className="stock-gauge" title={`${quantity} in stock`}>
      <span className="qty mono">{quantity}</span>
      <span className="track">
        <span className="fill" style={{ width: `${pct}%`, background: color }} />
      </span>
    </div>
  );
}
