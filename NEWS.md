# How to add "Relevant News" articles

Every section across the three pages can show a **Relevant News** box.
A box only appears when its list has at least one article — an empty list
stays completely hidden.

All articles are edited in **one file**: `relevant-news.jsx` → the
`RELEVANT_NEWS` object near the top. You do **not** touch any of the
page/chart files.

---

## 1. The quickest way (paste a link)

Find the section key (see the map below), and add an object with just a `url`:

```js
gdp: [
  { url: "https://www.thedailystar.net/some-article" },
],
```

The card will try to auto-fetch the title, image and date from the link.
⚠️ Auto-fetch is best-effort — it uses a free service (microlink.io) that is
rate-limited (~50/day) and blocked by some sites. For a published page,
fill the fields in yourself (next section) — it's instant and never fails.

## 2. The reliable way (fill the fields)

```js
debt: [
  {
    url:    "https://www.thedailystar.net/.../full-article-link",  // required — where the click goes
    title:  "FY2026 budget: A missed opportunity for reform",      // headline shown on the card
    kicker: "Opinion",                                             // small label above the title (optional)
    source: "The Daily Star",                                      // publication (optional)
    date:   "Jun 4, 2025",                                         // any readable date (optional)
    image:  "structural-reform.jpg",                               // see images below (optional)
  },
],
```

Anything you type by hand always overrides the auto-fetch.
Only `url` is required; every other field is optional.

## 3. Adding the image

1. Drop the image file into the **`news-images/`** folder.
2. Set `image` to just the file name:

   ```js
   image: "fy2027-budget.jpg"      →  loads news-images/fy2027-budget.jpg
   ```

   You can also paste a full web address (`image: "https://…/photo.jpg"`)
   or a path with a slash (`image: "assets/photo.jpg"`) — those are used as-is.

If you give no image, the card shows a tasteful ৳ placeholder in the
section's accent colour.

## 4. Multiple articles

Add as many objects as you like to the list — the box lays them out
automatically:

```js
taka: [
  { url: "https://…/article-one", title: "Article one", date: "Jun 1, 2026" },
  { url: "https://…/article-two", title: "Article two", date: "Jun 2, 2026" },
  { url: "https://…/article-three", title: "Article three" },
],
```

- **1 article**  → one compact feature card
- **2+ articles** → a responsive grid that wraps neatly

To hide a box again, set its list back to empty: `taka: []`.

---

## 5. Section keys → which box is which

Each key controls the box under one section. The colour is fixed per
section (set in code) so the design stays consistent.

### Budget at a Glance (home)
| Key       | Section it appears under            | Accent |
| --------- | ----------------------------------- | ------ |
| `taka`    | Where Does Every ৳100 Go? (the note)| Blue   |
| `gdp`     | A growing slice of the economy      | Sky    |
| `treemap` | Every department, every taka        | Gold   |
| `debt`    | The Interest Bill                   | Red    |

### Price Impact
| Key             | Section it appears under     | Accent |
| --------------- | ---------------------------- | ------ |
| `price_pricier` | What got pricier             | Red    |
| `price_cheaper` | What got cheaper             | Green  |
| `price_tax`     | How the state raises revenue | Blue   |
| `price_subsidy` | The subsidy bill             | Gold   |
| `price_calc`    | Where does your ৳100 go?     | Sky    |

### Sector Deep Dive
| Key               | Section it appears under     | Accent |
| ----------------- | ---------------------------- | ------ |
| `sector_grid`     | Every sector, every taka     | Blue   |
| `sector_heatmap`  | Which sectors won the decade | Green  |
| `sector_rankings` | The biggest single line items| Gold   |
| `sector_gauges`   | The implementation gap       | Sky    |

---

## 6. Quick checklist

- [ ] Open `relevant-news.jsx`
- [ ] Find the right key from the table above
- [ ] Add `{ url: "…", title: "…", date: "…", image: "file.jpg" }`
- [ ] If using an image, copy the file into `news-images/`
- [ ] Refresh the page — the box appears under that section

No build step. Just edit, save, refresh.
