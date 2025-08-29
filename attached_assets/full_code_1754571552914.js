import 'dotenv/config';
import express from 'express';
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

const MICRO_TOKEN_ID = 'micropets';    // <-- Confirm this at CoinGecko
const TO_CURRENCY = 'usd';             // Or any valid fiat

async function getMicroToCurrencyPrice(tokenId, vsCurrency) {
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

function convertMicroToCurrency(amountMicro, rate) {
  return Number((Number(amountMicro) * rate).toFixed(2));
}

function usdToMicros(usd) {
  return Math.round(Number(usd) * 1_000_000); // 1 USD = 1,000,000 micros
}

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

// async function generateKeywordIdeas(
//   keywords,
//   languageId,
//   locationIds,
//   keywordCount,
//   minbidUsd,
//   minkeywordvolume
// ) {
//   const accessToken = await getAccessToken();
//   const customerId = process.env.GOOGLE_CUSTOMER_ID;
//   const loginCustomerId = process.env.GOOGLE_LOGIN_CUSTOMER_ID || customerId;
//   const url = `https://googleads.googleapis.com/v20/customers/${customerId}:generateKeywordIdeas`;
//   const body = {
//     keywordSeed: { keywords },
//     geoTargetConstants: locationIds.map(id => `geoTargetConstants/${id}`),
//     language: `languageConstants/${languageId}`,
//     includeAdultKeywords: false,
//     keywordPlanNetwork: "GOOGLE_SEARCH_AND_PARTNERS"
//   };

//   // (1) Get token price
//   const coinGeckoRate = await getMicroToCurrencyPrice(MICRO_TOKEN_ID, TO_CURRENCY);
//   // (2) Calculate min bid in micros
//   const minbidMicros = usdToMicros(minbidUsd);
//   const minKeywordVolume = Number(minkeywordvolume);

//   // (3) Get data from Google Ads API
//   const resp = await axios.post(url, body, {
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//       "developer-token": process.env.GOOGLE_DEVELOPER_TOKEN,
//       "login-customer-id": loginCustomerId,
//       "Content-Type": "application/json"
//     }
//   });

//   let keywordIdeas = resp.data.results || [];

//   // (4) Enrich and filter
//   keywordIdeas = keywordIdeas
//     .map(result => {
//       const metrics = result.keywordIdeaMetrics || {};
//       const enrichedMetrics = { ...metrics };
//       // Add USD conversions to metrics if possible
//       if (metrics.highTopOfPageBidMicros !== undefined) {
//         enrichedMetrics.highTopOfPageBidUSD = convertMicroToCurrency(
//           metrics.highTopOfPageBidMicros,
//           coinGeckoRate
//         );
//       }
//       if (metrics.lowTopOfPageBidMicros !== undefined) {
//         enrichedMetrics.lowTopOfPageBidUSD = convertMicroToCurrency(
//           metrics.lowTopOfPageBidMicros,
//           coinGeckoRate
//         );
//       }
//       return {
//         ...result,
//         keywordIdeaMetrics: enrichedMetrics
//       };
//     })
//     .filter(result => {
//       const metrics = result.keywordIdeaMetrics || {};
//       // Ensure numeric comparison
//       const avgMonthlySearches = Number(metrics.avgMonthlySearches || 0);
//       const highTopOfPageBidMicros = Number(metrics.highTopOfPageBidMicros || 0);

//       // FILTER: Only keep if both conditions met
//       return (
//         avgMonthlySearches >= minKeywordVolume &&
//         highTopOfPageBidMicros >= minbidMicros
//       );
//     });

//   return {
//     results: keywordIdeas,
//     micropetsToUsdRate: coinGeckoRate,
//     minbidMicros,
//     minKeywordVolume
//   };
// }

// ---------- EXPRESS APP ----------
async function generateKeywordIdeas(
  keywords,
  languageId,
  locationIds,
  keywordCount,
  minbidUsd,
  minkeywordvolume
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

  // (1) Enrich every result with highTopOfPageBidUSD (conversion FIRST)
  keywordIdeas = keywordIdeas.map(result => {
    const metrics = result.keywordIdeaMetrics || {};
    const enrichedMetrics = { ...metrics };

    // Convert micros to USD
    if (metrics.highTopOfPageBidMicros !== undefined) {
      enrichedMetrics.highTopOfPageBidUSD = convertMicroToCurrency(
        metrics.highTopOfPageBidMicros,
        coinGeckoRate
      );
    }
    if (metrics.lowTopOfPageBidMicros !== undefined) {
      enrichedMetrics.lowTopOfPageBidUSD = convertMicroToCurrency(
        metrics.lowTopOfPageBidMicros,
        coinGeckoRate
      );
    }
    return {
      ...result,
      keywordIdeaMetrics: enrichedMetrics
    };
  });

  // (2) Now filter on the enriched USD value and avgMonthlySearches
  keywordIdeas = keywordIdeas.filter(result => {
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

const app = express();
app.use(express.json());

app.post('/generate-keyword-ideas', async (req, res) => {
  try {
    const {
      keywords,
      languageId,
      locationIds,
      keywordCount = 20,
      minbid,
      minkeywordvolume
    } = req.body;

    if (!Array.isArray(keywords) || !keywords.length) {
      return res.status(400).json({ error: "keywords[] is required and must be a non-empty array" });
    }
    if (
      languageId === undefined ||
      languageId === null ||
      isNaN(Number(languageId))
    ) {
      return res.status(400).json({ error: "languageId is required and must be a number" });
    }
    if (!Array.isArray(locationIds) || !locationIds.length) {
      return res.status(400).json({ error: "locationIds[] is required and must be a non-empty array" });
    }
    if (
      minbid === undefined ||
      minbid === null ||
      isNaN(Number(minbid)) ||
      Number(minbid) <= 0
    ) {
      return res.status(400).json({ error: "minbid (USD) is required and must be a positive number" });
    }
    if (
      minkeywordvolume === undefined ||
      minkeywordvolume === null ||
      isNaN(Number(minkeywordvolume)) ||
      Number(minkeywordvolume) <= 0 ||
      !Number.isInteger(Number(minkeywordvolume))
    ) {
      return res.status(400).json({ error: "minkeywordvolume is required and must be a positive integer" });
    }

    const data = await generateKeywordIdeas(
      keywords,
      Number(languageId),
      locationIds,
      keywordCount,
      Number(minbid),
      Number(minkeywordvolume)
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

