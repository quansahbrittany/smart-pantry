-- Smart Pantry - MySQL Database Schema --
-- CS 370 Group 4: Zac Chittum, Ethan Beverly, Kelly Fitzgerald, Brittany Quansah, Christian Rauch --

-- Drop Tables --
DROP TABLE IF EXISTS pantry_members;
DROP TABLE IF EXISTS pantry_items;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS pantries;
DROP TABLE IF EXISTS users;

-- Users Table --
-- Stores login credentials for each account.
-- Supports FR1 (account creation) and FR12 (account deletion).
CREATE TABLE users (
    user_id      INT          NOT NULL AUTO_INCREMENT,
    username     VARCHAR(50)  NOT NULL UNIQUE,
    email        VARCHAR(100) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,         -- store bcrypt hash, never plaintext (NFR2)
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,

    PRIMARY KEY (user_id)
);

-- User Profiles Table --
-- One-to-one extension of users for allergy and dietary data.
-- Supports FR2 (add allergies/restrictions) and FR11 (update profile).
-- Boolean flags make it easy to query and tag pantry items later (FR6).
CREATE TABLE user_profiles (
    profile_id        INT          NOT NULL AUTO_INCREMENT,
    user_id           INT          NOT NULL UNIQUE,             -- 1-to-1 with users
    first_name        VARCHAR(50),
    last_name         VARCHAR(50),

    -- Dietary restrictions
    is_vegan          BOOLEAN      NOT NULL DEFAULT FALSE,
    is_vegetarian     BOOLEAN      NOT NULL DEFAULT FALSE,
    is_gluten_free    BOOLEAN      NOT NULL DEFAULT FALSE,
    is_dairy_free     BOOLEAN      NOT NULL DEFAULT FALSE,
    is_halal          BOOLEAN      NOT NULL DEFAULT FALSE,
    is_kosher         BOOLEAN      NOT NULL DEFAULT FALSE,

    -- Common allergen flags (FDA Big 9)
    allergy_milk      BOOLEAN      NOT NULL DEFAULT FALSE,
    allergy_eggs      BOOLEAN      NOT NULL DEFAULT FALSE,
    allergy_fish      BOOLEAN      NOT NULL DEFAULT FALSE,
    allergy_shellfish BOOLEAN      NOT NULL DEFAULT FALSE,
    allergy_tree_nuts BOOLEAN      NOT NULL DEFAULT FALSE,
    allergy_peanuts   BOOLEAN      NOT NULL DEFAULT FALSE,
    allergy_wheat     BOOLEAN      NOT NULL DEFAULT FALSE,
    allergy_soybeans  BOOLEAN      NOT NULL DEFAULT FALSE,
    allergy_sesame    BOOLEAN      NOT NULL DEFAULT FALSE,

    -- Free-text field for anything not covered above
    other_notes       TEXT,

    updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                            ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (profile_id),
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE CASCADE
);

-- Pantries Table --
-- Represents a shared digital pantry (household, dorm room, etc.).
CREATE TABLE pantries (
    pantry_id    INT          NOT NULL AUTO_INCREMENT,
    
    owner_id     INT          NOT NULL,                         -- user who created this pantry
    pantry_name  VARCHAR(100) NOT NULL,
    description  VARCHAR(255),
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (pantry_id),
    CONSTRAINT fk_pantry_owner FOREIGN KEY (owner_id)
        REFERENCES users (user_id) ON DELETE CASCADE
);

-- Pantry Members Table --
-- Junction table: which users belong to which pantries.
CREATE TABLE pantry_members (
    membership_id INT       NOT NULL AUTO_INCREMENT,
    pantry_id     INT       NOT NULL,
    user_id       INT       NOT NULL,
    role          ENUM('owner', 'member') NOT NULL DEFAULT 'member',
    joined_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (membership_id),
    UNIQUE KEY uq_pantry_user (pantry_id, user_id),       -- no duplicate memberships
    CONSTRAINT fk_member_pantry FOREIGN KEY (pantry_id)
        REFERENCES pantries (pantry_id) ON DELETE CASCADE,
    CONSTRAINT fk_member_user FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE CASCADE
);

-- Pantry Items Table --
-- Food items inside a pantry.
CREATE TABLE pantry_items (
    item_id          INT           NOT NULL AUTO_INCREMENT,
    pantry_id        INT           NOT NULL,
    item_name        VARCHAR(100)  NOT NULL,
    quantity         DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit             VARCHAR(30),                    -- e.g. 'lbs', 'oz', 'count'
    expiration_date  DATE,                           -- NULL if not tracked
    low_stock_threshold DECIMAL(10,2) DEFAULT 1,     -- triggers FR7 alert when quantity <= this
    category VARCHAR(50), 
    amount DECIMAL(10,2) NOT NULL DEFAULT 1,

    -- Dietary restriction tags
    is_vegan          BOOLEAN NOT NULL DEFAULT FALSE,
    is_vegetarian     BOOLEAN NOT NULL DEFAULT FALSE,
    is_gluten_free    BOOLEAN NOT NULL DEFAULT FALSE,
    is_dairy_free     BOOLEAN NOT NULL DEFAULT FALSE,
    is_halal          BOOLEAN NOT NULL DEFAULT FALSE,
    is_kosher         BOOLEAN NOT NULL DEFAULT FALSE,

    -- Allergen tags
    contains_milk      BOOLEAN NOT NULL DEFAULT FALSE,
    contains_eggs      BOOLEAN NOT NULL DEFAULT FALSE,
    contains_fish      BOOLEAN NOT NULL DEFAULT FALSE,
    contains_shellfish BOOLEAN NOT NULL DEFAULT FALSE,
    contains_tree_nuts BOOLEAN NOT NULL DEFAULT FALSE,
    contains_peanuts   BOOLEAN NOT NULL DEFAULT FALSE,
    contains_wheat     BOOLEAN NOT NULL DEFAULT FALSE,
    contains_soybeans  BOOLEAN NOT NULL DEFAULT FALSE,
    contains_sesame    BOOLEAN NOT NULL DEFAULT FALSE,

    added_by         INT,        -- user_id of who added the item
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                         ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (item_id),
    CONSTRAINT fk_item_pantry FOREIGN KEY (pantry_id)
        REFERENCES pantries (pantry_id) ON DELETE CASCADE,
    CONSTRAINT fk_item_added_by FOREIGN KEY (added_by)
        REFERENCES users (user_id) ON DELETE SET NULL
);

-- Indexes --
-- Speeds up common queries
CREATE INDEX idx_pantry_items_pantry    ON pantry_items (pantry_id);
CREATE INDEX idx_pantry_items_expiry    ON pantry_items (expiration_date);
CREATE INDEX idx_pantry_members_user    ON pantry_members (user_id);

-- Add index for faster search
CREATE INDEX idx_pantry_items_name ON pantry_items (item_name);