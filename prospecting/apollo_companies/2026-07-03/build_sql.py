import json, re, os

DIR = "/sessions/youthful-keen-bell/mnt/prospecting/apollo_companies/2026-07-03"
NAICS_PREFIXES = ("333", "335", "326", "423")
ADDED = "2026-07-03"

def esc(s):
    return s.replace("'", "''")

def sql_str(s):
    if s is None:
        return "null"
    return "'" + esc(str(s)) + "'"

def sql_num(n):
    return "null" if n is None else repr(n)

FOREIGN_PAT = re.compile(r'[　-ヿ一-鿿＀-￯Ѐ-ӿ]')
FOREIGN_SUFFIX = re.compile(r'\b(GmbH|S\.A\.|S\.p\.A\.|SpA|Ltda|K\.K\.|A/S|Oyj?|AktG)\b')

def classify(o):
    name = o.get("name") or ""
    rev = o.get("organization_revenue")
    owned = o.get("owned_by_organization")
    domain = o.get("primary_domain")
    li = o.get("linkedin_url")

    if not name.strip():
        return ("dropped", "junk record (no name)")
    if not domain and not li:
        return ("dropped", "junk record (no domain or LinkedIn)")
    if FOREIGN_PAT.search(name) or FOREIGN_SUFFIX.search(name):
        return ("dropped", "foreign HQ")

    if rev is None or rev == 0:
        return ("flagged", "revenue unknown")
    if 50_000_000 <= rev <= 100_000_000:
        if owned and owned.get("name"):
            return ("flagged", "subsidiary of " + owned["name"])
        return ("qualified", "in band 50M-100M")
    if 100_000_000 < rev <= 130_000_000:
        return ("flagged", "boundary revenue")
    if rev < 50_000_000:
        return ("dropped", "revenue below band")
    return ("dropped", "revenue above band")

rows = {}
order = []
stats = {"qualified": 0, "flagged": 0, "dropped": 0}
per_page = {}

for n in (1, 2, 3):
    fn = f"page-{n}.json"
    data = json.load(open(os.path.join(DIR, fn)))
    orgs = data.get("organizations") or []
    per_page[fn] = len(orgs)
    for o in orgs:
        oid = o.get("id")
        if not oid or oid in rows:
            continue
        status, reason = classify(o)
        stats[status] += 1
        matched = None
        for c in (o.get("naics_codes") or []):
            if str(c).startswith(NAICS_PREFIXES):
                matched = str(c)
                break
        products = {"cdp-selection": {"status": status, "reason": reason,
                                      "matched_naics": matched, "added": ADDED}}
        naics = o.get("naics_codes") or []
        naics_sql = ("ARRAY[" + ",".join(sql_str(c) for c in naics) + "]::text[]") if naics else "'{}'::text[]"
        owned = o.get("owned_by_organization")
        parent = owned.get("name") if owned else None
        vals = "(" + ",".join([
            sql_str(oid),
            sql_str(o.get("name")),
            sql_str(o.get("primary_domain")),
            sql_str(o.get("linkedin_url")),
            "'201,1000'",
            sql_num(o.get("organization_revenue")),
            sql_str(o.get("organization_revenue_printed")),
            naics_sql,
            "null",
            sql_str(parent),
            sql_num(o.get("organization_headcount_six_month_growth")),
            sql_num(o.get("organization_headcount_twelve_month_growth")),
            sql_num(o.get("organization_headcount_twenty_four_month_growth")),
            sql_str(f"{ADDED}/page-{n}.json"),
            "'" + esc(json.dumps(products, ensure_ascii=False)) + "'::jsonb",
        ]) + ")"
        rows[oid] = vals
        order.append(oid)

COLS = ("apollo_org_id,company,domain,linkedin_url,employee_range,revenue,revenue_printed,"
        "naics,hq_location,parent_company,growth_6m,growth_12m,growth_24m,raw_file,products")
BATCH = 50
batch_files = []
for i in range(0, len(order), BATCH):
    chunk = [rows[oid] for oid in order[i:i+BATCH]]
    sql = (f"INSERT INTO public.apollo_company_universe ({COLS}) VALUES\n"
           + ",\n".join(chunk)
           + "\nON CONFLICT (apollo_org_id) DO UPDATE SET products = apollo_company_universe.products || excluded.products, raw_file = excluded.raw_file;")
    bf = os.path.join(DIR, f"insert_batch_{i//BATCH + 1:02d}.sql")
    open(bf, "w").write(sql)
    batch_files.append(bf)

print("per_page:", per_page)
print("unique rows:", len(order))
print("stats:", stats)
print("batches:", [(os.path.basename(b), os.path.getsize(b)) for b in batch_files])
