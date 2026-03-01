"""
Signal 4: Tourist-Engineered Menu Classifier
TF-IDF + Logistic Regression on menu item text.
Falls back to rule-based scoring if model not trained.
"""
from typing import List
import re

BUZZWORDS = [
    "world famous", "authentic experience", "best in city", "must try",
    "local favorite", "award winning", "as seen on", "signature",
    "legendary", "iconic", "famous", "exclusive", "secret recipe",
    "original", "number one", "top rated", "chef's special",
    "best in town", "most popular"
]

MULTI_LANG_PATTERNS = [
    r'\b(bon appétit|merci|gracias|buongiorno|danke|arigato|namaste)\b',
    r'\(.*?\)',  # parenthetical translations
]

_model = None
_vectorizer = None


def _get_model():
    global _model, _vectorizer
    if _model is None:
        import os, pickle
        model_path = os.path.join(os.path.dirname(__file__), "../../models/menu_classifier.pkl")
        vec_path = os.path.join(os.path.dirname(__file__), "../../models/menu_vectorizer.pkl")
        if os.path.exists(model_path) and os.path.exists(vec_path):
            with open(model_path, "rb") as f:
                _model = pickle.load(f)
            with open(vec_path, "rb") as f:
                _vectorizer = pickle.load(f)
    return _model, _vectorizer


def _rule_based_score(menu_items: List[dict]) -> float:
    """Fallback rule-based scoring when ML model isn't available."""
    if not menu_items:
        return 50.0

    total_text = " ".join(
        f"{item.get('name', '')} {item.get('description', '')}"
        for item in menu_items
    ).lower()

    buzzword_hits = sum(1 for bw in BUZZWORDS if bw in total_text)
    multi_lang_hits = sum(
        1 for p in MULTI_LANG_PATTERNS
        if re.search(p, total_text, re.IGNORECASE)
    )

    # Check for combo items
    combo_count = sum(1 for item in menu_items if item.get("is_combo", False))
    combo_ratio = combo_count / max(len(menu_items), 1)

    # Menu length penalty: very long menus (>40 items) are tourist-oriented
    menu_length_score = min(len(menu_items) / 40.0, 1.0)

    # Multi-language photos
    has_buzzword_ratio = sum(1 for item in menu_items if item.get("has_buzzword", False)) / max(len(menu_items), 1)

    raw = (
        0.30 * min(buzzword_hits / 5.0, 1.0) +
        0.20 * min(multi_lang_hits / 3.0, 1.0) +
        0.20 * combo_ratio +
        0.15 * menu_length_score +
        0.15 * has_buzzword_ratio
    )
    return round(min(raw * 100, 100), 2)


def compute_signal(menu_items: List[dict]) -> float:
    """
    Returns Menu Tourist Probability (0-100).
    Tries ML model first, falls back to rules.
    """
    model, vectorizer = _get_model()

    if model and vectorizer:
        texts = [
            f"{item.get('name', '')} {item.get('description', '')}"
            for item in menu_items
        ]
        if texts:
            try:
                X = vectorizer.transform(texts)
                probs = model.predict_proba(X)[:, 1]
                return round(float(probs.mean()) * 100, 2)
            except Exception:
                pass

    return _rule_based_score(menu_items)


def train_model(labeled_menus: List[dict], labels: List[int]):
    """
    Train the menu classifier.
    labeled_menus: list of {name, description} dicts
    labels: 0 = local, 1 = tourist
    """
    import os, pickle
    from sklearn.pipeline import Pipeline
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression

    texts = [f"{m.get('name', '')} {m.get('description', '')}" for m in labeled_menus]

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000)),
        ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
    ])
    pipeline.fit(texts, labels)

    os.makedirs("models", exist_ok=True)
    with open("models/menu_classifier.pkl", "wb") as f:
        pickle.dump(pipeline.named_steps["clf"], f)
    with open("models/menu_vectorizer.pkl", "wb") as f:
        pickle.dump(pipeline.named_steps["tfidf"], f)

    return pipeline
