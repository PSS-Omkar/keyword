import {
  users,
  projects,
  campaigns,
  campaignGroups,
  advertisers,
  keywords,
  trafficSources,
  metaCampaigns,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Campaign,
  type InsertCampaign,
  type CampaignGroup,
  type InsertCampaignGroup,
  type Advertiser,
  type InsertAdvertiser,
  type Keyword,
  type InsertKeyword,
  type TrafficSource,
  type InsertTrafficSource,
  type MetaCampaign,
  type InsertMetaCampaign,
} from "./shared/schema.js";
import { eq, desc, and, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Project operations
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: number, userId: string): Promise<Project | undefined>;
  createProject(project: InsertProject, userId: string): Promise<Project>;
  updateProject(
    id: number,
    project: Partial<InsertProject>,
    userId: string,
  ): Promise<Project | undefined>;
  deleteProject(id: number, userId: string): Promise<boolean>;

  // Campaign operations
  getCampaigns(projectId: number | null, userId: string): Promise<Campaign[]>;
  getCampaign(id: number, userId: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign, userId: string): Promise<Campaign>;
  updateCampaign(
    id: number,
    campaign: Partial<InsertCampaign>,
    userId: string,
  ): Promise<Campaign | undefined>;
  deleteCampaign(id: number, userId: string): Promise<boolean>;

  // Campaign Group operations
  getCampaignGroups(
    projectId: number | null,
    userId: string,
  ): Promise<CampaignGroup[]>;
  getCampaignGroup(id: number, userId: string): Promise<CampaignGroup | undefined>;
  createCampaignGroup(
    campaignGroup: InsertCampaignGroup,
    userId: string,
  ): Promise<CampaignGroup>;
  updateCampaignGroup(
    id: number,
    campaignGroup: Partial<InsertCampaignGroup>,
    userId: string,
  ): Promise<CampaignGroup | undefined>;
  deleteCampaignGroup(id: number, userId: string): Promise<boolean>;

  // Advertiser operations
  getAdvertisers(): Promise<Advertiser[]>;
  getAdvertiser(id: number): Promise<Advertiser | undefined>;
  createAdvertiser(advertiser: InsertAdvertiser): Promise<Advertiser>;
  updateAdvertiser(
    id: number,
    advertiser: Partial<InsertAdvertiser>,
  ): Promise<Advertiser | undefined>;

  // Keyword operations
  getKeywords(projectId: number | null, userId: string): Promise<Keyword[]>;
  getKeyword(id: number, userId: string): Promise<Keyword | undefined>;
  createKeyword(keyword: InsertKeyword, userId: string): Promise<Keyword>;
  createKeywords(keywords: InsertKeyword[], userId: string): Promise<Keyword[]>;
  updateKeyword(
    id: number,
    keyword: Partial<InsertKeyword>,
    userId: string,
  ): Promise<Keyword | undefined>;
  deleteKeyword(id: number, userId: string): Promise<boolean>;
  deleteKeywords(ids: number[], userId: string): Promise<boolean>;
  deleteKeywordsByProject(projectId: number, userId: string): Promise<boolean>;

  // Traffic Source operations
  getTrafficSources(): Promise<TrafficSource[]>;
  getTrafficSource(id: number): Promise<TrafficSource | undefined>;
  createTrafficSource(trafficSource: InsertTrafficSource): Promise<TrafficSource>;
  updateTrafficSource(
    id: number,
    trafficSource: Partial<InsertTrafficSource>,
  ): Promise<TrafficSource | undefined>;
  deleteTrafficSource(id: number): Promise<boolean>;

  // Meta Campaign operations
  getMetaCampaigns(userId: string): Promise<MetaCampaign[]>;
  getMetaCampaign(id: number, userId: string): Promise<MetaCampaign | undefined>;
  createMetaCampaign(
    metaCampaign: InsertMetaCampaign,
    userId: string,
  ): Promise<MetaCampaign>;
  updateMetaCampaign(
    id: number,
    metaCampaign: Partial<InsertMetaCampaign>,
    userId: string,
  ): Promise<MetaCampaign | undefined>;
  deleteMetaCampaign(id: number, userId: string): Promise<boolean>;

  // Stats
  getProjectStats(userId: string): Promise<{
    totalProjects: number;
    activeCampaigns: number;
    advertisers: number;
    countries: number;
  }>;
}

// Lazy DB import to avoid connecting when running in in-memory mode
async function getDb() {
  const mod = await import("./db.js");
  return mod.db as any;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const db = await getDb();
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Project operations
  async getProjects(userId: string): Promise<Project[]> {
    const db = await getDb();
    if (userId === "system") {
      return await db.select().from(projects).orderBy(desc(projects.createdAt));
    }
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  async getProject(id: number, userId: string): Promise<Project | undefined> {
    const db = await getDb();
    if (userId === "system") {
      const [project] = await db.select().from(projects).where(eq(projects.id, id));
      return project;
    }
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return project;
  }

  async createProject(project: InsertProject, userId: string): Promise<Project> {
    const db = await getDb();
    const [newProject] = await db
      .insert(projects)
      .values({ ...project, userId })
      .returning();
    return newProject;
  }

  async updateProject(
    id: number,
    project: Partial<InsertProject>,
    userId: string,
  ): Promise<Project | undefined> {
    const db = await getDb();
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: number, userId: string): Promise<boolean> {
    const db = await getDb();
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Campaign operations
  async getCampaigns(projectId: number | null, userId: string): Promise<Campaign[]> {
    const db = await getDb();
    if (userId === "system") {
      if (projectId !== null) {
        return await db.select().from(campaigns).where(eq(campaigns.projectId, projectId));
      } else {
        return await db.select().from(campaigns);
      }
    }

    if (projectId !== null) {
      return await db
        .select()
        .from(campaigns)
        .leftJoin(projects, eq(campaigns.projectId, projects.id))
        .where(and(eq(campaigns.projectId, projectId), eq(projects.userId, userId)))
        .then((rows: any[]) => rows.map((row) => row.campaigns));
    } else {
      return await db
        .select()
        .from(campaigns)
        .leftJoin(projects, eq(campaigns.projectId, projects.id))
        .where(eq(projects.userId, userId))
        .then((rows: any[]) => rows.map((row) => row.campaigns));
    }
  }

  async getCampaign(id: number, userId: string): Promise<Campaign | undefined> {
    const db = await getDb();
    const [campaign] = await db
      .select()
      .from(campaigns)
      .leftJoin(projects, eq(campaigns.projectId, projects.id))
      .where(and(eq(campaigns.id, id), eq(projects.userId, userId)))
      .then((rows: any[]) => rows.map((row) => row.campaigns));
    return campaign;
  }

  async createCampaign(campaign: InsertCampaign, userId: string): Promise<Campaign> {
    if (!campaign.projectId) {
      throw new Error("Project ID is required");
    }
    const project = await this.getProject(campaign.projectId, userId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const db = await getDb();
    const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
    return newCampaign;
  }

  async updateCampaign(
    id: number,
    campaign: Partial<InsertCampaign>,
    userId: string,
  ): Promise<Campaign | undefined> {
    const existingCampaign = await this.getCampaign(id, userId);
    if (!existingCampaign) {
      return undefined;
    }
    const db = await getDb();
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({ ...campaign, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  async deleteCampaign(id: number, userId: string): Promise<boolean> {
    const campaign = await this.getCampaign(id, userId);
    if (!campaign) {
      return false;
    }
    const db = await getDb();
    const result = await db.delete(campaigns).where(eq(campaigns.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Advertiser operations
  async getAdvertisers(): Promise<Advertiser[]> {
    const db = await getDb();
    return await db.select().from(advertisers).orderBy(advertisers.name);
  }

  async getAdvertiser(id: number): Promise<Advertiser | undefined> {
    const db = await getDb();
    const [advertiser] = await db.select().from(advertisers).where(eq(advertisers.id, id));
    return advertiser;
  }

  async createAdvertiser(advertiser: InsertAdvertiser): Promise<Advertiser> {
    const db = await getDb();
    const [newAdvertiser] = await db.insert(advertisers).values(advertiser).returning();
    return newAdvertiser;
  }

  async updateAdvertiser(
    id: number,
    advertiser: Partial<InsertAdvertiser>,
  ): Promise<Advertiser | undefined> {
    const db = await getDb();
    const [updatedAdvertiser] = await db
      .update(advertisers)
      .set({ ...advertiser, updatedAt: new Date() })
      .where(eq(advertisers.id, id))
      .returning();
    return updatedAdvertiser;
  }

  // Keyword operations
  async getKeywords(projectId: number | null, userId: string): Promise<Keyword[]> {
    const db = await getDb();
    if (projectId === null) {
      if (userId === "system") {
        return await db.select().from(keywords);
      }
      const userProjects = await this.getProjects(userId);
      const projectIds = userProjects.map((p) => p.id);
      if (projectIds.length === 0) {
        return [];
      }
      return await db.select().from(keywords).where(inArray(keywords.projectId, projectIds));
    }

    const project = await this.getProject(projectId, userId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }

    return await db.select().from(keywords).where(eq(keywords.projectId, projectId));
  }

  async getKeyword(id: number, userId: string): Promise<Keyword | undefined> {
    if (!id || isNaN(id) || id <= 0) {
      return undefined;
    }
    const db = await getDb();
    const [result] = await db
      .select({ keyword: keywords, project: projects })
      .from(keywords)
      .innerJoin(projects, eq(keywords.projectId, projects.id))
      .where(and(eq(keywords.id, id), eq(projects.userId, userId)));
    return result?.keyword;
  }

  async createKeyword(keyword: InsertKeyword, userId: string): Promise<Keyword> {
    const project = await this.getProject(keyword.projectId, userId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    const db = await getDb();
    const [newKeyword] = await db.insert(keywords).values(keyword).returning();
    return newKeyword;
  }

  async createKeywords(keywordList: InsertKeyword[], userId: string): Promise<Keyword[]> {
    if (keywordList.length === 0) return [];
    const projectIds = [...new Set(keywordList.map((k) => k.projectId))];
    for (const projectId of projectIds) {
      const project = await this.getProject(projectId, userId);
      if (!project) {
        throw new Error(`Project ${projectId} not found or access denied`);
      }
    }
    const db = await getDb();
    return await db.insert(keywords).values(keywordList).returning();
  }

  async updateKeyword(
    id: number,
    keyword: Partial<InsertKeyword>,
    userId: string,
  ): Promise<Keyword | undefined> {
    const existingKeyword = await this.getKeyword(id, userId);
    if (!existingKeyword) {
      return undefined;
    }
    const db = await getDb();
    const [updated] = await db
      .update(keywords)
      .set({ ...keyword, updatedAt: new Date() })
      .where(eq(keywords.id, id))
      .returning();
    return updated;
  }

  async deleteKeyword(id: number, userId: string): Promise<boolean> {
    if (!id || isNaN(id) || id <= 0) {
      return false;
    }
    const keyword = await this.getKeyword(id, userId);
    if (!keyword) {
      return false;
    }
    const db = await getDb();
    const result = await db.delete(keywords).where(eq(keywords.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteKeywords(ids: number[], userId: string): Promise<boolean> {
    if (ids.length === 0) return true;
    for (const id of ids) {
      if (!id || isNaN(id) || id <= 0) {
        return false;
      }
      const keyword = await this.getKeyword(id, userId);
      if (!keyword) {
        return false;
      }
    }
    const db = await getDb();
    const result = await db.delete(keywords).where(inArray(keywords.id, ids));
    return (result.rowCount || 0) > 0;
  }

  async deleteKeywordsByProject(projectId: number, userId: string): Promise<boolean> {
    const project = await this.getProject(projectId, userId);
    if (!project) {
      return false;
    }
    const db = await getDb();
    await db.delete(keywords).where(eq(keywords.projectId, projectId));
    return true;
  }

  // Stats
  async getProjectStats(userId: string): Promise<{
    totalProjects: number;
    activeCampaigns: number;
    advertisers: number;
    countries: number;
  }> {
    const userProjects = await this.getProjects(userId);
    const totalProjects = userProjects.length;

    let activeCampaigns = 0;
    for (const project of userProjects) {
      const projectCampaigns = await this.getCampaigns(project.id, userId);
      activeCampaigns += projectCampaigns.filter((c) => c.status === "active").length;
    }

    const allAdvertisers = await this.getAdvertisers();
    const advertisersCount = allAdvertisers.length;

    const countries = new Set<string>();
    userProjects.forEach((project) => {
      project.countries.forEach((country) => countries.add(country));
    });

    return {
      totalProjects,
      activeCampaigns,
      advertisers: advertisersCount,
      countries: countries.size,
    };
  }

  // Traffic Source operations
  async getTrafficSources(): Promise<TrafficSource[]> {
    const db = await getDb();
    return await db
      .select()
      .from(trafficSources)
      .where(eq(trafficSources.isActive, true))
      .orderBy(trafficSources.displayName);
  }

  async getTrafficSource(id: number): Promise<TrafficSource | undefined> {
    const db = await getDb();
    const [trafficSource] = await db.select().from(trafficSources).where(eq(trafficSources.id, id));
    return trafficSource;
  }

  async createTrafficSource(trafficSourceData: InsertTrafficSource): Promise<TrafficSource> {
    const db = await getDb();
    const [trafficSource] = await db
      .insert(trafficSources)
      .values(trafficSourceData)
      .returning();
    return trafficSource;
  }

  async updateTrafficSource(
    id: number,
    trafficSourceData: Partial<InsertTrafficSource>,
  ): Promise<TrafficSource | undefined> {
    const db = await getDb();
    const [trafficSource] = await db
      .update(trafficSources)
      .set({ ...trafficSourceData, updatedAt: new Date() })
      .where(eq(trafficSources.id, id))
      .returning();
    return trafficSource;
  }

  async deleteTrafficSource(id: number): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(trafficSources).where(eq(trafficSources.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Campaign Group operations
  async getCampaignGroups(projectId: number | null, userId: string): Promise<CampaignGroup[]> {
    const db = await getDb();
    if (projectId) {
      return await db
        .select()
        .from(campaignGroups)
        .where(and(eq(campaignGroups.projectId, projectId), eq(campaignGroups.userId, userId)))
        .orderBy(desc(campaignGroups.createdAt));
    } else {
      return await db
        .select()
        .from(campaignGroups)
        .where(eq(campaignGroups.userId, userId))
        .orderBy(desc(campaignGroups.createdAt));
    }
  }

  async getCampaignGroup(id: number, userId: string): Promise<CampaignGroup | undefined> {
    const db = await getDb();
    const [campaignGroup] = await db
      .select()
      .from(campaignGroups)
      .where(and(eq(campaignGroups.id, id), eq(campaignGroups.userId, userId)));
    return campaignGroup;
  }

  async createCampaignGroup(
    campaignGroupData: InsertCampaignGroup,
    userId: string,
  ): Promise<CampaignGroup> {
    const db = await getDb();
    const [campaignGroup] = await db
      .insert(campaignGroups)
      .values({ ...campaignGroupData, userId })
      .returning();
    return campaignGroup;
  }

  async updateCampaignGroup(
    id: number,
    campaignGroupData: Partial<InsertCampaignGroup>,
    userId: string,
  ): Promise<CampaignGroup | undefined> {
    const db = await getDb();
    const [campaignGroup] = await db
      .update(campaignGroups)
      .set({ ...campaignGroupData, updatedAt: new Date() })
      .where(and(eq(campaignGroups.id, id), eq(campaignGroups.userId, userId)))
      .returning();
    return campaignGroup;
  }

  async deleteCampaignGroup(id: number, userId: string): Promise<boolean> {
    try {
      const db = await getDb();
      const result = await db
        .delete(campaignGroups)
        .where(and(eq(campaignGroups.id, id), eq(campaignGroups.userId, userId)));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      return false;
    }
  }

  // Meta Campaign operations
  async getMetaCampaigns(userId: string): Promise<MetaCampaign[]> {
    const db = await getDb();
    return await db
      .select()
      .from(metaCampaigns)
      .where(eq(metaCampaigns.userId, userId))
      .orderBy(desc(metaCampaigns.createdAt));
  }

  async getMetaCampaign(id: number, userId: string): Promise<MetaCampaign | undefined> {
    const db = await getDb();
    const [metaCampaign] = await db
      .select()
      .from(metaCampaigns)
      .where(and(eq(metaCampaigns.id, id), eq(metaCampaigns.userId, userId)));
    return metaCampaign;
  }

  async createMetaCampaign(
    metaCampaignData: InsertMetaCampaign,
    userId: string,
  ): Promise<MetaCampaign> {
    const db = await getDb();
    const [metaCampaign] = await db
      .insert(metaCampaigns)
      .values({ ...metaCampaignData, userId })
      .returning();
    return metaCampaign;
  }

  async updateMetaCampaign(
    id: number,
    metaCampaignData: Partial<InsertMetaCampaign>,
    userId: string,
  ): Promise<MetaCampaign | undefined> {
    const db = await getDb();
    const [metaCampaign] = await db
      .update(metaCampaigns)
      .set({ ...metaCampaignData, updatedAt: new Date() })
      .where(and(eq(metaCampaigns.id, id), eq(metaCampaigns.userId, userId)))
      .returning();
    return metaCampaign;
  }

  async deleteMetaCampaign(id: number, userId: string): Promise<boolean> {
    try {
      const db = await getDb();
      const result = await db
        .delete(metaCampaigns)
        .where(and(eq(metaCampaigns.id, id), eq(metaCampaigns.userId, userId)));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      return false;
    }
  }
}

class MemoryStorage implements IStorage {
  private mem = {
    users: new Map<string, User>(),
    projects: new Map<number, Project>(),
    campaigns: new Map<number, Campaign>(),
    campaignGroups: new Map<number, CampaignGroup>(),
    advertisers: new Map<number, Advertiser>(),
    keywords: new Map<number, Keyword>(),
    trafficSources: new Map<number, TrafficSource>(),
    metaCampaigns: new Map<number, MetaCampaign>(),
  };
  private counters = {
    project: 1,
    campaign: 1,
    campaignGroup: 1,
    advertiser: 1,
    keyword: 1,
    trafficSource: 1,
    metaCampaign: 1,
  };

  constructor() {
    // Seed a hardcoded user to match index.ts auth mock
    const u: User = {
      id: "hardcoded-user-123",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      profileImageUrl: null as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as User;
    this.mem.users.set(u.id, u);

    // Seed some advertisers and traffic sources for UI
    const adv: Advertiser = {
      id: this.counters.advertiser++,
      name: "Default Advertiser",
      channelIds: [],
      domains: [],
      sampleUrl: null as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Advertiser;
    this.mem.advertisers.set(adv.id, adv);

    const ts: TrafficSource = {
      id: this.counters.trafficSource++,
      name: "google_ads",
      displayName: "Google Ads",
      fields: {},
      isActive: true as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as TrafficSource;
    this.mem.trafficSources.set(ts.id, ts);

    // Seed a sample project
    const p: Project = {
      id: this.counters.project++,
      name: "Sample Project",
      topics: ["digital marketing"],
      languages: ["en"],
      countries: ["US"],
      keywordsVolume: 100,
      keywordsBid: "1.00" as any,
      numberOfKeywords: 10,
      advertiserId: adv.id as any,
      status: "draft" as any,
      userId: u.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Project;
    this.mem.projects.set(p.id, p);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.mem.users.get(id);
  }
  async upsertUser(user: UpsertUser): Promise<User> {
    const existing = this.mem.users.get(user.id);
    const now = new Date();
    const newUser = {
      ...(existing as any),
      ...user,
      updatedAt: now,
      createdAt: existing?.createdAt ?? now,
    } as unknown as User;
    this.mem.users.set(user.id, newUser);
    return newUser;
  }

  async getProjects(userId: string): Promise<Project[]> {
    return [...this.mem.projects.values()].filter((p) => userId === "system" || p.userId === userId);
  }
  async getProject(id: number, userId: string): Promise<Project | undefined> {
    const p = this.mem.projects.get(id);
    if (!p) return undefined;
    if (userId !== "system" && p.userId !== userId) return undefined;
    return p;
  }
  async createProject(project: InsertProject, userId: string): Promise<Project> {
    const id = this.counters.project++;
    const now = new Date();
    const created = {
      id,
      ...project,
      userId,
      createdAt: now,
      updatedAt: now,
    } as unknown as Project;
    this.mem.projects.set(id, created);
    return created;
  }
  async updateProject(
    id: number,
    project: Partial<InsertProject>,
    userId: string,
  ): Promise<Project | undefined> {
    const existing = await this.getProject(id, userId);
    if (!existing) return undefined;
    const updated = { ...(existing as any), ...project, updatedAt: new Date() } as Project;
    this.mem.projects.set(id, updated);
    return updated;
  }
  async deleteProject(id: number, userId: string): Promise<boolean> {
    const existing = await this.getProject(id, userId);
    if (!existing) return false;
    this.mem.projects.delete(id);
    for (const [kid, kw] of [...this.mem.keywords.entries()]) {
      if ((kw as any).projectId === id) this.mem.keywords.delete(kid);
    }
    return true;
  }

  async getCampaigns(projectId: number | null, userId: string): Promise<Campaign[]> {
    const all = [...this.mem.campaigns.values()].filter((c) => {
      const p = this.mem.projects.get((c as any).projectId);
      return userId === "system" || p?.userId === userId;
    });
    return projectId ? all.filter((c) => (c as any).projectId === projectId) : all;
  }
  async getCampaign(id: number, userId: string): Promise<Campaign | undefined> {
    const c = this.mem.campaigns.get(id);
    if (!c) return undefined;
    const p = this.mem.projects.get((c as any).projectId);
    if (userId !== "system" && p?.userId !== userId) return undefined;
    return c;
  }
  async createCampaign(campaign: InsertCampaign, userId: string): Promise<Campaign> {
    const p = await this.getProject((campaign as any).projectId, userId);
    if (!p) throw new Error("Project not found or access denied");
    const id = this.counters.campaign++;
    const now = new Date();
    const c = { id, ...campaign, createdAt: now, updatedAt: now } as unknown as Campaign;
    this.mem.campaigns.set(id, c);
    return c;
  }
  async updateCampaign(
    id: number,
    campaign: Partial<InsertCampaign>,
    userId: string,
  ): Promise<Campaign | undefined> {
    const existing = await this.getCampaign(id, userId);
    if (!existing) return undefined;
    const updated = { ...(existing as any), ...campaign, updatedAt: new Date() } as Campaign;
    this.mem.campaigns.set(id, updated);
    return updated;
  }
  async deleteCampaign(id: number, userId: string): Promise<boolean> {
    const existing = await this.getCampaign(id, userId);
    if (!existing) return false;
    this.mem.campaigns.delete(id);
    return true;
  }

  async getAdvertisers(): Promise<Advertiser[]> {
    return [...this.mem.advertisers.values()];
  }
  async getAdvertiser(id: number): Promise<Advertiser | undefined> {
    return this.mem.advertisers.get(id);
  }
  async createAdvertiser(advertiser: InsertAdvertiser): Promise<Advertiser> {
    const id = this.counters.advertiser++;
    const now = new Date();
    const a = { id, ...advertiser, createdAt: now, updatedAt: now } as unknown as Advertiser;
    this.mem.advertisers.set(id, a);
    return a;
  }
  async updateAdvertiser(
    id: number,
    advertiser: Partial<InsertAdvertiser>,
  ): Promise<Advertiser | undefined> {
    const existing = this.mem.advertisers.get(id);
    if (!existing) return undefined;
    const updated = { ...(existing as any), ...advertiser, updatedAt: new Date() } as Advertiser;
    this.mem.advertisers.set(id, updated);
    return updated;
  }

  async getKeywords(projectId: number | null, userId: string): Promise<Keyword[]> {
    const all = [...this.mem.keywords.values()].filter((k) => {
      const p = this.mem.projects.get((k as any).projectId);
      return userId === "system" || p?.userId === userId;
    });
    return projectId ? all.filter((k) => (k as any).projectId === projectId) : all;
  }
  async getKeyword(id: number, userId: string): Promise<Keyword | undefined> {
    const k = this.mem.keywords.get(id);
    if (!k) return undefined;
    const p = this.mem.projects.get((k as any).projectId);
    if (userId !== "system" && p?.userId !== userId) return undefined;
    return k;
  }
  async createKeyword(keyword: InsertKeyword, userId: string): Promise<Keyword> {
    const p = await this.getProject((keyword as any).projectId, userId);
    if (!p) throw new Error("Project not found or access denied");
    const id = this.counters.keyword++;
    const now = new Date();
    const k = { id, ...keyword, createdAt: now, updatedAt: now } as unknown as Keyword;
    this.mem.keywords.set(id, k);
    return k;
  }
  async createKeywords(keywordList: InsertKeyword[], userId: string): Promise<Keyword[]> {
    const out: Keyword[] = [];
    for (const kw of keywordList) {
      out.push(await this.createKeyword(kw, userId));
    }
    return out;
  }
  async updateKeyword(
    id: number,
    keyword: Partial<InsertKeyword>,
    userId: string,
  ): Promise<Keyword | undefined> {
    const existing = await this.getKeyword(id, userId);
    if (!existing) return undefined;
    const updated = { ...(existing as any), ...keyword, updatedAt: new Date() } as Keyword;
    this.mem.keywords.set(id, updated);
    return updated;
  }
  async deleteKeyword(id: number, userId: string): Promise<boolean> {
    const existing = await this.getKeyword(id, userId);
    if (!existing) return false;
    this.mem.keywords.delete(id);
    return true;
  }
  async deleteKeywords(ids: number[], userId: string): Promise<boolean> {
    for (const id of ids) {
      const ok = await this.deleteKeyword(id, userId);
      if (!ok) return false;
    }
    return true;
  }
  async deleteKeywordsByProject(projectId: number, userId: string): Promise<boolean> {
    const p = await this.getProject(projectId, userId);
    if (!p) return false;
    for (const [id, k] of [...this.mem.keywords.entries()]) {
      if ((k as any).projectId === projectId) this.mem.keywords.delete(id);
    }
    return true;
  }

  async getProjectStats(userId: string): Promise<{
    totalProjects: number;
    activeCampaigns: number;
    advertisers: number;
    countries: number;
  }> {
    const userProjects = await this.getProjects(userId);
    const totalProjects = userProjects.length;
    let activeCampaigns = 0;
    for (const p of userProjects) {
      const cs = await this.getCampaigns(p.id, userId);
      activeCampaigns += cs.filter((c) => (c as any).status === "active").length;
    }
    const advertisersCount = this.mem.advertisers.size;
    const countries = new Set<string>();
    userProjects.forEach((p) => p.countries.forEach((c) => countries.add(c)));
    return { totalProjects, activeCampaigns, advertisers: advertisersCount, countries: countries.size };
  }

  async getTrafficSources(): Promise<TrafficSource[]> {
    return [...this.mem.trafficSources.values()].filter((t) => (t as any).isActive !== false);
  }
  async getTrafficSource(id: number): Promise<TrafficSource | undefined> {
    return this.mem.trafficSources.get(id);
  }
  async createTrafficSource(trafficSourceData: InsertTrafficSource): Promise<TrafficSource> {
    const id = this.counters.trafficSource++;
    const now = new Date();
    const t = { id, ...trafficSourceData, createdAt: now, updatedAt: now } as unknown as TrafficSource;
    this.mem.trafficSources.set(id, t);
    return t;
  }
  async updateTrafficSource(
    id: number,
    trafficSourceData: Partial<InsertTrafficSource>,
  ): Promise<TrafficSource | undefined> {
    const existing = this.mem.trafficSources.get(id);
    if (!existing) return undefined;
    const updated = { ...(existing as any), ...trafficSourceData, updatedAt: new Date() } as TrafficSource;
    this.mem.trafficSources.set(id, updated);
    return updated;
  }
  async deleteTrafficSource(id: number): Promise<boolean> {
    const existed = this.mem.trafficSources.delete(id);
    return existed;
  }

  async getCampaignGroups(projectId: number | null, userId: string): Promise<CampaignGroup[]> {
    const all = [...this.mem.campaignGroups.values()].filter((cg) => {
      const p = this.mem.projects.get((cg as any).projectId);
      return userId === "system" || p?.userId === userId;
    });
    return projectId ? all.filter((cg) => (cg as any).projectId === projectId) : all;
  }
  async getCampaignGroup(id: number, userId: string): Promise<CampaignGroup | undefined> {
    const cg = this.mem.campaignGroups.get(id);
    if (!cg) return undefined;
    const p = this.mem.projects.get((cg as any).projectId);
    if (userId !== "system" && p?.userId !== userId) return undefined;
    return cg;
  }
  async createCampaignGroup(
    campaignGroupData: InsertCampaignGroup,
    userId: string,
  ): Promise<CampaignGroup> {
    const p = await this.getProject((campaignGroupData as any).projectId, userId);
    if (!p) throw new Error("Project not found or access denied");
    const id = this.counters.campaignGroup++;
    const now = new Date();
    const cg = { id, ...campaignGroupData, userId, createdAt: now, updatedAt: now } as unknown as CampaignGroup;
    this.mem.campaignGroups.set(id, cg);
    return cg;
  }
  async updateCampaignGroup(
    id: number,
    campaignGroupData: Partial<InsertCampaignGroup>,
    userId: string,
  ): Promise<CampaignGroup | undefined> {
    const existing = await this.getCampaignGroup(id, userId);
    if (!existing) return undefined;
    const updated = { ...(existing as any), ...campaignGroupData, updatedAt: new Date() } as CampaignGroup;
    this.mem.campaignGroups.set(id, updated);
    return updated;
  }
  async deleteCampaignGroup(id: number, userId: string): Promise<boolean> {
    const existing = await this.getCampaignGroup(id, userId);
    if (!existing) return false;
    this.mem.campaignGroups.delete(id);
    return true;
  }

  async getMetaCampaigns(userId: string): Promise<MetaCampaign[]> {
    return [...this.mem.metaCampaigns.values()].filter((mc) => (mc as any).userId === userId);
  }
  async getMetaCampaign(id: number, userId: string): Promise<MetaCampaign | undefined> {
    const mc = this.mem.metaCampaigns.get(id);
    if (!mc) return undefined;
    if ((mc as any).userId !== userId) return undefined;
    return mc;
  }
  async createMetaCampaign(
    metaCampaignData: InsertMetaCampaign,
    userId: string,
  ): Promise<MetaCampaign> {
    const id = this.counters.metaCampaign++;
    const now = new Date();
    const mc = { id, ...metaCampaignData, userId, createdAt: now, updatedAt: now } as unknown as MetaCampaign;
    this.mem.metaCampaigns.set(id, mc);
    return mc;
  }
  async updateMetaCampaign(
    id: number,
    metaCampaignData: Partial<InsertMetaCampaign>,
    userId: string,
  ): Promise<MetaCampaign | undefined> {
    const existing = await this.getMetaCampaign(id, userId);
    if (!existing) return undefined;
    const updated = { ...(existing as any), ...metaCampaignData, updatedAt: new Date() } as MetaCampaign;
    this.mem.metaCampaigns.set(id, updated);
    return updated;
  }
  async deleteMetaCampaign(id: number, userId: string): Promise<boolean> {
    const existing = await this.getMetaCampaign(id, userId);
    if (!existing) return false;
    this.mem.metaCampaigns.delete(id);
    return true;
  }
}

const useMemory = (process.env.STORAGE_MODE || "").toLowerCase() === "memory" || !process.env.DATABASE_URL;
console.log(`[storage] Mode: ${useMemory ? 'memory' : 'database'}`);
export const storage: IStorage = useMemory ? new MemoryStorage() : new DatabaseStorage();
