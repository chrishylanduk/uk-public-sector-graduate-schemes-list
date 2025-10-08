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

  if (!input) {
    return;
  }

  if (summary) {
    summary.setAttribute("tabindex", "-1");
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

    const items = Array.from(list.querySelectorAll("li")).map((item) => ({
      element: item,
      text: item.textContent.replace(/\s+/g, " ").trim().toLowerCase(),
    }));

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

  const totalItems = sections.reduce(
    (count, section) => count + section.items.length,
    0,
  );

  function updateSummary(visibleCount, query) {
    if (!summary) {
      return;
    }

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      summary.textContent = `Showing all ${totalItems} ${
        totalItems === 1 ? "scheme" : "schemes"
      }.`;
      return;
    }

    if (visibleCount === 0) {
      summary.textContent = `No schemes match "${trimmedQuery}".`;
      return;
    }

    summary.textContent = `Showing ${visibleCount} ${
      visibleCount === 1 ? "scheme" : "schemes"
    } matching "${trimmedQuery}".`;
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

  function applyFilter() {
    const query = input.value;
    const normalizedQuery = query.trim().toLowerCase();
    let visibleCount = 0;

    sections.forEach((section) => {
      let visibleInSection = 0;

      section.items.forEach((item) => {
        const matches =
          normalizedQuery.length === 0 || item.text.includes(normalizedQuery);

        item.element.hidden = !matches;

        if (matches) {
          visibleInSection += 1;
          visibleCount += 1;
        }
      });

      const shouldHideSection =
        normalizedQuery.length > 0 && visibleInSection === 0;

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
      const shouldHideParent = normalizedQuery.length > 0 && !anyVisible;

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

    toggleClearButton(normalizedQuery.length > 0);
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

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      input.value = "";
      applyFilter();
      input.focus();
    });

    toggleClearButton(input.value.trim().length > 0);
  }
})();
