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
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: number, userId: string): Promise<Project | undefined>;
  createProject(project: InsertProject, userId: string): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>, userId: string): Promise<Project | undefined>;
  deleteProject(id: number, userId: string): Promise<boolean>;
  
  // Campaign operations
  getCampaigns(projectId: number | null, userId: string): Promise<Campaign[]>;
  getCampaign(id: number, userId: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign, userId: string): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<InsertCampaign>, userId: string): Promise<Campaign | undefined>;
  deleteCampaign(id: number, userId: string): Promise<boolean>;
  
  // Campaign Group operations
  getCampaignGroups(projectId: number | null, userId: string): Promise<CampaignGroup[]>;
  getCampaignGroup(id: number, userId: string): Promise<CampaignGroup | undefined>;
  createCampaignGroup(campaignGroup: InsertCampaignGroup, userId: string): Promise<CampaignGroup>;
  updateCampaignGroup(id: number, campaignGroup: Partial<InsertCampaignGroup>, userId: string): Promise<CampaignGroup | undefined>;
  deleteCampaignGroup(id: number, userId: string): Promise<boolean>;
  
  // Advertiser operations
  getAdvertisers(): Promise<Advertiser[]>;
  getAdvertiser(id: number): Promise<Advertiser | undefined>;
  createAdvertiser(advertiser: InsertAdvertiser): Promise<Advertiser>;
  updateAdvertiser(id: number, advertiser: Partial<InsertAdvertiser>): Promise<Advertiser | undefined>;
  
  // Keyword operations
  getKeywords(projectId: number | null, userId: string): Promise<Keyword[]>;
  getKeyword(id: number, userId: string): Promise<Keyword | undefined>;
  createKeyword(keyword: InsertKeyword, userId: string): Promise<Keyword>;
  createKeywords(keywords: InsertKeyword[], userId: string): Promise<Keyword[]>;
  updateKeyword(id: number, keyword: Partial<InsertKeyword>, userId: string): Promise<Keyword | undefined>;
  deleteKeyword(id: number, userId: string): Promise<boolean>;
  deleteKeywords(ids: number[], userId: string): Promise<boolean>;
  deleteKeywordsByProject(projectId: number, userId: string): Promise<boolean>;
  
  // Traffic Source operations
  getTrafficSources(): Promise<TrafficSource[]>;
  getTrafficSource(id: number): Promise<TrafficSource | undefined>;
  createTrafficSource(trafficSource: InsertTrafficSource): Promise<TrafficSource>;
  updateTrafficSource(id: number, trafficSource: Partial<InsertTrafficSource>): Promise<TrafficSource | undefined>;
  deleteTrafficSource(id: number): Promise<boolean>;
  
  // Meta Campaign operations
  getMetaCampaigns(userId: string): Promise<MetaCampaign[]>;
  getMetaCampaign(id: number, userId: string): Promise<MetaCampaign | undefined>;
  createMetaCampaign(metaCampaign: InsertMetaCampaign, userId: string): Promise<MetaCampaign>;
  updateMetaCampaign(id: number, metaCampaign: Partial<InsertMetaCampaign>, userId: string): Promise<MetaCampaign | undefined>;
  deleteMetaCampaign(id: number, userId: string): Promise<boolean>;
  
  // Stats
  getProjectStats(userId: string): Promise<{
    totalProjects: number;
    activeCampaigns: number;
    advertisers: number;
    countries: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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
    // Allow system user to access all projects (for API access)
    if (userId === "system") {
      return await db
        .select()
        .from(projects)
        .orderBy(desc(projects.createdAt));
    }
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  async getProject(id: number, userId: string): Promise<Project | undefined> {
    // Allow system user to access any project (for API access)
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
    const [newProject] = await db
      .insert(projects)
      .values({ ...project, userId })
      .returning();
    return newProject;
  }

  async updateProject(id: number, project: Partial<InsertProject>, userId: string): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Campaign operations
  async getCampaigns(projectId: number | null, userId: string): Promise<Campaign[]> {
    // Allow system user to access any project's campaigns (for API access)
    if (userId === "system") {
      if (projectId !== null) {
        return await db
          .select()
          .from(campaigns)
          .where(eq(campaigns.projectId, projectId));
      } else {
        return await db
          .select()
          .from(campaigns);
      }
    }
    
    if (projectId !== null) {
      return await db
        .select()
        .from(campaigns)
        .leftJoin(projects, eq(campaigns.projectId, projects.id))
        .where(and(eq(campaigns.projectId, projectId), eq(projects.userId, userId)))
        .then(rows => rows.map(row => row.campaigns));
    } else {
      // Get all campaigns for the user across all projects
      return await db
        .select()
        .from(campaigns)
        .leftJoin(projects, eq(campaigns.projectId, projects.id))
        .where(eq(projects.userId, userId))
        .then(rows => rows.map(row => row.campaigns));
    }
  }

  async getCampaign(id: number, userId: string): Promise<Campaign | undefined> {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .leftJoin(projects, eq(campaigns.projectId, projects.id))
      .where(and(eq(campaigns.id, id), eq(projects.userId, userId)))
      .then(rows => rows.map(row => row.campaigns));
    return campaign;
  }

  async createCampaign(campaign: InsertCampaign, userId: string): Promise<Campaign> {
    // Verify user owns the project
    if (!campaign.projectId) {
      throw new Error("Project ID is required");
    }
    const project = await this.getProject(campaign.projectId, userId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    
    const [newCampaign] = await db
      .insert(campaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async updateCampaign(id: number, campaign: Partial<InsertCampaign>, userId: string): Promise<Campaign | undefined> {
    // Verify user owns the campaign through project
    const existingCampaign = await this.getCampaign(id, userId);
    if (!existingCampaign) {
      return undefined;
    }
    
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({ ...campaign, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  async deleteCampaign(id: number, userId: string): Promise<boolean> {
    // Verify user owns the campaign through project
    const campaign = await this.getCampaign(id, userId);
    if (!campaign) {
      return false;
    }
    
    const result = await db.delete(campaigns).where(eq(campaigns.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Advertiser operations
  async getAdvertisers(): Promise<Advertiser[]> {
    return await db.select().from(advertisers).orderBy(advertisers.name);
  }

  async getAdvertiser(id: number): Promise<Advertiser | undefined> {
    const [advertiser] = await db.select().from(advertisers).where(eq(advertisers.id, id));
    return advertiser;
  }

  async createAdvertiser(advertiser: InsertAdvertiser): Promise<Advertiser> {
    const [newAdvertiser] = await db
      .insert(advertisers)
      .values(advertiser)
      .returning();
    return newAdvertiser;
  }

  async updateAdvertiser(id: number, advertiser: Partial<InsertAdvertiser>): Promise<Advertiser | undefined> {
    const [updatedAdvertiser] = await db
      .update(advertisers)
      .set({ ...advertiser, updatedAt: new Date() })
      .where(eq(advertisers.id, id))
      .returning();
    return updatedAdvertiser;
  }

  // Keyword operations
  async getKeywords(projectId: number | null, userId: string): Promise<Keyword[]> {
    if (projectId === null) {
      // For API access (system user), return all keywords
      if (userId === "system") {
        return await db.select().from(keywords);
      }
      // For regular users, return keywords from all their projects
      const userProjects = await this.getProjects(userId);
      const projectIds = userProjects.map(p => p.id);
      if (projectIds.length === 0) {
        return [];
      }
      return await db.select().from(keywords).where(inArray(keywords.projectId, projectIds));
    }
    
    // Verify project ownership
    const project = await this.getProject(projectId, userId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }
    
    return await db.select().from(keywords).where(eq(keywords.projectId, projectId));
  }

  async getKeyword(id: number, userId: string): Promise<Keyword | undefined> {
    console.log("getKeyword called with id:", id, "type:", typeof id, "userId:", userId);
    
    if (!id || isNaN(id) || id <= 0) {
      console.error("Invalid keyword ID in getKeyword:", id);
      return undefined;
    }
    
    const [result] = await db.select({
        keyword: keywords,
        project: projects
      })
      .from(keywords)
      .innerJoin(projects, eq(keywords.projectId, projects.id))
      .where(and(eq(keywords.id, id), eq(projects.userId, userId)));
    
    console.log("getKeyword result:", result);
    return result?.keyword;
  }

  async createKeyword(keyword: InsertKeyword, userId: string): Promise<Keyword> {
    // Verify project ownership
    const project = await this.getProject(keyword.projectId, userId);
    if (!project) {
      throw new Error("Project not found or access denied");
    }

    const [newKeyword] = await db.insert(keywords).values(keyword).returning();
    return newKeyword;
  }

  async createKeywords(keywordList: InsertKeyword[], userId: string): Promise<Keyword[]> {
    if (keywordList.length === 0) return [];
    
    // Verify project ownership for all keywords
    const projectIds = [...new Set(keywordList.map(k => k.projectId))];
    for (const projectId of projectIds) {
      const project = await this.getProject(projectId, userId);
      if (!project) {
        throw new Error(`Project ${projectId} not found or access denied`);
      }
    }

    return await db.insert(keywords).values(keywordList).returning();
  }

  async updateKeyword(id: number, keyword: Partial<InsertKeyword>, userId: string): Promise<Keyword | undefined> {
    // Verify project ownership
    const existingKeyword = await this.getKeyword(id, userId);
    if (!existingKeyword) {
      return undefined;
    }

    const [updated] = await db
      .update(keywords)
      .set({ ...keyword, updatedAt: new Date() })
      .where(eq(keywords.id, id))
      .returning();
    
    return updated;
  }

  async deleteKeyword(id: number, userId: string): Promise<boolean> {
    console.log("deleteKeyword called with ID:", id, "type:", typeof id, "for user:", userId);
    
    if (!id || isNaN(id) || id <= 0) {
      console.error("Invalid keyword ID in deleteKeyword:", id);
      return false;
    }
    
    // Verify project ownership
    const keyword = await this.getKeyword(id, userId);
    if (!keyword) {
      console.log("Keyword not found or access denied for ID:", id);
      return false;
    }

    const result = await db.delete(keywords).where(eq(keywords.id, id));
    console.log("Single delete result:", result);
    return (result.rowCount || 0) > 0;
  }

  async deleteKeywords(ids: number[], userId: string): Promise<boolean> {
    if (ids.length === 0) return true;
    
    console.log("deleteKeywords called with IDs:", ids, "for user:", userId);
    
    // Verify ownership for all keywords
    for (const id of ids) {
      console.log("Checking ownership for keyword ID:", id);
      if (!id || isNaN(id) || id <= 0) {
        console.error("Invalid keyword ID in deleteKeywords:", id);
        return false;
      }
      
      const keyword = await this.getKeyword(id, userId);
      if (!keyword) {
        console.error("Keyword not found or access denied for ID:", id);
        return false;
      }
    }

    const result = await db.delete(keywords).where(inArray(keywords.id, ids));
    console.log("Delete result:", result);
    return (result.rowCount || 0) > 0;
  }

  async deleteKeywordsByProject(projectId: number, userId: string): Promise<boolean> {
    // Verify project ownership
    const project = await this.getProject(projectId, userId);
    if (!project) {
      console.error("Project not found or access denied for project ID:", projectId);
      return false;
    }

    const result = await db.delete(keywords).where(eq(keywords.projectId, projectId));
    console.log(`Deleted ${result.rowCount || 0} keywords for project ${projectId}`);
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
    
    // Get all campaigns for user's projects
    let activeCampaigns = 0;
    for (const project of userProjects) {
      const projectCampaigns = await this.getCampaigns(project.id, userId);
      activeCampaigns += projectCampaigns.filter(c => c.status === "active").length;
    }
    
    const allAdvertisers = await this.getAdvertisers();
    const advertisers = allAdvertisers.length;
    
    // Get unique countries from user's projects
    const countries = new Set();
    userProjects.forEach(project => {
      project.countries.forEach(country => countries.add(country));
    });
    
    return {
      totalProjects,
      activeCampaigns,
      advertisers,
      countries: countries.size,
    };
  }

  // Traffic Source operations
  async getTrafficSources(): Promise<TrafficSource[]> {
    return await db.select().from(trafficSources).where(eq(trafficSources.isActive, true)).orderBy(trafficSources.displayName);
  }

  async getTrafficSource(id: number): Promise<TrafficSource | undefined> {
    const [trafficSource] = await db.select().from(trafficSources).where(eq(trafficSources.id, id));
    return trafficSource;
  }

  async createTrafficSource(trafficSourceData: InsertTrafficSource): Promise<TrafficSource> {
    const [trafficSource] = await db
      .insert(trafficSources)
      .values(trafficSourceData)
      .returning();
    return trafficSource;
  }

  async updateTrafficSource(id: number, trafficSourceData: Partial<InsertTrafficSource>): Promise<TrafficSource | undefined> {
    const [trafficSource] = await db
      .update(trafficSources)
      .set({ ...trafficSourceData, updatedAt: new Date() })
      .where(eq(trafficSources.id, id))
      .returning();
    return trafficSource;
  }

  async deleteTrafficSource(id: number): Promise<boolean> {
    const result = await db.delete(trafficSources).where(eq(trafficSources.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Campaign Group operations
  async getCampaignGroups(projectId: number | null, userId: string): Promise<CampaignGroup[]> {
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
    const [campaignGroup] = await db
      .select()
      .from(campaignGroups)
      .where(and(eq(campaignGroups.id, id), eq(campaignGroups.userId, userId)));
    return campaignGroup;
  }

  async createCampaignGroup(campaignGroupData: InsertCampaignGroup, userId: string): Promise<CampaignGroup> {
    const [campaignGroup] = await db
      .insert(campaignGroups)
      .values({ ...campaignGroupData, userId })
      .returning();
    return campaignGroup;
  }

  async updateCampaignGroup(id: number, campaignGroupData: Partial<InsertCampaignGroup>, userId: string): Promise<CampaignGroup | undefined> {
    const [campaignGroup] = await db
      .update(campaignGroups)
      .set({ ...campaignGroupData, updatedAt: new Date() })
      .where(and(eq(campaignGroups.id, id), eq(campaignGroups.userId, userId)))
      .returning();
    return campaignGroup;
  }

  async deleteCampaignGroup(id: number, userId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(campaignGroups)
        .where(and(eq(campaignGroups.id, id), eq(campaignGroups.userId, userId)));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting campaign group:", error);
      return false;
    }
  }

  // Meta Campaign operations
  async getMetaCampaigns(userId: string): Promise<MetaCampaign[]> {
    return await db
      .select()
      .from(metaCampaigns)
      .where(eq(metaCampaigns.userId, userId))
      .orderBy(desc(metaCampaigns.createdAt));
  }

  async getMetaCampaign(id: number, userId: string): Promise<MetaCampaign | undefined> {
    const [metaCampaign] = await db
      .select()
      .from(metaCampaigns)
      .where(and(eq(metaCampaigns.id, id), eq(metaCampaigns.userId, userId)));
    return metaCampaign;
  }

  async createMetaCampaign(metaCampaignData: InsertMetaCampaign, userId: string): Promise<MetaCampaign> {
    const [metaCampaign] = await db
      .insert(metaCampaigns)
      .values({ ...metaCampaignData, userId })
      .returning();
    return metaCampaign;
  }

  async updateMetaCampaign(id: number, metaCampaignData: Partial<InsertMetaCampaign>, userId: string): Promise<MetaCampaign | undefined> {
    const [metaCampaign] = await db
      .update(metaCampaigns)
      .set({ ...metaCampaignData, updatedAt: new Date() })
      .where(and(eq(metaCampaigns.id, id), eq(metaCampaigns.userId, userId)))
      .returning();
    return metaCampaign;
  }

  async deleteMetaCampaign(id: number, userId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(metaCampaigns)
        .where(and(eq(metaCampaigns.id, id), eq(metaCampaigns.userId, userId)));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting meta campaign:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
