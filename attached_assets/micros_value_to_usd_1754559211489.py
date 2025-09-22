import requests

# -----------------------------
# CONFIGURATION
# -----------------------------

MICRO_TOKEN_ID = 'micropets'   # <-- Make sure it's correct on CoinGecko
TO_CURRENCY = 'usd'            # You can change this to 'inr', 'eur', etc.
MICRO_AMOUNT = 92846704       # Amount in MICRO

# -----------------------------
# FUNCTIONS
# -----------------------------

def get_micro_to_currency_price(token_id, vs_currency):
    """
    Fetch live MICRO token price in the specified currency using CoinGecko API.
    """
    url = f'https://api.coingecko.com/api/v3/simple/price?ids={token_id}&vs_currencies={vs_currency}'
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if token_id in data and vs_currency in data[token_id]:
            return data[token_id][vs_currency]
        else:
            raise ValueError(f"Token ID '{token_id}' or currency '{vs_currency}' not found in CoinGecko response.")
    else:
        raise Exception(f"Failed to fetch token price. HTTP Status: {response.status_code}")


def convert_micro_to_currency(amount_micro, rate):
    """
    Convert MICRO amount to the target currency using the exchange rate.
    """
    return round(amount_micro * rate, 2)  # Round to 2 decimal places


# -----------------------------
# MAIN
# -----------------------------

def main():
    try:
        rate = get_micro_to_currency_price(MICRO_TOKEN_ID, TO_CURRENCY)
        converted_amount = convert_micro_to_currency(MICRO_AMOUNT, rate)

        print(f"Live MICRO to {TO_CURRENCY.upper()} rate: {rate:.10f}")
        print(f"{MICRO_AMOUNT:,} MICRO = {converted_amount:,.2f} {TO_CURRENCY.upper()}")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == '__main__':
    main()