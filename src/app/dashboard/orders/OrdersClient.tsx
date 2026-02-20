"use client";

import { createTestOrderAction } from "./actions";
import { normalizeRole, isManager, isCEO } from "@/lib/roles";
import { useState } from "react";

type Order = {
  id: string;
  status: string;
  gross_amount_cents: number;
  net_amount_cents: number;
  created_at: string;
};

export default function OrdersClientPage({ 
  initialOrders, 
  role,
  onOrderCreated
}: { 
  initialOrders: Order[]; 
  role: string;
  onOrderCreated?: () => void;
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreateOrder = isManager(normalizeRole(role)) || isCEO(normalizeRole(role));

  const handleCreateTestOrder = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newOrder = await createTestOrderAction();
      setOrders([newOrder as Order, ...orders]);
      if (onOrderCreated) onOrderCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create test order");
      console.error("Error creating test order:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div style={{ width: "100%", maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <h1 style={{ color: "#38bdf8", fontWeight: 700, fontSize: 28 }}>Orders</h1>
        {canCreateOrder && (
          <button
            onClick={handleCreateTestOrder}
            disabled={isLoading}
            style={{
              padding: "8px 16px",
              background: "#1e40af",
              color: "#fff",
              border: "1px solid #3b82f6",
              borderRadius: 6,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "Creating..." : "Create Test Order"}
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: "#7f1d1d", borderRadius: 12, border: "1px solid #dc2626", padding: 16, color: "#fca5a5", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div style={{ background: "#131c2e", borderRadius: 12, border: "1px solid #1e3a8a", padding: 32, color: "#fff", fontWeight: 600, fontSize: 20 }}>
          No orders yet.
          {canCreateOrder && " Click 'Create Test Order' to get started."}
        </div>
      ) : (
        <div style={{ background: "#131c2e", borderRadius: 12, border: "1px solid #1e3a8a", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0f1419", borderBottom: "1px solid #1e3a8a" }}>
                <th style={{ padding: 12, textAlign: "left", color: "#38bdf8", fontWeight: 600 }}>Date</th>
                <th style={{ padding: 12, textAlign: "left", color: "#38bdf8", fontWeight: 600 }}>Status</th>
                <th style={{ padding: 12, textAlign: "right", color: "#38bdf8", fontWeight: 600 }}>Gross</th>
                <th style={{ padding: 12, textAlign: "right", color: "#38bdf8", fontWeight: 600 }}>Net</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => (
                <tr key={order.id} style={{ borderBottom: idx < orders.length - 1 ? "1px solid #1e3a8a" : "none" }}>
                  <td style={{ padding: 12, color: "#e0e7ff" }}>{formatDate(order.created_at)}</td>
                  <td style={{ padding: 12, color: "#e0e7ff" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        background: order.status === "pending" ? "#7c2d12" : "#1e3a8a",
                        color: order.status === "pending" ? "#fed7aa" : "#38bdf8",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: "right", color: "#e0e7ff", fontWeight: 600 }}>{formatCurrency(order.gross_amount_cents)}</td>
                  <td style={{ padding: 12, textAlign: "right", color: "#e0e7ff", fontWeight: 600 }}>{formatCurrency(order.net_amount_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
