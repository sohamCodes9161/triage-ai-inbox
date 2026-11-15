// Realistic sample threads. "{{c}}" is replaced with the client's first name.
// c = category, conf = confidence, r = reason, sig = signals, sum = summary
// imp/unread/req/mtg = flags, dates = [label, daysFromNow, type], thread = later messages
const H = 3600e3, D = 24 * H;

const GMAIL = [
  { subject: "Series A term sheet – signature needed by Friday", from: ["Daniel Ortiz", "daniel@ortizlegal.com"], ago: 3, unread: 1, imp: 1, req: 1,
    body: "Hi {{c}}, the final term sheet is attached. Please review section 4 (liquidation preference) and sign by Friday so we can close with the lead investor. Happy to walk you through it on a call.",
    c: "client_action", conf: 0.96, r: "Needs the client's own legal approval and signature on a time-sensitive investment document.", sig: ["signature request", "legal", "deadline: Friday"],
    sum: "Daniel Ortiz sent the final Series A term sheet and needs {{c}} to review the liquidation preference clause and sign by Friday.",
    dates: [["Term sheet signature deadline", 3, "deadline"]], act: ["Review section 4", "Sign the term sheet"] },
  { subject: "Partnership proposal – revenue share with Brightpath", from: ["Jonas Weber", "jonas@brightpath.io"], ago: 7, unread: 1, imp: 1, req: 1,
    body: "Hi {{c}}, we'd love to explore a 70/30 revenue share for the EU rollout. Could you let me know if you're open to this structure before our board meets next week?",
    c: "client_action", conf: 0.91, r: "Strategic commercial decision that only the client can make.", sig: ["revenue share", "strategic", "decision needed"],
    sum: "Jonas Weber proposes a 70/30 revenue share for the EU rollout and wants {{c}}'s position before his board meets next week.",
    dates: [["Reply before Brightpath board meeting", 6, "deadline"]], act: ["Decide on the 70/30 structure"] },
  { subject: "Reschedule our Tuesday sync?", from: ["Marcus Lee", "marcus@acmecorp.com"], ago: 5, unread: 1, req: 1, mtg: 1,
    body: "Hey, something came up on Tuesday. Could we move our sync to Wednesday or Thursday afternoon? Any slot after 2pm works for me.",
    c: "assistant_action", conf: 0.94, r: "Routine scheduling request. The assistant can propose times from the calendar.", sig: ["reschedule", "calendar", "availability"],
    sum: "Marcus Lee asks to move Tuesday's sync to Wednesday or Thursday after 2pm.",
    dates: [["Sync with Marcus (to be rescheduled)", 4, "meeting"]], act: ["Offer Wednesday/Thursday slots after 2pm"] },
  { subject: "Invoice #4821 – Cloudscale – due Nov 30", from: ["Cloudscale Billing", "billing@cloudscale.example"], ago: 20, req: 1,
    body: "Your invoice #4821 for $2,340.00 is attached and due on November 30. Please confirm the PO number so we can process payment on schedule.",
    c: "assistant_action", conf: 0.88, r: "Administrative invoice. The assistant can confirm the PO and route it to finance.", sig: ["invoice", "payment due", "PO number"],
    sum: "Cloudscale invoice #4821 ($2,340) is due Nov 30 and needs a PO number confirmed.",
    dates: [["Invoice #4821 due", 15, "deadline"]], act: ["Confirm PO number", "Forward to finance"] },
  { subject: "Intro: {{c}} <> Elena Park (Lumen Capital)", from: ["Sofia Alvarez", "sofia@mentorsnetwork.org"], ago: 26, unread: 1, imp: 1, req: 1,
    body: "{{c}}, I'd like you to meet Elena Park, a partner at Lumen Capital who has backed several infra companies. I think a conversation would be valuable for both of you. Elena, meet {{c}}.",
    c: "client_action", conf: 0.82, r: "Personal introduction from a mentor. Whether and how to engage is the client's call.", sig: ["personal intro", "investor", "relationship"],
    sum: "Sofia Alvarez introduced {{c}} to Elena Park of Lumen Capital and suggests they talk.",
    act: ["Reply to thank Sofia and respond to Elena"] },
  { subject: "Board meeting prep – investor deck review", from: ["Tom Becker", "tom@northwindlabs.com"], ago: 9, imp: 1, req: 1, mtg: 1,
    body: "Deck v3 is in the shared folder. Can you review slides 8-14 (financials) before Monday's board meeting? I flagged two numbers I'm not sure about.",
    c: "client_action", conf: 0.79, r: "Asks the client to personally review financials before the board meeting.", sig: ["review request", "board meeting", "financials"],
    sum: "Tom Becker needs {{c}} to review the financial slides (8-14) of the investor deck before Monday's board meeting.",
    dates: [["Board meeting", 6, "meeting"]], act: ["Review slides 8-14"] },
  { subject: "Quick question about the NDA", from: ["Ravi Menon", "ravi@zenithsystems.io"], ago: 14, unread: 1,
    body: "Hi, before we proceed, can you confirm whether clause 7 on IP ownership is negotiable? We'd like to move quickly if possible.",
    c: "assistant_action", conf: 0.58, r: "Could be routine follow-up, but it concerns legal wording that may need the client's decision.", sig: ["NDA", "ambiguous ownership", "low confidence"],
    sum: "Ravi Menon asks whether clause 7 (IP ownership) of the NDA is negotiable.", act: ["Check with {{c}} whether clause 7 can change"] },
  { subject: "Re: Offsite venue options", from: ["Hannah Cole", "hannah@venuefinder.example"], ago: 30, mtg: 1,
    body: "We have two options for the team offsite: Lakeside Lodge (Dec 12) and The Granary (Dec 19). Both fit 25 people. Let me know your preference.",
    thread: [{ out: 1, ago: 22, body: "Thanks Hannah. Could you hold Dec 12 at Lakeside Lodge while I confirm with the team?" }],
    c: "waiting", conf: 0.9, r: "The client asked the venue to hold a date. Waiting on their confirmation.", sig: ["hold request", "awaiting confirmation"],
    sum: "Hannah offered two offsite venues; {{c}} asked her to hold Dec 12 at Lakeside Lodge and is waiting for confirmation.",
    dates: [["Follow up on venue hold", 2, "followup"], ["Team offsite (proposed)", 27, "meeting"]] },
  { subject: "Re: Q3 expense report", from: ["Neil Foster", "neil@northwindlabs.com"], ago: 40, req: 1,
    body: "Your Q3 report is missing receipts for two travel items (Aug 14 and Aug 22). Please send them over when you can.",
    thread: [{ out: 1, ago: 28, body: "Thanks Neil, my assistant will send those receipts over this week." }],
    c: "waiting", conf: 0.87, r: "A reply promising receipts was already sent. Pending follow-through.", sig: ["pending deliverable", "receipts"],
    sum: "Neil Foster needs receipts for two August travel items; {{c}} said they would be sent this week.",
    dates: [["Send receipts to Neil", 2, "followup"]], act: ["Send receipts for Aug 14 and Aug 22"] },
  { subject: "Following up: candidate interview feedback", from: ["Sana Khan", "sana@northwindlabs.com"], ago: 11, req: 1,
    body: "Hi, can someone collect interview feedback for the senior backend candidate by Thursday? We'd like to make a decision before the weekend.",
    c: "assistant_action", conf: 0.86, r: "Administrative coordination. The assistant can collect and compile feedback.", sig: ["collect feedback", "deadline: Thursday"],
    sum: "Sana Khan asks for interview feedback on the senior backend candidate by Thursday.",
    dates: [["Interview feedback due", 4, "deadline"]], act: ["Collect feedback from interviewers"] },
  { subject: "Lunch next week?", from: ["Aarav Sharma", "aarav.sharma@mail.example"], ago: 18, unread: 1,
    body: "Hey {{c}}! I'm in town Tuesday through Thursday. Free for lunch? It's been ages.",
    c: "client_action", conf: 0.74, r: "Personal social invitation. Only the client can accept.", sig: ["personal", "social invite"],
    sum: "Friend Aarav Sharma is in town Tue-Thu and invites {{c}} for lunch.", act: ["Accept or decline lunch"] },
  { subject: "Dentist appointment confirmation – Thu 4:30 PM", from: ["Smile Dental", "reminders@smiledental.example"], ago: 8, mtg: 1,
    body: "This is a reminder of your appointment on Thursday at 4:30 PM with Dr. Patel. Reply C to confirm or call us to reschedule.",
    c: "fyi", conf: 0.85, r: "Automated appointment reminder. Add to calendar, no reply required.", sig: ["automated", "appointment"],
    sum: "Reminder for a dental appointment Thursday at 4:30 PM.", dates: [["Dentist appointment", 4, "meeting"]] },
  { subject: "Flight itinerary updated – BLR → SFO", from: ["SkyJet Airways", "no-reply@skyjet.example"], ago: 33, mtg: 1,
    body: "Your itinerary has been updated. Departure: Nov 24, 02:15 from BLR. Arrival: Nov 24, 08:40 at SFO. No action is required.",
    c: "fyi", conf: 0.93, r: "Automated itinerary update with no action required.", sig: ["no-reply sender", "itinerary"],
    sum: "SkyJet updated the BLR→SFO flight on Nov 24 (departs 02:15).", dates: [["Flight BLR → SFO", 9, "meeting"]] },
  { subject: "Security alert: new sign-in to your account", from: ["Accounts Team", "no-reply@accounts.example"], ago: 6,
    body: "We noticed a new sign-in from a Chrome browser on Windows. If this was you, you can ignore this message.",
    c: "fyi", conf: 0.97, r: "Automated security notification.", sig: ["automated", "notification"], sum: "A new sign-in notification. No action unless it wasn't you." },
  { subject: "Product Weekly: 10 ways teams ship faster", from: ["Product Weekly", "hello@productweekly.example"], ago: 50,
    body: "This week: roadmaps that survive contact with reality, the case for smaller releases, and a teardown of a great onboarding flow. Unsubscribe anytime.",
    c: "fyi", conf: 0.98, r: "Newsletter. No reply needed.", sig: ["newsletter", "unsubscribe link"], sum: "Weekly product newsletter." },
  { subject: "Webinar: scaling infra on a budget", from: ["InfraConf", "events@infraconf.example"], ago: 60,
    body: "Join us Dec 3 for a free webinar on scaling infrastructure without breaking the bank. Register now.",
    c: "fyi", conf: 0.95, r: "Promotional invitation. No reply needed.", sig: ["promotion", "webinar"], sum: "Promotional webinar invite for Dec 3." },
];

const OUTLOOK = [
  { subject: "Teams: Weekly leadership sync – agenda", from: ["Tom Becker", "tom@northwindlabs.com"], ago: 4, unread: 1, req: 1, mtg: 1,
    body: "Can someone compile the agenda for tomorrow's leadership sync? Please include hiring, the Q4 roadmap, and the budget update.",
    c: "assistant_action", conf: 0.9, r: "Meeting logistics that the assistant can prepare.", sig: ["agenda", "meeting prep"],
    sum: "Tom Becker asks for tomorrow's leadership sync agenda (hiring, Q4 roadmap, budget).",
    dates: [["Leadership sync", 1, "meeting"]], act: ["Compile agenda"] },
  { subject: "Contract renewal – Zenith Systems", from: ["Neha Kapoor", "neha@zenithsystems.io"], ago: 12, unread: 1, imp: 1, req: 1,
    body: "Our contract expires Dec 31. We'd like to renew for 24 months at a 6% increase. Could you confirm if these terms work for {{c}}?",
    c: "client_action", conf: 0.93, r: "Contract renewal terms require the client's approval.", sig: ["contract renewal", "pricing change"],
    sum: "Zenith Systems proposes a 24-month renewal at +6% and needs {{c}}'s approval before Dec 31.",
    dates: [["Contract expires", 46, "deadline"]], act: ["Approve or negotiate renewal terms"] },
  { subject: "Customer escalation – Orbit Retail", from: ["Priyanka Das", "priyanka@northwindlabs.com"], ago: 2, unread: 1, imp: 1, req: 1,
    body: "Orbit Retail is threatening to cancel after two outages this month. Their COO asked to speak with {{c}} directly. Can you call them today?",
    c: "client_action", conf: 0.89, r: "A key customer asked for a personal conversation with the client.", sig: ["escalation", "customer churn risk", "urgent"],
    sum: "Orbit Retail may cancel after two outages and their COO wants to speak with {{c}} today.",
    dates: [["Call Orbit Retail COO", 0, "deadline"]], act: ["Call Orbit's COO today"] },
  { subject: "Conference speaker invite – DevSummit 2027", from: ["DevSummit Team", "speakers@devsummit.example"], ago: 70, unread: 1,
    body: "We'd love for you to speak at DevSummit 2027 in Austin. Reply to this message with your interest and availability.",
    c: "client_action", conf: 0.66, r: "Could be personal outreach or mass invitation. Needs a human look.", sig: ["invitation", "possible mass mail", "low confidence"],
    sum: "DevSummit invites {{c}} to speak at their 2027 conference." },
  { subject: "Travel reimbursement approved", from: ["Finance Team", "finance@northwindlabs.com"], ago: 55,
    body: "Your travel reimbursement of $842.15 has been approved and will be paid with the next payroll run.",
    c: "fyi", conf: 0.9, r: "Status notification. No action required.", sig: ["approved", "notification"], sum: "Travel reimbursement of $842.15 approved." },
  { subject: "Out of office: Marcus Lee", from: ["Marcus Lee", "marcus@acmecorp.com"], ago: 24,
    body: "I'm out of office until Nov 20 with limited access to email. For urgent matters, contact my colleague Dana.",
    c: "fyi", conf: 0.99, r: "Automatic out-of-office reply.", sig: ["auto-reply"], sum: "Marcus Lee is out of office until Nov 20." },
];

export const INCOMING = [
  { mode: "new", subject: "Can you approve the revised Q1 budget?", from: ["Karen Liu", "karen@northwindlabs.com"],
    body: "Hi {{c}}, finance revised the Q1 budget (+8% on engineering). I need your explicit approval before I can release funds. Can you confirm by tomorrow?" },
  { mode: "new", subject: "Courier delivery tomorrow 11am", from: ["Delivery Updates", "no-reply@courier.example"],
    body: "Your package will be delivered tomorrow between 11:00 and 12:00. This is an automated notification. No action is needed." },
  { mode: "new", subject: "Meeting request: product demo next Wednesday", from: ["Alisha Menon", "alisha@lumencapital.example"],
    body: "Hello, could we schedule a 30 minute product demo next Wednesday afternoon? Please share your availability and we will send a calendar invite." },
  { mode: "reply", match: "Offsite venue", from: ["Hannah Cole", "hannah@venuefinder.example"],
    body: "Good news! We can hold Dec 12 until Friday. Do you want us to send the contract over for {{c}}'s signature?" },
  { mode: "reply", match: "Q3 expense report", from: ["Neil Foster", "neil@northwindlabs.com"],
    body: "Receipts received, thank you. Everything looks good and the report is closed. No further action needed." },
];

export function buildEmails({ provider, assistantId, client, connectionId }) {
  const now = Date.now();
  const first = client.name.split(" ")[0];
  const fill = (s) => (typeof s === "string" ? s.replaceAll("{{c}}", first) : s);
  const me = { name: client.name, email: client.email };
  const list = provider === "outlook" ? OUTLOOK : GMAIL;

  return list.map((s, i) => {
    const from = { name: s.from[0], email: s.from[1] };
    const inbound = { from, to: [me], body: fill(s.body), sentAt: new Date(now - s.ago * H), isFromClient: false };
    const later = (s.thread || []).map((m) => ({
      from: m.out ? me : from, to: m.out ? [from] : [me], body: fill(m.body),
      sentAt: new Date(now - m.ago * H), isFromClient: !!m.out, sentBy: m.out ? "assistant" : undefined,
    }));
    const messages = [inbound, ...later].sort((a, b) => a.sentAt - b.sentAt);
    const last = messages[messages.length - 1];
    return {
      assistantId, clientId: client._id, connectionId, provider,
      threadId: `${provider}-${i}-${now}`, subject: fill(s.subject), participants: [from, me], messages,
      lastMessageAt: last.sentAt, lastFromName: last.from.name, snippet: last.body.slice(0, 120),
      isUnread: !!s.unread, isImportant: !!s.imp,
      triage: { category: s.c, confidence: s.conf, reason: fill(s.r), signals: s.sig || [], needsReview: s.conf < 0.7, source: "seed", classifiedAt: new Date(), history: [] },
      ai: {
        summary: fill(s.sum), hasMeeting: !!s.mtg, requiresAction: !!s.req && s.c !== "fyi",
        actionItems: (s.act || []).map(fill),
        extractedDates: (s.dates || []).map((d) => ({ label: d[0], date: new Date(now + d[1] * D), type: d[2] })),
      },
    };
  });
}
