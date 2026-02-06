"use client";

import React, { useMemo, useState } from "react";
import { FEATURE_LABELS, FEATURE_KEYS, type FeatureKey } from "@/lib/permissions";
import { setRoleFeaturePermissionAction, setUserRoleAction } from "./actions";
import { normalizeRole } from "@/lib/roles";

type ProfileRow = {
  id: string;
  email?: string | null;
  role?: string | null;
};

type RolePermission = {
  role: string;
  feature: string;
  enabled: boolean;
};

type Props = {
  profiles: ProfileRow[];
  permissions: RolePermission[];
};

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const maybeMessage = (err as Record<string, unknown>).message;
    if (typeof maybeMessage === "string") return maybeMessage;
  }
  return fallback;
}

export default function ManagerPermissionsClient({ profiles, permissions }: Props) {
  const [rows, setRows] = useState(profiles);
  const [permRows, setPermRows] = useState(permissions);
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [roleSavingId, setRoleSavingId] = useState<string | null>(null);

  const permissionMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const perm of permRows) {
      map.set(`${perm.role}:${perm.feature}`, perm.enabled);
    }
    return map;
  }, [permRows]);

  const handleToggle = async (featureKey: FeatureKey, enabled: boolean) => {
    setSavingKey(`manager:${featureKey}`);
    setError("");
    try {
      const res = await setRoleFeaturePermissionAction("manager", featureKey, enabled);
      if (!res.ok) throw new Error(res.error);
      setPermRows((prev) => {
        const next = prev.filter((p) => !(p.role === "manager" && p.feature === featureKey));
        next.push(res.data);
        return next;
      });
    } catch (err: unknown) {
      console.error("toggleManagerPermission failed", err);
      setError(getErrorMessage(err, "Failed to update permission"));
    } finally {
      setSavingKey(null);
    }
  };

  const handleRoleChange = async (userId: string, role: "MEMBER" | "MANAGER") => {
    setRoleSavingId(userId);
    setError("");
    try {
      const res = await setUserRoleAction(userId, role);
      if (!res.ok) throw new Error(res.error);
      setRows((prev) => prev.map((row) => (row.id === userId ? { ...row, role: res.data.role } : row)));
    } catch (err: unknown) {
      console.error("setUserRole failed", err);
      setError(getErrorMessage(err, "Failed to update role"));
    } finally {
      setRoleSavingId(null);
    }
  };

  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold text-blue-300 mb-2">Manager Permissions</h2>
      <div className="bg-[#131c2e] p-6 rounded-lg border border-blue-900 flex flex-col gap-4">
        {error && <div className="text-red-300">{error}</div>}
        {rows.length === 0 ? (
          <div className="text-blue-200">No members found.</div>
        ) : (
          rows.map((profile) => {
            const label = profile.email || profile.id;
            const role = normalizeRole(profile.role);
            const isManager = role === "MANAGER";
            return (
              <div key={profile.id} className="border border-blue-900 rounded-lg p-4 flex items-center justify-between gap-4 bg-[#0f172a]">
                <div className="text-blue-200 font-semibold">{label}</div>
                <div className="flex items-center gap-2">
                  <select
                    value={isManager ? "MANAGER" : "MEMBER"}
                    onChange={(e) => handleRoleChange(profile.id, e.target.value as "MEMBER" | "MANAGER")}
                    disabled={roleSavingId === profile.id}
                    className="p-2 rounded bg-[#101a2b] border border-blue-800 text-white"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                  {roleSavingId === profile.id && <span className="text-blue-300 text-sm">Saving...</span>}
                </div>
              </div>
            );
          })
        )}
        <div className="border border-blue-900 rounded-lg p-4 flex flex-col gap-3 bg-[#0f172a]">
          <div className="text-blue-200 font-semibold">Manager feature toggles</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FEATURE_KEYS.map((featureKey) => {
              const checked = permissionMap.get(`manager:${featureKey}`) || false;
              return (
                <label key={featureKey} className="flex items-center gap-2 text-blue-100">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={savingKey === `manager:${featureKey}`}
                    onChange={(e) => handleToggle(featureKey, e.target.checked)}
                  />
                  <span>{FEATURE_LABELS[featureKey]}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
