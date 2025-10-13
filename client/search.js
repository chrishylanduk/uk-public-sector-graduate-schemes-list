(() => {
  class RoleColorManager {
    constructor(roleConfig) {
      this.roleConfig = roleConfig || {};
      this.cache = new Map();
    }

    hashString(value) {
      let hash = 0;
      const text = String(value || "");

      for (let index = 0; index < text.length; index += 1) {
        hash = (hash << 5) - hash + text.charCodeAt(index);
        hash |= 0;
      }

      return Math.abs(hash);
    }

    normalizeHue(value) {
      if (!Number.isFinite(value)) {
        return null;
      }
      const normalized = value % 360;
      return normalized < 0 ? normalized + 360 : normalized;
    }

    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    formatHsl({ h, s, l }) {
      const hue = Math.round(this.clamp(h, 0, 360));
      const sat = Math.round(this.clamp(s, 0, 1) * 100);
      const light = Math.round(this.clamp(l, 0, 1) * 100);
      return `hsl(${hue}, ${sat}%, ${light}%)`;
    }

    lightenLightness(l, amount, minimum = 0) {
      const lightened = l + (1 - l) * amount;
      return this.clamp(Math.max(lightened, minimum), 0, 1);
    }

    darkenLightness(l, amount, maximum = 1) {
      const darkened = l * (1 - amount);
      return this.clamp(Math.min(darkened, maximum), 0, 1);
    }

    buildPaletteFromHsl({ h, s, l }) {
      const baseHue = this.clamp(h, 0, 360);
      const baseSat = this.clamp(s, 0, 1);
      const baseLight = this.clamp(l, 0, 1);

      const soften = (factor, minimum = 0) =>
        this.clamp(baseSat * factor, minimum, 1);

      const bg = {
        h: baseHue,
        s: soften(0.7, 0.45),
        l: this.lightenLightness(baseLight, 0.65, 0.7),
      };

      const border = {
        h: baseHue,
        s: soften(0.8, 0.5),
        l: this.lightenLightness(baseLight, 0.5, 0.6),
      };

      const text = {
        h: baseHue,
        s: soften(0.95, 0.6),
        l: this.darkenLightness(baseLight, 0.65, 0.16),
      };

      const selectedBg = {
        h: baseHue,
        s: soften(0.8, 0.55),
        l: this.lightenLightness(baseLight, 0.45, 0.66),
      };

      const selectedBorder = {
        h: baseHue,
        s: soften(0.9, 0.65),
        l: this.lightenLightness(baseLight, 0.35, 0.56),
      };

      const selectedText = {
        h: baseHue,
        s: soften(1, 0.65),
        l: this.darkenLightness(baseLight, 0.7, 0.12),
      };

      return {
        bg: this.formatHsl(bg),
        border: this.formatHsl(border),
        text: this.formatHsl(text),
        selectedBg: this.formatHsl(selectedBg),
        selectedBorder: this.formatHsl(selectedBorder),
        selectedText: this.formatHsl(selectedText),
      };
    }

    colorsFromHue(hueValue, saturation = 0.65, lightness = 0.35) {
      const hue = this.normalizeHue(hueValue);
      if (hue === null) {
        return null;
      }

      return this.buildPaletteFromHsl({
        h: hue,
        s: this.clamp(saturation, 0, 1),
        l: this.clamp(lightness, 0, 1),
      });
    }

    parseHexColor(value) {
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

    rgbToHsl({ r, g, b }) {
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
        s: this.clamp(saturation, 0, 1),
        l: this.clamp(lightness, 0, 1),
      };
    }

    colorsFromConfig(slug) {
      const config = this.roleConfig[slug];
      if (!config) {
        return null;
      }

      if (typeof config.hue === "number") {
        return this.colorsFromHue(config.hue);
      }

      if (typeof config.color === "string") {
        const rgb = this.parseHexColor(config.color);
        if (rgb) {
          return this.buildPaletteFromHsl(this.rgbToHsl(rgb));
        }
      }

      return null;
    }

    getRoleColors(slug) {
      if (this.cache.has(slug)) {
        return this.cache.get(slug);
      }

      let colors = this.colorsFromConfig(slug);

      if (!colors) {
        const hashHue = this.hashString(slug) % 360;
        colors = this.colorsFromHue(hashHue);
      }

      if (!colors) {
        colors = this.buildPaletteFromHsl({ h: 210, s: 0.6, l: 0.35 });
      }

      this.cache.set(slug, colors);
      return colors;
    }

    applyToElement(element, slug) {
      if (!element || !slug) {
        return;
      }

      const colors = this.getRoleColors(slug);
      element.style.setProperty("--role-pill-bg", colors.bg);
      element.style.setProperty("--role-pill-border", colors.border);
      element.style.setProperty("--role-pill-text", colors.text);
      element.style.setProperty("--role-pill-bg-selected", colors.selectedBg);
      element.style.setProperty(
        "--role-pill-border-selected",
        colors.selectedBorder,
      );
      element.style.setProperty(
        "--role-pill-text-selected",
        colors.selectedText,
      );
    }
  }

  class SearchController {
    constructor({
      form,
      main,
      summary,
      input,
      clearButton,
      roleFilter,
      roleFilterList,
      roleFilterClear,
      navSummary,
      navSummaryBase,
      roleConfig,
      roleOrder,
      prefersReducedMotion,
    }) {
      this.form = form;
      this.main = main;
      this.summary = summary;
      this.input = input;
      this.clearButton = clearButton;
      this.roleFilter = roleFilter;
      this.roleFilterList = roleFilterList;
      this.roleFilterClear = roleFilterClear;
      this.navSummary = navSummary;
      this.navSummaryBase = navSummaryBase;
      this.prefersReducedMotion = prefersReducedMotion;
      this.roleConfig = roleConfig;
      this.roleOrder = roleOrder;

      this.selectedRoles = new Set();
      this.roleLabels = new Map();
      this.sections = [];
      this.parentGroups = new Map();
      this.totalItems = 0;
      this.navSummaryFiltersSuffix = " (matching your filters)";

      this.colors = new RoleColorManager(this.roleConfig);

      this.applyFilter = this.applyFilter.bind(this);
    }

    init() {
      if (!this.main || !this.form || !this.input) {
        return;
      }

      if (this.summary) {
        this.summary.setAttribute("tabindex", "-1");
      }

      this.collectSections();

      if (this.sections.length === 0) {
        return;
      }

      this.renderRoleFilters();
      this.applyFilter();
      this.bindEvents();
      this.toggleClearButton(this.input.value.trim().length > 0);
    }

    collectSections() {
      const lists = Array.from(this.main.querySelectorAll("ul, ol")).filter(
        (list) => {
          if (list.closest(".feedback-callout")) {
            return false;
          }

          if (list.closest('[role="note"]')) {
            return false;
          }

          return Boolean(this.findHeading(list));
        },
      );

      lists.forEach((list) => {
        const heading = this.findHeading(list);
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

            const configEntry = this.roleConfig[slug];
            const displayLabel = configEntry?.label || originalLabel;

            if (!displayLabel) {
              return;
            }

            roles.add(slug);
            this.roleLabels.set(slug, displayLabel);

            if (displayLabel && tag.textContent.trim() !== displayLabel) {
              tag.textContent = displayLabel;
            }
            tag.dataset.roleLabel = displayLabel;

            this.colors.applyToElement(tag, slug);

            tag.hidden = true;
            tag.classList.add("role-tag--filtered-out");
          });

          if (roles.size > 0) {
            item.dataset.roles = Array.from(roles).join(" ");
          }

          if (roleTags.length > 0) {
            this.ensureRoleDetails(item);
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

        const navItems = this.getNavItemsForHeading(heading);
        const headingLevel = this.headingDepth(heading);
        const paragraphsBeforeList = this.collectParagraphSiblings(heading, {
          untilElement: list,
          stopAtAnyHeading: true,
        });
        const paragraphsAfterList = this.collectParagraphSiblings(list, {
          stopAtHeadingDepth: headingLevel ?? 6,
        });
        const descriptionNodes = Array.from(
          new Set([...paragraphsBeforeList, ...paragraphsAfterList]),
        );

        const section = { heading, list, items, navItems, descriptionNodes };
        const parentHeading = this.findParentHeading(heading);

        if (parentHeading) {
          section.parentHeading = parentHeading;

          let group = this.parentGroups.get(parentHeading);
          if (!group) {
            group = {
              heading: parentHeading,
              navItems: this.getNavItemsForHeading(parentHeading),
              sections: [],
              descriptionNodes: this.collectParagraphSiblings(parentHeading, {
                stopAtAnyHeading: true,
              }),
            };
            this.parentGroups.set(parentHeading, group);
          }

          group.sections.push(section);
        }

        this.sections.push(section);
      });

      this.totalItems = this.sections.reduce(
        (count, section) => count + section.items.length,
        0,
      );
    }

    renderRoleFilters() {
      if (!this.roleFilter || !this.roleFilterList) {
        return;
      }

      const available = new Map(this.roleLabels);
      const configuredOrder = [];
      const seen = new Set();

      this.roleOrder.forEach((slug) => {
        if (available.has(slug)) {
          configuredOrder.push([slug, available.get(slug)]);
          seen.add(slug);
        }
      });

      const remaining = Array.from(available.entries())
        .filter(([slug]) => !seen.has(slug))
        .sort((a, b) =>
          a[1].localeCompare(b[1], "en", { sensitivity: "base" }),
        );

      const roles = [...configuredOrder, ...remaining];

      if (roles.length === 0) {
        this.roleFilter.hidden = true;
        this.roleFilter.removeAttribute("open");
        return;
      }

      this.roleFilter.hidden = false;
      this.roleFilterList.innerHTML = "";
      if (this.selectedRoles.size > 0) {
        this.roleFilter.open = true;
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
        this.colors.applyToElement(pill, slug);

        optionLabel.append(pill);
        wrapper.append(checkbox, optionLabel);
        fragment.append(wrapper);

        checkbox.checked = this.selectedRoles.has(slug);

        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            this.selectedRoles.add(slug);
          } else {
            this.selectedRoles.delete(slug);
          }

          this.toggleRoleClearButton(this.selectedRoles.size > 0);
          this.applyFilter();

          if (this.roleFilter && this.selectedRoles.size > 0) {
            this.roleFilter.open = true;
          }
        });
      });

      this.roleFilterList.append(fragment);
      this.toggleRoleClearButton(this.selectedRoles.size > 0);
    }

    bindEvents() {
      this.input.addEventListener("input", this.applyFilter);

      this.form.addEventListener("submit", (event) => {
        event.preventDefault();
        this.handleSubmit();
      });

      if (this.roleFilterClear && this.roleFilterList) {
        this.roleFilterClear.addEventListener("click", () => {
          this.handleRoleFilterClear();
        });
      }

      if (this.clearButton) {
        this.clearButton.addEventListener("click", () => {
          this.input.value = "";
          this.applyFilter();
          this.input.focus();
        });
      }
    }

    handleSubmit() {
      if (!this.summary) {
        return;
      }

      this.summary.scrollIntoView({
        behavior: this.prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
      this.summary.focus();
    }

    handleRoleFilterClear() {
      this.selectedRoles.clear();

      this.roleFilterList
        .querySelectorAll(".role-filter__checkbox")
        .forEach((checkbox) => {
          checkbox.checked = false;
        });

      this.toggleRoleClearButton(false);
      this.applyFilter();

      const firstCheckbox = this.roleFilterList.querySelector(
        ".role-filter__checkbox",
      );

      if (firstCheckbox) {
        firstCheckbox.focus();
      } else if (this.summary) {
        this.summary.focus();
      }
    }

    headingDepth(heading) {
      if (!heading || !/^H[1-6]$/.test(heading.tagName)) {
        return null;
      }

      const depth = Number(heading.tagName.slice(1));
      return Number.isNaN(depth) ? null : depth;
    }

    collectParagraphSiblings(
      startElement,
      {
        untilElement = null,
        stopAtAnyHeading = false,
        stopAtHeadingDepth = null,
      } = {},
    ) {
      const nodes = [];

      if (!startElement) {
        return nodes;
      }

      let current = startElement.nextElementSibling;

      while (current) {
        if (current === untilElement) {
          break;
        }

        if (/^H[1-6]$/.test(current.tagName)) {
          const depth = this.headingDepth(current);

          if (stopAtAnyHeading) {
            break;
          }

          if (
            stopAtHeadingDepth !== null &&
            stopAtHeadingDepth !== undefined &&
            depth !== null &&
            depth <= stopAtHeadingDepth
          ) {
            break;
          }
        }

        if (current.tagName === "P") {
          nodes.push(current);
        }

        current = current.nextElementSibling;
      }

      return nodes;
    }

    findHeading(element) {
      let current = element?.previousElementSibling || null;

      while (current) {
        if (/^H[2-4]$/.test(current.tagName)) {
          return current;
        }

        if (/^H[1-6]$/.test(current.tagName)) {
          return null;
        }

        current = current.previousElementSibling;
      }

      const parent = element?.parentElement || null;
      if (!parent || parent === this.main) {
        return null;
      }

      return this.findHeading(parent);
    }

    findAncestorHeading(element, maxDepth) {
      let current = element?.previousElementSibling || null;

      while (current) {
        if (/^H[1-6]$/.test(current.tagName)) {
          const currentDepth = this.headingDepth(current);
          if (currentDepth !== null && (!maxDepth || currentDepth < maxDepth)) {
            return current;
          }
        }

        current = current.previousElementSibling;
      }

      const parent = element?.parentElement || null;
      if (!parent || parent === this.main) {
        return null;
      }

      return this.findAncestorHeading(parent, maxDepth);
    }

    findParentHeading(heading) {
      const depth = this.headingDepth(heading);

      if (depth === null || depth <= 2) {
        return null;
      }

      return this.findAncestorHeading(heading, depth);
    }

    getNavItemsForHeading(heading) {
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

    ensureRoleDetails(itemElement) {
      if (!itemElement) {
        return;
      }

      let details = itemElement.querySelector(".role-tag-details");
      const contentContainer = details
        ? details.querySelector(".role-tag-details__content")
        : null;

      if (!contentContainer) {
        return;
      }

      const seen = new Set();

      Array.from(contentContainer.children).forEach((pill) => {
        const slug = (pill.dataset.role || "").trim();

        if (!slug || seen.has(slug)) {
          pill.remove();
          return;
        }

        seen.add(slug);

        pill.classList.add("role-tag--details");
        pill.hidden = false;
        pill.removeAttribute("hidden");
        pill.removeAttribute("aria-hidden");
        pill.classList.remove("role-tag--filtered-out");
        this.colors.applyToElement(pill, slug);
      });
    }

    updateItemRoleTagsVisibility(itemElement, shouldFilter, activeRoles) {
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
          tag.setAttribute("aria-hidden", "true");
        });
        return;
      }

      roleTags.forEach((tag) => {
        const slug = (tag.dataset.role || "").trim();
        const isSelected = slug && activeRoleSet.has(slug);

        if (isSelected) {
          tag.hidden = false;
          tag.removeAttribute("hidden");
          tag.classList.remove("role-tag--filtered-out");
          tag.removeAttribute("aria-hidden");
        } else {
          tag.hidden = true;
          tag.classList.add("role-tag--filtered-out");
          tag.setAttribute("aria-hidden", "true");
        }
      });
    }

    updateSummary(visibleCount, query) {
      if (!this.summary) {
        return;
      }

      const trimmedQuery = query.trim();
      const activeRoles = Array.from(this.selectedRoles)
        .map((slug) => this.roleLabels.get(slug))
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
          this.summary.textContent = "No schemes available.";
          return;
        }

        this.summary.textContent = `No schemes match ${filters.join(" and ")}.`;
        return;
      }

      if (filters.length === 0) {
        this.summary.textContent = `Showing all ${this.totalItems} ${
          this.totalItems === 1 ? "scheme" : "schemes"
        }.`;
        return;
      }

      this.summary.textContent = `Showing ${visibleCount} ${
        visibleCount === 1 ? "scheme" : "schemes"
      } where ${filters.join(", and ")}.`;
    }

    updateNavSummaryLabel(filtersActive) {
      if (!this.navSummary || !this.navSummaryBase) {
        return;
      }

      this.navSummary.textContent = filtersActive
        ? `${this.navSummaryBase}${this.navSummaryFiltersSuffix}`
        : this.navSummaryBase;
    }

    toggleClearButton(hasQuery) {
      if (!this.clearButton) {
        return;
      }

      this.form.classList.toggle("site-search--has-query", hasQuery);

      this.clearButton.hidden = !hasQuery;
      this.clearButton.disabled = !hasQuery;

      if (hasQuery) {
        this.clearButton.removeAttribute("tabindex");
      } else {
        this.clearButton.setAttribute("tabindex", "-1");
      }
    }

    toggleRoleClearButton(hasSelectedRoles) {
      if (!this.roleFilterClear) {
        return;
      }

      this.roleFilterClear.hidden = !hasSelectedRoles;
      this.roleFilterClear.disabled = !hasSelectedRoles;

      if (hasSelectedRoles) {
        this.roleFilterClear.removeAttribute("tabindex");
      } else {
        this.roleFilterClear.setAttribute("tabindex", "-1");
      }
    }

    applyFilter() {
      const query = this.input.value || "";
      const normalizedQuery = query.trim().toLowerCase();
      const selectedRoleList = Array.from(this.selectedRoles);
      const hasRoleFilter = selectedRoleList.length > 0;
      const filtersActive =
        hasRoleFilter || normalizedQuery.length > 0 || false;
      let visibleCount = 0;

      this.sections.forEach((section) => {
        let visibleInSection = 0;

        section.items.forEach((item) => {
          const matchesQuery =
            normalizedQuery.length === 0 ||
            item.title.includes(normalizedQuery);
          const matchesRoles =
            !hasRoleFilter ||
            selectedRoleList.some((role) => item.roles.has(role));
          const matches = matchesQuery && matchesRoles;

          item.element.hidden = !matches;
          this.updateItemRoleTagsVisibility(
            item.element,
            hasRoleFilter,
            this.selectedRoles,
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

        if (section.descriptionNodes && section.descriptionNodes.length > 0) {
          section.descriptionNodes.forEach((node) => {
            node.hidden = shouldHideSection;
          });
        }

        if (section.navItems && section.navItems.length > 0) {
          section.navItems.forEach((navItem) => {
            navItem.hidden = shouldHideSection;
          });
        }
      });

      this.parentGroups.forEach((group) => {
        const anyVisible = group.sections.some(
          (section) => (section.visibleInSection || 0) > 0,
        );
        const shouldHideParent = filtersActive && !anyVisible;

        if (group.heading) {
          group.heading.hidden = shouldHideParent;
        }

        if (group.descriptionNodes && group.descriptionNodes.length > 0) {
          group.descriptionNodes.forEach((node) => {
            node.hidden = shouldHideParent;
          });
        }

        if (group.navItems && group.navItems.length > 0) {
          group.navItems.forEach((navItem) => {
            navItem.hidden = shouldHideParent;
          });
        }
      });

      this.updateSummary(visibleCount, query);
      this.updateNavSummaryLabel(filtersActive);
      this.toggleClearButton(normalizedQuery.length > 0);
      this.toggleRoleClearButton(this.selectedRoles.size > 0);
    }
  }

  function getDomReferences() {
    const form = document.querySelector('[data-js="search-form"]');
    const main = document.getElementById("main-content");
    const summary = document.getElementById("results-summary");
    const input = form ? form.querySelector(".site-search__input") : null;
    const clearButton = form
      ? form.querySelector('[data-js="clear-search"]')
      : null;
    const roleFilter = form
      ? form.querySelector('[data-js="role-filter"]')
      : null;
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
    const roleConfigElement = document.getElementById("role-config");

    const prefersReducedMotion = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

    return {
      form,
      main,
      summary,
      input,
      clearButton,
      roleFilter,
      roleFilterList,
      roleFilterClear,
      navSummary,
      navSummaryBase,
      roleConfigElement,
      prefersReducedMotion,
    };
  }

  function parseRoleConfig(roleConfigElement) {
    let roleConfig = {};

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

    const roleOrder = Object.keys(roleConfig);
    return { roleConfig, roleOrder };
  }

  const dom = getDomReferences();

  if (!dom.form || !dom.main || !dom.input) {
    return;
  }

  const { roleConfig, roleOrder } = parseRoleConfig(dom.roleConfigElement);

  const controller = new SearchController({
    form: dom.form,
    main: dom.main,
    summary: dom.summary,
    input: dom.input,
    clearButton: dom.clearButton,
    roleFilter: dom.roleFilter,
    roleFilterList: dom.roleFilterList,
    roleFilterClear: dom.roleFilterClear,
    navSummary: dom.navSummary,
    navSummaryBase: dom.navSummaryBase,
    roleConfig,
    roleOrder,
    prefersReducedMotion: dom.prefersReducedMotion,
  });

  controller.init();
})();
