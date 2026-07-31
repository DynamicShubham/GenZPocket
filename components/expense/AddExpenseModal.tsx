"use client";

import { useState, useRef } from "react";
import { X, Camera, UploadCloud } from "lucide-react";

const CATEGORIES = [
  { key: "FOOD", label: "🍕 Food", cls: "chip chip-food chip-selectable" },
  { key: "TRAVEL", label: "🚗 Travel", cls: "chip chip-travel chip-selectable" },
  { key: "SHOPPING", label: "🛍️ Shopping", cls: "chip chip-shopping chip-selectable" },
  { key: "ENTERTAINMENT", label: "🎬 Fun", cls: "chip chip-entertainment chip-selectable" },
  { key: "SUBSCRIPTIONS", label: "📱 Subs", cls: "chip chip-subscriptions chip-selectable" },
  { key: "EDUCATION", label: "📚 Education", cls: "chip chip-education chip-selectable" },
  { key: "HEALTH", label: "💊 Health", cls: "chip chip-health chip-selectable" },
  { key: "OTHER", label: "📦 Other", cls: "chip chip-other chip-selectable" },
];

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddExpenseModal({ onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReceiptScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("http://localhost:8000/expenses/ocr", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to parse receipt image");
      const data = await res.json();
      if (data.amount) setAmount(data.amount.toString());
      if (data.merchant) setMerchant(data.merchant);
      if (data.category) setCategory(data.category);
      if (data.receipt_url) setReceiptUrl(data.receipt_url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Receipt OCR failed");
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !merchant) {
      setError("Amount and merchant are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8000/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: parseFloat(amount),
          merchant,
          category: category || undefined,
          note: note || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to log expense");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed", inset: 0, background: "rgba(13,13,13,0.55)",
          zIndex: 200, backdropFilter: "none",
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "var(--paper-white)",
          borderTop: "3px solid var(--ink-black)",
          borderRadius: "6px 6px 0 0",
          boxShadow: "0 -4px 0 var(--ink-black)",
          padding: "var(--space-3)",
          zIndex: 201,
          maxWidth: "480px",
          margin: "0 auto",
          animation: "slide-in-up 0.15s var(--ease-snap) forwards",
        }}
      >
        {/* Header */}
        <div className="row-between" style={{ marginBottom: "var(--space-3)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem" }}>
            Log Expense
          </h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* OCR Scan Banner */}
        <div
          style={{
            border: "2px dashed var(--ink-black)",
            borderRadius: "6px",
            padding: "0.75rem",
            background: "var(--accent-lilac, #f3e8ff)",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Camera size={20} />
            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              {scanning ? "Scanning Receipt OCR..." : "Scan Receipt to Auto-fill"}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem" }}
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
          >
            {scanning ? "Scanning..." : "Upload Receipt"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleReceiptScan}
          />
        </div>

        <form onSubmit={handleSubmit} className="stack stack-md">
          {/* Amount */}
          <div className="form-group">
            <label className="label" htmlFor="amount">Amount (₹)</label>
            <input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              className="input"
              placeholder="e.g. 340"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.25rem" }}
            />
          </div>

          {/* Merchant */}
          <div className="form-group">
            <label className="label" htmlFor="merchant">Merchant / Where</label>
            <input
              id="merchant"
              type="text"
              className="input"
              placeholder="e.g. Zomato, Uber, Amazon"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
            />
          </div>

          {/* Category chips */}
          <div className="form-group">
            <label className="label">Category <span className="caption">(auto-detected if skipped)</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  className={`${cat.cls}${category === cat.key ? " selected" : ""}`}
                  onClick={() => setCategory(category === cat.key ? "" : cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="form-group">
            <label className="label" htmlFor="note">Note <span className="caption">(optional)</span></label>
            <input
              id="note"
              type="text"
              className="input"
              placeholder="e.g. Dinner with friends"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">{error}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", fontSize: "1rem" }}
            disabled={loading}
            id="btn-submit-expense"
          >
            {loading ? "Logging..." : "Log Expense ✓"}
          </button>
        </form>
      </div>
    </>
  );
}
