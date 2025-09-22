# import os
# from dotenv import load_dotenv
# from google.auth.transport.requests import Request
# from google.oauth2.credentials import Credentials
# import requests

# # Load environment variables from .env file
# load_dotenv()

# # --- Config ---
# GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
# GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
# GOOGLE_REFRESH_TOKEN = os.getenv("GOOGLE_REFRESH_TOKEN")
# GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
# GOOGLE_CUSTOMER_ID = os.getenv("GOOGLE_CUSTOMER_ID")
# GOOGLE_LOGIN_CUSTOMER_ID = os.getenv("GOOGLE_LOGIN_CUSTOMER_ID") or GOOGLE_CUSTOMER_ID
# GOOGLE_DEVELOPER_TOKEN = os.getenv("GOOGLE_DEVELOPER_TOKEN")

# def safe_int(val, default=0):
#     try:
#         return int(val)
#     except Exception:
#         return default

# def get_access_token():
#     creds = Credentials(
#         None,
#         refresh_token=GOOGLE_REFRESH_TOKEN,
#         token_uri="https://oauth2.googleapis.com/token",
#         client_id=GOOGLE_CLIENT_ID,
#         client_secret=GOOGLE_CLIENT_SECRET,
#         scopes=["https://www.googleapis.com/auth/adwords"],
#     )
#     creds.refresh(Request())
#     return creds.token

# def generate_keyword_ideas(
#     keywords,
#     language_id,
#     location_ids,
#     keyword_count,
#     max_bid_usd,         # Now using maximum bid
#     min_search_volume,   # Now using minimum search volume
# ):
#     access_token = get_access_token()
#     url = f"https://googleads.googleapis.com/v20/customers/{GOOGLE_CUSTOMER_ID}:generateKeywordIdeas"
#     headers = {
#         "Authorization": f"Bearer {access_token}",
#         "developer-token": GOOGLE_DEVELOPER_TOKEN,
#         "login-customer-id": GOOGLE_LOGIN_CUSTOMER_ID,
#         "Content-Type": "application/json",
#     }
#     body = {
#         "keywordSeed": {"keywords": keywords},
#         "geoTargetConstants": [f"geoTargetConstants/{id}" for id in location_ids],
#         "language": f"languageConstants/{language_id}",
#         "includeAdultKeywords": False,
#         "keywordPlanNetwork": "GOOGLE_SEARCH_AND_PARTNERS",
#         "pageSize": 10000,
#     }
#     resp = requests.post(url, headers=headers, json=body)
#     resp.raise_for_status()
#     data = resp.json().get('results', [])

#     # Filter: avgMonthlySearches >= min_search_volume
#     results = [
#         item for item in data
#         if (
#             item.get('keywordIdeaMetrics', {}).get('avgMonthlySearches') is not None and
#             safe_int(item['keywordIdeaMetrics']['avgMonthlySearches']) >= min_search_volume
#         )
#     ]

#     # Filter: highTopOfPageBidMicros <= max_bid_micros
#     max_bid_micros = int(max_bid_usd * 1_000_000)
#     results = [
#         item for item in results
#         if (
#             'keywordIdeaMetrics' in item and
#             item['keywordIdeaMetrics'].get('highTopOfPageBidMicros') is not None and
#             safe_int(item['keywordIdeaMetrics']['highTopOfPageBidMicros']) <= max_bid_micros
#         )
#     ]

#     # Sort by bid descending, limit count, format results
#     results = sorted(
#         results,
#         key=lambda k: safe_int(k['keywordIdeaMetrics']['highTopOfPageBidMicros']),
#         reverse=True
#     )[:keyword_count]

#     final = []
#     for item in results:
#         kw = item.get('text')
#         metrics = item.get('keywordIdeaMetrics', {})
#         bid = safe_int(metrics.get('highTopOfPageBidMicros'))
#         bid_usd = f"{bid/1_000_000:.2f}" if bid else "-"
#         volume = safe_int(metrics.get('avgMonthlySearches', '-'))
#         final.append({
#             "text": kw,
#             "highTopOfPageBidUsd": bid_usd,
#             "avgMonthlySearches": volume
#         })
#     return final

# # Example usage:
# if __name__ == "__main__":
#     keywords = ["cricket"]
#     language_id = 1000          # English
#     location_ids = [2356]       # Update as necessary
#     keyword_count = 10
#     max_bid_usd = 2             # Only show keywords with bid <= $5
#     min_search_volume = 1000    # Only show keywords with at least 1000 searches

#     try:
#         results = generate_keyword_ideas(
#             keywords, language_id, location_ids,
#             keyword_count, max_bid_usd, min_search_volume
#         )
#         if not results:
#             print("No keywords met your filtering criteria.")
#         else:
#             for i, kw in enumerate(results, 1):
#                 print(f"{i}. {kw['text']} | Bid: ${kw['highTopOfPageBidUsd']} | Volume: {kw['avgMonthlySearches']}")
#     except Exception as e:
#         print("Failed to generate keyword ideas:", e)


import os
from dotenv import load_dotenv
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
import requests

# --- Safely convert to int
def safe_int(val, default=0):
    try:
        return int(val)
    except Exception:
        return default

# --- Load env variables
load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REFRESH_TOKEN = os.getenv("GOOGLE_REFRESH_TOKEN")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
GOOGLE_CUSTOMER_ID = os.getenv("GOOGLE_CUSTOMER_ID")
GOOGLE_LOGIN_CUSTOMER_ID = os.getenv("GOOGLE_LOGIN_CUSTOMER_ID") or GOOGLE_CUSTOMER_ID
GOOGLE_DEVELOPER_TOKEN = os.getenv("GOOGLE_DEVELOPER_TOKEN")

def get_access_token():
    creds = Credentials(
        None,
        refresh_token=GOOGLE_REFRESH_TOKEN,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        scopes=["https://www.googleapis.com/auth/adwords"],
    )
    creds.refresh(Request())
    return creds.token

def generate_keyword_ideas(
    keywords,             # a list of seed keywords
    language_id,
    location_ids,
    keyword_count,        # max suggestions to return
    max_bid_usd,
    min_search_volume,
):
    access_token = get_access_token()
    url = f"https://googleads.googleapis.com/v20/customers/{GOOGLE_CUSTOMER_ID}:generateKeywordIdeas"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "developer-token": GOOGLE_DEVELOPER_TOKEN,
        "login-customer-id": GOOGLE_LOGIN_CUSTOMER_ID,
        "Content-Type": "application/json",
    }
    body = {
        "keywordSeed": {"keywords": keywords},
        "geoTargetConstants": [f"geoTargetConstants/{id}" for id in location_ids],
        "language": f"languageConstants/{language_id}",
        "includeAdultKeywords": False,
        "keywordPlanNetwork": "GOOGLE_SEARCH_AND_PARTNERS",
        "pageSize": 10000,
    }
    resp = requests.post(url, headers=headers, json=body)
    resp.raise_for_status()
    data = resp.json().get('results', [])
    # Filter by min search volume
    results = [
        item for item in data
        if (
            item.get('keywordIdeaMetrics', {}).get('avgMonthlySearches') is not None and
            safe_int(item['keywordIdeaMetrics']['avgMonthlySearches']) >= min_search_volume
        )
    ]
    # Filter by max bid
    max_bid_micros = int(max_bid_usd * 1_000_000)
    results = [
        item for item in results
        if (
            'keywordIdeaMetrics' in item and
            item['keywordIdeaMetrics'].get('highTopOfPageBidMicros') is not None and
            safe_int(item['keywordIdeaMetrics']['highTopOfPageBidMicros']) <= max_bid_micros
        )
    ]
    # Sort by bid descending, limit to keyword_count, format output
    results = sorted(
        results,
        key=lambda k: safe_int(k['keywordIdeaMetrics']['highTopOfPageBidMicros']),
        reverse=True
    )[:keyword_count]
    final = []
    for item in results:
        kw = item.get('text')
        metrics = item.get('keywordIdeaMetrics', {})
        bid = safe_int(metrics.get('highTopOfPageBidMicros'))
        bid_usd = f"{bid / 1_000_000:.2f}" if bid else "-"
        volume = safe_int(metrics.get('avgMonthlySearches', '-'))
        final.append({
            "text": kw,
            "highTopOfPageBidUsd": bid_usd,
            "avgMonthlySearches": volume
        })
    return final

if __name__ == "__main__":
    ############################################################################
    # Set THIS to your comma-separated input (or use input(...) to prompt)
    user_input = "cricket, football, tennis"
    ############################################################################

    seed_keywords = [k.strip() for k in user_input.split(",") if k.strip()]

    language_id = 1000          # English
    location_ids = [2356]       # Replace as necessary (e.g., 2840 for USA)
    keyword_count = 10          # per SEED keyword
    max_bid_usd = 2             # Only show keywords with bid <= $5
    min_search_volume = 1000    # Only show keywords with at least 1000 searches

    try:
        for seed in seed_keywords:
            print(f"\nKeyword ideas for seed: '{seed}'")
            results = generate_keyword_ideas(
                [seed], language_id, location_ids,
                keyword_count, max_bid_usd, min_search_volume
            )
            if not results:
                print("  No keywords met your filtering criteria.")
            else:
                for i, kw in enumerate(results, 1):
                    print(f"  {i}. {kw['text']} | Bid: ${kw['highTopOfPageBidUsd']} | Volume: {kw['avgMonthlySearches']}")
    except Exception as e:
        print("Failed to generate keyword ideas:", e)
