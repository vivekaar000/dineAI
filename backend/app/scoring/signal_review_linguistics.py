"""
Signal 1: Review Linguistics
Uses HuggingFace DistilBERT for sentiment analysis + keyword detection
"""
from typing import List
import re

# Lazy-load the transformer to avoid import-time slowness
_pipeline = None

TOURIST_KEYWORDS = [
    "overpriced", "touristy", "tourist trap", "trap", "instagrammable",
    "not authentic", "pushy", "aggressive host", "aggressive staff",
    "rip off", "ripoff", "overcharge", "scam", "avoid", "mediocre"
]

AESTHETIC_KEYWORDS = [
    "cute place", "great photos", "instagram", "aesthetic", "photogenic",
    "beautiful decor", "ambiance", "atmosphere", "cozy", "trendy", "vibes"
]

QUALITY_KEYWORDS = [
    "flavor", "technique", "quality", "fresh", "authentic", "delicious",
    "well-prepared", "skilled", "crafted", "homemade", "traditional",
    "seasoning", "texture", "ingredients"
]


def _get_pipeline():
    global _pipeline
    if _pipeline is None:
        from transformers import pipeline
        _pipeline = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            truncation=True,
            max_length=512,
        )
    return _pipeline


def analyze_review(text: str) -> dict:
    """Analyze a single review for sentiment and keywords."""
    text_lower = text.lower()

    tourist_count = sum(1 for kw in TOURIST_KEYWORDS if kw in text_lower)
    aesthetic_count = sum(1 for kw in AESTHETIC_KEYWORDS if kw in text_lower)
    quality_count = sum(1 for kw in QUALITY_KEYWORDS if kw in text_lower)

    try:
        pipe = _get_pipeline()
        result = pipe(text[:512])[0]
        # POSITIVE → low tourist signal, NEGATIVE → higher tourist signal
        if result["label"] == "NEGATIVE":
            sentiment_score = result["score"]  # close to 1 = very negative
        else:
            sentiment_score = 1 - result["score"]  # invert positive
    except Exception:
        sentiment_score = 0.5

    return {
        "sentiment_score": sentiment_score,
        "tourist_keyword_count": tourist_count,
        "aesthetic_keyword_count": aesthetic_count,
        "quality_keyword_count": quality_count,
    }


def compute_signal(reviews: List[dict]) -> float:
    """
    Returns a 0-100 Review Linguistics Score.
    Higher = more tourist-oriented signals in reviews.
    """
    if not reviews:
        return 50.0

    total_tourist = 0
    total_aesthetic = 0
    total_quality = 0
    total_sentiment = 0.0

    for r in reviews:
        total_tourist += r.get("tourist_keyword_count", 0)
        total_aesthetic += r.get("aesthetic_keyword_count", 0)
        total_quality += r.get("quality_keyword_count", 0)
        total_sentiment += r.get("sentiment_score", 0.5)

    n = len(reviews)
    avg_sentiment = total_sentiment / n

    # Aesthetic bias = aesthetic keywords relative to quality keywords
    quality_denominator = max(total_quality, 1)
    aesthetic_bias = min(total_aesthetic / quality_denominator, 3.0) / 3.0

    # Keyword density (tourist keywords per review)
    keyword_density = min(total_tourist / n, 5.0) / 5.0

    # Combine: 40% negative sentiment, 30% tourist keywords, 30% aesthetic bias
    raw_score = (0.40 * avg_sentiment) + (0.30 * keyword_density) + (0.30 * aesthetic_bias)
    return round(min(raw_score * 100, 100), 2)
