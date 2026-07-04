import re
from pathlib import Path

path = Path(r"C:\Users\Muhammad Kunzal\.cursor\projects\d-xampp-htdocs-autods\uploads\c__Users_Muhammad_Kunzal_Downloads_3Dsellers-L1-L38313-0.html")
html = path.read_text(encoding="utf-8", errors="ignore")

labels = re.findall(r'aria-label="([^"]*?) Column"', html)
print("Column picker labels:", len(labels))
for i, label in enumerate(labels, 1):
    print(f"{i:2}. {label or '(blank)'}")

# filter panel group titles (unique order)
titles = []
for match in re.finditer(r'class="ag-group-title ag-filter-toolpanel-group-title"[^>]*>([^<]+)<', html):
    title = match.group(1).strip()
    if title not in titles:
        titles.append(title)
print("\nFilter panel column groups:", len(titles))
for i, title in enumerate(titles, 1):
    print(f"{i:2}. {title}")
