"""
Seed data: 12 demo restaurants across NYC, Paris, Nashville.
Run once to populate the database.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal, engine
from app import models

# Inline lightweight analyze_review (no transformers needed for seed)
TOURIST_KEYWORDS = [
    "overpriced", "touristy", "tourist trap", "trap", "instagrammable",
    "not authentic", "pushy", "aggressive", "rip off", "mediocre"
]
AESTHETIC_KEYWORDS = [
    "cute place", "great photos", "instagram", "aesthetic", "photogenic",
    "beautiful decor", "ambiance", "atmosphere", "vibes"
]
QUALITY_KEYWORDS = [
    "flavor", "technique", "quality", "fresh", "authentic", "delicious",
    "well-prepared", "homemade", "traditional", "seasoning", "ingredients"
]

def analyze_review(text: str) -> dict:
    text_lower = text.lower()
    tourist_count = sum(1 for kw in TOURIST_KEYWORDS if kw in text_lower)
    aesthetic_count = sum(1 for kw in AESTHETIC_KEYWORDS if kw in text_lower)
    quality_count = sum(1 for kw in QUALITY_KEYWORDS if kw in text_lower)
    # Simple heuristic sentiment
    neg_words = sum(1 for w in ["bad", "terrible", "awful", "mediocre", "overpriced", "worst"] if w in text_lower)
    pos_words = sum(1 for w in ["great", "amazing", "excellent", "incredible", "outstanding", "best", "perfect"] if w in text_lower)
    sentiment_score = 0.5 + (neg_words - pos_words) * 0.1
    sentiment_score = max(0.0, min(1.0, sentiment_score))
    return {
        "sentiment_score": sentiment_score,
        "tourist_keyword_count": tourist_count,
        "aesthetic_keyword_count": aesthetic_count,
        "quality_keyword_count": quality_count,
    }

def clear_data(db):
    db.query(models.ScoreCache).delete()
    db.query(models.ValidationLabel).delete()
    db.query(models.ReviewerMetadata).delete()
    db.query(models.GeoBusinessContext).delete()
    db.query(models.MenuItem).delete()
    db.query(models.Review).delete()
    db.query(models.Attraction).delete()
    db.query(models.Restaurant).delete()
    db.commit()

def seed():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    clear_data(db)

    # --- Attractions ---
    attractions = [
        models.Attraction(name="Times Square", city="New York", lat=40.7580, lng=-73.9855),
        models.Attraction(name="Central Park", city="New York", lat=40.7851, lng=-73.9683),
        models.Attraction(name="Brooklyn Bridge", city="New York", lat=40.7061, lng=-73.9969),
        models.Attraction(name="Eiffel Tower", city="Paris", lat=48.8584, lng=2.2945),
        models.Attraction(name="Louvre Museum", city="Paris", lat=48.8606, lng=2.3376),
        models.Attraction(name="Broadway Strip", city="Nashville", lat=36.1600, lng=-86.7797),
        models.Attraction(name="Country Music HOF", city="Nashville", lat=36.1607, lng=-86.7760),
        models.Attraction(name="Colosseum", city="Rome", lat=41.8902, lng=12.4922),
    ]
    db.add_all(attractions)
    db.commit()

    # --- Restaurant definitions ---
    restaurants_data = [
        # HIGH TOURIST — NYC near Times Square
        {
            "restaurant": models.Restaurant(
                name="Broadway Bites",
                cuisine="American",
                address="1540 Broadway, New York, NY",
                city="New York",
                lat=40.7589,
                lng=-73.9851,
                avg_price=38.00,
            ),
            "reviews": [
                "Totally overpriced for what you get. Classic tourist trap near Times Square.",
                "Great photos but the food was mediocre. The decor is very Instagrammable though!",
                "Pushy staff tried to seat us outside in the cold. Not authentic NYC at all.",
                "The burger was okay but $22? Come on. Cute place for photos though.",
                "Amazing ambiance! The atmosphere was perfect for our NYC trip. Staff was aggressive about upselling.",
            ],
            "menu_items": [
                {"name": "World Famous NYC Burger", "category": "Mains", "price": 22.00, "has_buzzword": True},
                {"name": "The Best in City Pizza Slice", "category": "Mains", "price": 8.00, "has_buzzword": True},
                {"name": "Authentic NYC Experience Combo", "category": "Combos", "price": 45.00, "has_buzzword": True, "is_combo": True},
                {"name": "Tourist Special Bundle", "category": "Combos", "price": 55.00, "is_combo": True},
                {"name": "I Love NYC Cheesecake", "category": "Desserts", "price": 14.00},
                {"name": "Legendary Manhattan Cocktail", "category": "Drinks", "price": 18.00, "has_buzzword": True},
            ],
            "reviewers": [
                {"reviewer_city": "Los Angeles", "total_reviews": 1, "is_local": False},
                {"reviewer_city": "Chicago", "total_reviews": 1, "is_local": False},
                {"reviewer_city": "London", "total_reviews": 1, "is_local": False},
                {"reviewer_city": "Tokyo", "total_reviews": 1, "is_local": False},
                {"reviewer_city": "New York", "total_reviews": 2, "is_local": True},
            ],
            "geo": {"nearby_souvenir_shops": 6, "nearby_hotels": 8, "nearby_tour_offices": 4, "nearby_attractions": 3},
        },
        # MED-HIGH TOURIST — Paris near Eiffel Tower
        {
            "restaurant": models.Restaurant(
                name="Le Tour Bistro",
                cuisine="French",
                address="5 Av. Gustave Eiffel, Paris",
                city="Paris",
                lat=48.8565,
                lng=2.2970,
                avg_price=42.00,
            ),
            "reviews": [
                "The view is incredible but the food is very average for the price. Very touristy.",
                "Beautiful setting near the tower! The photos came out amazing. Food was just okay.",
                "Standard French fare priced for tourists. Locals would never eat here.",
                "Overpriced crêpes. The menu has 6 languages which should have been a warning.",
                "Lovely ambiance and great decor. Went for the experience more than the food.",
            ],
            "menu_items": [
                {"name": "Authentic French Experience Menu (EN/FR/DE/ES/IT/ZH)", "category": "Combos", "price": 65.00, "has_buzzword": True, "is_combo": True},
                {"name": "Award Winning Crêpe Suzette", "category": "Desserts", "price": 18.00, "has_buzzword": True},
                {"name": "Most Popular Steak Frites", "category": "Mains", "price": 38.00, "has_buzzword": True},
                {"name": "As Seen On TV Escargot", "category": "Starters", "price": 24.00, "has_buzzword": True},
                {"name": "Tourist Bundle: Starter + Main + Wine", "category": "Combos", "price": 72.00, "is_combo": True},
            ],
            "reviewers": [
                {"reviewer_city": "New York", "total_reviews": 1, "is_local": False},
                {"reviewer_city": "Sydney", "total_reviews": 1, "is_local": False},
                {"reviewer_city": "Berlin", "total_reviews": 1, "is_local": False},
                {"reviewer_city": "Paris", "total_reviews": 45, "is_local": True},
                {"reviewer_city": "Dubai", "total_reviews": 1, "is_local": False},
            ],
            "geo": {"nearby_souvenir_shops": 9, "nearby_hotels": 5, "nearby_tour_offices": 6, "nearby_attractions": 2},
        },
        # LOW TOURIST — authentic local NYC spot
        {
            "restaurant": models.Restaurant(
                name="Mama Rita's Kitchen",
                cuisine="Italian",
                address="347 Mulberry St, New York, NY",
                city="New York",
                lat=40.7208,
                lng=-73.9971,
                avg_price=18.00,
            ),
            "reviews": [
                "Best homemade pasta in the city. The technique here is outstanding.",
                "Went 4 times this month. The quality of ingredients is unmatched for the price.",
                "Truly authentic Italian. The flavors are complex and perfectly seasoned.",
                "My neighborhood gem for 5 years. The texture of the fresh pasta is incredible.",
                "Local legend. The owner still hand-rolls the gnocchi daily. Incredible technique.",
            ],
            "menu_items": [
                {"name": "Handmade Tagliatelle al Ragù", "category": "Mains", "price": 16.00},
                {"name": "Fresh Gnocchi Pomodoro", "category": "Mains", "price": 14.00},
                {"name": "Seasonal Risotto", "category": "Mains", "price": 18.00},
                {"name": "House Tiramisu", "category": "Desserts", "price": 8.00},
                {"name": "Chianti (glass)", "category": "Drinks", "price": 9.00},
            ],
            "reviewers": [
                {"reviewer_city": "New York", "total_reviews": 89, "is_local": True},
                {"reviewer_city": "New York", "total_reviews": 142, "is_local": True},
                {"reviewer_city": "New York", "total_reviews": 55, "is_local": True},
                {"reviewer_city": "New York", "total_reviews": 28, "is_local": True},
                {"reviewer_city": "New Jersey", "total_reviews": 12, "is_local": False},
            ],
            "geo": {"nearby_souvenir_shops": 0, "nearby_hotels": 1, "nearby_tour_offices": 0, "nearby_attractions": 0},
        },
        # MIXED — Nashville near Broadway
        {
            "restaurant": models.Restaurant(
                name="Honky Tonk Grill",
                cuisine="American",
                address="220 Broadway, Nashville, TN",
                city="Nashville",
                lat=36.1604,
                lng=-86.7793,
                avg_price=28.00,
            ),
            "reviews": [
                "Fun place with great live music. Food could be better for the price.",
                "Very loud and crowded but that's what Broadway is. Hot chicken was decent.",
                "A bit overpriced but the atmosphere was amazing. Definitely touristy.",
                "Great for first-timers in Nashville. Locals probably skip it but fun experience.",
                "The hot chicken had real flavor and technique. Exceeded my expectations for a tourist street.",
            ],
            "menu_items": [
                {"name": "Nashville's Famous Hot Chicken", "category": "Mains", "price": 24.00, "has_buzzword": True},
                {"name": "BBQ Brisket Plate", "category": "Mains", "price": 26.00},
                {"name": "Best in Nashville Burger", "category": "Mains", "price": 22.00, "has_buzzword": True},
                {"name": "Tennessee Whiskey Combo Meal", "category": "Combos", "price": 45.00, "is_combo": True},
                {"name": "Classic Mac & Cheese", "category": "Sides", "price": 8.00},
            ],
            "reviewers": [
                {"reviewer_city": "Nashville", "total_reviews": 18, "is_local": True},
                {"reviewer_city": "Atlanta", "total_reviews": 1, "is_local": False},
                {"reviewer_city": "Dallas", "total_reviews": 3, "is_local": False},
                {"reviewer_city": "Nashville", "total_reviews": 7, "is_local": True},
                {"reviewer_city": "Memphis", "total_reviews": 2, "is_local": False},
            ],
            "geo": {"nearby_souvenir_shops": 4, "nearby_hotels": 5, "nearby_tour_offices": 3, "nearby_attractions": 2},
        },
        # LOW TOURIST — authentic Nashville neighborhood spot
        {
            "restaurant": models.Restaurant(
                name="Prince's Original",
                cuisine="American",
                address="123 Ewing Dr, Nashville, TN",
                city="Nashville",
                lat=36.1733,
                lng=-86.7520,
                avg_price=14.00,
            ),
            "reviews": [
                "Been coming here for 15 years. Criminally underrated and never changes. Perfect.",
                "The hot chicken technique at Prince's is unmatched anywhere in Nashville.",
                "Real Nashville institution. No combos, no menus in 6 languages. Just quality.",
                "Every local knows this place. The ingredient quality and freshness is exceptional.",
                "Lined up 30 mins but worth every second. The flavor development is masterful.",
            ],
            "menu_items": [
                {"name": "Hot Chicken (Plain)", "category": "Mains", "price": 12.00},
                {"name": "Hot Chicken (Medium)", "category": "Mains", "price": 12.00},
                {"name": "Hot Chicken (Hot)", "category": "Mains", "price": 13.00},
                {"name": "White Bread + Pickles", "category": "Sides", "price": 1.00},
                {"name": "RC Cola", "category": "Drinks", "price": 2.00},
            ],
            "reviewers": [
                {"reviewer_city": "Nashville", "total_reviews": 67, "is_local": True},
                {"reviewer_city": "Nashville", "total_reviews": 103, "is_local": True},
                {"reviewer_city": "Nashville", "total_reviews": 41, "is_local": True},
                {"reviewer_city": "Nashville", "total_reviews": 29, "is_local": True},
                {"reviewer_city": "Nashville", "total_reviews": 88, "is_local": True},
            ],
            "geo": {"nearby_souvenir_shops": 0, "nearby_hotels": 1, "nearby_tour_offices": 0, "nearby_attractions": 0},
        },
        # HIGH TOURIST — Paris Louvre area
        {
            "restaurant": models.Restaurant(
                name="Café Mona Lisa",
                cuisine="French",
                address="1 Rue du Louvre, Paris",
                city="Paris",
                lat=48.8620,
                lng=2.3380,
                avg_price=48.00,
            ),
            "reviews": [
                "Overpriced and not authentic. They clearly cater to the museum crowd.",
                "The photos on Instagram looked better than the food. Instagrammable interior though!",
                "The staff were pushy about dessert upsells. Classic tourist restaurant.",
                "Great ambiance, terrible value. Every table was a tourist. Not real Parisian food.",
                "Cute decor and aesthetic vibes. Very photogenic. Food forgettable.",
            ],
            "menu_items": [
                {"name": "Iconic Louvre Lunch Experience", "category": "Combos", "price": 75.00, "has_buzzword": True, "is_combo": True},
                {"name": "World Famous French Onion Soup", "category": "Starters", "price": 22.00, "has_buzzword": True},
                {"name": "The Original Croque Monsieur", "category": "Mains", "price": 26.00, "has_buzzword": True},
                {"name": "Award-Winning Chocolate Fondant", "category": "Desserts", "price": 19.00, "has_buzzword": True},
                {"name": "Best-in-Paris Wine Flight", "category": "Drinks", "price": 45.00, "has_buzzword": True},
            ],
            "reviewers": [
                {"reviewer_city": "London", "total_reviews": 1, "is_local": False},
                {"reviewer_city": "Toronto", "total_reviews": 1, "is_local": False},
                {"reviewer_city": "Singapore", "total_reviews": 1, "is_local": False},
                {"reviewer_city": "Paris", "total_reviews": 5, "is_local": True},
                {"reviewer_city": "Amsterdam", "total_reviews": 1, "is_local": False},
            ],
            "geo": {"nearby_souvenir_shops": 8, "nearby_hotels": 6, "nearby_tour_offices": 5, "nearby_attractions": 3},
        },
        # LOW TOURIST — neighborhood Paris bistro
        {
            "restaurant": models.Restaurant(
                name="Chez Bernard",
                cuisine="French",
                address="14 Rue de la Roquette, Paris",
                city="Paris",
                lat=48.8533,
                lng=2.3728,
                avg_price=22.00,
            ),
            "reviews": [
                "This is what Paris actually tastes like. The technique on the duck was incredible.",
                "Been coming since 2018. Consistently fresh ingredients, real flavor depth.",
                "No English menu, no photos. Just outstanding traditional French cooking.",
                "The seasoning here is unbelievable. Real Parisian neighborhood cooking.",
                "My local go-to for 3 years. The homemade tarte tatin is worth the whole trip.",
            ],
            "menu_items": [
                {"name": "Canard à l'Orange", "category": "Mains", "price": 24.00},
                {"name": "Soupe de Poisson", "category": "Starters", "price": 12.00},
                {"name": "Tarte Tatin Maison", "category": "Desserts", "price": 9.00},
                {"name": "Plat du Jour", "category": "Mains", "price": 16.00},
                {"name": "Carafe de Vin Rouge", "category": "Drinks", "price": 14.00},
            ],
            "reviewers": [
                {"reviewer_city": "Paris", "total_reviews": 156, "is_local": True},
                {"reviewer_city": "Paris", "total_reviews": 89, "is_local": True},
                {"reviewer_city": "Paris", "total_reviews": 72, "is_local": True},
                {"reviewer_city": "Lyon", "total_reviews": 23, "is_local": False},
                {"reviewer_city": "Paris", "total_reviews": 44, "is_local": True},
            ],
            "geo": {"nearby_souvenir_shops": 0, "nearby_hotels": 1, "nearby_tour_offices": 0, "nearby_attractions": 0},
        },
        # MED TOURIST — NYC midtown
        {
            "restaurant": models.Restaurant(
                name="Rockefeller Ramen",
                cuisine="Japanese",
                address="45 W 50th St, New York, NY",
                city="New York",
                lat=40.7587,
                lng=-73.9787,
                avg_price=24.00,
            ),
            "reviews": [
                "Solid ramen but clearly positioned for midtown office workers and tourists alike.",
                "The presentation was beautiful for photos. Broth technique was acceptable.",
                "Good flavor depth but the combo meals feel engineered for tourists.",
                "Overpriced for ramen but the quality holds up better than I expected.",
                "Instagrammable bowls! The aesthetic is perfect. Flavor is secondary but still okay.",
            ],
            "menu_items": [
                {"name": "NYC's Most Famous Tonkotsu", "category": "Mains", "price": 22.00, "has_buzzword": True},
                {"name": "Instagram Special — Rainbow Bowl", "category": "Mains", "price": 26.00},
                {"name": "Tourist Ramen Combo (Ramen + Gyoza + Drink)", "category": "Combos", "price": 38.00, "is_combo": True},
                {"name": "Spicy Miso Ramen", "category": "Mains", "price": 20.00},
                {"name": "Seasonal Wagyu Add-On", "category": "Extras", "price": 12.00},
            ],
            "reviewers": [
                {"reviewer_city": "New York", "total_reviews": 22, "is_local": True},
                {"reviewer_city": "Boston", "total_reviews": 1, "is_local": False},
                {"reviewer_city": "Philadelphia", "total_reviews": 4, "is_local": False},
                {"reviewer_city": "New York", "total_reviews": 37, "is_local": True},
                {"reviewer_city": "Miami", "total_reviews": 1, "is_local": False},
            ],
            "geo": {"nearby_souvenir_shops": 3, "nearby_hotels": 6, "nearby_tour_offices": 2, "nearby_attractions": 1},
        },
        # LOW TOURIST — Brooklyn local
        {
            "restaurant": models.Restaurant(
                name="Sunset Tacos",
                cuisine="Mexican",
                address="88 Graham Ave, Brooklyn, NY",
                city="New York",
                lat=40.7145,
                lng=-73.9416,
                avg_price=12.00,
            ),
            "reviews": [
                "Perfectly seasoned al pastor. The corn tortillas are freshly made. Incredible.",
                "Best tacos in Brooklyn by far. The ingredients are always fresh and flavorful.",
                "Authentic technique and quality. 5 years and never disappointed.",
                "The flavors here are complex and well-developed. Real street food quality.",
                "A neighborhood staple. Every bite has character. Good value for quality ingredients.",
            ],
            "menu_items": [
                {"name": "Al Pastor Taco (3)", "category": "Tacos", "price": 9.00},
                {"name": "Carnitas Taco (3)", "category": "Tacos", "price": 9.00},
                {"name": "Ceviche", "category": "Starters", "price": 10.00},
                {"name": "Elote", "category": "Sides", "price": 5.00},
                {"name": "Agua Fresca", "category": "Drinks", "price": 3.00},
            ],
            "reviewers": [
                {"reviewer_city": "New York", "total_reviews": 78, "is_local": True},
                {"reviewer_city": "New York", "total_reviews": 112, "is_local": True},
                {"reviewer_city": "New York", "total_reviews": 34, "is_local": True},
                {"reviewer_city": "New York", "total_reviews": 56, "is_local": True},
                {"reviewer_city": "Queens", "total_reviews": 19, "is_local": True},
            ],
            "geo": {"nearby_souvenir_shops": 0, "nearby_hotels": 0, "nearby_tour_offices": 0, "nearby_attractions": 0},
        },
        # HIGH TOURIST — Nashville Broadway very close
        {
            "restaurant": models.Restaurant(
                name="Nashville Star Diner",
                cuisine="American",
                address="154 2nd Ave N, Nashville, TN",
                city="Nashville",
                lat=36.1599,
                lng=-86.7771,
                avg_price=32.00,
            ),
            "reviews": [
                "Total tourist trap. Overpriced and mediocre. Only going here because it was on Broadway.",
                "Great photos and very cute place! The atmosphere was fun. Food was nothing special.",
                "Aggressive host sat us at a bad table and then tried to upsell constantly.",
                "Not authentic Nashville at all. The menu screams tourist destination.",
                "The aesthetic is perfect for Instagram. Went purely for photos. Wouldn't eat here again.",
            ],
            "menu_items": [
                {"name": "World Famous Nashville Meat & Three", "category": "Mains", "price": 32.00, "has_buzzword": True},
                {"name": "As Seen on Food Network Hot Chicken", "category": "Mains", "price": 28.00, "has_buzzword": True},
                {"name": "Number One Tourist Combo", "category": "Combos", "price": 55.00, "is_combo": True, "has_buzzword": True},
                {"name": "Legendary Broadway Biscuit", "category": "Sides", "price": 9.00, "has_buzzword": True},
                {"name": "Best-in-City Peach Cobbler", "category": "Desserts", "price": 14.00, "has_buzzword": True},
                {"name": "Tennessee Whiskey Flight", "category": "Drinks", "price": 28.00},
            ],
            "reviewers": [
                {"reviewer_city": "Chicago", "total_reviews": 1, "is_local": False},
                {"reviewer_city": "Phoenix", "total_reviews": 1, "is_local": False},
                {"reviewer_city": "Houston", "total_reviews": 1, "is_local": False},
                {"reviewer_city": "Nashville", "total_reviews": 5, "is_local": True},
                {"reviewer_city": "Denver", "total_reviews": 1, "is_local": False},
            ],
            "geo": {"nearby_souvenir_shops": 7, "nearby_hotels": 4, "nearby_tour_offices": 5, "nearby_attractions": 3},
        },
        # MIXED — Rome Colosseum area  
        {
            "restaurant": models.Restaurant(
                name="Colosseo Cucina",
                cuisine="Italian",
                address="Via Sacra 12, Rome",
                city="Rome",
                lat=48.8910,
                lng=12.4935,
                avg_price=35.00,
            ),
            "reviews": [
                "Beautiful location near the Colosseum but the prices reflect the tourism tax.",
                "The pasta was actually well-prepared despite the tourist trap expectations.",
                "Good technique on the carbonara but I wouldn't return. Too overpriced.",
                "Lovely atmosphere and the food held up better than expected for the area.",
                "Overpriced for what it is. Beautiful for photos near the ruins though.",
            ],
            "menu_items": [
                {"name": "Original Roman Carbonara", "category": "Mains", "price": 28.00, "has_buzzword": True},
                {"name": "Legendary Cacio e Pepe", "category": "Mains", "price": 26.00, "has_buzzword": True},
                {"name": "Roma Visitor Combo (Pasta + Wine + Dessert)", "category": "Combos", "price": 58.00, "is_combo": True},
                {"name": "Bruschetta al Pomodoro", "category": "Starters", "price": 14.00},
                {"name": "Tiramisu Classico", "category": "Desserts", "price": 12.00},
            ],
            "reviewers": [
                {"reviewer_city": "New York", "total_reviews": 1, "is_local": False},
                {"reviewer_city": "London", "total_reviews": 2, "is_local": False},
                {"reviewer_city": "Rome", "total_reviews": 15, "is_local": True},
                {"reviewer_city": "Berlin", "total_reviews": 1, "is_local": False},
                {"reviewer_city": "Rome", "total_reviews": 8, "is_local": True},
            ],
            "geo": {"nearby_souvenir_shops": 7, "nearby_hotels": 4, "nearby_tour_offices": 5, "nearby_attractions": 3},
        },
        # LOW TOURIST — authentic NYC Korean
        {
            "restaurant": models.Restaurant(
                name="Han's BBQ",
                cuisine="Korean",
                address="32 W 32nd St, New York, NY",
                city="New York",
                lat=40.7488,
                lng=-73.9882,
                avg_price=20.00,
            ),
            "reviews": [
                "Authentic Korean BBQ technique. The marination and quality of meat is outstanding.",
                "Fresh banchan every visit. The skill and technique here is consistent every time.",
                "Great flavor development in the galbi. Locals and Koreans fill this place on weekends.",
                "Real quality ingredients, fair prices, and incredible seasoning. This is the real deal.",
                "My family dines here monthly. The homemade doenjang soup is exceptional quality.",
            ],
            "menu_items": [
                {"name": "Galbi (Short Rib)", "category": "BBQ", "price": 28.00},
                {"name": "Bulgogi", "category": "BBQ", "price": 22.00},
                {"name": "Samgyeopsal (Pork Belly)", "category": "BBQ", "price": 20.00},
                {"name": "Kimchi Jjigae", "category": "Soups", "price": 14.00},
                {"name": "Banchan (5 sides)", "category": "Sides", "price": 0.00},
            ],
            "reviewers": [
                {"reviewer_city": "New York", "total_reviews": 94, "is_local": True},
                {"reviewer_city": "New York", "total_reviews": 132, "is_local": True},
                {"reviewer_city": "New York", "total_reviews": 67, "is_local": True},
                {"reviewer_city": "New Jersey", "total_reviews": 31, "is_local": True},
                {"reviewer_city": "New York", "total_reviews": 48, "is_local": True},
            ],
            "geo": {"nearby_souvenir_shops": 1, "nearby_hotels": 2, "nearby_tour_offices": 0, "nearby_attractions": 0},
        },
    ]

    # Insert all restaurants
    for data in restaurants_data:
        rest = data["restaurant"]
        db.add(rest)
        db.flush()  # get ID

        # Reviews (with keyword analysis)
        for review_text in data["reviews"]:
            analysis = analyze_review(review_text)
            review = models.Review(
                restaurant_id=rest.id,
                text=review_text,
                rating=3,
                **analysis,
            )
            db.add(review)

        # Menu items
        for item_data in data["menu_items"]:
            item = models.MenuItem(
                restaurant_id=rest.id,
                name=item_data["name"],
                description=item_data.get("description", ""),
                price=item_data.get("price", 0),
                category=item_data.get("category", ""),
                has_buzzword=item_data.get("has_buzzword", False),
                is_combo=item_data.get("is_combo", False),
            )
            db.add(item)

        # Reviewers
        for rev in data["reviewers"]:
            meta = models.ReviewerMetadata(
                restaurant_id=rest.id,
                reviewer_city=rev["reviewer_city"],
                total_reviews_by_user=rev["total_reviews"],
                is_local=rev["is_local"],
                is_single_review=rev["total_reviews"] == 1,
            )
            db.add(meta)

        # Geo context
        geo = data["geo"]
        geo_obj = models.GeoBusinessContext(
            restaurant_id=rest.id,
            **geo,
        )
        db.add(geo_obj)

    db.commit()
    print(f"✅ Seeded {len(restaurants_data)} restaurants with full data.")
    db.close()


def run_seed():
    """Safe wrapper: only seeds demo restaurants if the DB has no seed data (no NYC/Paris restaurants)."""
    from app.db import SessionLocal
    session = SessionLocal()
    try:
        count = session.query(models.Restaurant).filter(
            models.Restaurant.city.in_(["New York", "Paris"])
        ).count()
        if count == 0:
            seed()
        else:
            print(f"Seed data already present ({count} non-Nashville restaurants). Skipping seed.")
    finally:
        session.close()


if __name__ == "__main__":
    seed()
