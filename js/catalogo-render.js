(() => {
  const catalog = window.AR_PRODUCT_CATALOG || {};
  const containers = document.querySelectorAll("[data-product-catalog]");
  const doorCategoryOrder = ["INC", "OPERA", "GEO", "NEW", "DOOR", "NEXT", "YNCA", "TAO", "OIKOS"];
  const doorCategoryInfo = {
    INC: {
      title: "INC",
      description: "Linea per interni coordinati, con modelli numerati e varianti pensate per ambienti moderni.",
      specs: ["Battente, scorrevole e filo muro", "Finiture da catalogo", "Soluzioni coordinate"]
    },
    OPERA: {
      title: "OPERA",
      description: "Linea elegante per ambienti classici o contemporanei, predisposta per varianti telaio e pannello.",
      specs: ["Pannelli pieni o incisi", "Stile sobrio ed elegante", "Finiture personalizzabili"]
    },
    GEO: {
      title: "GEO",
      description: "Linea caratterizzata da geometrie, incisioni e finiture pulite per interni moderni.",
      specs: ["Disegni geometrici", "Soluzioni moderne", "Varianti con dettagli decorativi"]
    },
    NEW: {
      title: "NEW",
      description: "Linea versatile per progetti residenziali, predisposta per dimensioni, telai e finiture diverse.",
      specs: ["Modelli contemporanei", "Campi tecnici modificabili", "Abbinamenti da catalogo"]
    },
    DOOR: {
      title: "DOOR",
      description: "Linea essenziale e tecnica, pensata come base ordinata per schede prodotto dedicate.",
      specs: ["Uso interno residenziale", "Varianti numerate", "Schede tecniche predisposte"]
    },
    NEXT: {
      title: "NEXT",
      description: "Linea dal taglio contemporaneo, adatta a modelli minimal e soluzioni filo muro.",
      specs: ["Design minimal", "Soluzioni tecniche", "Dettagli moderni"]
    },
    YNCA: {
      title: "YNCA",
      description: "Linea con finiture distintive e combinazioni decorative da valorizzare con foto e dettagli reali.",
      specs: ["Finiture calde e materiche", "Varianti scorrevoli", "Modelli decorativi"]
    },
    TAO: {
      title: "TAO",
      description: "Linea essenziale e bilanciata, con varianti di superficie e aperture per ambienti raffinati.",
      specs: ["Design equilibrato", "Superfici lisce o materiche", "Varianti numerate"]
    },
    OIKOS: {
      title: "OIKOS",
      description: "Linea predisposta per ambienti abitativi di fascia alta, con finiture e accessori dedicati.",
      specs: ["Residenziale premium", "Pannelli coordinati", "Accessori da definire"]
    }
  };

  const normalize = (value) => String(value || "").toLowerCase().replace(/_/g, " ");

  const createModelCard = (item, prefix) => {
    const card = document.createElement("article");
    card.className = "model-card reveal is-visible";
    card.dataset.category = item.category;
    card.innerHTML = `
      <button class="model-card-button" type="button" aria-label="Apri scheda ${item.title}">
        <img src="${prefix}${item.image}" alt="${item.title}">
        <span class="model-category">${item.category.replace(/_/g, " ")}</span>
        <strong>${item.title}</strong>
        <small>${item.type}</small>
      </button>
    `;
    card.querySelector("button").addEventListener("click", () => openProductModal(item, prefix));
    return card;
  };

  const createCategoryPanel = (category, items, prefix, index) => {
    const info = doorCategoryInfo[category] || {
      title: category.replace(/_/g, " "),
      description: "Linea prodotto predisposta per sottomodelli, foto catalogo e specifiche tecniche.",
      specs: ["Foto reale catalogo", "Sottomodelli numerati", "Specifiche da completare"]
    };
    const panel = document.createElement("article");
    panel.className = "door-category-panel reveal is-visible";
    panel.innerHTML = `
      <button class="door-category-button" type="button" aria-label="Apri sottomodelli ${info.title}">
        <img src="${prefix}${items[0].image}" alt="Linea ${info.title}">
        <div class="door-category-content">
          <p class="door-line-code">Linea ${String(index + 1).padStart(2, "0")}</p>
          <h3>${info.title}</h3>
          <p>${info.description}</p>
          <dl class="spec-list">
            ${info.specs.map((spec, specIndex) => `<div><dt>${specIndex === 0 ? "Tipologia" : specIndex === 1 ? "Finiture" : "Note"}</dt><dd>${spec}</dd></div>`).join("")}
          </dl>
          <span class="open-models-label">${items.length} sottomodelli disponibili</span>
        </div>
      </button>
    `;
    panel.querySelector("button").addEventListener("click", () => openCategoryModal(category, items, prefix, info));
    return panel;
  };

  const createFilters = (items, container, grid, beforeNode) => {
    const categories = [...new Set(items.map((item) => item.category))].sort();
    const filters = document.createElement("div");
    filters.className = "catalog-filters";
    filters.innerHTML = `<button class="filter-btn is-active" type="button" data-filter="all">Tutti</button>`;

    categories.forEach((category) => {
      const button = document.createElement("button");
      button.className = "filter-btn";
      button.type = "button";
      button.dataset.filter = category;
      button.textContent = category.replace(/_/g, " ");
      filters.appendChild(button);
    });

    filters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-filter]");
      if (!button) return;
      filters.querySelectorAll(".filter-btn").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      const filter = button.dataset.filter;
      grid.querySelectorAll(".model-card").forEach((card) => {
        card.classList.toggle("is-hidden", filter !== "all" && card.dataset.category !== filter);
      });
    });

    if (beforeNode && beforeNode.parentNode === container) {
      container.insertBefore(filters, beforeNode);
    } else {
      container.appendChild(filters);
    }
  };

  const openProductModal = (item, prefix) => {
    let modal = document.querySelector("[data-product-modal]");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "product-modal";
      modal.dataset.productModal = "";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="product-modal-backdrop" data-close-modal></div>
      <section class="product-modal-panel" role="dialog" aria-modal="true" aria-label="${item.title}">
        <button class="product-modal-close" type="button" data-close-modal aria-label="Chiudi">×</button>
        <img src="${prefix}${item.image}" alt="${item.title}">
        <div class="product-modal-content">
          <p class="eyebrow">${item.category.replace(/_/g, " ")}</p>
          <h2>${item.title}</h2>
          <p>${item.type}. Scheda predisposta per specifiche reali, misure, finiture, apertura, telaio, vetri e accessori.</p>
          <ul>${(item.specs || []).map((spec) => `<li>${spec}</li>`).join("")}</ul>
          <a class="btn btn-accent" href="../preventivo.html">Richiedi preventivo per ${item.model}</a>
        </div>
      </section>
    `;

    modal.classList.add("is-open");
    document.body.classList.add("modal-open");
    modal.querySelectorAll("[data-close-modal]").forEach((button) => {
      button.addEventListener("click", closeProductModal);
    });
  };

  const openCategoryModal = (category, items, prefix, info) => {
    let modal = document.querySelector("[data-product-modal]");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "product-modal";
      modal.dataset.productModal = "";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="product-modal-backdrop" data-close-modal></div>
      <section class="product-modal-panel category-modal-panel" role="dialog" aria-modal="true" aria-label="Sottomodelli ${info.title}">
        <button class="product-modal-close" type="button" data-close-modal aria-label="Chiudi">×</button>
        <div class="category-modal-head">
          <p class="eyebrow">Linea ${category.replace(/_/g, " ")}</p>
          <h2>${info.title}</h2>
          <p>${info.description}</p>
        </div>
        <div class="category-model-grid"></div>
      </section>
    `;

    const grid = modal.querySelector(".category-model-grid");
    items.forEach((item) => grid.appendChild(createModelCard(item, prefix)));

    modal.classList.add("is-open");
    document.body.classList.add("modal-open");
    modal.querySelectorAll("[data-close-modal]").forEach((button) => {
      button.addEventListener("click", closeProductModal);
    });
  };

  const closeProductModal = () => {
    const modal = document.querySelector("[data-product-modal]");
    if (modal) modal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
  };

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProductModal();
  });

  containers.forEach((container) => {
    const key = container.dataset.productCatalog;
    const mode = container.dataset.catalogMode;
    const items = catalog[key] || [];
    const prefix = container.dataset.assetPrefix || "";
    const searchInput = container.querySelector("[data-catalog-search]");
    const mount = container.querySelector("[data-catalog-grid]") || container;
    const grid = document.createElement("div");
    grid.className = "model-grid";

    if (mode === "categories") {
      grid.className = "door-category-grid";
      const grouped = [...new Set(items.map((item) => item.category))].sort((a, b) => {
        const aIndex = doorCategoryOrder.indexOf(a);
        const bIndex = doorCategoryOrder.indexOf(b);
        if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
      grouped.forEach((category, index) => {
        const categoryItems = items.filter((item) => item.category === category);
        grid.appendChild(createCategoryPanel(category, categoryItems, prefix, index));
      });
    } else {
      createFilters(items, container, grid, mount);
      items.forEach((item) => grid.appendChild(createModelCard(item, prefix)));
    }
    mount.appendChild(grid);

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const query = normalize(searchInput.value);
        grid.querySelectorAll(".model-card").forEach((card) => {
          const text = normalize(card.textContent);
          card.classList.toggle("is-search-hidden", query && !text.includes(query));
        });
      });
    }
  });
})();
