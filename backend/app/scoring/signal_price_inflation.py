"""
Signal 3: Price Inflation
Compares restaurant's average price against cuisine-wide city average.
"""
from typing import List


def compute_signal(restaurant_avg_price: float, cuisine_avg_price: float) -> tuple:
    """
    Returns (Price Inflation Score 0-100, inflation_pct float).
    """
    if not cuisine_avg_price or cuisine_avg_price == 0:
        return 50.0, 0.0

    inflation_pct = (restaurant_avg_price - cuisine_avg_price) / cuisine_avg_price

    # Normalize: -50% inflation = 0 score, +100% inflation = 100 score
    # Map inflation_pct from [-0.5, 1.0] to [0, 100]
    normalized = (inflation_pct + 0.5) / 1.5
    score = max(0.0, min(normalized * 100, 100))
    return round(score, 2), round(inflation_pct * 100, 2)


def compute_cuisine_averages(all_restaurants: List[dict]) -> dict:
    """
    Given a list of restaurant dicts with 'cuisine' and 'avg_price',
    returns {cuisine: avg_price}.
    """
    from collections import defaultdict
    cuisine_prices = defaultdict(list)
    for r in all_restaurants:
        if r.get("cuisine") and r.get("avg_price"):
            cuisine_prices[r["cuisine"]].append(float(r["avg_price"]))

    return {
        cuisine: sum(prices) / len(prices)
        for cuisine, prices in cuisine_prices.items()
        if prices
    }
