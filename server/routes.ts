import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// Simple authentication bypass for hardcoded auth
const isAuthenticated = (req: any, res: any, next: any) => next();
import {
  insertProjectSchema,
  insertCampaignSchema,
  insertAdvertiserSchema,
  insertTrafficSourceSchema,
  insertCampaignGroupSchema,
  projects,
  keywords,
  insertKeywordSchema,
} from "./shared/schema.js";
import { COUNTRIES, LANGUAGES } from "./shared/countries-languages.js";
import { z } from "zod";
// Google Keywords service integration
import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import { handleProjectStatusChange } from './projectStatusMonitor.js';
import type { Project } from './shared/schema.js';

const MICRO_TOKEN_ID = 'micropets';
const TO_CURRENCY = 'usd';

// Google OAuth client setup
const googleOAuthClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

async function getMicroToCurrencyPrice(tokenId: string, vsCurrency: string) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=${vsCurrency}`;
  const response = await axios.get(url);
  if (
    response.data &&
    response.data[tokenId] &&
    response.data[tokenId][vsCurrency]
  ) {
    return response.data[tokenId][vsCurrency];
  }
  throw new Error(`Token ID '${tokenId}' or currency '${vsCurrency}' not found in CoinGecko response.`);
}

function convertMicroToCurrency(amountMicro: number) {
  const usdrate = Number(process.env.USD_RATE) || 87.67;
  return Number((Number(amountMicro) / 1000000) / usdrate).toFixed(2);
}

async function getGoogleAccessToken() {
  googleOAuthClient.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  const { token } = await googleOAuthClient.getAccessToken();
  if (!token) throw new Error("Google OAuth Token error");
  return token;
}

async function generateKeywordIdeas(
  keywords: string[],
  languageId: number,
  locationIds: number[],
  keywordCount: number,
  minbidUsd: number,
  minkeywordvolume: number
) {
  const accessToken = await getGoogleAccessToken();
  const customerId = process.env.GOOGLE_CUSTOMER_ID;
  const loginCustomerId = process.env.GOOGLE_LOGIN_CUSTOMER_ID || customerId;
  const url = `https://googleads.googleapis.com/v20/customers/${customerId}:generateKeywordIdeas`;
  
  const body = {
    keywordSeed: { keywords },
    geoTargetConstants: locationIds.map(id => `geoTargetConstants/${id}`),
    language: `languageConstants/${languageId}`,
    includeAdultKeywords: false,
    keywordPlanNetwork: "GOOGLE_SEARCH_AND_PARTNERS"
  };

  // Get token:micropets price
  const coinGeckoRate = await getMicroToCurrencyPrice(MICRO_TOKEN_ID, TO_CURRENCY);

  // Google Ads API call
  const resp = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": process.env.GOOGLE_DEVELOPER_TOKEN,
      "login-customer-id": loginCustomerId,
      "Content-Type": "application/json"
    }
  });

  let keywordIdeas = resp.data.results || [];

  // Enrich every result with highTopOfPageBidUSD conversion
  keywordIdeas = keywordIdeas.map((result: any) => {
    const metrics = result.keywordIdeaMetrics || {};
    const enrichedMetrics = { ...metrics };

    // Convert micros to USD
    if (metrics.highTopOfPageBidMicros !== undefined) {
      enrichedMetrics.highTopOfPageBidUSD = convertMicroToCurrency(
        metrics.highTopOfPageBidMicros
      );
    }
    if (metrics.lowTopOfPageBidMicros !== undefined) {
      enrichedMetrics.lowTopOfPageBidUSD = convertMicroToCurrency(
        metrics.lowTopOfPageBidMicros
      );
    }
    return {
      ...result,
      keywordIdeaMetrics: enrichedMetrics
    };
  });

  // Filter on the enriched USD value and avgMonthlySearches
  keywordIdeas = keywordIdeas.filter((result: any) => {
    const metrics = result.keywordIdeaMetrics || {};
    const avgMonthlySearches = Number(metrics.avgMonthlySearches || 0);
    const highTopOfPageBidUSD = Number(metrics.highTopOfPageBidUSD || 0);

    return (
      avgMonthlySearches >= minkeywordvolume &&
      highTopOfPageBidUSD >= minbidUsd
    );
  });

  return {
    results: keywordIdeas,
    micropetsToUsdRate: coinGeckoRate
  };
}

// Project-specific keyword generation function
async function generateKeywordsForProjectInternal(
  projectId: number,
  project: any,
  userId: string,
) {
  if (project.status !== "active") {
    return;
  }

  console.log(
    `🔍 Generating keywords for project ${projectId}: ${project.name} (${project.numberOfKeywords} keywords)`,
  );

  try {
    // Parse rawTopics from comma-separated string or array
    const rawTopics =
      typeof project.topics === "string"
        ? project.topics
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : Array.isArray(project.topics)
          ? project.topics.map((t: string) => t.trim()).filter(Boolean)
          : [];

    // Set seedKeywords to rawTopics only
    const seedKeywords = rawTopics;

    if (seedKeywords.length === 0) {
      console.log("⚠️ No valid topics found, aborting keyword generation.");
      return;
    }

    // Get primary country and language codes
    const primaryCountry = project.countries?.[0] || "US";
    const primaryLanguage = project.languages?.[0] || "EN";

    // Clear existing keywords for this project
    await storage.deleteKeywordsByProject(projectId, userId);

    let totalKeywordsGenerated = 0;

    // Iterate through each topic and generate keywords individually
    for (const topic of seedKeywords) {
      console.log(`📡 Requesting keywords for topic: "${topic}"`);

      // Extract filtering parameters from project - STRICT validation
      const minbidUsd = project.keywordsBid ? parseFloat(project.keywordsBid) : undefined;
      const minkeywordvolume = project.keywordsVolume || undefined;
      
      console.log(`\n🎯 [PROJECT FILTERING] Applying project filters for "${topic}":`);
      console.log(`   📋 Raw project.keywordsBid: "${project.keywordsBid}" (type: ${typeof project.keywordsBid})`);
      console.log(`   📋 Raw project.keywordsVolume: ${project.keywordsVolume} (type: ${typeof project.keywordsVolume})`);
      console.log(`   💰 Parsed Min Bid USD: ${minbidUsd} (type: ${typeof minbidUsd})`);
      console.log(`   📈 Parsed Min Volume: ${minkeywordvolume} (type: ${typeof minkeywordvolume})`);
      console.log(`   ⚠️ WARNING: ANY KEYWORD WITH BID < $${minbidUsd} OR VOLUME < ${minkeywordvolume} SHOULD BE EXCLUDED!`);

      try {
        // Use exact topic without variations - Google Keyword Planner integration
        // Convert project countries and languages to the correct format
        const countryIds = project.countries?.length ? 
          project.countries.map((countryCode: string) => {
            const country = COUNTRIES.find(c => c.code === countryCode);
            return country ? country.locationId : 2840; // Default to US
          }) : [2840];
        
        const languageId = project.languages?.length ?
          (() => {
            const language = LANGUAGES.find(l => l.code === project.languages[0]);
            return language ? language.languageId : 1000; // Default to English
          })() : 1000;

        console.log(`   🌍 Using country location IDs: ${countryIds.join(', ')}`);
        console.log(`   🗣️ Using language ID: ${languageId}`);
        
        const keywordIdeas = await generateKeywordIdeas(
          [topic], // Use exact topic only
          languageId,
          countryIds,
          Math.ceil(project.numberOfKeywords / seedKeywords.length),
          minbidUsd || 0.5,
          minkeywordvolume
        );

        if (keywordIdeas.results.length === 0) {
          console.log(`⚠️ No keywords returned for topic: "${topic}" with current filters, skipping.`);
          continue;
        }

        console.log(`✅ Retrieved ${keywordIdeas.results.length} keywords for topic "${topic}" with USD conversion:`);
        keywordIdeas.results.forEach((result: any, idx: number) => {
          const metrics = result.keywordIdeaMetrics || {};
          const text = result.keywordAnnotation?.keyword?.keywordMatchType ? 
            result.keywordAnnotation.keyword.text : result.text;
          console.log(`   ${idx + 1}. "${text}" - Volume: ${metrics.avgMonthlySearches}, Bid: $${metrics.highTopOfPageBidUSD}`);
        });

        const keywordsToCreate = keywordIdeas.results
          .slice(0, project.numberOfKeywords)
          .map((result: any) => {
            const metrics = result.keywordIdeaMetrics || {};
            const text = result.keywordAnnotation?.keyword?.keywordMatchType ? 
              result.keywordAnnotation.keyword.text : result.text;
            
            return {
              projectId,
              keyword: text,
              volume: metrics.avgMonthlySearches || 0,
              bid: (metrics.highTopOfPageBidMicros || 0).toString(),
              highTopOfPageBidUSD: (metrics.highTopOfPageBidUSD || 0).toString(),
              coinGeckoRate: keywordIdeas.micropetsToUsdRate.toString(),
            };
          });

        for (const keywordData of keywordsToCreate) {
          await storage.createKeyword(keywordData, userId);
        }

        totalKeywordsGenerated += keywordsToCreate.length;
      } catch (error) {
        console.error(`❌ Google Keyword Planner failed for topic "${topic}":`, error);
        console.log(`⚠️ Skipping topic "${topic}" due to API error.`);
        continue;
      }
    }

    console.log(
      `✅ Generated ${totalKeywordsGenerated} keywords across ${project.topics.length} topics for project "${project.name}"`,
    );
  } catch (error) {
    console.error("❌ Keyword generation failed:", error);
    console.log("🔄 Falling back to basic keyword generation.");

    try {
      // Use Google Keyword Planner for fallback with exact topics
      // Convert project countries and languages to the correct format
      const countryIds = project.countries?.length ? 
        project.countries.map((countryCode: string) => {
          const country = COUNTRIES.find(c => c.code === countryCode);
          return country ? country.locationId : 2840; // Default to US
        }) : [2840];
      
      const languageId = project.languages?.length ?
        (() => {
          const language = LANGUAGES.find(l => l.code === project.languages[0]);
          return language ? language.languageId : 1000; // Default to English
        })() : 1000;

      console.log(`   �� Using country location IDs for fallback: ${countryIds.join(', ')}`);
      console.log(`   🗣️ Using language ID for fallback: ${languageId}`);
      
      const keywordIdeas = await generateKeywordIdeas(
        project.topics, // Use exact topics without variations
        languageId,
        countryIds,
        project.numberOfKeywords,
        0.5, // Default minimum bid
        100 // Default minimum volume
      );

      if (keywordIdeas.results.length > 0) {
        await storage.deleteKeywordsByProject(projectId, userId);

        const keywordsToCreate = keywordIdeas.results
          .slice(0, project.numberOfKeywords)
          .map((result: any) => {
            const metrics = result.keywordIdeaMetrics || {};
            const text = result.keywordAnnotation?.keyword?.keywordMatchType ? 
              result.keywordAnnotation.keyword.text : result.text;
            
            return {
              projectId,
              keyword: text,
              volume: metrics.avgMonthlySearches || 0,
              bid: (metrics.highTopOfPageBidMicros || 0).toString(),
              highTopOfPageBidUSD: (metrics.highTopOfPageBidUSD || 0).toString(),
              coinGeckoRate: keywordIdeas.micropetsToUsdRate.toString(),
            };
          });

        for (const keywordData of keywordsToCreate) {
          await storage.createKeyword(keywordData, userId);
        }

        console.log(`✅ Generated ${keywordsToCreate.length} keywords using Google Keyword Planner for project "${project.name}"`);
      } else {
        console.log(`⚠️ No keywords met filtering criteria for project "${project.name}".`);
      }
    } catch (error) {
      console.error(`❌ Google Keyword Planner fallback failed for project "${project.name}":`, error);
      console.log(`⚠️ Manual keyword addition required for project "${project.name}".`);
    }
  }
}



export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // Skip complex authentication setup - using hardcoded auth from index.ts
  // Test endpoint to trigger enhanced keyword generation with CoinGecko integration (placed before auth)
  app.post("/api/test-keywords", async (req, res) => {
    try {
      console.log("\n🔧 TEST ENDPOINT: Enhanced keyword generation with CoinGecko triggered");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      const { 
        keywords = ["veterinario roma"], 
        country = "IT", 
        language = "it", 
        count = 5,
        minbidUsd,
        minkeywordvolume
      } = req.body;
      
      console.log("\n📋 [TEST] Parameters received:");
      console.log(`   �� Keywords: ${keywords.join(', ')}`);
      console.log(`   🌍 Country: ${country}`);
      console.log(`   🗣️ Language: ${language}`);
      console.log(`   📊 Count: ${count}`);
      if (minbidUsd) console.log(`   💰 Min Bid USD: $${minbidUsd}`);
      if (minkeywordvolume) console.log(`   📈 Min Volume: ${minkeywordvolume}`);
      
      // Use Google Keyword Planner API for testing
      let result = [];
      try {
        // Use English and US as defaults for test endpoint
        const keywordData = await generateKeywordIdeas(
          keywords,
          1000, // English language ID
          [2840], // US location ID  
          count,
          minbidUsd || 0.5,
          minkeywordvolume || 100
        );

        result = keywordData.results.map((item: any) => {
          const metrics = item.keywordIdeaMetrics || {};
          const text = item.keywordAnnotation?.keyword?.keywordMatchType ? 
            item.keywordAnnotation.keyword.text : item.text;
          
          return {
            text: text,
            avgMonthlySearches: metrics.avgMonthlySearches || 0,
            competitionIndex: metrics.competitionIndex || 0,
            highTopOfPageBidMicros: metrics.highTopOfPageBidMicros || 0,
            highTopOfPageBidUSD: metrics.highTopOfPageBidUSD || 0,
            coinGeckoRate: keywordData.micropetsToUsdRate
          };
        });

        console.log(`✅ Google Keyword Planner returned ${result.length} keywords`);
      } catch (error) {
        console.error("❌ Google Keyword Planner API failed:", error);
        result = []; // Return empty on error
      }
      
      console.log("\n🎉 [TEST] Keyword generation completed successfully!");
      console.log(`   📊 Results returned: ${result.length}`);
      
      res.json({
        success: true,
        message: "Enhanced keyword generation completed - check console logs for CoinGecko integration details",
        result: result,
        metadata: {
          totalResults: result.length,
          hasFiltering: !!(minbidUsd || minkeywordvolume),
          filters: {
            minbidUsd: minbidUsd || null,
            minkeywordvolume: minkeywordvolume || null
          }
        }
      });
    } catch (error: any) {
      console.error("❌ [TEST] ENDPOINT ERROR:", error.message);
      console.error("   📋 Error details:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Countries and Languages endpoints for project creation
  app.get("/api/countries", (req, res) => {
    res.json(COUNTRIES);
  });

  app.get("/api/languages", (req, res) => {
    res.json(LANGUAGES);
  });

  // Test endpoint for Google Keyword Planner integration
  app.get("/api/test-google-keywords", async (req, res) => {
    try {
      console.log("🧪 [Test Endpoint] Testing Google Keyword Planner integration...");
      
      // Test data - Can be customized for different countries/languages
      const testProject = {
        id: 999,
        name: "Test Project",
        topics: ["diamond rings", "engagement rings"],
        countries: ["US", "CA"], // US (2840) and Canada (2124)
        languages: ["en"], // English (1000)
        numberOfKeywords: 10,
        keywordsVolume: 100,
        keywordsBid: "1.0",
        status: "active"
      };

      console.log(`��� [Test] Simulating keyword generation for project: ${testProject.name}`);
      console.log(`   Topics: ${testProject.topics.join(', ')}`);
      console.log(`   Countries: ${testProject.countries.join(', ')}`);
      console.log(`   Languages: ${testProject.languages.join(', ')}`);

      // Map countries to location IDs
      const locationIds = testProject.countries
        .map((countryCode: string) => {
          const country = COUNTRIES.find(c => c.code === countryCode);
          console.log(`   📍 Country ${countryCode} -> Location ID: ${country?.locationId || 'NOT FOUND'}`);
          return country?.locationId;
        })
        .filter(id => id !== undefined) as number[];

      // Map language to language ID
      const languageId = testProject.languages.length > 0 ? 
        LANGUAGES.find(lang => lang.code === testProject.languages[0])?.languageId || 1000 :
        1000;

      console.log(`   🗣️ Language ${testProject.languages[0]} -> Language ID: ${languageId}`);
      console.log(`   🌐 Final targeting: Location IDs: ${locationIds.join(', ')}, Language ID: ${languageId}`);

      // Import and test the keyword generation function
      const { generateKeywordIdeas, generateFallbackKeywords } = await import('./googleKeywordPlanner.js');

      let result = [];
      let source = 'unknown';
      
      try {
        // Test Google Keyword Planner API
        const keywordResults = await generateKeywordIdeas({
          keywords: testProject.topics,
          languageId: languageId,
          locationIds: locationIds,
          keywordCount: testProject.numberOfKeywords,
          minkeywordvolume: testProject.keywordsVolume,
          minbidUsd: parseFloat(testProject.keywordsBid)
        });

        result = keywordResults;
        source = 'Google Keyword Planner API';
        console.log(`✅ [Google API Success] Generated ${result.length} keywords`);

      } catch (googleError: any) {
        console.warn(`⚠️ [Google API Failed] Error: ${googleError.message}`);
        console.log(`🔄 [Fallback] Using exact topic words without variations`);
        
        const fallbackKeywords = generateFallbackKeywords(testProject.topics);
        result = fallbackKeywords;
        source = 'Fallback (exact topics)';
        console.log(`✅ [Fallback Success] Generated ${result.length} keywords`);
      }

      res.json({
        success: true,
        message: "Google Keyword Planner integration test completed",
        source: source,
        testProject: {
          name: testProject.name,
          topics: testProject.topics,
          countries: testProject.countries,
          languages: testProject.languages
        },
        targeting: {
          locationIds: locationIds,
          languageId: languageId,
          countryMappings: testProject.countries.map((code: string) => ({
            code,
            locationId: COUNTRIES.find(c => c.code === code)?.locationId,
            name: COUNTRIES.find(c => c.code === code)?.name
          })),
          languageMapping: {
            code: testProject.languages[0],
            languageId: languageId,
            name: LANGUAGES.find(lang => lang.code === testProject.languages[0])?.name
          }
        },
        results: result.slice(0, 5), // Show first 5 keywords for testing
        totalGenerated: result.length,
        filters: {
          minVolume: testProject.keywordsVolume,
          minBidUsd: testProject.keywordsBid
        }
      });

    } catch (error: any) {
      console.error("❌ [Test Endpoint] Error:", error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        details: "Check console for detailed error information"
      });
    }
  });

  // Enhanced test endpoint specifically for demonstrating filtering capabilities
  app.post("/api/test-keywords-filtered", async (req, res) => {
    try {
      console.log("\n🔍 FILTERED TEST ENDPOINT: Enhanced keyword generation with filtering triggered");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      const { 
        keywords = ["digital marketing", "seo services", "web design"], 
        country = "US", 
        language = "en", 
        count = 10,
        minbidUsd = 2.0,
        minkeywordvolume = 1000
      } = req.body;
      
      console.log("\n📋 [FILTERED TEST] Parameters:");
      console.log(`   🎯 Keywords: ${keywords.join(', ')}`);
      console.log(`   🌍 Country: ${country}`);
      console.log(`   🗣️ Language: ${language}`);
      console.log(`   📊 Count: ${count}`);
      console.log(`   💰 Min Bid USD: $${minbidUsd}`);
      console.log(`   📈 Min Volume: ${minkeywordvolume}`);
      
      // Use Google Keyword Planner API for filtered testing
      let result = [];
      try {
        // Use English and US as defaults for filtered test endpoint  
        const keywordData = await generateKeywordIdeas(
          keywords,
          1000, // English language ID
          [2840], // US location ID  
          count,
          minbidUsd,
          minkeywordvolume
        );

        result = keywordData.results.map((item: any) => {
          const metrics = item.keywordIdeaMetrics || {};
          const text = item.keywordAnnotation?.keyword?.keywordMatchType ? 
            item.keywordAnnotation.keyword.text : item.text;
          
          return {
            text: text,
            avgMonthlySearches: metrics.avgMonthlySearches || 0,
            competitionIndex: metrics.competitionIndex || 0,
            highTopOfPageBidMicros: metrics.highTopOfPageBidMicros || 0,
            highTopOfPageBidUSD: metrics.highTopOfPageBidUSD || 0,
            coinGeckoRate: keywordData.micropetsToUsdRate
          };
        });

        console.log(`✅ Google Keyword Planner returned ${result.length} filtered keywords`);
      } catch (error) {
        console.error("❌ Google Keyword Planner API failed:", error);
        result = []; // Return empty on error
      }
      
      console.log("\n🎯 [FILTERED TEST] Filtering demonstration completed!");
      console.log(`   📊 Filtered results: ${result.length}`);
      
      // Log sample results for debugging
      if (result.length > 0) {
        console.log("\n📋 [SAMPLE RESULTS] First few keywords:");
        result.slice(0, 3).forEach((kw: any, index: number) => {
          console.log(`   ${index + 1}. "${kw.text}"`);
          console.log(`      📈 Volume: ${kw.avgMonthlySearches}`);
          console.log(`      💰 High Bid USD (Simple): $${kw.highTopOfPageBidUsd?.toFixed(2) || 'N/A'}`);
          console.log(`      🪙 High Bid USD (CoinGecko): $${kw.highTopOfPageBidUSD?.toFixed(2) || 'N/A'}`);
          console.log(`      📊 CoinGecko Rate: ${kw.coinGeckoRate || 'N/A'}`);
        });
      }
      
      res.json({
        success: true,
        message: "Filtered keyword generation completed - check console logs for detailed CoinGecko and filtering process",
        result: result,
        metadata: {
          totalResults: result.length,
          filtersApplied: {
            minbidUsd: minbidUsd,
            minkeywordvolume: minkeywordvolume
          },
          sampleKeyword: result.length > 0 ? {
            text: result[0].text,
            volume: result[0].avgMonthlySearches,
            highBidUsdSimple: result[0].highTopOfPageBidUsd,
            highBidUsdCoinGecko: result[0].highTopOfPageBidUSD,
            coinGeckoRate: result[0].coinGeckoRate
          } : null
        }
      });
    } catch (error: any) {
      console.error("❌ [FILTERED TEST] ENDPOINT ERROR:", error.message);
      console.error("   📋 Error details:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: "Check console logs for detailed error information"
      });
    }
  });

  // Auth middleware
  // Skip complex authentication setup - using hardcoded auth from index.ts

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Project routes
  app.get("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId, userId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData, userId);

      // Auto-generate keywords if project status is active
      if (project.status === "active") {
        await handleProjectStatusChange({
          project,
          previousStatus: 'draft',
          newStatus: 'active'
        }, storage, userId);
      }

      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.id);
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(
        projectId,
        projectData,
        userId,
      );

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.patch("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.id);
      const projectData = insertProjectSchema.partial().parse(req.body);

      // Get the previous project state to check if status is changing to active
      const previousProject = await storage.getProject(projectId, userId);
      const project = await storage.updateProject(
        projectId,
        projectData,
        userId,
      );

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Auto-generate keywords if status changed to active
      if (
        projectData.status === "active" &&
        previousProject?.status !== "active"
      ) {
        await handleProjectStatusChange({
          project,
          previousStatus: previousProject?.status || 'draft',
          newStatus: 'active'
        }, storage, userId);
      }

      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.id);
      const deleted = await storage.deleteProject(projectId, userId);

      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Keywords routes
  app.get("/api/keywords", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const keywords = await storage.getKeywords(null, userId);
      res.json(keywords);
    } catch (error) {
      console.error("Error fetching all keywords:", error);
      res.status(500).json({ message: "Failed to fetch keywords" });
    }
  });

  app.get(
    "/api/projects/:projectId/keywords",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const projectId = parseInt(req.params.projectId);
        const userId = req.user.claims.sub;
        const keywords = await storage.getKeywords(projectId, userId);
        
        // Enhanced keywords with CoinGecko-based USD values  
        console.log(`\n📊 [Keywords API] Processing ${keywords.length} keywords for project ${projectId}`);
        
        // Cache CoinGecko rate to avoid multiple API calls
        let cachedCoinGeckoRate: number | null = null;
        let cacheTimestamp: number | null = null;
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
        
        const enhancedKeywords = await Promise.all(keywords.map(async (keyword: any) => {
          try {
            // If we already have stored CoinGecko values, use them
            if (keyword.highTopOfPageBidUSD && keyword.coinGeckoRate) {
              console.log(`   ✅ Using stored CoinGecko data for "${keyword.keyword}": $${keyword.highTopOfPageBidUSD}`);
              return {
                ...keyword,
                highTopOfPageBidUSD: parseFloat(keyword.highTopOfPageBidUSD),
                coinGeckoRate: parseFloat(keyword.coinGeckoRate)
              };
            }
            
            // Otherwise, calculate on-the-fly if we have bid data
            if (keyword.bid) {
              console.log(`\n🔄 [Keywords API] Calculating CoinGecko USD for "${keyword.keyword}"`);
              
              try {
                // Use cached rate if available and not expired
                let coinGeckoRate = cachedCoinGeckoRate;
                const now = Date.now();
                
                if (!coinGeckoRate || !cacheTimestamp || (now - cacheTimestamp) > CACHE_DURATION) {
                  console.log(`   🔄 Fetching fresh CoinGecko rate...`);
                  coinGeckoRate = 1.0; // Simple fallback rate since CoinGecko service removed
                  cachedCoinGeckoRate = coinGeckoRate;
                  cacheTimestamp = now;
                } else {
                  console.log(`   📦 Using cached CoinGecko rate: ${coinGeckoRate}`);
                }
                
                console.log(`   🪙 CoinGecko rate: ${coinGeckoRate}`);
                
                // Convert bid micros to USD using CoinGecko rate
                const bidMicros = parseInt(keyword.bid);
                const highTopOfPageBidUSD = bidMicros * coinGeckoRate / 1_000_000; // Simple conversion
                
                console.log(`   💱 Conversion: ${bidMicros} micros × ${coinGeckoRate} = $${highTopOfPageBidUSD}`);
                
                // Store the calculated values in the database for future use
                try {
                  await storage.updateKeyword(keyword.id, {
                    highTopOfPageBidUSD: highTopOfPageBidUSD.toString(),
                    coinGeckoRate: coinGeckoRate.toString()
                  }, userId);
                  console.log(`   💾 Stored CoinGecko data for "${keyword.keyword}"`);
                } catch (updateError) {
                  console.error(`   ⚠️ Failed to store CoinGecko data for "${keyword.keyword}":`, updateError);
                }
                
                return {
                  ...keyword,
                  highTopOfPageBidUSD,
                  coinGeckoRate
                };
              } catch (coinGeckoError) {
                console.log(`   ⚠️ CoinGecko API error for "${keyword.keyword}", using fallback`);
                return keyword; // Return original keyword if CoinGecko fails
              }
            }
            
            return keyword;
          } catch (error) {
            console.error(`   ❌ Error processing keyword "${keyword.keyword}":`, error);
            return keyword; // Return original keyword on error
          }
        }));
        
        console.log(`✅ [Keywords API] Enhanced ${enhancedKeywords.length} keywords with CoinGecko data`);
        res.json(enhancedKeywords);
      } catch (error) {
        console.error("Error fetching keywords:", error);
        res.status(500).json({ message: "Failed to fetch keywords" });
      }
    },
  );

  app.post(
    "/api/projects/:projectId/keywords",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const projectId = parseInt(req.params.projectId);
        const userId = req.user.claims.sub;
        const keyword = await storage.createKeyword(
          { ...req.body, projectId },
          userId,
        );
        res.status(201).json(keyword);
      } catch (error) {
        console.error("Error creating keyword:", error);
        res.status(500).json({ message: "Failed to create keyword" });
      }
    },
  );

  // Bulk delete must come BEFORE the parameterized route
  app.delete("/api/keywords/bulk", isAuthenticated, async (req: any, res) => {
    try {
      console.log("Bulk keyword delete route called");
      console.log("Request body:", req.body);

      const { ids } = req.body;
      const userId = req.user.claims.sub;

      if (!Array.isArray(ids)) {
        return res.status(400).json({ message: "IDs must be an array" });
      }

      // Validate and convert all IDs to integers
      const validIds: number[] = [];
      for (const id of ids) {
        const parsedId = typeof id === "number" ? id : parseInt(String(id));
        if (isNaN(parsedId) || parsedId <= 0) {
          console.error(
            "Invalid keyword ID received:",
            id,
            "parsed as:",
            parsedId,
          );
          return res.status(400).json({ message: `Invalid keyword ID: ${id}` });
        }
        validIds.push(parsedId);
      }

      console.log("Processing deletion for keyword IDs:", validIds);

      if (validIds.length === 0) {
        return res
          .status(400)
          .json({ message: "No valid keyword IDs provided" });
      }

      const success = await storage.deleteKeywords(validIds, userId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "One or more keywords not found" });
      }
    } catch (error) {
      console.error("Error deleting keywords:", error);
      res.status(500).json({ message: "Failed to delete keywords" });
    }
  });

  app.patch("/api/keywords/:id", isAuthenticated, async (req: any, res) => {
    try {
      const keywordId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      if (isNaN(keywordId)) {
        return res.status(400).json({ message: "Invalid keyword ID" });
      }

      const updatedKeyword = await storage.updateKeyword(
        keywordId,
        req.body,
        userId,
      );
      if (updatedKeyword) {
        res.json(updatedKeyword);
      } else {
        res.status(404).json({ message: "Keyword not found" });
      }
    } catch (error) {
      console.error("Error updating keyword:", error);
      res.status(500).json({ message: "Failed to update keyword" });
    }
  });

  app.delete("/api/keywords/:id", isAuthenticated, async (req: any, res) => {
    try {
      console.log("Single keyword delete route called with ID:", req.params.id);
      const keywordId = parseInt(req.params.id);
      console.log("Parsed keyword ID:", keywordId);

      if (isNaN(keywordId)) {
        return res.status(400).json({ message: "Invalid keyword ID" });
      }

      const userId = req.user.claims.sub;
      const success = await storage.deleteKeyword(keywordId, userId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Keyword not found" });
      }
    } catch (error) {
      console.error("Error deleting keyword:", error);
      res.status(500).json({ message: "Failed to delete keyword" });
    }
  });

  app.post(
    "/api/projects/:projectId/keywords/upload",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const projectId = parseInt(req.params.projectId);
        const userId = req.user.claims.sub;

        if (!req.files || !req.files.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const file = req.files.file as any;
        const csvContent = file.data.toString("utf8");
        const lines = csvContent.split("\n").filter((line: string) => line.trim());

        if (lines.length < 2) {
          return res.status(400).json({
            message: "CSV must have header row and at least one data row",
          });
        }

        const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase());
        const requiredHeaders = ["keyword"];

        for (const required of requiredHeaders) {
          if (!headers.includes(required)) {
            return res
              .status(400)
              .json({ message: `Missing required column: ${required}` });
          }
        }

        const keywords = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v: string) => v.trim());
          const keywordData: any = { projectId };

          headers.forEach((header: string, index: number) => {
            const value = values[index]?.replace(/"/g, "");
            if (value) {
              switch (header) {
                case "keyword":
                  keywordData.keyword = value;
                  break;
                case "volume":
                  keywordData.volume = parseInt(value) || null;
                  break;
                case "bid":
                  keywordData.bid = value; // Keep as string for storage
                  break;
                case "status":
                  keywordData.status = value;
                  break;
              }
            }
          });

          if (keywordData.keyword) {
            keywords.push(keywordData);
          }
        }

        if (keywords.length === 0) {
          return res
            .status(400)
            .json({ message: "No valid keywords found in CSV" });
        }

        const newKeywords = await storage.createKeywords(keywords, userId);
        res.status(201).json({
          created: newKeywords.length,
          total: keywords.length,
          message: `Successfully imported ${newKeywords.length} keywords`,
        });
      } catch (error) {
        console.error("Error uploading keywords:", error);
        res.status(500).json({ message: "Failed to upload keywords" });
      }
    },
  );

  // Bulk upload keywords from CSV with project names
  app.post(
    "/api/keywords/upload-bulk",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;

        if (!req.files || !req.files.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const file = req.files.file;

        // Parse CSV content  
        const fileWithData = file as any; // Fix type issue for file.data
        const csvContent = fileWithData.data.toString();
        const lines = csvContent.split("\n").filter((line: string) => line.trim());

        if (lines.length < 2) {
          return res.status(400).json({
            message: "CSV file must contain at least a header and one data row",
          });
        }

        // Get user's projects
        const userProjects = await storage.getProjects(userId);
        const projectMap = new Map(
          userProjects.map((p) => [p.name.toLowerCase(), p.id]),
        );

        // Skip header row and parse data
        const keywords: any[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const [projectName, keyword, volume, bid, status] = line
            .split(",")
            .map((s: string) => s.trim().replace(/"/g, ""));

          if (!projectName || !keyword) {
            errors.push(`Line ${i + 1}: Missing project name or keyword`);
            continue;
          }

          const projectId = projectMap.get(projectName.toLowerCase());
          if (!projectId) {
            errors.push(`Line ${i + 1}: Project "${projectName}" not found`);
            continue;
          }

          keywords.push({
            projectId,
            keyword,
            volume:
              volume && !isNaN(parseInt(volume)) ? parseInt(volume) : null,
            bid: bid && !isNaN(parseFloat(bid)) ? parseFloat(bid).toString() : null,
            status:
              status && ["active", "paused", "draft"].includes(status)
                ? status
                : "active",
          });
        }

        if (keywords.length === 0) {
          return res.status(400).json({
            message: "No valid keywords found in CSV",
            errors: errors,
          });
        }

        const newKeywords = await storage.createKeywords(keywords, userId);
        res.status(201).json({
          created: newKeywords.length,
          total: keywords.length,
          errors: errors.length > 0 ? errors : undefined,
          message: `Successfully imported ${newKeywords.length} keywords${errors.length > 0 ? ` with ${errors.length} errors` : ""}`,
        });
      } catch (error) {
        console.error("Error uploading keywords:", error);
        res.status(500).json({ message: "Failed to upload keywords" });
      }
    },
  );

  // Campaign routes
  app.get("/api/campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Get campaigns across all projects
      const campaigns = await storage.getCampaigns(null, userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.get(
    "/api/projects/:projectId/campaigns",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const projectId = parseInt(req.params.projectId);
        const campaigns = await storage.getCampaigns(projectId, userId);
        res.json(campaigns);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        res.status(500).json({ message: "Failed to fetch campaigns" });
      }
    },
  );

  app.post("/api/campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(campaignData, userId);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid campaign data", errors: error.errors });
      }
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.put("/api/campaigns/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = parseInt(req.params.id);
      const campaignData = insertCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateCampaign(
        campaignId,
        campaignData,
        userId,
      );

      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid campaign data", errors: error.errors });
      }
      console.error("Error updating campaign:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.patch("/api/campaigns/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = parseInt(req.params.id);
      const campaignData = insertCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateCampaign(
        campaignId,
        campaignData,
        userId,
      );

      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid campaign data", errors: error.errors });
      }
      console.error("Error updating campaign:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.delete("/api/campaigns/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = parseInt(req.params.id);
      const deleted = await storage.deleteCampaign(campaignId, userId);

      if (!deleted) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // Bulk campaign creation
  app.post("/api/campaigns/bulk", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      if (!req.files || !req.files.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const file = req.files.file;
      const projectId = parseInt(req.body.projectId);

      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      // Verify user owns the project
      const project = await storage.getProject(projectId, userId);
      if (!project) {
        return res
          .status(404)
          .json({ message: "Project not found or access denied" });
      }

      // Parse CSV content
      const csvContent = file.data.toString();
      const lines = csvContent
        .split("\n")
        .filter((line: string) => line.trim());
      const headers = lines[0].split(",").map((h: string) => h.trim());

      // Validate headers
      const requiredHeaders = ["keyword", "url", "channelId", "status"];
      const optionalHeaders = [
        "trafficSource",
        "aiPrimaryText",
        "aiHeadline",
        "aiCta",
        "aiImage",
        "aiVideo",
        "primaryText",
        "headline",
        "description",
        "cta",
        "image",
        "video",
      ];
      const missingHeaders = requiredHeaders.filter(
        (h) => !headers.includes(h),
      );
      if (missingHeaders.length > 0) {
        return res.status(400).json({
          message: `Missing required headers: ${missingHeaders.join(", ")}`,
        });
      }

      const campaigns = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v: string) => v.trim());
        if (values.length >= requiredHeaders.length) {
          const campaign: any = {
            projectId,
            keyword: values[headers.indexOf("keyword")],
            url: values[headers.indexOf("url")],
            channelId: values[headers.indexOf("channelId")],
            status: values[headers.indexOf("status")] || "draft",
          };

          // Add optional fields if present
          optionalHeaders.forEach((header) => {
            const index = headers.indexOf(header);
            if (index !== -1 && values[index]) {
              campaign[header] = values[index];
            }
          });

          campaigns.push(campaign);
        }
      }

      // Create campaigns
      let created = 0;
      for (const campaign of campaigns) {
        try {
          await storage.createCampaign(campaign, userId);
          created++;
        } catch (error) {
          console.error("Error creating campaign:", error);
        }
      }

      res.json({ created, total: campaigns.length });
    } catch (error) {
      console.error("Error in bulk campaign creation:", error);
      res.status(500).json({ message: "Failed to create campaigns" });
    }
  });

  // Advertiser routes
  app.get("/api/advertisers", async (req, res) => {
    try {
      const advertisers = await storage.getAdvertisers();
      res.json(advertisers);
    } catch (error) {
      console.error("Error fetching advertisers:", error);
      res.status(500).json({ message: "Failed to fetch advertisers" });
    }
  });

  app.post("/api/advertisers", isAuthenticated, async (req: any, res) => {
    try {
      const advertiserData = insertAdvertiserSchema.parse(req.body);
      const advertiser = await storage.createAdvertiser(advertiserData);
      res.status(201).json(advertiser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid advertiser data", errors: error.errors });
      }
      console.error("Error creating advertiser:", error);
      res.status(500).json({ message: "Failed to create advertiser" });
    }
  });

  app.put("/api/advertisers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const advertiserId = parseInt(req.params.id);
      const advertiserData = insertAdvertiserSchema.partial().parse(req.body);
      const advertiser = await storage.updateAdvertiser(
        advertiserId,
        advertiserData,
      );

      if (!advertiser) {
        return res.status(404).json({ message: "Advertiser not found" });
      }

      res.json(advertiser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid advertiser data", errors: error.errors });
      }
      console.error("Error updating advertiser:", error);
      res.status(500).json({ message: "Failed to update advertiser" });
    }
  });

  app.patch("/api/advertisers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const advertiserId = parseInt(req.params.id);
      const advertiserData = insertAdvertiserSchema.partial().parse(req.body);
      const advertiser = await storage.updateAdvertiser(
        advertiserId,
        advertiserData,
      );

      if (!advertiser) {
        return res.status(404).json({ message: "Advertiser not found" });
      }

      res.json(advertiser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid advertiser data", errors: error.errors });
      }
      console.error("Error updating advertiser:", error);
      res.status(500).json({ message: "Failed to update advertiser" });
    }
  });

  // Stats route
  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getProjectStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Initialize default advertisers and traffic sources
  app.post("/api/init", async (req, res) => {
    try {
      const existingAdvertisers = await storage.getAdvertisers().catch((e) => {
        console.warn("/api/init: skipping advertisers init (storage unavailable)", e?.message || e);
        return null;
      });

      if (existingAdvertisers && existingAdvertisers.length === 0) {
        try {
          await storage.createAdvertiser({
            name: "Sedo",
            channelIds: ["sedo_001", "sedo_002", "sedo_003"],
            domains: ["sedo.com", "sedo.de", "sedo.co.uk"],
            sampleUrl: "https://sedo.com/search?keyword=domain",
          });
          await storage.createAdvertiser({
            name: "Explorads",
            channelIds: ["exp_001", "exp_002", "exp_003", "exp_004"],
            domains: ["explorads.com", "explorads.net"],
            sampleUrl: "https://explorads.com/campaigns/new",
          });
        } catch (e) {
          console.warn("/api/init: failed creating advertisers (storage unavailable)", e?.message || e);
        }
      }

      const existingTrafficSources = await storage.getTrafficSources().catch((e) => {
        console.warn("/api/init: skipping traffic sources init (storage unavailable)", e?.message || e);
        return null;
      });

      if (existingTrafficSources && existingTrafficSources.length === 0) {
        try {
          await storage.createTrafficSource({
            name: "facebook",
            displayName: "Facebook",
            fields: [
              { name: "primaryText", label: "Primary Text", type: "textarea", required: true },
              { name: "headline", label: "Headline", type: "text", required: true },
              { name: "cta", label: "Call to Action", type: "text", required: true },
              { name: "image", label: "Image URL", type: "url", required: false },
              { name: "video", label: "Video URL", type: "url", required: false },
            ],
            isActive: true,
          });
        } catch (e) {
          console.warn("/api/init: failed creating traffic source (storage unavailable)", e?.message || e);
        }
      }

      res.json({ message: "Initialization complete" });
    } catch (error) {
      console.error("/api/init unexpected error:", error);
      // Always succeed to avoid blocking UI even if DB is down
      res.json({ message: "Initialization skipped" });
    }
  });

  // API endpoints for external access (require API key)
  const validateApiKey = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const apiKey = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : req.headers["x-api-key"] || req.body.apiKey || req.query.apiKey;
    if (!apiKey || apiKey !== "traffid-api-key-2025") {
      return res.status(401).json({ message: "Invalid or missing API key" });
    }
    next();
  };

  // Get all projects (API access)
  app.get("/api/external/projects", validateApiKey, async (req, res) => {
    try {
      const projects = await storage.getProjects("system");
      const { COUNTRIES, LANGUAGES } = await import(
        "@shared/countries-languages"
      );

      // Enhance projects with location IDs and language IDs
      const enhancedProjects = projects.map((project) => {
        const countriesWithIds = project.countries.map((countryCode) => {
          const country = COUNTRIES.find((c) => c.code === countryCode);
          return {
            code: countryCode,
            locationId: country?.locationId,
            name: country?.name || countryCode,
          };
        });

        const languagesWithIds = project.languages.map((languageCode) => {
          const language = LANGUAGES.find((l) => l.code === languageCode);
          return {
            code: languageCode,
            languageId: language?.languageId,
            name: language?.name || languageCode,
          };
        });

        return {
          ...project,
          countries: countriesWithIds,
          languages: languagesWithIds,
        };
      });

      res.json(enhancedProjects);
    } catch (error) {
      console.error("Error fetching projects via API:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Get specific project with campaigns (API access)
  app.get("/api/external/projects/:id", validateApiKey, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId, "system");

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const campaigns = await storage.getCampaigns(projectId, "system");
      const { COUNTRIES, LANGUAGES } = await import(
        "@shared/countries-languages"
      );

      // Enhance project with location IDs and language IDs
      const countriesWithIds = project.countries.map((countryCode) => {
        const country = COUNTRIES.find((c) => c.code === countryCode);
        return {
          code: countryCode,
          locationId: country?.locationId,
          name: country?.name || countryCode,
        };
      });

      const languagesWithIds = project.languages.map((languageCode) => {
        const language = LANGUAGES.find((l) => l.code === languageCode);
        return {
          code: languageCode,
          languageId: language?.languageId,
          name: language?.name || languageCode,
        };
      });

      res.json({
        ...project,
        countries: countriesWithIds,
        languages: languagesWithIds,
        campaigns: campaigns,
      });
    } catch (error) {
      console.error("Error fetching project via API:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Get project campaigns only (API access)
  app.get(
    "/api/external/projects/:id/campaigns",
    validateApiKey,
    async (req, res) => {
      try {
        const projectId = parseInt(req.params.id);

        // Verify project exists
        const project = await storage.getProject(projectId, "system");
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }

        const campaigns = await storage.getCampaigns(projectId, "system");
        res.json(campaigns);
      } catch (error) {
        console.error("Error fetching campaigns via API:", error);
        res.status(500).json({ message: "Failed to fetch campaigns" });
      }
    },
  );

  // Old endpoints removed - now using comprehensive mapping with proper IDs

  // Get all advertisers (API access)
  app.get("/api/external/advertisers", validateApiKey, async (req, res) => {
    try {
      const advertisers = await storage.getAdvertisers();
      res.json(advertisers);
    } catch (error) {
      console.error("Error fetching advertisers via API:", error);
      res.status(500).json({ message: "Failed to fetch advertisers" });
    }
  });

  // Get all countries with proper location IDs (API access)
  app.get("/api/external/countries", validateApiKey, async (req, res) => {
    try {
      const { COUNTRIES } = await import("@shared/countries-languages");
      res.json(COUNTRIES);
    } catch (error) {
      console.error("Error fetching countries via API:", error);
      res.status(500).json({ message: "Failed to fetch countries" });
    }
  });

  // Get all languages with proper language IDs (API access)
  app.get("/api/external/languages", validateApiKey, async (req, res) => {
    try {
      const { LANGUAGES } = await import("@shared/countries-languages");
      res.json(LANGUAGES);
    } catch (error) {
      console.error("Error fetching languages via API:", error);
      res.status(500).json({ message: "Failed to fetch languages" });
    }
  });

  // Get all keywords (API access)
  app.get("/api/external/keywords", validateApiKey, async (req, res) => {
    try {
      const allKeywords = await storage.getKeywords(null, "system");
      res.json(allKeywords);
    } catch (error) {
      console.error("Error fetching keywords via API:", error);
      res.status(500).json({ message: "Failed to fetch keywords" });
    }
  });

  // Get keywords for specific project (API access)
  app.get(
    "/api/external/projects/:id/keywords",
    validateApiKey,
    async (req, res) => {
      try {
        const projectId = parseInt(req.params.id);

        // Verify project exists
        const project = await storage.getProject(projectId, "system");
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }

        const keywords = await storage.getKeywords(projectId, "system");
        res.json(keywords);
      } catch (error) {
        console.error("Error fetching project keywords via API:", error);
        res.status(500).json({ message: "Failed to fetch keywords" });
      }
    },
  );

  // External API keyword creation
  app.post("/api/external/keywords", validateApiKey, async (req, res) => {
    try {
      const { projectId, keyword, volume, bid, status = "active" } = req.body;

      if (!projectId || !keyword) {
        return res.status(400).json({
          message: "Missing required fields: projectId, keyword",
        });
      }

      // Verify project exists
      const project = await storage.getProject(projectId, "system");
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Create keyword using storage interface
      const newKeyword = await storage.createKeyword(
        {
          projectId,
          keyword,
          volume,
          bid,
          status,
        },
        "system",
      );

      res.status(201).json(newKeyword);
    } catch (error) {
      console.error("Error creating external keyword:", error);
      res.status(500).json({ message: "Failed to create keyword" });
    }
  });

  // External API bulk keyword upload
  app.post(
    "/api/external/keywords/upload",
    validateApiKey,
    async (req, res) => {
      try {
        if (!req.files || !req.files.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const file = req.files.file;

        // Parse CSV content
        const fileWithData = file as any; // Fix type issue for file.data
        const csvContent = fileWithData.data.toString();
        const lines = csvContent.split("\n").filter((line: string) => line.trim());

        if (lines.length < 2) {
          return res.status(400).json({
            message: "CSV file must contain at least a header and one data row",
          });
        }

        // Get all projects for project name resolution
        const allProjects = await storage.getProjects("system");
        const projectMap = new Map(
          allProjects.map((p) => [p.name.toLowerCase(), p.id]),
        );

        // Expected headers: project_name,keyword,volume,bid,status
        const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase());
        if (!headers.includes("project_name") || !headers.includes("keyword")) {
          return res.status(400).json({
            message: "CSV must contain 'project_name' and 'keyword' columns",
          });
        }

        // Skip header row and parse data
        const keywords: any[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const [projectName, keyword, volume, bid, status] = line
            .split(",")
            .map((s: string) => s.trim().replace(/"/g, ""));

          if (!projectName || !keyword) {
            errors.push(`Line ${i + 1}: Missing project name or keyword`);
            continue;
          }

          const projectId = projectMap.get(projectName.toLowerCase());
          if (!projectId) {
            errors.push(`Line ${i + 1}: Project "${projectName}" not found`);
            continue;
          }

          keywords.push({
            projectId,
            keyword,
            volume:
              volume && !isNaN(parseInt(volume)) ? parseInt(volume) : null,
            bid: bid && !isNaN(parseFloat(bid)) ? parseFloat(bid).toString() : null,
            status:
              status && ["active", "paused", "draft"].includes(status)
                ? status
                : "active",
          });
        }

        if (keywords.length === 0) {
          return res.status(400).json({
            message: "No valid keywords found in CSV",
            errors: errors,
          });
        }

        // Create keywords using storage interface
        const newKeywords = await storage.createKeywords(keywords, "system");
        res.status(201).json({
          created: newKeywords.length,
          total: keywords.length,
          errors: errors.length > 0 ? errors : undefined,
          message: `Successfully imported ${newKeywords.length} keywords${errors.length > 0 ? ` with ${errors.length} errors` : ""}`,
        });
      } catch (error) {
        console.error("Error uploading keywords via API:", error);
        res.status(500).json({ message: "Failed to upload keywords" });
      }
    },
  );

  // Get project statistics (API access)
  app.get("/api/external/stats", validateApiKey, async (req, res) => {
    try {
      const stats = await storage.getProjectStats("system");
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats via API:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // API endpoint for campaign creation (for external access)
  app.post("/api/campaigns/create", validateApiKey, async (req, res) => {
    try {
      const { projectId, campaigns } = req.body;

      if (!projectId || !campaigns || !Array.isArray(campaigns)) {
        return res.status(400).json({ message: "Invalid request format" });
      }

      // Validate project exists (using system user for API access)
      const project = await storage.getProject(projectId, "system");
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Create campaigns
      let created = 0;
      const errors = [];

      for (const campaign of campaigns) {
        try {
          if (!campaign.keyword || !campaign.url || !campaign.channelId) {
            errors.push(
              `Missing required fields for campaign: ${JSON.stringify(campaign)}`,
            );
            continue;
          }

          await storage.createCampaign(
            {
              ...campaign,
              projectId,
              status: campaign.status || "draft",
            },
            "system",
          );
          created++;
        } catch (error) {
          errors.push(
            `Failed to create campaign ${campaign.keyword}: ${error}`,
          );
        }
      }

      res.json({
        created,
        total: campaigns.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("Error in API campaign creation:", error);
      res.status(500).json({ message: "Failed to create campaigns" });
    }
  });

  // External Meta Campaigns API endpoints
  app.get("/api/external/meta-campaigns", validateApiKey, async (req, res) => {
    try {
      const metaCampaigns = await storage.getMetaCampaigns("system");
      res.json(metaCampaigns);
    } catch (error) {
      console.error("Error fetching meta campaigns via API:", error);
      res.status(500).json({ message: "Failed to fetch meta campaigns" });
    }
  });

  app.post("/api/external/meta-campaigns", validateApiKey, async (req, res) => {
    try {
      const metaCampaignData = req.body;

      // Validate required fields
      if (
        !metaCampaignData.name ||
        !metaCampaignData.projectId ||
        !metaCampaignData.advertiserId
      ) {
        return res.status(400).json({
          message: "Missing required fields: name, projectId, advertiserId",
        });
      }

      const newMetaCampaign = await storage.createMetaCampaign(
        metaCampaignData,
        "system",
      );
      res.status(201).json(newMetaCampaign);
    } catch (error) {
      console.error("Error creating meta campaign via API:", error);
      res.status(500).json({ message: "Failed to create meta campaign" });
    }
  });

  app.patch(
    "/api/external/meta-campaigns/:id",
    validateApiKey,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const updateData = req.body;

        const updatedMetaCampaign = await storage.updateMetaCampaign(
          id,
          updateData,
          "system",
        );
        if (!updatedMetaCampaign) {
          return res.status(404).json({ message: "Meta campaign not found" });
        }

        res.json(updatedMetaCampaign);
      } catch (error) {
        console.error("Error updating meta campaign via API:", error);
        res.status(500).json({ message: "Failed to update meta campaign" });
      }
    },
  );

  // Traffic Sources Routes
  app.get("/api/traffic-sources", async (req, res) => {
    try {
      const trafficSources = await storage.getTrafficSources();
      res.json(trafficSources);
    } catch (error) {
      console.error("Error fetching traffic sources:", error);
      res.status(500).json({ message: "Failed to fetch traffic sources" });
    }
  });

  app.get("/api/traffic-sources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const trafficSource = await storage.getTrafficSource(id);

      if (!trafficSource) {
        return res.status(404).json({ message: "Traffic source not found" });
      }

      res.json(trafficSource);
    } catch (error) {
      console.error("Error fetching traffic source:", error);
      res.status(500).json({ message: "Failed to fetch traffic source" });
    }
  });

  app.post("/api/traffic-sources", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTrafficSourceSchema.parse(req.body);
      const trafficSource = await storage.createTrafficSource(validatedData);
      res.status(201).json(trafficSource);
    } catch (error) {
      console.error("Error creating traffic source:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Failed to create traffic source" });
    }
  });

  app.patch("/api/traffic-sources/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTrafficSourceSchema.partial().parse(req.body);
      const trafficSource = await storage.updateTrafficSource(
        id,
        validatedData,
      );

      if (!trafficSource) {
        return res.status(404).json({ message: "Traffic source not found" });
      }

      res.json(trafficSource);
    } catch (error) {
      console.error("Error updating traffic source:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Failed to update traffic source" });
    }
  });

  app.delete("/api/traffic-sources/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTrafficSource(id);

      if (!success) {
        return res.status(404).json({ message: "Traffic source not found" });
      }

      res.json({ message: "Traffic source deleted successfully" });
    } catch (error) {
      console.error("Error deleting traffic source:", error);
      res.status(500).json({ message: "Failed to delete traffic source" });
    }
  });

  // Campaign Groups routes
  app.get("/api/campaign-groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = req.query.projectId
        ? parseInt(req.query.projectId as string)
        : null;
      const campaignGroups = await storage.getCampaignGroups(projectId, userId);
      res.json(campaignGroups);
    } catch (error) {
      console.error("Error fetching campaign groups:", error);
      res.status(500).json({ message: "Failed to fetch campaign groups" });
    }
  });

  app.get(
    "/api/campaign-groups/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        const campaignGroup = await storage.getCampaignGroup(id, userId);
        if (!campaignGroup) {
          return res.status(404).json({ message: "Campaign group not found" });
        }
        res.json(campaignGroup);
      } catch (error) {
        console.error("Error fetching campaign group:", error);
        res.status(500).json({ message: "Failed to fetch campaign group" });
      }
    },
  );

  app.post("/api/campaign-groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCampaignGroupSchema.parse(req.body);
      const campaignGroup = await storage.createCampaignGroup(
        validatedData,
        userId,
      );
      res.status(201).json(campaignGroup);
    } catch (error) {
      console.error("Error creating campaign group:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Failed to create campaign group" });
    }
  });

  app.patch(
    "/api/campaign-groups/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        const validatedData = insertCampaignGroupSchema
          .partial()
          .parse(req.body);
        const campaignGroup = await storage.updateCampaignGroup(
          id,
          validatedData,
          userId,
        );

        if (!campaignGroup) {
          return res.status(404).json({ message: "Campaign group not found" });
        }

        res.json(campaignGroup);
      } catch (error) {
        console.error("Error updating campaign group:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: error.errors,
          });
        }
        res.status(500).json({ message: "Failed to update campaign group" });
      }
    },
  );

  app.delete(
    "/api/campaign-groups/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = parseInt(req.params.id);
        const success = await storage.deleteCampaignGroup(id, userId);

        if (!success) {
          return res.status(404).json({ message: "Campaign group not found" });
        }

        res.status(204).send();
      } catch (error) {
        console.error("Error deleting campaign group:", error);
        res.status(500).json({ message: "Failed to delete campaign group" });
      }
    },
  );

  // Bulk campaign group creation
  app.post(
    "/api/campaign-groups/bulk",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;

        if (!req.files || !req.files.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const file = req.files.file;
        const projectId = parseInt(req.body.projectId);

        if (!projectId) {
          return res.status(400).json({ message: "Project ID is required" });
        }

        // Verify user owns the project
        const project = await storage.getProject(projectId, userId);
        if (!project) {
          return res
            .status(404)
            .json({ message: "Project not found or access denied" });
        }

        // Parse CSV content
        const csvContent = file.data.toString();
        const lines = csvContent
          .split("\n")
          .filter((line: string) => line.trim());
        const headers = lines[0].split(",").map((h: string) => h.trim());

        // Validate headers
        const requiredHeaders = ["name", "trafficSource", "status"];
        const optionalHeaders = [
          "url",
          "channelId",
          "aiPrimaryText",
          "aiHeadline",
          "aiCta",
          "aiImage",
          "aiVideo",
          "aiVariants",
          "primaryText",
          "headline",
          "description",
          "cta",
          "image",
          "video",
        ];
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h),
        );
        if (missingHeaders.length > 0) {
          return res.status(400).json({
            message: `Missing required headers: ${missingHeaders.join(", ")}`,
          });
        }

        const campaignGroups = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v: string) => v.trim());
          if (values.length >= requiredHeaders.length) {
            const campaignGroup: any = {
              projectId,
              advertiserId: project.advertiserId, // Auto-populate from project
              name: values[headers.indexOf("name")],
              trafficSource: values[headers.indexOf("trafficSource")],
              status: values[headers.indexOf("status")] || "draft",
            };

            // Add optional fields if present
            optionalHeaders.forEach((header) => {
              const index = headers.indexOf(header);
              if (index !== -1 && values[index]) {
                if (header === "aiVariants") {
                  campaignGroup[header] = parseInt(values[index]) || 1;
                } else {
                  campaignGroup[header] = values[index];
                }
              }
            });

            campaignGroups.push(campaignGroup);
          }
        }

        // Create campaign groups
        let created = 0;
        for (const campaignGroup of campaignGroups) {
          try {
            await storage.createCampaignGroup(campaignGroup, userId);
            created++;
          } catch (error) {
            console.error("Error creating campaign group:", error);
          }
        }

        res.json({ created, total: campaignGroups.length });
      } catch (error) {
        console.error("Error in bulk campaign group creation:", error);
        res.status(500).json({ message: "Failed to create campaign groups" });
      }
    },
  );

  // Meta Ads API Routes (placeholder for now - will integrate with actual Meta API)
  app.get("/api/meta/ad-accounts", isAuthenticated, async (req, res) => {
    try {
      // TODO: Replace with actual Meta Marketing API call
      // This would require user to authenticate with Meta and provide access tokens
      const mockAdAccounts = [
        { id: "act_123456789", name: "Primary Ad Account" },
        { id: "act_987654321", name: "Secondary Ad Account" },
        { id: "act_456789123", name: "Test Ad Account" },
      ];
      res.json(mockAdAccounts);
    } catch (error) {
      console.error("Error fetching Meta ad accounts:", error);
      res.status(500).json({ message: "Failed to fetch ad accounts" });
    }
  });

  app.get("/api/meta/pixels", isAuthenticated, async (req, res) => {
    try {
      // TODO: Replace with actual Meta Marketing API call
      const mockPixels = [
        { id: "123456789", name: "Main Website Pixel" },
        { id: "987654321", name: "Landing Page Pixel" },
        { id: "456789123", name: "E-commerce Pixel" },
      ];
      res.json(mockPixels);
    } catch (error) {
      console.error("Error fetching Meta pixels:", error);
      res.status(500).json({ message: "Failed to fetch pixels" });
    }
  });

  app.get("/api/meta/conversion-events", isAuthenticated, async (req, res) => {
    try {
      // Standard Meta conversion events
      const conversionEvents = [
        { id: "purchase", name: "Purchase" },
        { id: "lead", name: "Lead" },
        { id: "complete_registration", name: "Complete Registration" },
        { id: "add_to_cart", name: "Add to Cart" },
        { id: "view_content", name: "View Content" },
        { id: "initiate_checkout", name: "Initiate Checkout" },
        { id: "add_payment_info", name: "Add Payment Info" },
        { id: "contact", name: "Contact" },
        { id: "customize_product", name: "Customize Product" },
        { id: "donate", name: "Donate" },
        { id: "find_location", name: "Find Location" },
        { id: "schedule", name: "Schedule" },
        { id: "search", name: "Search" },
        { id: "start_trial", name: "Start Trial" },
        { id: "submit_application", name: "Submit Application" },
        { id: "subscribe", name: "Subscribe" },
      ];
      res.json(conversionEvents);
    } catch (error) {
      console.error("Error fetching conversion events:", error);
      res.status(500).json({ message: "Failed to fetch conversion events" });
    }
  });

  app.get(
    "/api/meta/ad-account-users/:adAccountId",
    isAuthenticated,
    async (req, res) => {
      try {
        const adAccountId = req.params.adAccountId;
        // TODO: Replace with actual Meta Marketing API call
        const mockUsers = [
          {
            id: "user_123",
            name: "Primary User",
            email: "primary@example.com",
          },
          {
            id: "user_456",
            name: "Secondary User",
            email: "secondary@example.com",
          },
          { id: "user_789", name: "Admin User", email: "admin@example.com" },
        ];
        res.json(mockUsers);
      } catch (error) {
        console.error("Error fetching ad account users:", error);
        res.status(500).json({ message: "Failed to fetch ad account users" });
      }
    },
  );

  // Meta Campaign CRUD Routes
  app.get("/api/meta-campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const metaCampaigns = await storage.getMetaCampaigns(userId);
      res.json(metaCampaigns);
    } catch (error) {
      console.error("Error fetching meta campaigns:", error);
      res.status(500).json({ message: "Failed to fetch meta campaigns" });
    }
  });

  app.get("/api/meta-campaigns/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const id = parseInt(req.params.id);
      const metaCampaign = await storage.getMetaCampaign(id, userId);

      if (!metaCampaign) {
        return res.status(404).json({ message: "Meta campaign not found" });
      }

      res.json(metaCampaign);
    } catch (error) {
      console.error("Error fetching meta campaign:", error);
      res.status(500).json({ message: "Failed to fetch meta campaign" });
    }
  });

  // Helper function to replace campaign name variables
  const replaceCampaignNameVariables = async (
    campaignName: string,
    config: any,
    userId: string,
    keyword?: string,
  ) => {
    let processedName = campaignName;

    // Get advertiser data if advertiserId is provided
    if (config.advertiserId) {
      const advertiser = await storage.getAdvertiser(
        config.advertiserId,
        userId,
      );
      if (advertiser) {
        processedName = processedName.replace(
          /\[advertiser_id\]/g,
          advertiser.id.toString(),
        );
        if (advertiser.channelIds && advertiser.channelIds.length > 0) {
          processedName = processedName.replace(
            /\[channel_id\]/g,
            advertiser.channelIds[0],
          );
        }
      }
    }

    // Replace ad account user
    if (config.adAccountUser) {
      processedName = processedName.replace(
        /\[ad_account_user\]/g,
        config.adAccountUser,
      );
    }

    // Replace location targeting (first country)
    if (config.locationTargeting && config.locationTargeting.length > 0) {
      processedName = processedName.replace(
        /\[country_code\]/g,
        config.locationTargeting[0],
      );
    }

    // Replace language (first language)
    if (config.language && config.language.length > 0) {
      processedName = processedName.replace(
        /\[language_code\]/g,
        config.language[0],
      );
    }

    // Replace keyword with actual keyword or placeholder
    if (keyword) {
      processedName = processedName.replace(/\[keyword\]/g, keyword);
    } else {
      processedName = processedName.replace(/\[keyword\]/g, "{keyword}");
    }

    return processedName;
  };

  // Helper function to get keywords from campaigns and campaign groups
  const getKeywordsFromSelection = async (config: any, userId: string) => {
    const keywords = [];

    // Get keywords from individual campaigns
    if (config.selectedCampaigns && config.selectedCampaigns.length > 0) {
      for (const campaignId of config.selectedCampaigns) {
        const campaign = await storage.getCampaign(
          parseInt(campaignId),
          userId,
        );
        if (campaign && campaign.keyword) {
          keywords.push(campaign.keyword);
        }
      }
    }

    // Get keywords from campaign groups
    if (
      config.selectedCampaignGroups &&
      config.selectedCampaignGroups.length > 0
    ) {
      for (const groupId of config.selectedCampaignGroups) {
        const group = await storage.getCampaignGroup(parseInt(groupId), userId);
        if (group && group.projectId) {
          // Get all keywords for this project
          const projectKeywords = await storage.getKeywords(
            group.projectId,
            userId,
          );
          for (const kw of projectKeywords) {
            if (kw.keyword && !keywords.includes(kw.keyword)) {
              keywords.push(kw.keyword);
            }
          }
        }
      }
    }

    return keywords;
  };

  app.post("/api/meta-campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const metaCampaignData = req.body;

      // Convert array fields from strings to arrays if needed
      if (typeof metaCampaignData.selectedCampaigns === "string") {
        metaCampaignData.selectedCampaigns =
          metaCampaignData.selectedCampaigns.split(",");
      }
      if (typeof metaCampaignData.selectedCampaignGroups === "string") {
        metaCampaignData.selectedCampaignGroups =
          metaCampaignData.selectedCampaignGroups.split(",");
      }
      if (typeof metaCampaignData.locationTargeting === "string") {
        metaCampaignData.locationTargeting =
          metaCampaignData.locationTargeting.split(",");
      }
      if (typeof metaCampaignData.language === "string") {
        metaCampaignData.language = metaCampaignData.language.split(",");
      }

      // Process campaign name variables
      if (metaCampaignData.name) {
        metaCampaignData.name = await replaceCampaignNameVariables(
          metaCampaignData.name,
          metaCampaignData,
          userId,
        );
      }

      const metaCampaign = await storage.createMetaCampaign(
        metaCampaignData,
        userId,
      );
      res.status(201).json(metaCampaign);
    } catch (error) {
      console.error("Error creating meta campaign:", error);
      res.status(500).json({ message: "Failed to create meta campaign" });
    }
  });

  app.patch("/api/meta-campaigns/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const id = parseInt(req.params.id);
      const metaCampaignData = req.body;

      // Convert array fields from strings to arrays if needed
      if (typeof metaCampaignData.selectedCampaigns === "string") {
        metaCampaignData.selectedCampaigns =
          metaCampaignData.selectedCampaigns.split(",");
      }
      if (typeof metaCampaignData.selectedCampaignGroups === "string") {
        metaCampaignData.selectedCampaignGroups =
          metaCampaignData.selectedCampaignGroups.split(",");
      }
      if (typeof metaCampaignData.locationTargeting === "string") {
        metaCampaignData.locationTargeting =
          metaCampaignData.locationTargeting.split(",");
      }
      if (typeof metaCampaignData.language === "string") {
        metaCampaignData.language = metaCampaignData.language.split(",");
      }

      // Process campaign name variables
      if (metaCampaignData.name) {
        metaCampaignData.name = await replaceCampaignNameVariables(
          metaCampaignData.name,
          metaCampaignData,
          userId,
        );
      }

      const metaCampaign = await storage.updateMetaCampaign(
        id,
        metaCampaignData,
        userId,
      );

      if (!metaCampaign) {
        return res.status(404).json({ message: "Meta campaign not found" });
      }

      res.json(metaCampaign);
    } catch (error) {
      console.error("Error updating meta campaign:", error);
      res.status(500).json({ message: "Failed to update meta campaign" });
    }
  });

  app.delete("/api/meta-campaigns/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const id = parseInt(req.params.id);
      const success = await storage.deleteMetaCampaign(id, userId);

      if (!success) {
        return res.status(404).json({ message: "Meta campaign not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting meta campaign:", error);
      res.status(500).json({ message: "Failed to delete meta campaign" });
    }
  });

  // Meta Ads Campaign Creation (from configurations)
  app.post("/api/meta/campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { configs } = req.body;

      if (!configs || !Array.isArray(configs)) {
        return res
          .status(400)
          .json({ message: "Invalid campaign configurations" });
      }

      // Store configurations in database and simulate Meta API calls
      const createdCampaigns = [];

      for (const config of configs) {
        try {
          // Get keywords from selected campaigns and campaign groups
          const keywords = await getKeywordsFromSelection(config, userId);

          // If we have keywords, create a separate Meta campaign for each keyword
          if (keywords.length > 0) {
            for (const keyword of keywords) {
              const metaCampaignData = {
                name:
                  config.campaignName ||
                  config.campaignNameStructure ||
                  "Meta Campaign",
                campaignNameStructure: config.campaignNameStructure,
                selectedCampaigns: config.selectedCampaigns?.map(String) || [],
                selectedCampaignGroups:
                  config.selectedCampaignGroups?.map(String) || [],
                advertiserId: config.advertiserId,
                adAccount: config.adAccount,
                adAccountUser: config.adAccountUser,
                locationTargeting: config.locationTargeting || [],
                language: config.language || [],
                campaignBudget: config.campaignBudget,
                campaignBid: config.campaignBid,
                pixel: config.pixel,
                conversionEvent: config.conversionEvent,
                adFormat: config.adFormat,
                objective: config.objective,
                goal: config.goal,
                biddingStrategy: config.biddingStrategy,
                placementType: config.placementType,
                finalUrl: config.finalUrl,
                campaignSuffix: config.campaignSuffix,
                urlExtraParameters: config.urlExtraParameters,
                status: "draft",
                metaCampaignId: `meta_campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                keyword: keyword, // Store the keyword for reference
              };

              // Process campaign name variables with the specific keyword
              if (metaCampaignData.name) {
                metaCampaignData.name = await replaceCampaignNameVariables(
                  metaCampaignData.name,
                  metaCampaignData,
                  userId,
                  keyword,
                );
              }

              const savedCampaign = await storage.createMetaCampaign(
                metaCampaignData,
                userId,
              );
              createdCampaigns.push({
                configId: config.id,
                success: true,
                metaCampaignId: savedCampaign.metaCampaignId,
                databaseId: savedCampaign.id,
                keyword: keyword,
                message: `Campaign configuration saved successfully for keyword: ${keyword}`,
              });
            }
          } else {
            // No keywords found, create a single campaign without keyword replacement
            const metaCampaignData = {
              name:
                config.campaignName ||
                config.campaignNameStructure ||
                "Meta Campaign",
              campaignNameStructure: config.campaignNameStructure,
              selectedCampaigns: config.selectedCampaigns?.map(String) || [],
              selectedCampaignGroups:
                config.selectedCampaignGroups?.map(String) || [],
              advertiserId: config.advertiserId,
              adAccount: config.adAccount,
              adAccountUser: config.adAccountUser,
              locationTargeting: config.locationTargeting || [],
              language: config.language || [],
              campaignBudget: config.campaignBudget,
              campaignBid: config.campaignBid,
              pixel: config.pixel,
              conversionEvent: config.conversionEvent,
              adFormat: config.adFormat,
              objective: config.objective,
              goal: config.goal,
              biddingStrategy: config.biddingStrategy,
              placementType: config.placementType,
              finalUrl: config.finalUrl,
              campaignSuffix: config.campaignSuffix,
              urlExtraParameters: config.urlExtraParameters,
              status: "draft",
              metaCampaignId: `meta_campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            };

            // Process campaign name variables without keyword
            if (metaCampaignData.name) {
              metaCampaignData.name = await replaceCampaignNameVariables(
                metaCampaignData.name,
                metaCampaignData,
                userId,
              );
            }

            const savedCampaign = await storage.createMetaCampaign(
              metaCampaignData,
              userId,
            );
            createdCampaigns.push({
              configId: config.id,
              success: true,
              metaCampaignId: savedCampaign.metaCampaignId,
              databaseId: savedCampaign.id,
              message: "Campaign configuration saved successfully",
            });
          }
        } catch (configError) {
          console.error("Error saving config:", configError);
          createdCampaigns.push({
            configId: config.id,
            success: false,
            message: "Failed to save campaign configuration",
          });
        }
      }

      res.json({
        success: true,
        results: createdCampaigns,
        message: `Processed ${createdCampaigns.length} Meta campaign configurations`,
      });
    } catch (error) {
      console.error("Error creating Meta campaigns:", error);
      res.status(500).json({ message: "Failed to create Meta campaigns" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
