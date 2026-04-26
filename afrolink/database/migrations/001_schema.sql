-- =============================================================
--  AFRO LINK — Complete Database Schema
--  Dialect : PostgreSQL 15+
--  Fixed   : 2026-04-25
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- =============================================================
--  UTILITY — auto-update updated_at
-- =============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION attach_updated_at(tbl TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    EXECUTE format(
        'CREATE TRIGGER trg_%1$s_updated_at
         BEFORE UPDATE ON %1$I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
        tbl
    );
END;
$$;

-- =============================================================
--  SECTION 1 — USERS & IDENTITY
-- =============================================================

CREATE TABLE roles (
    id          SERIAL       PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email               CITEXT      NOT NULL UNIQUE,
    phone               VARCHAR(20) UNIQUE,
    password_hash       TEXT        NOT NULL,
    role_id             INT         NOT NULL REFERENCES roles(id),
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    is_email_verified   BOOLEAN     NOT NULL DEFAULT FALSE,
    is_phone_verified   BOOLEAN     NOT NULL DEFAULT FALSE,
    email_verified_at   TIMESTAMPTZ,
    phone_verified_at   TIMESTAMPTZ,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);
SELECT attach_updated_at('users');

CREATE TABLE profiles (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name      VARCHAR(100),
    last_name       VARCHAR(100),
    display_name    VARCHAR(150),
    avatar_url      TEXT,
    bio             TEXT,
    date_of_birth   DATE,
    gender          VARCHAR(30),
    country         VARCHAR(100),
    city            VARCHAR(100),
    address_line1   TEXT,
    address_line2   TEXT,
    postal_code     VARCHAR(20),
    latitude        NUMERIC(9,6),
    longitude       NUMERIC(9,6),
    language        VARCHAR(10)  NOT NULL DEFAULT 'en',
    currency        CHAR(3)      NOT NULL DEFAULT 'CAD',
    website_url     TEXT,
    social_links    JSONB,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('profiles');

CREATE TABLE user_documents (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_type        VARCHAR(50) NOT NULL,
    file_url        TEXT        NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected')),
    reviewed_by     UUID        REFERENCES users(id),
    reviewed_at     TIMESTAMPTZ,
    rejection_note  TEXT,
    expires_at      DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('user_documents');

CREATE TABLE sessions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT        NOT NULL UNIQUE,
    device_info     JSONB,
    ip_address      INET,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
--  SECTION 2 — CATALOGUE
-- =============================================================

CREATE TABLE categories (
    id               SERIAL       PRIMARY KEY,
    parent_id        INT          REFERENCES categories(id),
    name             VARCHAR(100) NOT NULL,
    slug             VARCHAR(120) NOT NULL UNIQUE,
    description      TEXT,
    icon_url         TEXT,
    banner_url       TEXT,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order       INT          NOT NULL DEFAULT 0,
    meta_title       VARCHAR(200),
    meta_description TEXT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('categories');

CREATE TABLE products (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id         UUID         NOT NULL REFERENCES users(id),
    category_id       INT          NOT NULL REFERENCES categories(id),
    name              VARCHAR(200) NOT NULL,
    slug              VARCHAR(220) NOT NULL UNIQUE,
    description       TEXT,
    short_desc        VARCHAR(500),
    sku               VARCHAR(100) UNIQUE,
    base_price        NUMERIC(12,2) NOT NULL,
    sale_price        NUMERIC(12,2),
    currency          CHAR(3)      NOT NULL DEFAULT 'CAD',
    unit              VARCHAR(50),
    weight_grams      INT,
    tags              TEXT[],
    attributes        JSONB,
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    is_featured       BOOLEAN      NOT NULL DEFAULT FALSE,
    requires_shipping BOOLEAN      NOT NULL DEFAULT TRUE,
    is_digital        BOOLEAN      NOT NULL DEFAULT FALSE,
    download_url      TEXT,
    meta_title        VARCHAR(200),
    meta_description  VARCHAR(500),
    rating_avg        NUMERIC(3,2) NOT NULL DEFAULT 0,
    review_count      INT          NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ
);
SELECT attach_updated_at('products');

CREATE TABLE product_images (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url         TEXT        NOT NULL,
    alt_text    VARCHAR(200),
    is_primary  BOOLEAN     NOT NULL DEFAULT FALSE,
    sort_order  INT         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory (
    id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID    NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    quantity_available  INT     NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
    quantity_reserved   INT     NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    quantity_sold       INT     NOT NULL DEFAULT 0 CHECK (quantity_sold >= 0),
    low_stock_threshold INT     NOT NULL DEFAULT 5,
    track_quantity      BOOLEAN NOT NULL DEFAULT TRUE,
    allow_backorder     BOOLEAN NOT NULL DEFAULT FALSE,
    warehouse_location  VARCHAR(100),
    last_restocked_at   TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE promotions (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id           UUID         REFERENCES users(id),
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    promo_type          VARCHAR(30)  NOT NULL,
    discount_type       VARCHAR(20),
    discount_value      NUMERIC(10,2),
    min_order_amount    NUMERIC(12,2),
    max_discount_amount NUMERIC(12,2),
    product_ids         UUID[],
    category_ids        INT[],
    banner_url          TEXT,
    target_url          TEXT,
    starts_at           TIMESTAMPTZ  NOT NULL,
    ends_at             TIMESTAMPTZ  NOT NULL,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT promotions_dates_check CHECK (ends_at > starts_at)
);
SELECT attach_updated_at('promotions');

-- =============================================================
--  SECTION 3 — COUPONS (before cart & orders)
-- =============================================================

CREATE TABLE coupons (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code                  VARCHAR(50) NOT NULL UNIQUE,
    description           TEXT,
    discount_type         VARCHAR(20) NOT NULL
                              CHECK (discount_type IN ('percentage','fixed','free_shipping')),
    discount_value        NUMERIC(10,2) NOT NULL,
    min_order_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    max_discount_amount   NUMERIC(12,2),
    usage_limit           INT,
    usage_count           INT         NOT NULL DEFAULT 0,
    per_user_limit        INT         NOT NULL DEFAULT 1,
    applicable_products   UUID[],
    applicable_categories INT[],
    is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
    starts_at             TIMESTAMPTZ,
    expires_at            TIMESTAMPTZ,
    created_by            UUID        REFERENCES users(id),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('coupons');

-- =============================================================
--  SECTION 4 — CART & ORDERS
-- =============================================================

CREATE TABLE cart (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    session_key VARCHAR(100) UNIQUE,
    coupon_id   UUID        REFERENCES coupons(id),
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT cart_owner_check CHECK (
        (user_id IS NOT NULL) OR (session_key IS NOT NULL)
    )
);
SELECT attach_updated_at('cart');

CREATE TABLE cart_items (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id     UUID          NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
    product_id  UUID          NOT NULL REFERENCES products(id),
    quantity    INT           NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price  NUMERIC(12,2) NOT NULL,
    attributes  JSONB,
    added_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (cart_id, product_id)
);
SELECT attach_updated_at('cart_items');

CREATE TABLE orders (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number     VARCHAR(40)   NOT NULL UNIQUE,
    user_id          UUID          NOT NULL REFERENCES users(id),
    coupon_id        UUID          REFERENCES coupons(id),
    subtotal         NUMERIC(12,2) NOT NULL,
    discount_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
    shipping_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount     NUMERIC(12,2) NOT NULL,
    currency         CHAR(3)       NOT NULL DEFAULT 'CAD',
    status           VARCHAR(30)   NOT NULL DEFAULT 'pending',
    payment_status   VARCHAR(30)   NOT NULL DEFAULT 'unpaid',
    shipping_address JSONB         NOT NULL,
    billing_address  JSONB,
    notes            TEXT,
    ip_address       INET,
    placed_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('orders');

CREATE TABLE order_items (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID          NOT NULL REFERENCES products(id),
    vendor_id       UUID          NOT NULL REFERENCES users(id),
    quantity        INT           NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_price     NUMERIC(12,2) NOT NULL,
    attributes      JSONB,
    status          VARCHAR(30)   NOT NULL DEFAULT 'pending'
);

CREATE TABLE order_status_history (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status      VARCHAR(30) NOT NULL,
    note        TEXT,
    changed_by  UUID        REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE coupon_usages (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id        UUID          NOT NULL REFERENCES coupons(id),
    user_id          UUID          NOT NULL REFERENCES users(id),
    order_id         UUID          NOT NULL REFERENCES orders(id),
    discount_applied NUMERIC(10,2) NOT NULL,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- =============================================================
--  SECTION 5 — PAYMENTS & FINANCE
-- =============================================================

CREATE TABLE payments (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id         UUID          NOT NULL REFERENCES orders(id),
    user_id          UUID          NOT NULL REFERENCES users(id),
    amount           NUMERIC(12,2) NOT NULL,
    currency         CHAR(3)       NOT NULL DEFAULT 'CAD',
    method           VARCHAR(50)   NOT NULL,
    status           VARCHAR(30)   NOT NULL DEFAULT 'pending',
    -- UNIQUE so payment.controller ON CONFLICT (gateway_ref) works
    gateway_ref      VARCHAR(200)  UNIQUE,
    gateway_response JSONB,
    paid_at          TIMESTAMPTZ,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('payments');

CREATE TABLE transactions (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id     UUID          REFERENCES payments(id),
    user_id        UUID          NOT NULL REFERENCES users(id),
    type           VARCHAR(30)   NOT NULL
                       CHECK (type IN ('charge','refund','payout','fee')),
    amount         NUMERIC(12,2) NOT NULL,
    currency       CHAR(3)       NOT NULL DEFAULT 'CAD',
    balance_before NUMERIC(12,2),
    balance_after  NUMERIC(12,2),
    reference      VARCHAR(200),
    description    TEXT,
    metadata       JSONB,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE refunds (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     UUID          NOT NULL REFERENCES orders(id),
    payment_id   UUID          NOT NULL REFERENCES payments(id),
    requested_by UUID          NOT NULL REFERENCES users(id),
    amount       NUMERIC(12,2) NOT NULL,
    reason       TEXT,
    status       VARCHAR(30)   NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','rejected','completed')),
    reviewed_by  UUID          REFERENCES users(id),
    reviewed_at  TIMESTAMPTZ,
    gateway_ref  VARCHAR(200),
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('refunds');

-- =============================================================
--  SECTION 6 — DELIVERY (zones first, jobs second)
-- =============================================================

CREATE TABLE delivery_zones (
    id               SERIAL        PRIMARY KEY,
    name             VARCHAR(100)  NOT NULL,
    description      TEXT,
    polygon          JSONB,
    base_fee         NUMERIC(10,2) NOT NULL DEFAULT 0,
    per_km_rate      NUMERIC(8,2)  NOT NULL DEFAULT 0,
    min_order_amount NUMERIC(12,2),
    is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('delivery_zones');

CREATE TABLE delivery_vendors (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL UNIQUE REFERENCES users(id),
    company_name     VARCHAR(200),
    vehicle_type     VARCHAR(50),
    vehicle_plate    VARCHAR(30),
    license_number   VARCHAR(80),
    is_available     BOOLEAN      NOT NULL DEFAULT FALSE,
    is_verified      BOOLEAN      NOT NULL DEFAULT FALSE,
    current_lat      NUMERIC(9,6),
    current_lng      NUMERIC(9,6),
    rating_avg       NUMERIC(3,2) NOT NULL DEFAULT 0,
    total_deliveries INT          NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('delivery_vendors');

CREATE TABLE delivery_jobs (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id          UUID          NOT NULL REFERENCES orders(id),
    vendor_id         UUID          REFERENCES delivery_vendors(id),
    zone_id           INT           REFERENCES delivery_zones(id),
    pickup_address    JSONB         NOT NULL,
    dropoff_address   JSONB         NOT NULL,
    pickup_lat        NUMERIC(9,6),
    pickup_lng        NUMERIC(9,6),
    dropoff_lat       NUMERIC(9,6),
    dropoff_lng       NUMERIC(9,6),
    status            VARCHAR(30)   NOT NULL DEFAULT 'unassigned',
    distance_km       NUMERIC(8,2),
    estimated_minutes INT,
    delivery_fee      NUMERIC(10,2),
    assigned_at       TIMESTAMPTZ,
    picked_up_at      TIMESTAMPTZ,
    delivered_at      TIMESTAMPTZ,
    failed_at         TIMESTAMPTZ,
    failure_reason    TEXT,
    proof_of_delivery TEXT,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('delivery_jobs');

CREATE TABLE delivery_status_history (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id     UUID        NOT NULL REFERENCES delivery_jobs(id) ON DELETE CASCADE,
    status     VARCHAR(30) NOT NULL,
    note       TEXT,
    lat        NUMERIC(9,6),
    lng        NUMERIC(9,6),
    changed_by UUID        REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE delivery_schedule (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id    UUID        NOT NULL REFERENCES delivery_vendors(id) ON DELETE CASCADE,
    day_of_week  SMALLINT    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time   TIME        NOT NULL,
    end_time     TIME        NOT NULL,
    is_available BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (vendor_id, day_of_week),
    CONSTRAINT schedule_time_check CHECK (end_time > start_time)
);

CREATE TABLE delivery_payouts (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id      UUID          NOT NULL REFERENCES delivery_vendors(id),
    job_id         UUID          REFERENCES delivery_jobs(id),
    amount         NUMERIC(10,2) NOT NULL,
    currency       CHAR(3)       NOT NULL DEFAULT 'CAD',
    status         VARCHAR(30)   NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','paid','failed')),
    payment_method VARCHAR(50),
    reference      VARCHAR(200),
    paid_at        TIMESTAMPTZ,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- =============================================================
--  SECTION 7 — CONTENT
--  recipes & posts defined FIRST so favorites/reviews/videos/
--  comments/likes can reference them without forward refs.
-- =============================================================

CREATE TABLE recipes (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id     UUID         NOT NULL REFERENCES users(id),
    category_id   INT          REFERENCES categories(id),
    title         VARCHAR(250) NOT NULL,
    slug          VARCHAR(270) NOT NULL UNIQUE,
    description   TEXT,
    ingredients   JSONB,        -- [{ name, quantity, unit }]
    instructions  JSONB,        -- [{ step, text }]
    prep_time_min INT,
    cook_time_min INT,
    servings      INT,
    difficulty    VARCHAR(20)  CHECK (difficulty IN ('easy','medium','hard')),
    cuisine_type  VARCHAR(100),
    dietary_tags  TEXT[],
    is_published  BOOLEAN      NOT NULL DEFAULT FALSE,
    is_featured   BOOLEAN      NOT NULL DEFAULT FALSE,
    view_count    INT          NOT NULL DEFAULT 0,
    like_count    INT          NOT NULL DEFAULT 0,
    rating_avg    NUMERIC(3,2) NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);
SELECT attach_updated_at('recipes');

CREATE TABLE recipe_images (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id  UUID        NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    url        TEXT        NOT NULL,
    alt_text   VARCHAR(200),
    is_cover   BOOLEAN     NOT NULL DEFAULT FALSE,
    sort_order INT         NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE posts (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id     UUID        NOT NULL REFERENCES users(id),
    title         VARCHAR(300),
    body          TEXT,
    media_urls    TEXT[],
    post_type     VARCHAR(30) NOT NULL DEFAULT 'status'
                      CHECK (post_type IN ('status','article','reel')),
    is_published  BOOLEAN     NOT NULL DEFAULT TRUE,
    is_featured   BOOLEAN     NOT NULL DEFAULT FALSE,
    view_count    INT         NOT NULL DEFAULT 0,
    like_count    INT         NOT NULL DEFAULT 0,
    comment_count INT         NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);
SELECT attach_updated_at('posts');

CREATE TABLE videos (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id     UUID        NOT NULL REFERENCES users(id),
    recipe_id     UUID        REFERENCES recipes(id),
    post_id       UUID        REFERENCES posts(id),
    title         VARCHAR(250) NOT NULL,
    description   TEXT,
    video_url     TEXT        NOT NULL,
    thumbnail_url TEXT,
    duration_sec  INT,
    category_id   INT         REFERENCES categories(id),
    tags          TEXT[],
    is_published  BOOLEAN     NOT NULL DEFAULT FALSE,
    view_count    INT         NOT NULL DEFAULT 0,
    like_count    INT         NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('videos');

CREATE TABLE favorites (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID        REFERENCES products(id) ON DELETE CASCADE,
    recipe_id  UUID        REFERENCES recipes(id)  ON DELETE CASCADE,
    post_id    UUID        REFERENCES posts(id)    ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT favorites_target_check CHECK (
        (product_id IS NOT NULL)::INT +
        (recipe_id  IS NOT NULL)::INT +
        (post_id    IS NOT NULL)::INT = 1
    ),
    UNIQUE (user_id, product_id),
    UNIQUE (user_id, recipe_id),
    UNIQUE (user_id, post_id)
);

CREATE TABLE reviews (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    -- NULL when the author's account is deleted (ON DELETE SET NULL)
    user_id       UUID        REFERENCES users(id) ON DELETE SET NULL,
    product_id    UUID        REFERENCES products(id) ON DELETE CASCADE,
    recipe_id     UUID        REFERENCES recipes(id)  ON DELETE CASCADE,
    rating        SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title         VARCHAR(200),
    body          TEXT,
    images        TEXT[],
    is_verified   BOOLEAN     NOT NULL DEFAULT FALSE,
    is_approved   BOOLEAN     NOT NULL DEFAULT FALSE,
    helpful_count INT         NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT reviews_target_check CHECK (
        (product_id IS NOT NULL)::INT +
        (recipe_id  IS NOT NULL)::INT = 1
    )
);
SELECT attach_updated_at('reviews');

CREATE TABLE comments (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    -- NULL when the author's account is deleted (ON DELETE SET NULL)
    user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
    post_id    UUID        REFERENCES posts(id)    ON DELETE CASCADE,
    recipe_id  UUID        REFERENCES recipes(id)  ON DELETE CASCADE,
    product_id UUID        REFERENCES products(id) ON DELETE CASCADE,
    video_id   UUID        REFERENCES videos(id)   ON DELETE CASCADE,
    parent_id  UUID        REFERENCES comments(id) ON DELETE CASCADE,
    body       TEXT        NOT NULL,
    like_count INT         NOT NULL DEFAULT 0,
    is_approved BOOLEAN    NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT comments_target_check CHECK (
        (post_id    IS NOT NULL)::INT +
        (recipe_id  IS NOT NULL)::INT +
        (product_id IS NOT NULL)::INT +
        (video_id   IS NOT NULL)::INT = 1
    )
);
SELECT attach_updated_at('comments');

CREATE TABLE likes (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id    UUID        REFERENCES posts(id)    ON DELETE CASCADE,
    comment_id UUID        REFERENCES comments(id) ON DELETE CASCADE,
    recipe_id  UUID        REFERENCES recipes(id)  ON DELETE CASCADE,
    video_id   UUID        REFERENCES videos(id)   ON DELETE CASCADE,
    product_id UUID        REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT likes_one_target CHECK (
        (post_id    IS NOT NULL)::INT +
        (comment_id IS NOT NULL)::INT +
        (recipe_id  IS NOT NULL)::INT +
        (video_id   IS NOT NULL)::INT +
        (product_id IS NOT NULL)::INT = 1
    )
);

CREATE TABLE hashtags (
    id         SERIAL      PRIMARY KEY,
    tag        CITEXT      NOT NULL UNIQUE,
    use_count  INT         NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hashtag_items (
    id         BIGSERIAL PRIMARY KEY,
    hashtag_id INT       NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
    post_id    UUID      REFERENCES posts(id)    ON DELETE CASCADE,
    recipe_id  UUID      REFERENCES recipes(id)  ON DELETE CASCADE,
    video_id   UUID      REFERENCES videos(id)   ON DELETE CASCADE,
    CONSTRAINT hashtag_items_target_check CHECK (
        (post_id   IS NOT NULL)::INT +
        (recipe_id IS NOT NULL)::INT +
        (video_id  IS NOT NULL)::INT = 1
    )
);
CREATE UNIQUE INDEX uq_hashtag_post   ON hashtag_items (hashtag_id, post_id)   WHERE post_id   IS NOT NULL;
CREATE UNIQUE INDEX uq_hashtag_recipe ON hashtag_items (hashtag_id, recipe_id) WHERE recipe_id IS NOT NULL;
CREATE UNIQUE INDEX uq_hashtag_video  ON hashtag_items (hashtag_id, video_id)  WHERE video_id  IS NOT NULL;

CREATE TABLE events (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id    UUID         NOT NULL REFERENCES users(id),
    category_id     INT          REFERENCES categories(id),
    title           VARCHAR(250) NOT NULL,
    slug            VARCHAR(270) NOT NULL UNIQUE,
    description     TEXT,
    cover_image_url TEXT,
    event_type      VARCHAR(30)  NOT NULL DEFAULT 'physical'
                        CHECK (event_type IN ('physical','virtual','hybrid')),
    venue_name      VARCHAR(200),
    venue_address   JSONB,
    latitude        NUMERIC(9,6),
    longitude       NUMERIC(9,6),
    virtual_link    TEXT,
    starts_at       TIMESTAMPTZ  NOT NULL,
    ends_at         TIMESTAMPTZ  NOT NULL,
    timezone        VARCHAR(60),
    ticket_price    NUMERIC(10,2) NOT NULL DEFAULT 0,
    capacity        INT,
    rsvp_count      INT          NOT NULL DEFAULT 0,
    is_published    BOOLEAN      NOT NULL DEFAULT FALSE,
    is_cancelled    BOOLEAN      NOT NULL DEFAULT FALSE,
    tags            TEXT[],
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT events_dates_check CHECK (ends_at > starts_at)
);
SELECT attach_updated_at('events');

CREATE TABLE followers (
    follower_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

-- =============================================================
--  SECTION 8 — STATIC / SUPPORT CONTENT
-- =============================================================

CREATE TABLE contact_us_submissions (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         REFERENCES users(id),
    name        VARCHAR(200),
    email       CITEXT       NOT NULL,
    subject     VARCHAR(300) NOT NULL,
    message     TEXT         NOT NULL,
    category    VARCHAR(100),
    status      VARCHAR(30)  NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','resolved')),
    resolved_by UUID         REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE faq (
    id         SERIAL       PRIMARY KEY,
    category   VARCHAR(100),
    question   TEXT         NOT NULL,
    answer     TEXT         NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('faq');

CREATE TABLE static_pages (
    id               SERIAL       PRIMARY KEY,
    slug             VARCHAR(150) NOT NULL UNIQUE,
    title            VARCHAR(250) NOT NULL,
    content          TEXT         NOT NULL,
    meta_title       VARCHAR(200),
    meta_description VARCHAR(400),
    is_published     BOOLEAN      NOT NULL DEFAULT TRUE,
    published_at     TIMESTAMPTZ,
    created_by       UUID         REFERENCES users(id),
    updated_by       UUID         REFERENCES users(id),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('static_pages');

-- =============================================================
--  SECTION 9 — ADMINISTRATION & GOVERNANCE
-- =============================================================

CREATE TABLE admin_users (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    admin_level VARCHAR(30) NOT NULL DEFAULT 'moderator'
                    CHECK (admin_level IN ('super_admin','admin','moderator')),
    permissions TEXT[]      NOT NULL DEFAULT '{}',
    created_by  UUID        REFERENCES users(id),
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('admin_users');

CREATE TABLE vendor_applications (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID         NOT NULL REFERENCES users(id),
    business_name  VARCHAR(200) NOT NULL,
    business_type  VARCHAR(100),
    description    TEXT,
    category_ids   INT[],
    documents      JSONB,
    social_links   JSONB,
    status         VARCHAR(30)  NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','approved','rejected')),
    reviewed_by    UUID         REFERENCES admin_users(id),
    reviewed_at    TIMESTAMPTZ,
    rejection_note TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('vendor_applications');

CREATE TABLE content_moderation (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID        REFERENCES admin_users(id),
    entity_type  VARCHAR(50) NOT NULL,
    entity_id    UUID        NOT NULL,
    action       VARCHAR(50) NOT NULL
                     CHECK (action IN ('approve','reject','remove','flag')),
    reason       TEXT,
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reports (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     UUID         NOT NULL REFERENCES users(id),
    entity_type     VARCHAR(50)  NOT NULL,
    entity_id       UUID         NOT NULL,
    reason          VARCHAR(100) NOT NULL,
    details         TEXT,
    status          VARCHAR(30)  NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','in_review','resolved','dismissed')),
    resolved_by     UUID         REFERENCES admin_users(id),
    resolved_at     TIMESTAMPTZ,
    resolution_note TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     UUID         REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   TEXT,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE activity_logs (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     UUID         REFERENCES users(id),
    activity    VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   TEXT,
    metadata    JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(80) NOT NULL,
    title      VARCHAR(250) NOT NULL,
    body       TEXT,
    data       JSONB,
    channel    VARCHAR(30) NOT NULL DEFAULT 'in_app'
                   CHECK (channel IN ('in_app','email','push','sms')),
    is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
    read_at    TIMESTAMPTZ,
    is_sent    BOOLEAN     NOT NULL DEFAULT FALSE,
    sent_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
--  SECTION 10 — MESSAGING
-- =============================================================

CREATE TABLE message_threads (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_type     VARCHAR(30) NOT NULL DEFAULT 'direct'
                        CHECK (thread_type IN ('direct','support','group')),
    title           VARCHAR(200),
    order_id        UUID        REFERENCES orders(id),
    last_message_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE message_thread_participants (
    thread_id    UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id)           ON DELETE CASCADE,
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_read_at TIMESTAMPTZ,
    PRIMARY KEY (thread_id, user_id)
);

CREATE TABLE messages (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id  UUID        NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    sender_id  UUID        NOT NULL REFERENCES users(id),
    body       TEXT,
    media_urls TEXT[],
    is_deleted BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT messages_content_check CHECK (
        body IS NOT NULL OR (media_urls IS NOT NULL AND array_length(media_urls, 1) > 0)
    )
);
SELECT attach_updated_at('messages');

-- =============================================================
--  SECTION 11 — SUBSCRIPTIONS & REFERRALS
-- =============================================================

CREATE TABLE subscriptions (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID        NOT NULL REFERENCES users(id),
    plan_name            VARCHAR(100) NOT NULL,
    status               VARCHAR(30) NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active','cancelled','past_due','trialing')),
    billing_cycle        VARCHAR(20) NOT NULL DEFAULT 'monthly'
                             CHECK (billing_cycle IN ('monthly','annual')),
    amount               NUMERIC(10,2) NOT NULL,
    currency             CHAR(3)     NOT NULL DEFAULT 'CAD',
    gateway              VARCHAR(50),
    gateway_sub_id       VARCHAR(200),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end   TIMESTAMPTZ NOT NULL,
    trial_ends_at        TIMESTAMPTZ,
    cancelled_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT attach_updated_at('subscriptions');

CREATE TABLE referral_codes (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL UNIQUE REFERENCES users(id),
    code         VARCHAR(30) NOT NULL UNIQUE,
    reward_type  VARCHAR(30) NOT NULL DEFAULT 'credit'
                     CHECK (reward_type IN ('credit','discount','free_delivery')),
    reward_value NUMERIC(10,2),
    usage_count  INT         NOT NULL DEFAULT 0,
    max_usage    INT,
    is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
    expires_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE referral_usages (
    id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    code_id          UUID    NOT NULL REFERENCES referral_codes(id),
    referred_user_id UUID    NOT NULL UNIQUE REFERENCES users(id),
    order_id         UUID    REFERENCES orders(id),
    reward_issued    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
--  SECTION 12 — MEDIA
-- =============================================================

CREATE TABLE media_files (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_id   UUID         NOT NULL REFERENCES users(id),
    filename      VARCHAR(300) NOT NULL,
    original_name VARCHAR(300),
    mime_type     VARCHAR(100) NOT NULL,
    size_bytes    BIGINT,
    url           TEXT         NOT NULL,
    cdn_url       TEXT,
    bucket        VARCHAR(100),
    key           TEXT,
    width         INT,
    height        INT,
    duration_sec  INT,
    entity_type   VARCHAR(50),
    entity_id     UUID,
    alt_text      VARCHAR(300),
    is_public     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =============================================================
--  INDEXES
-- =============================================================

CREATE INDEX idx_users_role    ON users(role_id);
CREATE INDEX idx_users_email   ON users(email);
CREATE INDEX idx_users_active  ON users(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_products_vendor   ON products(vendor_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active   ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_fts      ON products
    USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

CREATE INDEX idx_orders_user   ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_placed ON orders(placed_at DESC);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_messages_thread    ON messages(thread_id, created_at DESC);

CREATE INDEX idx_delivery_jobs_status ON delivery_jobs(status);
CREATE INDEX idx_delivery_jobs_vendor ON delivery_jobs(vendor_id);

CREATE INDEX idx_activity_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_entity  ON audit_logs(entity_type, entity_id);

CREATE INDEX idx_comments_post     ON comments(post_id)    WHERE post_id    IS NOT NULL;
CREATE INDEX idx_comments_recipe   ON comments(recipe_id)  WHERE recipe_id  IS NOT NULL;
CREATE INDEX idx_comments_product  ON comments(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_comments_video    ON comments(video_id)   WHERE video_id   IS NOT NULL;

CREATE INDEX idx_media_entity   ON media_files(entity_type, entity_id);
CREATE INDEX idx_media_uploader ON media_files(uploader_id);
CREATE INDEX idx_hashtag_items  ON hashtag_items(hashtag_id);

-- =============================================================
--  SEED — DEFAULT ROLES
-- =============================================================
INSERT INTO roles (name, description) VALUES
    ('customer',    'Regular buyer / community member'),
    ('vendor',      'Product or service seller'),
    ('driver',      'Delivery driver / courier'),
    ('moderator',   'Community moderator'),
    ('admin',       'Platform administrator'),
    ('super_admin', 'Full platform access');

-- =============================================================
--  END OF SCHEMA
-- =============================================================
