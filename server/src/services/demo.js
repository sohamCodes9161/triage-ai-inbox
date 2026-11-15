import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Email from "../models/Email.js";
import AccountConnection from "../models/AccountConnection.js";
import { instantImport } from "./syncService.js";

export const DEMO = { assistant: "demo.assistant@triage.app", client: "demo.client@triage.app", password: "demo1234" };

export async function ensureDemoUsers() {
  const passwordHash = await bcrypt.hash(DEMO.password, 8);
  let assistant = await User.findOne({ email: DEMO.assistant });
  if (!assistant) assistant = await User.create({ name: "Alex Morgan", email: DEMO.assistant, passwordHash, role: "assistant", title: "Executive Assistant", isDemo: true });
  let client = await User.findOne({ email: DEMO.client });
  if (!client) client = await User.create({ name: "Priya Raman", email: DEMO.client, passwordHash, role: "client", title: "Founder & CEO, Northwind Labs", assistantId: assistant._id, isDemo: true });
  return { assistant, client };
}

// Lets the demo client log in before the assistant has run the connect flow.
export async function ensureDemoEmails(assistant, client) {
  if (await Email.exists({ clientId: client._id })) return;
  const conn = await AccountConnection.create({ assistantId: assistant._id, clientId: client._id, provider: "gmail", accountEmail: "priya.raman@gmail.com", status: "syncing" });
  await instantImport(conn, client);
}
