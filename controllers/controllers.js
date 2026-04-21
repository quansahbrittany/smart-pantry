const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/config");

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const [existing] = await db.query(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already exists." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, password_hash]
    );

    res.status(201).json({ message: "User created successfully." });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const [rows] = await db.query(
      "SELECT user_id, username, email, password_hash FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: user.user_id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
      id: user.user_id,
      username: user.username,
      email: user.email
}
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const getMe = async (req, res) => {
  res.status(200).json({
    message: "Authenticated user fetched successfully.",
    user: req.user
  });
};

// Create a new shared pantry.
// The auth user becomes the owner and is auto added to pantry_members with role = 'owner'
const createPantry = async (req, res) => {
  try {
    const { pantry_name, description } = req.body;
    const owner_id = req.user.id;

    if (!pantry_name) {
      return res.status(400).json({ message: "Pantry name is required." });
    
    }

    // Insert the new pantry
    const [pantryResult] = await db.query(
      "INSERT INTO pantries (owner_id, pantry_name, description) VALUES (?, ?, ?)",
      [owner_id, pantry_name, description || null]
    );

    const pantry_id = pantryResult.insertId;

    // Add the creator as owner in pantry_members
    await db.query(
      "INSERT INTO pantry_members (pantry_id, user_id, role) VALUES (?, ?, 'owner')",
      [pantry_id, owner_id]
    );

    res.status(201).json({
      message: "Pantry created successfully.",
      pantry: {
        pantry_id, 
        pantry_name, 
        description: description || null, 
        owner_id
      }
    });

  } 
  catch (error) {
    console.error("Create pantry error: ", error);
    res.status(500).json({ message: "Server error." });
  }
};


// Join an existing shared pantry as a member.
// Requires a valid pantry_id; user is added to pantry_members with role = 'member'
const joinPantry = async (req, res) => {
  try {
    const { pantry_id } = req.body;
    const user_id = req.user.id;

    if (!pantry_id) {
      return res.status(400).json({ message: "Pantry ID is required." });
    }

    // Check the pantry actually exists
    const [pantryRows] = await db.query(
      "SELECT pantry_id FROM pantries WHERE pantry_id = ?",
      [pantry_id]
    );

    if (pantryRows.length === 0) {
      return res.status(404).json({ message: "Pantry not found." });
    }

    // Check the user isn't already a member
    const [memberRows] = await db.query(
      "SELECT * FROM pantry_members WHERE pantry_id = ? AND user_id = ?",
      [pantry_id, user_id]
    );

    if (memberRows.length > 0) {
      return res.status(409).json({ message: "You are already a member of this pantry." });
    }

    // Add user as a member
    await db.query(
      "INSERT INTO pantry_members (pantry_id, user_id, role) VALUES (?, ?, 'member')",
      [pantry_id, user_id]
    );

    res.status(200).json({
      message: "Successfully joined pantry.",
      membership: {
        pantry_id,
        user_id,
        role: "member"
      }
    });

  } catch (error) {
    console.error("Join pantry error: ", error);
    res.status(500).json({ message: "Server error." });
  }
};

const getMyPantries = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [rows] = await db.query (
      'SELECT p.pantry_id, p.pantry_name, p.description, p.created_at, pm.role, u.username AS owner_name FROM pantry_members pm JOIN pantries p ON pm.pantry_id = p.pantry_id JOIN users u ON p.owner_id = u.user_id WHERE pm.user_id = ? ORDER BY p.created_at DESC',
      [user_id]
    );

    res.status(200).json({ pantries: rows });
  }
  catch (error) {
    console.error("Get pantries error: ", error);
    res.status(500).json({ message: "Server error." })
  }
}

const addPantryItem = async (req, res) => {
  try {
    const {
      pantry_id,
      item_name,
      category,
      quantity,
      unit,
      expiration_date,
      low_stock_threshold,
      is_vegan,
      is_vegetarian,
      is_gluten_free,
      is_dairy_free,
      is_halal,
      is_kosher,
      contains_milk,
      contains_eggs,
      contains_fish,
      contains_shellfish,
      contains_tree_nuts,
      contains_peanuts,
      contains_wheat,
      contains_soybeans,
      contains_sesame
    } = req.body;

    const added_by = req.user.id;

    if (!pantry_id || !item_name) {
      return res.status(400).json({ message: "Pantry ID and item name are required." });
    }

    const [membershipRows] = await db.query(
      "SELECT membership_id FROM pantry_members WHERE pantry_id = ? AND user_id = ?",
      [pantry_id, added_by]
    );

    if (membershipRows.length === 0) {
      return res.status(403).json({ message: "You do not have access to this pantry." });
    }

    const [result] = await db.query(
      `INSERT INTO pantry_items (
        pantry_id, item_name, category, quantity, unit, expiration_date, low_stock_threshold,
        is_vegan, is_vegetarian, is_gluten_free, is_dairy_free, is_halal, is_kosher,
        contains_milk, contains_eggs, contains_fish, contains_shellfish, contains_tree_nuts,
        contains_peanuts, contains_wheat, contains_soybeans, contains_sesame, added_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pantry_id,
        item_name,
        category || null,
        quantity ?? 1,
        unit || null,
        expiration_date || null,
        low_stock_threshold ?? 1,
        !!is_vegan,
        !!is_vegetarian,
        !!is_gluten_free,
        !!is_dairy_free,
        !!is_halal,
        !!is_kosher,
        !!contains_milk,
        !!contains_eggs,
        !!contains_fish,
        !!contains_shellfish,
        !!contains_tree_nuts,
        !!contains_peanuts,
        !!contains_wheat,
        !!contains_soybeans,
        !!contains_sesame,
        added_by
      ]
    );

    res.status(201).json({
      message: "Pantry item added successfully.",
      item_id: result.insertId
    });
  } catch (error) {
    console.error("Add pantry item error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const getPantryItems = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { pantry_id } = req.params;

    const [membershipRows] = await db.query(
      "SELECT membership_id FROM pantry_members WHERE pantry_id = ? AND user_id = ?",
      [pantry_id, user_id]
    );

    if (membershipRows.length === 0) {
      return res.status(403).json({ message: "You do not have access to this pantry." });
    }

    const [rows] = await db.query(
      `SELECT item_id, pantry_id, item_name, category, quantity, unit, expiration_date,
              low_stock_threshold, is_vegan, is_vegetarian, is_gluten_free, is_dairy_free,
              is_halal, is_kosher, contains_milk, contains_eggs, contains_fish,
              contains_shellfish, contains_tree_nuts, contains_peanuts, contains_wheat,
              contains_soybeans, contains_sesame, added_by, created_at, updated_at
       FROM pantry_items
       WHERE pantry_id = ?
       ORDER BY item_name ASC`,
      [pantry_id]
    );

    res.status(200).json({ items: rows });
  } catch (error) {
    console.error("Get pantry items error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

const searchPantryItems = async (req, res) => {
  try {
    const user_id = req.user.id;

    const {
      pantry_id,
      q,
      category,
      expiringSoon,
      lowStock,
      is_vegan,
      is_vegetarian,
      is_gluten_free,
      is_dairy_free,
      is_halal,
      is_kosher,
      exclude_milk,
      exclude_eggs,
      exclude_fish,
      exclude_shellfish,
      exclude_tree_nuts,
      exclude_peanuts,
      exclude_wheat,
      exclude_soybeans,
      exclude_sesame
    } = req.query;

    if (!pantry_id) {
      return res.status(400).json({ message: "Pantry ID is required." });
    }

    const [membershipRows] = await db.query(
      "SELECT membership_id FROM pantry_members WHERE pantry_id = ? AND user_id = ?",
      [pantry_id, user_id]
    );

    if (membershipRows.length === 0) {
      return res.status(403).json({ message: "You do not have access to this pantry." });
    }

    let sql = `
      SELECT
        item_id,
        pantry_id,
        item_name,
        category,
        quantity,
        unit,
        expiration_date,
        low_stock_threshold,
        is_vegan,
        is_vegetarian,
        is_gluten_free,
        is_dairy_free,
        is_halal,
        is_kosher,
        contains_milk,
        contains_eggs,
        contains_fish,
        contains_shellfish,
        contains_tree_nuts,
        contains_peanuts,
        contains_wheat,
        contains_soybeans,
        contains_sesame,
        added_by,
        created_at,
        updated_at
      FROM pantry_items
      WHERE pantry_id = ?
    `;

    const params = [pantry_id];

    if (q && q.trim() !== "") {
      sql += ` AND item_name LIKE ?`;
      params.push(`%${q.trim()}%`);
    }

    if (category && category.trim() !== "") {
      sql += ` AND category = ?`;
      params.push(category.trim());
    }

    if (expiringSoon === "true") {
      sql += ` AND expiration_date IS NOT NULL
               AND expiration_date >= CURDATE()
               AND expiration_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)`;
    }

    if (lowStock === "true") {
      sql += ` AND quantity <= low_stock_threshold`;
    }

    if (is_vegan === "true") sql += ` AND is_vegan = TRUE`;
    if (is_vegetarian === "true") sql += ` AND is_vegetarian = TRUE`;
    if (is_gluten_free === "true") sql += ` AND is_gluten_free = TRUE`;
    if (is_dairy_free === "true") sql += ` AND is_dairy_free = TRUE`;
    if (is_halal === "true") sql += ` AND is_halal = TRUE`;
    if (is_kosher === "true") sql += ` AND is_kosher = TRUE`;

    if (exclude_milk === "true") sql += ` AND contains_milk = FALSE`;
    if (exclude_eggs === "true") sql += ` AND contains_eggs = FALSE`;
    if (exclude_fish === "true") sql += ` AND contains_fish = FALSE`;
    if (exclude_shellfish === "true") sql += ` AND contains_shellfish = FALSE`;
    if (exclude_tree_nuts === "true") sql += ` AND contains_tree_nuts = FALSE`;
    if (exclude_peanuts === "true") sql += ` AND contains_peanuts = FALSE`;
    if (exclude_wheat === "true") sql += ` AND contains_wheat = FALSE`;
    if (exclude_soybeans === "true") sql += ` AND contains_soybeans = FALSE`;
    if (exclude_sesame === "true") sql += ` AND contains_sesame = FALSE`;

    sql += ` ORDER BY item_name ASC`;

    const [rows] = await db.query(sql, params);

    res.status(200).json({
      message: "Items fetched successfully.",
      count: rows.length,
      items: rows
    });
  } catch (error) {
    console.error("Search pantry items error:", error);
    res.status(500).json({ message: "Server error." });
  }
};


// Update an existing pantry item
const updatePantryItem = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { item_id } = req.params;

    const {
      item_name, category, quantity, unit, expiration_date, low_stock_threshold, 
      is_vegan, is_vegetarian, is_gluten_free, is_dairy_free, is_halal, is_kosher, 
      contains_milk, contains_eggs, contains_fish, contains_shellfish, 
      contains_tree_nuts, contains_peanuts, contains_wheat, contains_soybeans, contains_sesame
    } = req.body;
  

    if (!item_name) {
      return res.status(400).json({ message: "Item name is required." });
    }

    // Verify the item exists and get ts pantry_id
    const [itemRows] = await db.query(
      "SELECT pantry_id FROM pantry_items WHERE item_id = ?",
      [item_id]
    );

    if (itemRows.length === 0 ) {
      return res.status(404).json({ message: "Item not found." });
    }

    // Verify user has access to this pantry
    const [membershipRows] = await db.query(
      "SELECT membership_id FROM pantry_members WHERE pantry_id = ? AND user_id = ?",
      [itemRows[0].pantry_id, user_id]
    );

    if (membershipRows.length === 0) {
      return res.status(403).json({ message: "You do not have access to this pantry." });
    }

    await db.query(
      `UPDATE pantry_items SET
        item_name = ?, category = ?, quantity = ?, unit = ?, expiration_date = ?, low_stock_threshold = ?,
        is_vegan = ?, is_vegetarian = ?, is_gluten_free = ?, is_dairy_free = ?, is_halal = ?, is_kosher = ?,
        contains_milk = ?, contains_eggs = ?, contains_fish = ?, contains_shellfish = ?,
        contains_tree_nuts = ?, contains_peanuts = ?, contains_wheat = ?, contains_soybeans = ?, contains_sesame = ?
      WHERE item_id = ?`,
      [
        item_name, category || null, quantity ?? 1, unit || null,
        expiration_date || null, low_stock_threshold ?? 1,
        !!is_vegan, !!is_vegetarian, !!is_gluten_free, !!is_dairy_free, !!is_halal, !!is_kosher,
        !!contains_milk, !!contains_eggs, !!contains_fish, !!contains_shellfish,
        !!contains_tree_nuts, !!contains_peanuts, !!contains_wheat, !!contains_soybeans, !!contains_sesame,
        item_id
      ]
    );

    res.status(200).json({ message: "Item updated successfully." });
  } catch (error) {
    console.error("Update pantry item error:", error);
    res.status(500).json({ message: "Server error."});
  }
};

// Delete a pantry item
const deletePantryItem = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { item_id } = req.params;

    // Versify the item exists and get its pantry_id
    const [itemRows] = await db.query(
      "SELECT pantry_id FROM pantry_items WHERE item_id = ?",
      [item_id]
    );

    if (itemRows.length === 0) {
      return res.status(404).json({ message: "Item not found." });
    }

    // Verify user has access to this pantry
    const [membershipRows] = await db.query(
      "SELECT membership_id FROM pantry_members WHERE pantry_id = ? AND user_id = ?",
      [itemRows[0].pantry_id, user_id]
    );

    if (membershipRows.length === 0) {
      return res.status(403).json({ message: "You do not have access to this pantry." });
    }

    await db.query("DELETE FROM pantry_items WHERE item_id = ?", [item_id]);

    res.status(200).json({ message: "Item deleted successfully." });
  }catch (error) {
    console.error("Delete pantry item error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  createPantry,
  joinPantry,
  getMyPantries,
  addPantryItem,
  getPantryItems,
  searchPantryItems,
  updatePantryItem, 
  deletePantryItem
};

