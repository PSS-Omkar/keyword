import 'dotenv/config';
import express from 'express';
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

// ----- Credentials -----
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

async function getAccessToken() {
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("Google OAuth Token error");
  return token;
}

// ---- Core function with USD conversion & filtering ----
async function generateKeywordIdeas(
  keywords,
  languageId,
  locationIds,
  keywordCount,
  minkeywordvolume = 0,
  minbidUsd = 0
) {
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

  const resp = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": process.env.GOOGLE_DEVELOPER_TOKEN,
      "login-customer-id": loginCustomerId,
      "Content-Type": "application/json"
    }
  });

  // Conversion factor INR -> USD
  const INR_TO_USD_RATE = 87.67;

  // Map results, convert to USD, and filter
  const filteredResults = (resp.data.results || [])
    .map(item => {
      const microsLow = parseFloat(item.keywordIdeaMetrics?.lowTopOfPageBidMicros || 0);
      const microsHigh = parseFloat(item.keywordIdeaMetrics?.highTopOfPageBidMicros || 0);

      const valueLowUSD = microsLow ? ((microsLow / 1_000_000) / INR_TO_USD_RATE) : 0;
      const valueHighUSD = microsHigh ? ((microsHigh / 1_000_000) / INR_TO_USD_RATE) : 0;

      return {
        ...item,
        keywordIdeaMetrics: {
          ...item.keywordIdeaMetrics,
          lowTopOfPageBidUSD: Number(valueLowUSD.toFixed(2)),
          highTopOfPageBidUSD: Number(valueHighUSD.toFixed(2))
        }
      };
    })
    .filter(item => {
      const avgMonthlySearches = item.keywordIdeaMetrics?.avgMonthlySearches || 0;
      const highTopOfPageBidUSD = item.keywordIdeaMetrics?.highTopOfPageBidUSD || 0;

      // ✅ Your exact passes condition
      return (
        avgMonthlySearches >= minkeywordvolume &&
        highTopOfPageBidUSD >= minbidUsd
      );
    })
    .slice(0, keywordCount); // ✅ Return only top keywordCount after filtering

  return {
    results: filteredResults,
    totalSize: filteredResults.length
  };
}

// ---- Express API ----
const app = express();
app.use(express.json());

app.post('/generate-keyword-ideas', async (req, res) => {
  try {
    const {
      keywords = [],
      languageId = 1000,
      locationIds = [],
      keywordCount = 20,
      minkeywordvolume = 0,
      minbidUsd = 0
    } = req.body;

    if (!Array.isArray(keywords) || !keywords.length) {
      return res.status(400).json({ error: "keywords[] is required" });
    }
    if (!Array.isArray(locationIds) || !locationIds.length) {
      return res.status(400).json({ error: "locationIds[] is required" });
    }

    const data = await generateKeywordIdeas(
      keywords,
      languageId,
      locationIds,
      keywordCount,
      minkeywordvolume,
      minbidUsd
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: (err.response && err.response.data) || err.message || "Unknown error"
    });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
