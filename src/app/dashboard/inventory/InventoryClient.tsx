"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { applyInventoryAdjustmentAction, createInventoryProductAction, deleteInventoryProductAction, updateInventoryProductAction } from "./actions";

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const maybeMessage = (err as Record<string, unknown>).message;
    if (typeof maybeMessage === "string") return maybeMessage;
  }
  return fallback;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message = "Request timed out") {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

function generateSku() {
  try {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const bytes = new Uint8Array(4);
      crypto.getRandomValues(bytes);
      return `SKU-${Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
    }
  } catch {
    // ignore
  }
  return `SKU-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
}

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  retail_price: number | null;
  status: "draft" | "active" | "archived";
  description?: string | null;
};

type Props = {
  initialProducts: Product[];
  canEdit?: boolean;
};

type CreateProductResult = { ok: true; data: Product } | { ok: false; error: string };

export default function InventoryClient({ initialProducts, canEdit = true }: Props) {
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<{
    sku: string;
    name: string;
    category: string;
    quantity: number;
    retail_price: number;
    status: "draft" | "active" | "archived";
    description: string;
  }>({
    sku: "",
    name: "",
    category: "",
    quantity: 1,
    retail_price: 0,
    status: "draft",
    description: "",
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [inventory, setInventory] = useState<Product[]>(initialProducts || []);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setInventory(initialProducts || []);
  }, [initialProducts]);

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustForm, setAdjustForm] = useState<{
    direction: "in" | "out";
    amount: number;
    reason: "purchase" | "sale" | "return" | "damage" | "correction" | "transfer" | "other";
    note: string;
  }>({
    direction: "in",
    amount: 1,
    reason: "correction",
    note: "",
  });

  const handleOpenModal = () => {
    setEditingProduct(null);
    setForm({
      sku: generateSku(),
      name: "",
      category: "",
      quantity: 1,
      retail_price: 0,
      status: "draft",
      description: "",
    });
    setSubmitError(null);
    setDeleteError(null);
    setSuccess("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      sku: product.sku,
      name: product.name,
      category: product.category,
      quantity: product.quantity ?? 0,
      retail_price: product.retail_price ?? 0,
      status: product.status,
      description: product.description ?? "",
    });
    setSubmitError(null);
    setDeleteError(null);
    setSuccess("");
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSubmitError(null);
  };

  const handleOpenAdjustModal = (product: Product) => {
    setAdjustingProduct(product);
    setAdjustForm({
      direction: "in",
      amount: 1,
      reason: "correction",
      note: "",
    });
    setError("");
    setDeleteError(null);
    setSuccess("");
    setAdjustModalOpen(true);
  };

  const handleCloseAdjustModal = () => {
    setAdjustModalOpen(false);
    setAdjustingProduct(null);
    setError("");
  };

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = typeof window !== "undefined" ? window.confirm(`Delete ${product.name}? This cannot be undone.`) : false;
    if (!confirmed) return;

    setDeleteLoadingId(product.id);
    setDeleteError(null);
    setSuccess("");
    try {
      const res = await deleteInventoryProductAction(product.id);
      if (!res.ok) throw new Error(res.error);
      setInventory((inv) => inv.filter((p) => p.id !== product.id));
      setSuccess("Product deleted");
      router.refresh();
    } catch (err: unknown) {
      console.error("deleteInventoryProduct failed", err);
      setDeleteError(getErrorMessage(err, "Failed to delete product"));
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleAdjustChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAdjustForm((f) => ({
      ...f,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    setAdjustLoading(true);
    setError("");
    setSuccess("");
    try {
      const amount = Math.floor(adjustForm.amount);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be > 0");
      if (adjustForm.direction === "out" && adjustingProduct.quantity - amount < 0) {
        throw new Error("Insufficient stock");
      }

      const result = await applyInventoryAdjustmentAction(adjustingProduct.id, {
        direction: adjustForm.direction,
        amount,
        reason: adjustForm.reason,
        note: adjustForm.note,
      });

      setInventory((inv) => inv.map((p) => (p.id === adjustingProduct.id ? { ...p, quantity: result.new_quantity } : p)));
      setAdjustModalOpen(false);
      setAdjustingProduct(null);
      setSuccess("Stock adjusted");
    } catch (err: unknown) {
      console.error("applyInventoryAdjustment failed", err);
      setError(getErrorMessage(err, "Failed to adjust stock"));
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "quantity" || name === "retail_price" ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);
    setSuccess("");
    try {
      if (!form.name.trim() || !form.category.trim()) {
        throw new Error("Name and category are required");
      }
      if (!form.sku.trim()) {
        throw new Error("SKU is required");
      }
      if (form.quantity < 0 || form.retail_price < 0) {
        throw new Error("Quantity and price must be non-negative");
      }

      if (editingProduct) {
        const updated = (await updateInventoryProductAction(editingProduct.id, {
          name: form.name,
          category: form.category,
          quantity: form.quantity,
          retail_price: form.retail_price,
          status: form.status,
          description: form.description,
        })) as Product;
        setModalOpen(false);
        setEditingProduct(null);
        setInventory((inv) => inv.map((p) => (p.id === updated.id ? updated : p)));
        setSuccess("Product updated");
      } else {
        let res = await withTimeout(
          createInventoryProductAction(form) as unknown as Promise<CreateProductResult>,
          20000
        );
        if (!res.ok && /duplicate|unique|sku/i.test(res.error)) {
          const nextSku = generateSku();
          const retryForm = { ...form, sku: nextSku };
          setForm((prev) => ({ ...prev, sku: nextSku }));
          res = await withTimeout(
            createInventoryProductAction(retryForm) as unknown as Promise<CreateProductResult>,
            20000
          );
        }
        if (!res.ok) throw new Error(res.error);
        const created = res.data as Product;
        setModalOpen(false);
        setForm({
          sku: generateSku(),
          name: "",
          category: "",
          quantity: 1,
          retail_price: 0,
          status: "draft",
          description: "",
        });
        setInventory((inv) => [created, ...inv]);
        setSuccess("Product added");
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("createInventoryProduct failed", err);
      setSubmitError(getErrorMessage(err, "Failed to add product"));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-950">
        <div />
        {canEdit && (
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold shadow"
            onClick={handleOpenModal}
          >
            Add Product
          </button>
        )}
      </div>

      {success && (
        <div className="px-6 pt-4">
          <div className="bg-green-900/40 border border-green-700 text-green-200 rounded-md px-4 py-2 text-sm">
            {success}
          </div>
        </div>
      )}
      {deleteError && (
        <div className="px-6 pt-4">
          <div className="bg-red-900/40 border border-red-700 text-red-200 rounded-md px-4 py-2 text-sm">
            {deleteError}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={handleCloseModal}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-white">{editingProduct ? "Edit Product" : "Add Product"}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-gray-300 mb-1">SKU</label>
                <input
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  required
                  readOnly={!!editingProduct}
                  className={`w-full px-3 py-2 rounded bg-gray-800 text-white ${editingProduct ? "opacity-70 cursor-not-allowed" : ""}`}
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Name</label>
                <input name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 rounded bg-gray-800 text-white" />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Category</label>
                <input name="category" value={form.category} onChange={handleChange} required className="w-full px-3 py-2 rounded bg-gray-800 text-white" />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Quantity</label>
                <input name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange} required className="w-full px-3 py-2 rounded bg-gray-800 text-white" />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Retail Price</label>
                <input name="retail_price" type="number" min="0" step="0.01" value={form.retail_price} onChange={handleChange} required className="w-full px-3 py-2 rounded bg-gray-800 text-white" />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleChange} required className="w-full px-3 py-2 rounded bg-gray-800 text-white">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Description <span className="text-gray-500">(optional)</span></label>
                <textarea name="description" value={form.description} onChange={handleChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white" />
              </div>
              {submitError && <div className="text-red-500 text-sm">{submitError}</div>}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
                  disabled={submitLoading}
                >
                  {submitLoading ? (editingProduct ? "Saving..." : "Adding...") : (editingProduct ? "Save" : "Add Product")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      {adjustModalOpen && adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={handleCloseAdjustModal}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-white">Stock Adjust</h2>
            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block text-gray-300 mb-1">Product</label>
                <input
                  value={`${adjustingProduct.name} (${adjustingProduct.sku})`}
                  readOnly
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white opacity-70 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Current Quantity</label>
                <input
                  value={adjustingProduct.quantity}
                  readOnly
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white opacity-70 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Adjustment Type</label>
                <select name="direction" value={adjustForm.direction} onChange={handleAdjustChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white">
                  <option value="in">IN</option>
                  <option value="out">OUT</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Amount</label>
                <input name="amount" type="number" min="1" step="1" value={adjustForm.amount} onChange={handleAdjustChange} required className="w-full px-3 py-2 rounded bg-gray-800 text-white" />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Reason</label>
                <select name="reason" value={adjustForm.reason} onChange={handleAdjustChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white">
                  <option value="purchase">purchase</option>
                  <option value="sale">sale</option>
                  <option value="return">return</option>
                  <option value="damage">damage</option>
                  <option value="correction">correction</option>
                  <option value="transfer">transfer</option>
                  <option value="other">other</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Note <span className="text-gray-500">(optional)</span></label>
                <textarea name="note" value={adjustForm.note} onChange={handleAdjustChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white" />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="flex justify-end">
                <button type="button" className="mr-2 px-4 py-2 rounded bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700" onClick={handleCloseAdjustModal}>
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold" disabled={adjustLoading}>
                  {adjustLoading ? "Applying..." : "Apply"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory List or Empty State */}
      <div className="flex-1 overflow-y-auto p-6">
        {inventory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-lg text-gray-400 mb-4">No inventory yet</div>
            {canEdit && (
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold shadow"
                onClick={handleOpenModal}
              >
                Add Product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-900 rounded-lg shadow">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-gray-400">Name</th>
                  <th className="px-4 py-2 text-left text-gray-400">SKU</th>
                  <th className="px-4 py-2 text-left text-gray-400">Stock</th>
                  <th className="px-4 py-2 text-left text-gray-400">Price</th>
                  <th className="px-4 py-2 text-left text-gray-400">Status</th>
                  <th className="px-4 py-2 text-left text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item: Product) => (
                  <tr key={item.id} className="border-t border-gray-800">
                    <td className="px-4 py-2 text-white">{item.name}</td>
                    <td className="px-4 py-2 text-white">{item.sku}</td>
                    <td className="px-4 py-2 text-white">{item.quantity}</td>
                    <td className="px-4 py-2 text-white">{item.retail_price == null ? "-" : `$${item.retail_price}`}</td>
                    <td className="px-4 py-2 text-white">{item.status}</td>
                    <td className="px-4 py-2">
                      {canEdit ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="px-3 py-1 text-sm rounded bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAdjustModal(item)}
                            className="px-3 py-1 text-sm rounded bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700"
                          >
                            Adjust
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(item)}
                            disabled={deleteLoadingId === item.id}
                            className="px-3 py-1 text-sm rounded bg-red-900/40 text-red-200 border border-red-800 hover:bg-red-900 disabled:opacity-60"
                          >
                            {deleteLoadingId === item.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
