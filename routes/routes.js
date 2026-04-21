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
  searchPantryItems, 
  updatePantryItem, 
  deletePantryItem,
  deletePantry,
  getProfile,
  updateProfile
} = require("../controllers/controllers");
const authenticateToken = require("../middleware/middleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticateToken, getMe);
router.post("/pantries", authenticateToken, createPantry);
router.post("/pantries/join", authenticateToken, joinPantry);
router.get("/pantries", authenticateToken, getMyPantries);
router.post("/pantries/items", authenticateToken, addPantryItem);
router.get("/pantries/items/search", authenticateToken, searchPantryItems);
router.get("/pantries/:pantry_id/items", authenticateToken, getPantryItems);
router.put("/pantries/items/:item_id", authenticateToken, updatePantryItem);
router.delete("/pantries/items/:item_id", authenticateToken, deletePantryItem);
router.delete("/pantries/:pantry_id", authenticateToken, deletePantry);
router.get("/profile", authenticateToken, getProfile);
router.put("/profile", authenticateToken, updateProfile);


module.exports = router;