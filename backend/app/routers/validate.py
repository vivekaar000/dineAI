from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Literal, List, Optional
from app.db import get_db
from app import models

router = APIRouter()


class ValidationRequest(BaseModel):
    restaurant_id: int
    true_label: Literal["local", "mixed", "tourist"]


class ValidationStats(BaseModel):
    accuracy: Optional[float]
    precision: Optional[dict]
    confusion_matrix: Optional[List[List[int]]]
    total_samples: int


@router.post("/validate")
def submit_validation(req: ValidationRequest, db: Session = Depends(get_db)):
    restaurant = db.query(models.Restaurant).filter(
        models.Restaurant.id == req.restaurant_id
    ).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    # Get cached score
    cached = db.query(models.ScoreCache).filter(
        models.ScoreCache.restaurant_id == req.restaurant_id
    ).first()

    if not cached:
        raise HTTPException(
            status_code=400,
            detail="Analyze this restaurant first before submitting a validation label."
        )

    predicted_label = _score_to_label(cached.tts_score)

    # Save label
    label = models.ValidationLabel(
        restaurant_id=req.restaurant_id,
        true_label=req.true_label,
        predicted_score=cached.tts_score,
        predicted_label=predicted_label,
    )
    db.add(label)
    db.commit()

    return {
        "restaurant_id": req.restaurant_id,
        "true_label": req.true_label,
        "predicted_label": predicted_label,
        "predicted_score": cached.tts_score,
        "correct": req.true_label == predicted_label,
    }


@router.get("/validate/stats")
def get_validation_stats(db: Session = Depends(get_db)):
    labels = db.query(models.ValidationLabel).all()
    if not labels:
        return {"total_samples": 0, "accuracy": None, "confusion_matrix": None, "precision": None}

    class_names = ["local", "mixed", "tourist"]
    n = len(class_names)
    cm = [[0] * n for _ in range(n)]

    correct = 0
    for label in labels:
        true_idx = class_names.index(label.true_label) if label.true_label in class_names else -1
        pred_idx = class_names.index(label.predicted_label) if label.predicted_label in class_names else -1
        if true_idx >= 0 and pred_idx >= 0:
            cm[true_idx][pred_idx] += 1
            if true_idx == pred_idx:
                correct += 1

    accuracy = correct / len(labels)

    # Precision per class
    precision = {}
    for i, cls in enumerate(class_names):
        tp = cm[i][i]
        col_sum = sum(cm[r][i] for r in range(n))
        precision[cls] = round(tp / col_sum, 3) if col_sum > 0 else 0.0

    return {
        "total_samples": len(labels),
        "accuracy": round(accuracy, 3),
        "confusion_matrix": cm,
        "confusion_labels": class_names,
        "precision": precision,
    }


def _score_to_label(tts_score: float) -> str:
    if tts_score >= 65:
        return "tourist"
    elif tts_score <= 40:
        return "local"
    return "mixed"
