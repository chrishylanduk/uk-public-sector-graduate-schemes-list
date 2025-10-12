export class SlugTracker {
  constructor() {
    this.counts = new Map();
  }

  reset() {
    this.counts.clear();
  }

  slugify(value) {
    const plainValue = String(value ?? "");
    const plainText = plainValue
      .toLowerCase()
      .replace(/<[^>]*>/g, "")
      .replace(/&[a-z]+;/g, "")
      .trim();

    let base = plainText
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    if (!base) {
      base = "section";
    }

    const count = this.counts.get(base) || 0;
    this.counts.set(base, count + 1);

    return count === 0 ? base : `${base}-${count}`;
  }
}
