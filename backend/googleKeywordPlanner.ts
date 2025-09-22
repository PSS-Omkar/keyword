// import 'dotenv/config';
// import dotenv from 'dotenv';
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

// Google OAuth client setup
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

async function getAccessToken(): Promise<string> {
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("Google OAuth Token error");
  return token;
}

export interface KeywordIdeaResult {
  keyword: string;
  volume: number;
  bid: number;
  status: string;
  highTopOfPageBidUSD: number;
  coinGeckoRate: number;
}

export interface KeywordGenerationOptions {
  keywords: string[];
  languageId?: number;
  locationIds?: number[];
  keywordCount?: number;
  minkeywordvolume?: number;
  minbidUsd?: number;
}

export async function generateKeywordIdeas(options: KeywordGenerationOptions): Promise<KeywordIdeaResult[]> {
  const {
    keywords,
    languageId = 1000,
    locationIds = [2840], // Default to US
    keywordCount = 30,
    minkeywordvolume = 0,
    minbidUsd = 0
  } = options;

  try {
    const accessToken = await getAccessToken();
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

    console.log(`🔍 [Google Keyword Planner] Generating keywords for topics: ${keywords.join(', ')}`);
    console.log(`   📍 Language ID: ${languageId}, Location IDs: ${locationIds.join(', ')}`);
    console.log(`   📊 Filters: Min Volume: ${minkeywordvolume}, Min Bid USD: $${minbidUsd}`);

    const resp = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_DEVELOPER_TOKEN,
        "login-customer-id": loginCustomerId,
        "Content-Type": "application/json"
      }
    });

    // Conversion factor: Use environment variable USD_RATE or fallback
    const USD_RATE = parseFloat(process.env.USD_RATE || '87.67');
    console.log(`💱 [Currency Conversion] Using USD rate: ${USD_RATE}`);

    // Process and filter results
    const filteredResults = (resp.data.results || [])
      .map((item: any) => {
        const metrics = item.keywordIdeaMetrics || {};
        const microsLow = parseFloat(metrics.lowTopOfPageBidMicros || '0');
        const microsHigh = parseFloat(metrics.highTopOfPageBidMicros || '0');

        // Convert micros to USD
        const bidLowUSD = microsLow ? ((microsLow / 1_000_000) / USD_RATE) : 0;
        const bidHighUSD = microsHigh ? ((microsHigh / 1_000_000) / USD_RATE) : 0;

        // Extract keyword text
        const keywordText = item.keywordAnnotation?.keyword?.text || 
                           item.text || 
                           'Unknown keyword';

        return {
          keyword: keywordText,
          volume: metrics.avgMonthlySearches || 0,
          bid: bidHighUSD,
          status: 'active',
          highTopOfPageBidUSD: bidHighUSD,
          coinGeckoRate: USD_RATE
        };
      })
      .filter((item: KeywordIdeaResult) => {
        const passesVolumeFilter = item.volume >= minkeywordvolume;
        const passesBidFilter = item.highTopOfPageBidUSD >= minbidUsd;
        return passesVolumeFilter && passesBidFilter;
      })
      .slice(0, keywordCount);

    console.log(`✅ [Google Keyword Planner] Generated ${filteredResults.length} keywords (filtered from ${resp.data.results?.length || 0} total)`);
    
    if (filteredResults.length > 0) {
      console.log('📋 [Sample Keywords]:');
      filteredResults.slice(0, 3).forEach((kw, index) => {
        console.log(`   ${index + 1}. "${kw.keyword}"`);
        console.log(`      📈 Volume: ${kw.volume}`);
        console.log(`      💰 Bid USD: $${kw.bid.toFixed(2)}`);
      });
    }

    return filteredResults;

  } catch (error: any) {
    console.error('❌ [Google Keyword Planner] Error:', error.message);
    if (error.response?.data) {
      console.error('   📋 API Error Details:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// Fallback keyword generation using exact topic words only (no variations)
export function generateFallbackKeywords(topics: string[]): KeywordIdeaResult[] {
  console.log('🔄 [Fallback Generation] Using exact topic words without variations');
  
  return topics.map(topic => ({
    keyword: topic.trim(),
    volume: 0,
    bid: 0,
    status: 'active',
    highTopOfPageBidUSD: 0,
    coinGeckoRate: 0
  }));
}