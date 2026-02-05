
import InvitesClient from "./InvitesClient";
import { listInvites } from "./actions";

type Invite = {
  email: string;
  role: string;
  created_at?: string | null;
};

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const maybeMessage = (err as Record<string, unknown>).message;
    if (typeof maybeMessage === "string") return maybeMessage;
  }
  return fallback;
}

export default async function InvitesPage() {
  let invites: Invite[] = [];
  let error = "";
  try {
    // TODO: fetch user email from session if needed
    invites = (await listInvites()) as Invite[];
  } catch (e: unknown) {
    error = getErrorMessage(e, "Failed to load invites");
  }
  // Render error or pass invites to client component
  if (error) {
    return (
      <div style={{ width: "100%", maxWidth: 900 }}>
        <h1 style={{ color: "#38bdf8", fontWeight: 700, fontSize: 28, marginBottom: 32 }}>Invites</h1>
        <div style={{ color: "#f87171", marginBottom: 16 }}>{error}</div>
      </div>
    );
  }
  return (
    <div style={{ width: "100%", maxWidth: 900 }}>
      <h1 style={{ color: "#38bdf8", fontWeight: 700, fontSize: 28, marginBottom: 32 }}>Invites</h1>
      <InvitesClient invites={invites} />
    </div>
  );
}
