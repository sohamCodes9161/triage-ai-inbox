import AccountConnection from "../models/AccountConnection.js";
import Email from "../models/Email.js";
import { buildEmails } from "../seed/emails.seed.js";

// Simulated mailbox sync: inserts seed threads in small batches while progress is polled by the UI.
export function startSync(conn, client) {
  const items = buildEmails({ provider: conn.provider, assistantId: conn.assistantId, client, connectionId: conn._id });
  let i = 0;
  const timer = setInterval(async () => {
    try {
      const batch = items.slice(i, i + 3);
      i += 3;
      if (batch.length) await Email.insertMany(batch);
      const synced = Math.min(i, items.length);
      const done = synced >= items.length;
      await AccountConnection.updateOne(
        { _id: conn._id },
        { $set: { emailsSynced: synced, syncProgress: Math.round((synced / items.length) * 100), ...(done ? { status: "connected", lastSyncedAt: new Date() } : {}) } }
      );
      if (done) clearInterval(timer);
    } catch (e) {
      clearInterval(timer);
      await AccountConnection.updateOne({ _id: conn._id }, { $set: { status: "error", errorMessage: e.message } });
    }
  }, 600);
}

export async function instantImport(conn, client) {
  const items = buildEmails({ provider: conn.provider, assistantId: conn.assistantId, client, connectionId: conn._id });
  await Email.insertMany(items);
  await AccountConnection.updateOne({ _id: conn._id }, { $set: { status: "connected", syncProgress: 100, emailsSynced: items.length, lastSyncedAt: new Date() } });
}
