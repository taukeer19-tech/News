/**
 * Firestore abstraction layer.
 *
 * Strategy:
 *  - In DEVELOPMENT (NODE_ENV !== 'production')  → local JSON mock (tmp/local_db.json)
 *  - In PRODUCTION (Vercel)                       → Firebase Admin Firestore
 *
 * The public API is identical in both modes so no other files need changing.
 */

import fs from "fs";
import path from "path";

const IS_PROD = process.env.NODE_ENV === "production";

// ─── Local JSON helpers (development only) ───────────────────────────────────

const DB_PATH = path.join(process.cwd(), "tmp", "local_db.json");

function readDb(): any {
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      users: [], contacts: [], campaigns: [], smtpConfigs: [],
      contactLists: [], contactListContacts: [], templates: [],
      workspaces: [], auditLogs: [], invitations: [],
    };
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    return {
      users: [], contacts: [], campaigns: [], smtpConfigs: [],
      contactLists: [], contactListContacts: [], templates: [],
      workspaces: [], auditLogs: [], invitations: [],
    };
  }
}

function writeDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ─── Firestore helper (production only) ──────────────────────────────────────

function getDb() {
  const { getAdminFirestore } = require("./firebase-admin");
  return getAdminFirestore();
}

// ─── Generic Firestore helpers ────────────────────────────────────────────────

async function fsGetAll(collection: string, userId?: string): Promise<any[]> {
  const db = getDb();
  let query: any = db.collection(collection);
  if (userId) query = query.where("userId", "==", userId);
  const snap = await query.get();
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
}

async function fsAdd(collection: string, data: any): Promise<any> {
  const db = getDb();
  const ref = await db.collection(collection).add({ ...data, createdAt: new Date().toISOString() });
  return { id: ref.id, ...data, createdAt: new Date().toISOString() };
}

async function fsGet(collection: string, id: string): Promise<any | null> {
  const db = getDb();
  const doc = await db.collection(collection).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function fsUpdate(collection: string, id: string, data: any): Promise<any> {
  const db = getDb();
  await db.collection(collection).doc(id).update({ ...data, updatedAt: new Date().toISOString() });
  return fsGet(collection, id);
}

async function fsDelete(collection: string, id: string): Promise<boolean> {
  const db = getDb();
  const doc = await db.collection(collection).doc(id).get();
  if (!doc.exists) return false;
  await db.collection(collection).doc(id).delete();
  return true;
}

// ─── Exported firestore object ────────────────────────────────────────────────

export const firestore = {
  // ── Contacts ────────────────────────────────────────────────────────────────

  async addContact(userId: string, data: any) {
    if (!IS_PROD) {
      const db = readDb();
      const newContact = { id: `contact_${Date.now()}`, userId, ...data, createdAt: new Date().toISOString() };
      if (!db.contacts) db.contacts = [];
      db.contacts.push(newContact);
      writeDb(db);
      return newContact;
    }
    return fsAdd("contacts", { userId, ...data });
  },

  async getContacts(userId: string, listId?: string) {
    if (!IS_PROD) {
      const db = readDb();
      let contacts = (db.contacts || []).filter((c: any) => c.userId === userId);
      if (listId) {
        const associations = db.contactListContacts || [];
        const ids = associations.filter((a: any) => a.listId === listId).map((a: any) => a.contactId);
        contacts = contacts.filter((c: any) => ids.includes(c.id));
      }
      return contacts;
    }
    const all = await fsGetAll("contacts", userId);
    if (listId) {
      const db = getDb();
      const snap = await db.collection("contactListContacts").where("listId", "==", listId).get();
      const ids = new Set(snap.docs.map((d: any) => d.data().contactId));
      return all.filter((c: any) => ids.has(c.id));
    }
    return all;
  },

  async updateContact(contactId: string, data: any) {
    if (!IS_PROD) {
      const db = readDb();
      const index = db.contacts.findIndex((c: any) => c.id === contactId);
      if (index === -1) return null;
      db.contacts[index] = { ...db.contacts[index], ...data };
      writeDb(db);
      return db.contacts[index];
    }
    return fsUpdate("contacts", contactId, data);
  },

  async deleteContact(contactId: string) {
    if (!IS_PROD) {
      const db = readDb();
      const before = db.contacts.length;
      db.contacts = db.contacts.filter((c: any) => c.id !== contactId);
      if (db.contacts.length === before) return false;
      writeDb(db);
      return true;
    }
    return fsDelete("contacts", contactId);
  },

  // ── Campaigns ───────────────────────────────────────────────────────────────

  async addCampaign(userId: string, data: any) {
    if (!IS_PROD) {
      const db = readDb();
      const newCampaign = { id: `camp_${Date.now()}`, userId, ...data, status: data.status || "draft", createdAt: new Date().toISOString() };
      db.campaigns.push(newCampaign);
      writeDb(db);
      return newCampaign;
    }
    return fsAdd("campaigns", { userId, ...data, status: data.status || "draft" });
  },

  async getCampaigns(userId: string) {
    if (!IS_PROD) {
      const db = readDb();
      return (db.campaigns || []).filter((c: any) => c.userId === userId).map((c: any) => ({
        ...c, _count: { recipients: c.totalRecipients || 0 },
      }));
    }
    const all = await fsGetAll("campaigns", userId);
    return all.map((c: any) => ({ ...c, _count: { recipients: c.totalRecipients || 0 } }));
  },

  async getCampaignById(userId: string, campaignId: string) {
    if (!IS_PROD) {
      const db = readDb();
      const campaign = (db.campaigns || []).find((c: any) => c.id === campaignId && c.userId === userId);
      if (!campaign) return null;
      const smtpConfig = (db.smtpConfigs || []).find((s: any) => s.id === campaign.smtpConfigId);
      return { ...campaign, smtpConfig: smtpConfig ? { name: smtpConfig.name } : null, _count: { recipients: campaign.totalRecipients || 0 } };
    }
    const campaign = await fsGet("campaigns", campaignId);
    if (!campaign || campaign.userId !== userId) return null;
    let smtpConfig = null;
    if (campaign.smtpConfigId) {
      const s = await fsGet("smtpConfigs", campaign.smtpConfigId);
      smtpConfig = s ? { name: s.name } : null;
    }
    return { ...campaign, smtpConfig, _count: { recipients: campaign.totalRecipients || 0 } };
  },

  async deleteCampaign(campaignId: string) {
    if (!IS_PROD) {
      const db = readDb();
      const before = (db.campaigns || []).length;
      db.campaigns = (db.campaigns || []).filter((c: any) => c.id !== campaignId);
      if (db.campaigns.length === before) return false;
      writeDb(db);
      return true;
    }
    return fsDelete("campaigns", campaignId);
  },

  async getCampaignReport(userId: string, campaignId: string) {
    const campaign = await this.getCampaignById(userId, campaignId);
    if (!campaign) return null;
    return {
      campaign,
      stats: { total: campaign.totalRecipients || 0, sent: campaign.sent || 0, opened: campaign.opened || 0, clicked: campaign.clicked || 0, bounced: 0, pending: 0 },
      chartData: [{ date: new Date().toISOString().split("T")[0], activity: campaign.sent || 0 }],
      recipients: [],
    };
  },

  async getRecentCampaigns(userId: string, count = 5) {
    const campaigns = await this.getCampaigns(userId);
    return campaigns.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)).slice(0, count);
  },

  async getCampaignsForProcessing() {
    const now = new Date().toISOString();
    if (!IS_PROD) {
      const db = readDb();
      return (db.campaigns || []).filter((c: any) => 
        ["scheduled", "sending"].includes(c.status) && 
        c.scheduledAt && c.scheduledAt <= now
      ).map((c: any) => {
        const smtp = (db.smtpConfigs || []).find((s: any) => s.id === c.smtpConfigId);
        const template = (db.templates || []).find((t: any) => t.id === c.templateId);
        return { ...c, smtpConfig: smtp, template };
      });
    }
    const db = getDb();
    const snap = await db.collection("campaigns")
      .where("status", "in", ["scheduled", "sending"])
      .where("scheduledAt", "<=", now)
      .get();
    
    return Promise.all(snap.docs.map(async (d: any) => {
      const data = d.data();
      let smtpConfig = null;
      let template = null;
      if (data.smtpConfigId) smtpConfig = await fsGet("smtpConfigs", data.smtpConfigId);
      if (data.templateId) template = await fsGet("templates", data.templateId);
      return { id: d.id, ...data, smtpConfig, template };
    }));
  },

  async getPendingRecipients(campaignId: string, limit?: number) {
    if (!IS_PROD) {
      const db = readDb();
      let recipients = (db.campaignRecipients || []).filter((r: any) => 
        r.campaignId === campaignId && r.status === "pending"
      );
      if (limit) recipients = recipients.slice(0, limit);
      return recipients.map((r: any) => {
        const contact = (db.contacts || []).find((c: any) => c.id === r.contactId);
        return { ...r, contact };
      });
    }
    const db = getDb();
    let query: any = db.collection("campaignRecipients")
      .where("campaignId", "==", campaignId)
      .where("status", "==", "pending");
    
    if (limit) query = query.limit(limit);
    const snap = await query.get();
    
    return Promise.all(snap.docs.map(async (d: any) => {
      const data = d.data();
      const contact = await fsGet("contacts", data.contactId);
      return { id: d.id, ...data, contact };
    }));
  },

  async updateCampaignRecipient(recipientId: string, data: any) {
    if (!IS_PROD) {
      const db = readDb();
      const idx = (db.campaignRecipients || []).findIndex((r: any) => r.id === recipientId);
      if (idx === -1) return null;
      db.campaignRecipients[idx] = { ...db.campaignRecipients[idx], ...data };
      writeDb(db);
      return db.campaignRecipients[idx];
    }
    return fsUpdate("campaignRecipients", recipientId, data);
  },

  async countPendingRecipients(campaignId: string) {
    if (!IS_PROD) {
      const db = readDb();
      return (db.campaignRecipients || []).filter((r: any) => 
        r.campaignId === campaignId && r.status === "pending"
      ).length;
    }
    const db = getDb();
    const snap = await db.collection("campaignRecipients")
      .where("campaignId", "==", campaignId)
      .where("status", "==", "pending")
      .count()
      .get();
    return snap.data().count;
  },

  async updateCampaign(campaignId: string, data: any) {
    if (!IS_PROD) {
      const db = readDb();
      const idx = (db.campaigns || []).findIndex((c: any) => c.id === campaignId);
      if (idx === -1) return null;
      db.campaigns[idx] = { ...db.campaigns[idx], ...data };
      writeDb(db);
      return db.campaigns[idx];
    }
    return fsUpdate("campaigns", campaignId, data);
  },

  // ── SMTP Configs ─────────────────────────────────────────────────────────────

  async addSmtpConfig(userId: string, data: any) {
    if (!IS_PROD) {
      const db = readDb();
      const newConfig = { id: `smtp_${Date.now()}`, userId, ...data, isActive: data.isActive !== undefined ? data.isActive : true, createdAt: new Date().toISOString() };
      db.smtpConfigs.push(newConfig);
      writeDb(db);
      return newConfig;
    }
    return fsAdd("smtpConfigs", { userId, ...data, isActive: data.isActive !== undefined ? data.isActive : true });
  },

  async getSmtpConfigs(userId: string) {
    if (!IS_PROD) {
      const db = readDb();
      return db.smtpConfigs.filter((c: any) => c.userId === userId);
    }
    return fsGetAll("smtpConfigs", userId);
  },

  async getSmtpConfigById(userId: string, configId: string) {
    if (!IS_PROD) {
      const db = readDb();
      return (db.smtpConfigs || []).find((c: any) => c.id === configId && c.userId === userId) || null;
    }
    const config = await fsGet("smtpConfigs", configId);
    return config?.userId === userId ? config : null;
  },

  async updateSmtpConfig(configId: string, data: any) {
    if (!IS_PROD) {
      const db = readDb();
      const index = db.smtpConfigs.findIndex((c: any) => c.id === configId);
      if (index === -1) return null;
      db.smtpConfigs[index] = { ...db.smtpConfigs[index], ...data };
      writeDb(db);
      return db.smtpConfigs[index];
    }
    return fsUpdate("smtpConfigs", configId, data);
  },

  async deleteSmtpConfig(configId: string) {
    if (!IS_PROD) {
      const db = readDb();
      const before = db.smtpConfigs.length;
      db.smtpConfigs = db.smtpConfigs.filter((c: any) => c.id !== configId);
      if (db.smtpConfigs.length === before) return false;
      writeDb(db);
      return true;
    }
    return fsDelete("smtpConfigs", configId);
  },

  // ── Contact Lists ─────────────────────────────────────────────────────────────

  async getContactLists(userId: string) {
    if (!IS_PROD) {
      const db = readDb();
      return (db.contactLists || []).filter((l: any) => l.userId === userId).map((l: any) => {
        const associations = db.contactListContacts || [];
        const count = associations.filter((a: any) => a.listId === l.id).length;
        return { ...l, _count: { contacts: count } };
      });
    }
    const lists = await fsGetAll("contactLists", userId);
    const db = getDb();
    return Promise.all(lists.map(async (l: any) => {
      const snap = await db.collection("contactListContacts").where("listId", "==", l.id).get();
      return { ...l, _count: { contacts: snap.size } };
    }));
  },

  async getContactListById(userId: string, listId: string) {
    if (!IS_PROD) {
      const db = readDb();
      const list = (db.contactLists || []).find((l: any) => l.id === listId && l.userId === userId);
      if (!list) return null;
      const associations = db.contactListContacts || [];
      const contactIds = associations.filter((a: any) => a.listId === listId).map((a: any) => a.contactId);
      const contacts = db.contacts.filter((c: any) => contactIds.includes(c.id));
      return { ...list, contacts: contacts.map((c: any) => ({ contact: c })), _count: { contacts: contacts.length } };
    }
    const list = await fsGet("contactLists", listId);
    if (!list || list.userId !== userId) return null;
    const db = getDb();
    const snap = await db.collection("contactListContacts").where("listId", "==", listId).get();
    const contactIds = snap.docs.map((d: any) => d.data().contactId);
    const contacts = await Promise.all(contactIds.map((id: string) => fsGet("contacts", id)));
    return { ...list, contacts: contacts.filter(Boolean).map((c: any) => ({ contact: c })), _count: { contacts: contactIds.length } };
  },

  async updateContactList(userId: string, listId: string, data: any) {
    if (!IS_PROD) {
      const db = readDb();
      const index = (db.contactLists || []).findIndex((l: any) => l.id === listId && l.userId === userId);
      if (index === -1) return null;
      db.contactLists[index] = { ...db.contactLists[index], ...data };
      writeDb(db);
      return db.contactLists[index];
    }
    const list = await fsGet("contactLists", listId);
    if (!list || list.userId !== userId) return null;
    return fsUpdate("contactLists", listId, data);
  },

  async deleteContactList(userId: string, listId: string) {
    if (!IS_PROD) {
      const db = readDb();
      db.contactLists = (db.contactLists || []).filter((l: any) => !(l.id === listId && l.userId === userId));
      db.contactListContacts = (db.contactListContacts || []).filter((a: any) => a.listId !== listId);
      writeDb(db);
      return true;
    }
    const fsDb = getDb();
    const snap = await fsDb.collection("contactListContacts").where("listId", "==", listId).get();
    const batch = fsDb.batch();
    snap.docs.forEach((d: any) => batch.delete(d.ref));
    batch.delete(fsDb.collection("contactLists").doc(listId));
    await batch.commit();
    return true;
  },

  async addContactList(userId: string, data: any) {
    if (!IS_PROD) {
      const db = readDb();
      const newList = { id: `list_${Date.now()}`, userId, ...data, createdAt: new Date().toISOString() };
      if (!db.contactLists) db.contactLists = [];
      db.contactLists.push(newList);
      writeDb(db);
      return newList;
    }
    return fsAdd("contactLists", { userId, ...data });
  },

  async addContactToList(userId: string, listId: string, contactId: string) {
    if (!IS_PROD) {
      const db = readDb();
      if (!db.contactListContacts) db.contactListContacts = [];
      const exists = db.contactListContacts.some((a: any) => a.listId === listId && a.contactId === contactId);
      if (exists) { const err = new Error("Contact is already in this list"); (err as any).code = "P2002"; throw err; }
      const assoc = { id: `clc_${Date.now()}`, listId, contactId };
      db.contactListContacts.push(assoc);
      writeDb(db);
      return assoc;
    }
    const fsDb = getDb();
    const existing = await fsDb.collection("contactListContacts").where("listId", "==", listId).where("contactId", "==", contactId).get();
    if (!existing.empty) { const err = new Error("Contact is already in this list"); (err as any).code = "P2002"; throw err; }
    return fsAdd("contactListContacts", { listId, contactId });
  },

  async removeContactFromList(userId: string, listId: string, contactId: string) {
    if (!IS_PROD) {
      const db = readDb();
      const before = (db.contactListContacts || []).length;
      db.contactListContacts = (db.contactListContacts || []).filter((a: any) => !(a.listId === listId && a.contactId === contactId));
      if (db.contactListContacts.length === before) return false;
      writeDb(db);
      return true;
    }
    const fsDb = getDb();
    const snap = await fsDb.collection("contactListContacts").where("listId", "==", listId).where("contactId", "==", contactId).get();
    if (snap.empty) return false;
    await snap.docs[0].ref.delete();
    return true;
  },

  // ── Templates ────────────────────────────────────────────────────────────────

  async getTemplates(workspaceId: string) {
    if (!IS_PROD) {
      const db = readDb();
      return (db.templates || []).filter((t: any) => t.workspaceId === workspaceId || !t.workspaceId);
    }
    const fsDb = getDb();
    const snap = await fsDb.collection("templates").get();
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  },

  async addTemplate(userId: string, data: any) {
    if (!IS_PROD) {
      const db = readDb();
      const newTemplate = { id: `tpl_${Date.now()}`, userId, ...data, createdAt: new Date().toISOString() };
      if (!db.templates) db.templates = [];
      db.templates.push(newTemplate);
      writeDb(db);
      return newTemplate;
    }
    return fsAdd("templates", { userId, ...data });
  },

  // ── Dashboard metrics ─────────────────────────────────────────────────────────

  async getDashboardMetrics(userId: string) {
    const contacts = await this.getContacts(userId);
    const campaigns = await this.getRecentCampaigns(userId, 50);
    return {
      totalContacts: contacts.length,
      totalCampaigns: campaigns.length,
      unsubscribes: contacts.filter((c: any) => c.unsubscribed).length,
      recentCampaigns: campaigns.map((camp: any) => ({
        ...camp, sent: camp.sent || 0, opened: camp.opened || 0,
        clicked: camp.clicked || 0, totalRecipients: camp.totalRecipients || 0,
        _count: { recipients: camp.totalRecipients || 0 },
      })),
    };
  },

  // ── Workspace ─────────────────────────────────────────────────────────────────

  async getWorkspace(workspaceId: string) {
    if (!IS_PROD) {
      const db = readDb();
      return (db.workspaces || []).find((w: any) => w.id === workspaceId) || null;
    }
    return fsGet("workspaces", workspaceId);
  },

  async createWorkspace(userId: string, name: string) {
    if (!IS_PROD) {
      const db = readDb();
      if (!db.workspaces) db.workspaces = [];
      const ws = { id: `ws_${Date.now()}`, name, ownerId: userId, createdAt: new Date().toISOString() };
      db.workspaces.push(ws);
      writeDb(db);
      return ws;
    }
    return fsAdd("workspaces", { name, ownerId: userId });
  },

  // ── Team Members ──────────────────────────────────────────────────────────────

  async getWorkspaceMembers(workspaceId: string) {
    if (!IS_PROD) {
      const db = readDb();
      return (db.users || []).filter((u: any) => u.workspaceId === workspaceId);
    }
    return fsGetAll("users");
  },

  async updateMemberRole(workspaceId: string, memberId: string, role: string) {
    if (!IS_PROD) {
      const db = readDb();
      const idx = db.users.findIndex((u: any) => u.id === memberId && u.workspaceId === workspaceId);
      if (idx === -1) return null;
      db.users[idx].role = role;
      writeDb(db);
      return db.users[idx];
    }
    return fsUpdate("users", memberId, { role });
  },

  async removeWorkspaceMember(workspaceId: string, memberId: string) {
    if (!IS_PROD) {
      const db = readDb();
      const idx = db.users.findIndex((u: any) => u.id === memberId && u.workspaceId === workspaceId);
      if (idx === -1) return false;
      db.users[idx].workspaceId = null;
      writeDb(db);
      return true;
    }
    return fsUpdate("users", memberId, { workspaceId: null }).then(() => true).catch(() => false);
  },

  async createUser(data: { email: string; passwordHash: string; role: string; workspaceId: string | null; name?: string }) {
    if (!IS_PROD) {
      const db = readDb();
      if (!db.users) db.users = [];
      const exists = db.users.some((u: any) => u.email === data.email);
      if (exists) throw new Error("User with this email already exists");
      const newUser = { id: `user_${Date.now()}`, email: data.email, name: data.name || null, password: data.passwordHash, role: data.role, workspaceId: data.workspaceId, status: "approved", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.users.push(newUser);
      writeDb(db);
      return newUser;
    }
    return fsAdd("users", { email: data.email, name: data.name || null, password: data.passwordHash, role: data.role, workspaceId: data.workspaceId, status: "approved" });
  },

  async updateUser(userId: string, data: any) {
    if (!IS_PROD) {
      const db = readDb();
      const idx = db.users.findIndex((u: any) => u.id === userId);
      if (idx === -1) return null;
      db.users[idx] = { ...db.users[idx], ...data, updatedAt: new Date().toISOString() };
      writeDb(db);
      return db.users[idx];
    }
    return fsUpdate("users", userId, data);
  },

  // ── Invitations ───────────────────────────────────────────────────────────────

  async createInvitation(workspaceId: string, email: string, role: string, token: string) {
    if (!IS_PROD) {
      const db = readDb();
      if (!db.invitations) db.invitations = [];
      db.invitations = db.invitations.filter((i: any) => !(i.workspaceId === workspaceId && i.email === email));
      const invitation = { id: `inv_${Date.now()}`, workspaceId, email, role, token, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), acceptedAt: null, createdAt: new Date().toISOString() };
      db.invitations.push(invitation);
      writeDb(db);
      return invitation;
    }
    return fsAdd("invitations", { workspaceId, email, role, token, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), acceptedAt: null });
  },

  async getInvitationByToken(token: string) {
    if (!IS_PROD) {
      const db = readDb();
      return (db.invitations || []).find((i: any) => i.token === token) || null;
    }
    const fsDb = getDb();
    const snap = await fsDb.collection("invitations").where("token", "==", token).get();
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  },

  async getWorkspaceInvitations(workspaceId: string) {
    if (!IS_PROD) {
      const db = readDb();
      return (db.invitations || []).filter((i: any) => i.workspaceId === workspaceId);
    }
    const fsDb = getDb();
    const snap = await fsDb.collection("invitations").where("workspaceId", "==", workspaceId).get();
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  },

  // ── Audit Logs ────────────────────────────────────────────────────────────────

  async addAuditLog(data: { userId: string; workspaceId: string; action: string; entityType: string; entityId: string; metadata?: Record<string, any>; createdAt?: string }) {
    if (!IS_PROD) {
      const db = readDb();
      if (!db.auditLogs) db.auditLogs = [];
      const log = { id: `log_${Date.now()}`, ...data, createdAt: data.createdAt || new Date().toISOString() };
      db.auditLogs.unshift(log);
      if (db.auditLogs.length > 500) db.auditLogs = db.auditLogs.slice(0, 500);
      writeDb(db);
      return log;
    }
    return fsAdd("auditLogs", data);
  },

  async getAuditLogs(workspaceId: string, limit = 50) {
    if (!IS_PROD) {
      const db = readDb();
      return (db.auditLogs || []).filter((l: any) => l.workspaceId === workspaceId).slice(0, limit);
    }
    const fsDb = getDb();
    const snap = await fsDb.collection("auditLogs").where("workspaceId", "==", workspaceId).orderBy("createdAt", "desc").limit(limit).get();
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  },

  async getWorkspaceSmtp(workspaceId: string) {
    if (!IS_PROD) {
      const db = readDb();
      const workspace = (db.workspaces || []).find((w: any) => w.id === workspaceId);
      if (!workspace) return null;
      const smtpConfigs = (db.smtpConfigs || []).filter((c: any) => c.userId === workspace.ownerId && c.isActive);
      return smtpConfigs[0] || null;
    }
    const workspace = await fsGet("workspaces", workspaceId);
    if (!workspace) return null;
    const fsDb = getDb();
    const snap = await fsDb.collection("smtpConfigs").where("userId", "==", workspace.ownerId).where("isActive", "==", true).limit(1).get();
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  },
};
