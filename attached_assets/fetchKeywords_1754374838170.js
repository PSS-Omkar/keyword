import 'dotenv/config';
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

/**
 * Fetches keyword ideas and applies filters:
 * - Keeps keywords with avgMonthlySearches >= minSearchVolume
 * - Keeps keywords with highTopOfPageBidMicros >= minBidMicros
 * - Limits to keywordCount results
 */
async function generateKeywordIdeas(
  keywords,
  languageId,
  locationIds,
  keywordCount,
  minBidUsd,
  minSearchVolume
) {
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

    const resp = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_DEVELOPER_TOKEN,
        "login-customer-id": loginCustomerId,
        "Content-Type": "application/json",
      },
    });

    const minBidMicros = minBidUsd * 1_000_000;

    let results = (resp.data.results || [])
      // First filter: search volume >= minSearchVolume
      .filter(item =>
        (item.keywordIdeaMetrics?.avgMonthlySearches ?? 0) >= minSearchVolume
      )
      // Second filter: bid >= minBidUsd
      .filter(item =>
        (item.keywordIdeaMetrics?.highTopOfPageBidMicros ?? 0) >= minBidMicros
      )
      // Limit to keywordCount
      .slice(0, keywordCount)
      // Format: convert bid to USD for display
      .map(kw => ({
        ...kw,
        highTopOfPageBidUsd: kw.keywordIdeaMetrics?.highTopOfPageBidMicros
          ? (kw.keywordIdeaMetrics.highTopOfPageBidMicros / 1_000_000).toFixed(2)
          : "-"
      }));

    return results;
  } catch (error) {
    console.error("Error generating keyword ideas:", error?.response?.data || error.message);
    throw error;
  }
}

// ----- Your Hardcoded Inputs Below -----
const keywords = ["clothing"];
const languageId = 1031;       // English
const locationIds = [2356];    // India
const keywordCount = 10;
const minBidUsd = 2;           // Only keep keywords where bid >= $2
const minSearchVolume = 100;  // Only keep keywords where search volume ≥ 5000

// ----- Run and Print -----
(async () => {
  try {
    const results = await generateKeywordIdeas(
      keywords,
      languageId,
      locationIds,
      keywordCount,
      minBidUsd,            // Pass minBidUsd instead of maxBidUsd
      minSearchVolume
    );
    if (!results.length) {
      console.log("No keywords met your filtering criteria.");
    } else {
      results.forEach((kw, i) => {
        console.log(
          `${i+1}. ${kw.text} | Bid: $${kw.highTopOfPageBidUsd} | Volume: ${kw.keywordIdeaMetrics?.avgMonthlySearches ?? "-"}`
        );
      });
    }
    // Uncomment for raw output:
    // console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    // Already logged in generateKeywordIdeas
  }
})();
