"""
Signal 5: Repeat Local Proxy
Analyzes reviewer metadata to detect single-visit vs local regulars.
"""
from typing import List


def compute_signal(reviewer_metadata: List[dict]) -> float:
    """
    Returns tourist score (0-100). High score = low local repeat visits.
    
    Metrics:
    - % reviewers with only 1 total review (likely tourists, one-off visitors)
    - % reviewers NOT from restaurant's city (non-local)
    """
    if not reviewer_metadata:
        return 50.0

    n = len(reviewer_metadata)

    single_review_count = sum(
        1 for r in reviewer_metadata
        if r.get("is_single_review", False) or r.get("total_reviews_by_user", 0) == 1
    )

    non_local_count = sum(
        1 for r in reviewer_metadata
        if not r.get("is_local", True)
    )

    single_review_ratio = single_review_count / n  # high = tourist
    non_local_ratio = non_local_count / n           # high = tourist

    # Weighted: single-review reviewers are stronger tourist signal
    raw = (0.55 * single_review_ratio) + (0.45 * non_local_ratio)
    score = round(min(raw * 100, 100), 2)
    return score
