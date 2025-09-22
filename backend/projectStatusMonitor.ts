import { generateKeywordIdeas, generateFallbackKeywords } from './googleKeywordPlanner.js';
import { COUNTRIES, LANGUAGES } from '../shared/countries-languages.js';
import type { IStorage } from './storage.js';
import type { Project } from '../shared/schema.js';

export interface ProjectStatusChangeEvent {
  project: Project;
  previousStatus: string;
  newStatus: string;
}

export async function handleProjectStatusChange(
  event: ProjectStatusChangeEvent,
  storage: IStorage,
  userId: string
): Promise<void> {
  const { project, previousStatus, newStatus } = event;

  // Only generate keywords when project becomes active
  if (newStatus !== 'active' || previousStatus === 'active') {
    return;
  }

  console.log(`🎯 [Status Monitor] Project "${project.name}" became active, generating keywords...`);

  try {
    // Generate keywords using Google Keyword Planner
    await generateKeywordsForProject(project, storage, userId);
  } catch (error) {
    console.error('❌ [Status Monitor] Failed to generate keywords for project:', error);
  }
}

async function generateKeywordsForProject(
  project: Project, 
  storage: IStorage, 
  userId: string
): Promise<void> {
  console.log(`📊 [Keyword Generation] Starting for project: "${project.name}"`);
  console.log(`   🏷️ Topics: ${project.topics.join(', ')}`);
  console.log(`   🌍 Countries: ${project.countries.join(', ')}`);
  console.log(`   🗣️ Languages: ${project.languages.join(', ')}`);

  // Clear existing keywords for this project (optional - you can remove this if you want to keep existing ones)
  await storage.deleteKeywordsByProject(project.id, userId);
  console.log('🗑️ [Cleanup] Cleared existing keywords for the project');

  let keywordsToCreate = [];

  try {
    // Get location IDs from countries
    const locationIds = project.countries
      .map(countryCode => {
        const country = COUNTRIES.find(c => c.code === countryCode);
        return country?.locationId;
      })
      .filter(id => id !== undefined) as number[];

    // Get language ID (use first language for now)
    const languageId = project.languages.length > 0 ? 
      LANGUAGES.find(lang => lang.code === project.languages[0])?.languageId || 1000 :
      1000; // Default to English

    console.log(`🌐 [Targeting] Location IDs: ${locationIds.join(', ')}, Language ID: ${languageId}`);

    // Use exact topic words only (no variations)
    const exactTopics = project.topics.map(topic => topic.trim());

    // Try Google Keyword Planner first
    const keywordResults = await generateKeywordIdeas({
      keywords: exactTopics,
      languageId,
      locationIds,
      keywordCount: project.numberOfKeywords || 30,
      minkeywordvolume: project.keywordsVolume || 0,
      minbidUsd: parseFloat(project.keywordsBid?.toString() || '0') || 0
    });

    if (keywordResults.length > 0) {
      console.log(`✅ [Google API] Generated ${keywordResults.length} keywords from Google Keyword Planner`);
      
      keywordsToCreate = keywordResults.map(kw => ({
        projectId: project.id,
        keyword: kw.keyword,
        volume: kw.volume,
        bid: kw.bid.toString(),
        highTopOfPageBidUSD: kw.highTopOfPageBidUSD.toString(),
        coinGeckoRate: kw.coinGeckoRate.toString(),
        status: kw.status
      }));
    } else {
      throw new Error('No keywords returned from Google API');
    }

  } catch (googleError) {
    console.warn('⚠️ [Google API] Failed, using fallback generation:', googleError);
    
    // Fallback: Use exact topic words without variations
    const fallbackKeywords = generateFallbackKeywords(project.topics);
    
    keywordsToCreate = fallbackKeywords.map(kw => ({
      projectId: project.id,
      keyword: kw.keyword,
      volume: kw.volume,
      bid: kw.bid.toString(),
      highTopOfPageBidUSD: kw.highTopOfPageBidUSD.toString(),
      coinGeckoRate: kw.coinGeckoRate.toString(),
      status: kw.status
    }));

    console.log(`🔄 [Fallback] Generated ${keywordsToCreate.length} keywords using exact topics`);
  }

  // Save keywords to database
  if (keywordsToCreate.length > 0) {
    const createdKeywords = await storage.createKeywords(keywordsToCreate, userId);
    console.log(`💾 [Database] Saved ${createdKeywords.length} keywords to project "${project.name}"`);
  }

  console.log(`🎉 [Keyword Generation] Completed for project: "${project.name}"`);
}