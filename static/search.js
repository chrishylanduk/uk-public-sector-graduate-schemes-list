(() => {
  const form = document.querySelector('[data-js="search-form"]');
  const main = document.getElementById("main-content");
  const summary = document.getElementById("results-summary");
  const prefersReducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  if (!form || !main) {
    return;
  }

  const input = form.querySelector(".site-search__input");
  const clearButton = form.querySelector('[data-js="clear-search"]');
  const roleFilter = form.querySelector('[data-js="role-filter"]');
  const roleFilterList = roleFilter
    ? roleFilter.querySelector('[data-js="role-filter-list"]')
    : null;
  const roleFilterClear = roleFilter
    ? roleFilter.querySelector('[data-js="role-filter-clear"]')
    : null;
  const navSummary = document.querySelector('[data-js="nav-summary"]');
  const navSummaryBase =
    navSummary?.dataset?.label?.trim() ||
    (navSummary?.textContent ? navSummary.textContent.trim() : "");
  const navSummaryFiltersSuffix = " (matching your filters)";
  const selectedRoles = new Set();
  const roleLabels = new Map();
  const roleColorCache = new Map();

  if (!input) {
    return;
  }

  if (summary) {
    summary.setAttribute("tabindex", "-1");
  }

  let roleConfig = {};
  const roleOrder = [];
  const roleConfigElement = document.getElementById("role-config");
  if (roleConfigElement) {
    try {
      const parsed = JSON.parse(roleConfigElement.textContent || "{}");
      if (parsed && typeof parsed === "object") {
        roleConfig = parsed;
      }
    } catch (error) {
      console.warn("Unable to parse role configuration", error);
    }
  }

  for (const [slug] of Object.entries(roleConfig)) {
    roleOrder.push(slug);
  }

  function hashString(value) {
    let hash = 0;

    for (let index = 0; index < value.length; index += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(index);
      hash |= 0;
    }

    return Math.abs(hash);
  }

  function normalizeHue(value) {
    if (!Number.isFinite(value)) {
      return null;
    }
    const normalized = value % 360;
    return normalized < 0 ? normalized + 360 : normalized;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function colorsFromHue(hueValue, saturation = 0.65, lightness = 0.35) {
    const hue = normalizeHue(hueValue);
    if (hue === null) {
      return null;
    }

    return buildPaletteFromHsl({
      h: hue,
      s: clamp(saturation, 0, 1),
      l: clamp(lightness, 0, 1),
    });
  }

  function parseHexColor(value) {
    const hex = String(value || "").trim();
    const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
    if (!match) {
      return null;
    }

    let digits = match[1];
    if (digits.length === 3) {
      digits = digits
        .split("")
        .map((char) => char + char)
        .join("");
    }

    const intVal = parseInt(digits, 16);
    const r = (intVal >> 16) & 255;
    const g = (intVal >> 8) & 255;
    const b = intVal & 255;
    return { r, g, b };
  }

  function rgbToHsl({ r, g, b }) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;

    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;

    let hue = 0;
    if (delta !== 0) {
      if (max === rn) {
        hue = ((gn - bn) / delta) % 6;
      } else if (max === gn) {
        hue = (bn - rn) / delta + 2;
      } else {
        hue = (rn - gn) / delta + 4;
      }
      hue *= 60;
      if (hue < 0) {
        hue += 360;
      }
    }

    const lightness = (max + min) / 2;

    let saturation = 0;
    if (delta !== 0) {
      saturation = delta / (1 - Math.abs(2 * lightness - 1));
    }

    return {
      h: hue,
      s: clamp(saturation, 0, 1),
      l: clamp(lightness, 0, 1),
    };
  }

  function formatHsl({ h, s, l }) {
    const hue = Math.round(clamp(h, 0, 360));
    const sat = Math.round(clamp(s, 0, 1) * 100);
    const light = Math.round(clamp(l, 0, 1) * 100);
    return `hsl(${hue}, ${sat}%, ${light}%)`;
  }

  function lightenLightness(l, amount, minimum = 0) {
    const lightened = l + (1 - l) * amount;
    return clamp(Math.max(lightened, minimum), 0, 1);
  }

  function darkenLightness(l, amount, maximum = 1) {
    const darkened = l * (1 - amount);
    return clamp(Math.min(darkened, maximum), 0, 1);
  }

  function buildPaletteFromHsl({ h, s, l }) {
    const baseHue = clamp(h, 0, 360);
    const baseSat = clamp(s, 0, 1);
    const baseLight = clamp(l, 0, 1);

    const soften = (factor, minimum = 0) => clamp(baseSat * factor, minimum, 1);

    const bg = {
      h: baseHue,
      s: soften(0.7, 0.45),
      l: lightenLightness(baseLight, 0.65, 0.7),
    };

    const border = {
      h: baseHue,
      s: soften(0.8, 0.5),
      l: lightenLightness(baseLight, 0.5, 0.6),
    };

    const text = {
      h: baseHue,
      s: soften(0.95, 0.6),
      l: darkenLightness(baseLight, 0.65, 0.16),
    };

    const selectedBg = {
      h: baseHue,
      s: soften(0.8, 0.55),
      l: lightenLightness(baseLight, 0.45, 0.66),
    };

    const selectedBorder = {
      h: baseHue,
      s: soften(0.9, 0.65),
      l: lightenLightness(baseLight, 0.35, 0.56),
    };

    const selectedText = {
      h: baseHue,
      s: soften(1, 0.65),
      l: darkenLightness(baseLight, 0.7, 0.12),
    };

    return {
      bg: formatHsl(bg),
      border: formatHsl(border),
      text: formatHsl(text),
      selectedBg: formatHsl(selectedBg),
      selectedBorder: formatHsl(selectedBorder),
      selectedText: formatHsl(selectedText),
    };
  }

  function colorsFromConfig(slug) {
    const config = roleConfig[slug];
    if (!config) {
      return null;
    }

    if (typeof config.hue === "number") {
      return colorsFromHue(config.hue);
    }

    if (typeof config.color === "string") {
      const rgb = parseHexColor(config.color);
      if (rgb) {
        return buildPaletteFromHsl(rgbToHsl(rgb));
      }
    }

    return null;
  }

  function getRoleColors(slug) {
    if (roleColorCache.has(slug)) {
      return roleColorCache.get(slug);
    }

    let colors = colorsFromConfig(slug);
    if (!colors) {
      const hashHue = hashString(slug) % 360;
      colors = colorsFromHue(hashHue);
    }
    if (!colors) {
      colors = buildPaletteFromHsl({ h: 210, s: 0.6, l: 0.35 });
    }

    roleColorCache.set(slug, colors);
    return colors;
  }

  function applyRoleColors(element, slug) {
    if (!element || !slug) {
      return;
    }

    const colors = getRoleColors(slug);
    element.style.setProperty("--role-pill-bg", colors.bg);
    element.style.setProperty("--role-pill-border", colors.border);
    element.style.setProperty("--role-pill-text", colors.text);
    element.style.setProperty("--role-pill-bg-selected", colors.selectedBg);
    element.style.setProperty(
      "--role-pill-border-selected",
      colors.selectedBorder,
    );
    element.style.setProperty("--role-pill-text-selected", colors.selectedText);
  }

  function ensureRoleDetails(itemElement, roleTags) {
    if (!itemElement || !Array.isArray(roleTags) || roleTags.length === 0) {
      return;
    }

    let details = itemElement.querySelector(".role-tag-details");
    let contentContainer = details
      ? details.querySelector(".role-tag-details__content")
      : null;

    if (!details) {
      details = document.createElement("details");
      details.className = "role-tag-details";

      const summary = document.createElement("summary");
      summary.className = "role-tag-details__summary";
      summary.textContent = "View all role types";
      details.append(summary);

      contentContainer = document.createElement("div");
      contentContainer.className = "role-tag-details__content";
      details.append(contentContainer);

      itemElement.append(details);
    } else if (!contentContainer) {
      contentContainer = document.createElement("div");
      contentContainer.className = "role-tag-details__content";
      details.append(contentContainer);
    } else {
      contentContainer.innerHTML = "";
    }

    const seen = new Set();

    roleTags.forEach((tag) => {
      const slug = (tag.dataset.role || "").trim();

      if (!slug || seen.has(slug)) {
        return;
      }

      seen.add(slug);

      const clone = tag.cloneNode(true);
      clone.classList.add("role-tag--details");
      clone.hidden = false;
      clone.classList.remove("role-tag--filtered-out");
      contentContainer.append(clone);
    });
  }

  function headingDepth(heading) {
    if (!heading || !/^H[1-6]$/.test(heading.tagName)) {
      return null;
    }

    const depth = Number(heading.tagName.slice(1));
    return Number.isNaN(depth) ? null : depth;
  }

  function findHeading(element) {
    let current = element.previousElementSibling;

    while (current) {
      if (/^H[2-4]$/.test(current.tagName)) {
        return current;
      }

      if (/^H[1-6]$/.test(current.tagName)) {
        return null;
      }

      current = current.previousElementSibling;
    }

    const parent = element.parentElement;
    if (!parent || parent === main) {
      return null;
    }

    return findHeading(parent);
  }

  function findAncestorHeading(element, maxDepth) {
    let current = element.previousElementSibling;

    while (current) {
      if (/^H[1-6]$/.test(current.tagName)) {
        const currentDepth = headingDepth(current);
        if (currentDepth !== null && (!maxDepth || currentDepth < maxDepth)) {
          return current;
        }
      }

      current = current.previousElementSibling;
    }

    const parent = element.parentElement;
    if (!parent || parent === main) {
      return null;
    }

    return findAncestorHeading(parent, maxDepth);
  }

  function findParentHeading(heading) {
    const depth = headingDepth(heading);

    if (depth === null || depth <= 2) {
      return null;
    }

    return findAncestorHeading(heading, depth);
  }

  function getNavItemsForHeading(heading) {
    if (!heading || !heading.id) {
      return [];
    }

    const selectorId =
      typeof CSS !== "undefined" && CSS.escape
        ? CSS.escape(heading.id)
        : heading.id;

    return Array.from(
      document.querySelectorAll(`.site-nav a[href="#${selectorId}"]`),
    )
      .map((link) => link.closest("li") || link)
      .filter(Boolean);
  }

  const sections = [];
  const parentGroups = new Map();

  const lists = Array.from(main.querySelectorAll("ul, ol")).filter((list) => {
    if (list.closest(".feedback-callout")) {
      return false;
    }

    if (list.closest('[role="note"]')) {
      return false;
    }

    return Boolean(findHeading(list));
  });

  lists.forEach((list) => {
    const heading = findHeading(list);
    if (!heading) {
      return;
    }

    const items = Array.from(list.querySelectorAll("li")).map((item) => {
      const link = item.querySelector("a");
      const titleText = (link?.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      const roleTags = Array.from(
        item.querySelectorAll(".role-tag:not(.role-tag--details)"),
      );
      const roles = new Set();

      roleTags.forEach((tag) => {
        const slug = (tag.dataset.role || "").trim();
        const originalLabel = (
          tag.dataset.roleLabel ||
          tag.textContent ||
          ""
        ).trim();

        if (!slug) {
          return;
        }

        const configEntry = roleConfig[slug];
        const displayLabel = configEntry?.label || originalLabel;

        if (!displayLabel) {
          return;
        }

        roles.add(slug);
        roleLabels.set(slug, displayLabel);

        if (displayLabel && tag.textContent.trim() !== displayLabel) {
          tag.textContent = displayLabel;
        }
        tag.dataset.roleLabel = displayLabel;

        applyRoleColors(tag, slug);

        tag.hidden = true;
        tag.classList.add("role-tag--filtered-out");
      });

      if (roles.size > 0) {
        item.dataset.roles = Array.from(roles).join(" ");
      }

      if (roleTags.length > 0) {
        ensureRoleDetails(item, roleTags);
      }

      return {
        element: item,
        title: titleText,
        roles,
      };
    });

    if (items.length === 0) {
      return;
    }

    const navItems = getNavItemsForHeading(heading);
    const section = { heading, list, items, navItems };

    const parentHeading = findParentHeading(heading);
    if (parentHeading) {
      section.parentHeading = parentHeading;

      let group = parentGroups.get(parentHeading);
      if (!group) {
        group = {
          heading: parentHeading,
          navItems: getNavItemsForHeading(parentHeading),
          sections: [],
        };
        parentGroups.set(parentHeading, group);
      }

      group.sections.push(section);
    }

    sections.push(section);
  });

  if (sections.length === 0) {
    return;
  }

  renderRoleFilters();

  const totalItems = sections.reduce(
    (count, section) => count + section.items.length,
    0,
  );

  function updateSummary(visibleCount, query) {
    if (!summary) {
      return;
    }

    const trimmedQuery = query.trim();
    const activeRoles = Array.from(selectedRoles)
      .map((slug) => roleLabels.get(slug))
      .filter(Boolean);

    const filters = [];

    if (trimmedQuery) {
      filters.push(`the scheme name contains "${trimmedQuery}"`);
    }

    if (activeRoles.length > 0) {
      const quotedRoles = activeRoles.map((role) => `"${role}"`).join(" or ");
      filters.push(`the available role types include ${quotedRoles}`);
    }

    if (visibleCount === 0) {
      if (filters.length === 0) {
        summary.textContent = "No schemes available.";
        return;
      }

      summary.textContent = `No schemes match ${filters.join(" and ")}.`;
      return;
    }

    if (filters.length === 0) {
      summary.textContent = `Showing all ${totalItems} ${
        totalItems === 1 ? "scheme" : "schemes"
      }.`;
      return;
    }

    summary.textContent = `Showing ${visibleCount} ${
      visibleCount === 1 ? "scheme" : "schemes"
    } where ${filters.join(", and ")}.`;
  }

  function updateNavSummaryLabel(filtersActive) {
    if (!navSummary || !navSummaryBase) {
      return;
    }

    navSummary.textContent = filtersActive
      ? `${navSummaryBase}${navSummaryFiltersSuffix}`
      : navSummaryBase;
  }

  function toggleClearButton(hasQuery) {
    if (!clearButton) {
      return;
    }

    form.classList.toggle("site-search--has-query", hasQuery);

    clearButton.hidden = !hasQuery;
    clearButton.disabled = !hasQuery;

    if (hasQuery) {
      clearButton.removeAttribute("tabindex");
    } else {
      clearButton.setAttribute("tabindex", "-1");
    }
  }

  function toggleRoleClearButton(hasSelection) {
    if (!roleFilterClear) {
      return;
    }

    roleFilterClear.hidden = !hasSelection;
    roleFilterClear.disabled = !hasSelection;

    if (hasSelection) {
      roleFilterClear.removeAttribute("tabindex");
      if (roleFilter) {
        roleFilter.open = true;
      }
    } else {
      roleFilterClear.setAttribute("tabindex", "-1");
    }
  }

  function updateItemRoleTagsVisibility(
    itemElement,
    shouldFilter,
    activeRoles,
  ) {
    if (!itemElement) {
      return;
    }

    const roleTags = itemElement.querySelectorAll(
      ".role-tag[data-role]:not(.role-tag--details)",
    );

    if (roleTags.length === 0) {
      return;
    }

    const activeRoleSet =
      activeRoles instanceof Set ? activeRoles : new Set(activeRoles || []);

    if (!shouldFilter || activeRoleSet.size === 0) {
      roleTags.forEach((tag) => {
        tag.hidden = true;
        tag.classList.add("role-tag--filtered-out");
      });
      return;
    }

    roleTags.forEach((tag) => {
      const slug = (tag.dataset.role || "").trim();
      const isSelected = slug && activeRoleSet.has(slug);

      if (isSelected) {
        tag.hidden = false;
        tag.classList.remove("role-tag--filtered-out");
      } else {
        tag.hidden = true;
        tag.classList.add("role-tag--filtered-out");
      }
    });
  }

  function renderRoleFilters() {
    if (!roleFilter || !roleFilterList) {
      return;
    }

    const available = new Map(roleLabels);
    const configuredOrder = [];
    const seen = new Set();

    roleOrder.forEach((slug) => {
      if (available.has(slug)) {
        configuredOrder.push([slug, available.get(slug)]);
        seen.add(slug);
      }
    });

    const remaining = Array.from(available.entries())
      .filter(([slug]) => !seen.has(slug))
      .sort((a, b) => a[1].localeCompare(b[1], "en", { sensitivity: "base" }));

    const roles = [...configuredOrder, ...remaining];

    if (roles.length === 0) {
      roleFilter.hidden = true;
      roleFilter.removeAttribute("open");
      return;
    }

    roleFilter.hidden = false;
    roleFilterList.innerHTML = "";
    if (selectedRoles.size > 0) {
      roleFilter.open = true;
    }

    const fragment = document.createDocumentFragment();

    roles.forEach(([slug, label]) => {
      const id = `role-filter-${slug}`;

      const wrapper = document.createElement("div");
      wrapper.className = "role-filter__item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "role-filter__checkbox";
      checkbox.id = id;
      checkbox.value = slug;
      checkbox.name = "role-filter";

      const optionLabel = document.createElement("label");
      optionLabel.className = "role-filter__label";
      optionLabel.setAttribute("for", id);

      const pill = document.createElement("span");
      pill.className = "role-tag role-tag--filter";
      pill.textContent = label;
      applyRoleColors(pill, slug);

      optionLabel.append(pill);
      wrapper.append(checkbox, optionLabel);
      fragment.append(wrapper);

      checkbox.checked = selectedRoles.has(slug);

      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          selectedRoles.add(slug);
        } else {
          selectedRoles.delete(slug);
        }

        toggleRoleClearButton(selectedRoles.size > 0);
        applyFilter();

        if (roleFilter && selectedRoles.size > 0) {
          roleFilter.open = true;
        }
      });
    });

    roleFilterList.append(fragment);
    toggleRoleClearButton(selectedRoles.size > 0);
  }

  function applyFilter() {
    const query = input.value;
    const normalizedQuery = query.trim().toLowerCase();
    const selectedRoleList = Array.from(selectedRoles);
    const hasRoleFilter = selectedRoleList.length > 0;
    const filtersActive = hasRoleFilter || normalizedQuery.length > 0;
    let visibleCount = 0;

    sections.forEach((section) => {
      let visibleInSection = 0;

      section.items.forEach((item) => {
        const matchesQuery =
          normalizedQuery.length === 0 || item.title.includes(normalizedQuery);
        const matchesRoles =
          !hasRoleFilter ||
          selectedRoleList.some((role) => item.roles.has(role));
        const matches = matchesQuery && matchesRoles;

        item.element.hidden = !matches;
        updateItemRoleTagsVisibility(
          item.element,
          hasRoleFilter,
          selectedRoles,
        );

        if (matches) {
          visibleInSection += 1;
          visibleCount += 1;
        }
      });

      const shouldHideSection = filtersActive && visibleInSection === 0;

      section.list.hidden = shouldHideSection;

      if (section.heading) {
        section.heading.hidden = shouldHideSection;
      }

      section.visibleInSection = visibleInSection;

      if (section.navItems && section.navItems.length > 0) {
        section.navItems.forEach((navItem) => {
          navItem.hidden = shouldHideSection;
        });
      }
    });

    parentGroups.forEach((group) => {
      const anyVisible = group.sections.some(
        (section) => (section.visibleInSection || 0) > 0,
      );
      const shouldHideParent = filtersActive && !anyVisible;

      if (group.heading) {
        group.heading.hidden = shouldHideParent;
      }

      if (group.navItems && group.navItems.length > 0) {
        group.navItems.forEach((navItem) => {
          navItem.hidden = shouldHideParent;
        });
      }
    });

    updateSummary(visibleCount, query);
    updateNavSummaryLabel(filtersActive);
    toggleClearButton(normalizedQuery.length > 0);
    toggleRoleClearButton(selectedRoles.size > 0);
  }

  applyFilter();

  input.addEventListener("input", applyFilter);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (summary) {
      summary.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
      summary.focus();
    }
  });

  if (roleFilterClear && roleFilterList) {
    roleFilterClear.addEventListener("click", () => {
      selectedRoles.clear();

      roleFilterList
        .querySelectorAll(".role-filter__checkbox")
        .forEach((checkbox) => {
          checkbox.checked = false;
        });

      toggleRoleClearButton(false);
      applyFilter();

      const firstCheckbox = roleFilterList.querySelector(
        ".role-filter__checkbox",
      );

      if (firstCheckbox) {
        firstCheckbox.focus();
      } else if (summary) {
        summary.focus();
      }
    });
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      input.value = "";
      applyFilter();
      input.focus();
    });

    toggleClearButton(input.value.trim().length > 0);
  }
})();
