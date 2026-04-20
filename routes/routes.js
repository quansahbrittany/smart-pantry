const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  createPantry,
  joinPantry,
  getMyPantries,
  addPantryItem,
  getPantryItems,
  searchPantryItems
} = require("../controllers/controllers");
const authenticateToken = require("../middleware/middleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticateToken, getMe);
router.post("/pantries", authenticateToken, createPantry);
router.post("/pantries/join", authenticateToken, joinPantry);
router.get("/pantries", authenticateToken, getMyPantries);

// Add item to pantry
router.post("/pantries/items", authenticateToken, addPantryItem);

// Search & filter items
router.get("/pantries/items/search", authenticateToken, searchPantryItems)

// Get all items in a pantry
router.get("/pantries/:pantry_id/items", authenticateToken, getPantryItems);

module.exports = router;