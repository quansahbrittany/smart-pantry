
async function addItem() {
    const token = localStorage.getItem("token");

    const pantryIdE1 = document.getElementById("itemPantryId");
    const editingId = pantryIdE1.dataset.editingId;

    const pantry_id = pantryIdE1.value.trim();
    const item_name = document.getElementById("itemName").value.trim();
    const quantity = document.getElementById("quantity").value;
    const date = document.getElementById("expiryDate").value;

    if (!pantry_id || !item_name || !quantity) {
        alert("Pantry ID, item name, and quantity are required.");
        return;
    }

    const body = {
        pantry_id: parseInt(pantry_id),
        item_name,
        quantity: parseFloat(quantity),
        expiration_date: date || null, 
        is_vegan:       document.getElementById("tagVegan").checked,
        is_vegetarian:  document.getElementById("tagVegetarian").checked,
        is_gluten_free: document.getElementById("tagGlutenFree").checked,
        is_dairy_free:  document.getElementById("tagDairyFree").checked,
        is_halal:       document.getElementById("tagHalal").checked,
        is_kosher:      document.getElementById("tagKosher").checked,
        contains_milk:      document.getElementById("containsMilk").checked,
        contains_eggs:      document.getElementById("containsEggs").checked,
        contains_fish:      document.getElementById("containsFish").checked,
        contains_shellfish: document.getElementById("containsShellfish").checked,
        contains_tree_nuts: document.getElementById("containsTreeNuts").checked,
        contains_peanuts:   document.getElementById("containsPeanuts").checked,
        contains_wheat:     document.getElementById("containsWheat").checked,
        contains_soybeans:  document.getElementById("containsSoybeans").checked,
        contains_sesame:    document.getElementById("containsSesame").checked
    };

    try {
        let res;
        if (editingId) {
            res = await fetch(`/api/auth/pantries/items/${editingId}` , {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
        } else {
            res = await fetch("/api/auth/pantries/items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
        }

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Could not save item.");
            return;
        }

        // Clear form and reset edit state
        const savedPantryId = pantry_id;
        document.getElementById("itemPantryId").value = "";
        document.getElementById("itemName").value = "";
        document.getElementById("quantity").value = "";
        document.getElementById("expiryDate").value = "";
        // Clear all tag checkboxes
        document.querySelectorAll("#appSection .card:nth-child(4) input[type=checkbox]")
            .forEach(cb => cb.checked = false);
        delete pantryIdE1.dataset.editingId;

        const btn = document.querySelector("#appSection .card:nth-child(4) button");
        btn.textContent = "Add Item";

        // Reload items from the database
        loadPantryItems(savedPantryId);

    } catch (err) {
        alert("Server error. Try again.");
    }

}

async function searchItems() {
    const token = localStorage.getItem("token");
    const statusEl = document.getElementById("searchStatus");
    const resultsEl = document.getElementById("searchResults");

    resultsEl.innerHTML = "";
    statusEl.textContent = "Searching...";

    const pantryId = document.getElementById("searchPantryId").value.trim();
    if (!pantryId) {
        statusEl.textContent = "Please enter a pantry ID.";
        return;
    }

    const params = new URLSearchParams();
    params.append("pantry_id", pantryId);

    const q = document.getElementById("searchQuery").value.trim();
    if (q) params.append("q", q);

    const category = document.getElementById("searchCategory").value.trim();
    if (category) params.append("category", category);

    if (document.getElementById("searchExpiringSoon").checked) params.append("expiringSoon", "true");
    if (document.getElementById("searchLowStock").checked) params.append("lowStock", "true");

    if (document.getElementById("filterVegan").checked) params.append("is_vegan", "true");
    if (document.getElementById("filterVegetarian").checked) params.append("is_vegetarian", "true");
    if (document.getElementById("filterGlutenFree").checked) params.append("is_gluten_free", "true");
    if (document.getElementById("filterDairyFree").checked) params.append("is_dairy_free", "true");
    if (document.getElementById("filterHalal").checked) params.append("is_halal", "true");
    if (document.getElementById("filterKosher").checked) params.append("is_kosher", "true");

    if (document.getElementById("excludeMilk").checked) params.append("exclude_milk", "true");
    if (document.getElementById("excludeEggs").checked) params.append("exclude_eggs", "true");
    if (document.getElementById("excludeFish").checked) params.append("exclude_fish", "true");
    if (document.getElementById("excludeShellfish").checked) params.append("exclude_shellfish", "true");
    if (document.getElementById("excludeTreeNuts").checked) params.append("exclude_tree_nuts", "true");
    if (document.getElementById("excludePeanuts").checked) params.append("exclude_peanuts", "true");
    if (document.getElementById("excludeWheat").checked) params.append("exclude_wheat", "true");
    if (document.getElementById("excludeSoybeans").checked) params.append("exclude_soybeans", "true");
    if (document.getElementById("excludeSesame").checked) params.append("exclude_sesame", "true");

    try {
        const res = await fetch(`/api/auth/pantries/items/search?${params.toString()}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) {
            statusEl.textContent = data.message || "Search failed.";
            return;
        }

        if (data.items.length === 0) {
            statusEl.textContent = "No items matched your search.";
            return;
        }

        statusEl.textContent = `Found ${data.count} item(s).`;

        data.items.forEach(item => {
            const li = document.createElement("li");
            const tags = [];
            if (item.is_vegan) tags.push("vegan");
            if (item.is_vegetarian) tags.push("vegetarian");
            if (item.is_gluten_free) tags.push("gluten-free");
            if (item.is_dairy_free) tags.push("dairy-free");
            if (item.is_halal) tags.push("halal");
            if (item.is_kosher) tags.push("kosher");

            li.innerHTML = `
                <span>
                    <strong>${item.item_name}</strong>
                    ${item.category ? ` [${item.category}]` : ""}
                    — ${parseFloat(item.quantity)}
                    ${item.expiration_date ? ` · expires ${item.expiration_date.split("T")[0]}` : ""}
                </span>
                <div>
                    ${tags.map(t => `<span class="tag">${t}</span>`).join(" ")}
                </div>
            `;
            resultsEl.appendChild(li);
        });
    } catch (err) {
        statusEl.textContent = "Network error. Try again.";
    }
}

function clearSearch() {
    document.getElementById("searchPantryId").value = "";
    document.getElementById("searchQuery").value = "";
    document.getElementById("searchCategory").value = "";

    document.querySelectorAll("#appSection .card input[type=checkbox]").forEach(cb => cb.checked = false);

    document.getElementById("searchResults").innerHTML = "";
    document.getElementById("searchStatus").textContent = "No search performed yet.";
}

// Load and display items for a pantry
async function loadPantryItems(pantryId) {
    const token  = localStorage.getItem("token");
    const listEl = document.getElementById("itemList");
    listEl.innerHTML = "";

    try {
        const res = await fetch(`/api/auth/pantries/${pantryId}/items`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) return;

        if (data.items.length === 0) {
            listEl.innerHTML = "<li>No items in this pantry yet.</li>";
            return;
        }

        data.items.forEach(item => {
            const li = document.createElement("li");

            const tags = [];
            if (item.is_vegan) tags.push("vegan");
            if (item.is_vegetarian) tags.push("vegetarian");
            if (item.is_gluten_free) tags.push("gluten-free");
            if (item.is_dairy_free) tags.push("dairy-free");
            if (item.is_halal) tags.push("halal");
            if (item.is_kosher) tags.push("kosher");

            li.innerHTML = `
                <span>
                    <strong>${item.item_name}</strong> (${parseFloat(item.quantity)})
                    — ${item.expiration_date ? item.expiration_date.split("T")[0] : "No expiry"}
                </span>
                <div>
                    ${tags.map(t => `<span class="tag">${t}</span>`).join(" ")}
                    <button onclick='editItem(${JSON.stringify(item)})'>✏️</button>
                    <button onclick='deleteItem(${item.item_id}, this.closest("li"))'>🗑️</button>
                </div>
            `;
            listEl.appendChild(li);
        });
    } catch {
        console.error("Error loading items.");
    }
}

// Edit: populate the form with existing item values
function editItem(item) {
    document.getElementById("itemPantryId").value = item.pantry_id;
    document.getElementById("itemName").value = item.item_name;
    document.getElementById("quantity").value  = item.quantity;
    document.getElementById("expiryDate").value = item.expiration_date
        ? item.expiration_date.split("T")[0] : "";

    // Set dietary checkboxes
    document.getElementById("tagVegan").checked = !!item.is_vegan;
    document.getElementById("tagVegetarian").checked  = !!item.is_vegetarian;
    document.getElementById("tagGlutenFree").checked = !!item.is_gluten_free;
    document.getElementById("tagDairyFree").checked = !!item.is_dairy_free;
    document.getElementById("tagHalal").checked = !!item.is_halal;
    document.getElementById("tagKosher").checked  = !!item.is_kosher;

    // Set allergen checkboxes
    document.getElementById("containsMilk").checked = !!item.contains_milk;
    document.getElementById("containsEggs").checked = !!item.contains_eggs;
    document.getElementById("containsFish").checked = !!item.contains_fish;
    document.getElementById("containsShellfish").checked = !!item.contains_shellfish;
    document.getElementById("containsTreeNuts").checked = !!item.contains_tree_nuts;
    document.getElementById("containsPeanuts").checked = !!item.contains_peanuts;
    document.getElementById("containsWheat").checked = !!item.contains_wheat;
    document.getElementById("containsSoybeans").checked = !!item.contains_soybeans;
    document.getElementById("containsSesame").checked = !!item.contains_sesame;

    document.getElementById("itemPantryId").dataset.editingId = item.item_id;

    const btn = document.querySelector("#appSection .card:nth-child(4) button");
    btn.textContent = "Update Item";

    document.getElementById("itemName").scrollIntoView({ behavior: "smooth" });
}

// Delete an item from the database
async function deleteItem(itemId, liElement) {
    const token = localStorage.getItem("token");

    if (!confirm("Delete this item?")) return;

    try {
        const res = await fetch(`/api/auth/pantries/items/${itemId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Could not delete item.");
            return;
        }

        liElement.remove();
    } catch {
        alert("Server error. Try again.");
    }
}