-- Tourist Targeting Score Database Schema

CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cuisine VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    avg_price DECIMAL(10, 2),
    phone VARCHAR(50),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id),
    text TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    sentiment_score DOUBLE PRECISION,
    tourist_keyword_count INTEGER DEFAULT 0,
    aesthetic_keyword_count INTEGER DEFAULT 0,
    quality_keyword_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id),
    name VARCHAR(255),
    description TEXT,
    price DECIMAL(10, 2),
    category VARCHAR(100),
    has_buzzword BOOLEAN DEFAULT FALSE,
    is_combo BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS reviewer_metadata (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id),
    reviewer_city VARCHAR(100),
    total_reviews_by_user INTEGER,
    is_local BOOLEAN,
    is_single_review BOOLEAN
);

CREATE TABLE IF NOT EXISTS geo_business_context (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) UNIQUE,
    nearby_souvenir_shops INTEGER DEFAULT 0,
    nearby_hotels INTEGER DEFAULT 0,
    nearby_tour_offices INTEGER DEFAULT 0,
    nearby_attractions INTEGER DEFAULT 0,
    tourist_density_index DOUBLE PRECISION DEFAULT 0
);

CREATE TABLE IF NOT EXISTS attractions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    city VARCHAR(100),
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS validation_labels (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id),
    true_label VARCHAR(50) CHECK (true_label IN ('local', 'mixed', 'tourist')),
    predicted_score DOUBLE PRECISION,
    predicted_label VARCHAR(50),
    submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS score_cache (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) UNIQUE,
    tts_score DOUBLE PRECISION,
    local_authenticity_score DOUBLE PRECISION,
    price_inflation_score DOUBLE PRECISION,
    review_linguistics_score DOUBLE PRECISION,
    tourist_density_score DOUBLE PRECISION,
    menu_engineering_score DOUBLE PRECISION,
    repeat_local_score DOUBLE PRECISION,
    attraction_proximity_score DOUBLE PRECISION,
    price_inflation_pct DOUBLE PRECISION,
    computed_at TIMESTAMP DEFAULT NOW()
);
