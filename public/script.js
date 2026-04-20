async function addItem() {
    const token = localStorage.getItem("token");

    const pantry_id = document.getElementById("itemPantryId").value.trim();
    const item_name = document.getElementById("itemName").value.trim();
    const quantity  = document.getElementById("quantity").value;
    const date      = document.getElementById("expiryDate").value;
    const dietary   = document.getElementById("dietary").value;

    if (!pantry_id || !item_name || !quantity) {
        alert("Pantry ID, item name, and quantity are required.");
        return;
    }

    // Map the dietary dropdown value to the boolean flags the backend expects
    const body = {
        pantry_id: parseInt(pantry_id),
        item_name,
        quantity: parseFloat(quantity),
        expiration_date: date || null,
        is_vegan:       dietary === "vegan",
        is_gluten_free: dietary === "gluten-free",
        is_dairy_free:  dietary === "dairy-free"
    };

    try {
        const res = await fetch("/api/auth/pantries/items", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Could not add item.");
            return;
        }

        // Build the list item in the UI
        const li = document.createElement("li");

        const today = new Date();
        const expDate = date ? new Date(date) : null;
        if (expDate) {
            const diffDays = (expDate - today) / (1000 * 60 * 60 * 24);
            if (diffDays < 3) li.classList.add("expiring");
        }
        if (parseFloat(quantity) <= 1) li.classList.add("low-stock");

        li.innerHTML = `
            <span>${item_name} (${parseFloat(quantity)}) - ${date || "No expiry"}</span>
            <div>
                ${dietary ? `<span class="tag">${dietary}</span>` : ""}
                <button onclick="this.parentElement.parentElement.remove()">X</button>
            </div>
        `;
        document.getElementById("itemList").appendChild(li);

        // Clear inputs
        document.getElementById("itemPantryId").value = "";
        document.getElementById("itemName").value = "";
        document.getElementById("quantity").value = "";
        document.getElementById("expiryDate").value = "";
        document.getElementById("dietary").value = "";

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