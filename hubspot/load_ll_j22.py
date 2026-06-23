#!/usr/bin/env python3
"""Upsert ll_j22_ea_aegis.csv into Supabase `leads` via PostgREST (the URL path).
ignore-duplicates => existing rows (apollo-enriched) are NOT touched; only new emails insert.
"""
import os, sys, json, csv, urllib.request, urllib.error
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
CSV  = REPO / "ll_j22_ea_aegis.csv"

def env():
    e={}
    for line in (REPO/".env").read_text().splitlines():
        line=line.strip()
        if not line or line.startswith("#") or "=" not in line: continue
        k,_,v=line.partition("="); e[k.strip()]=v.strip()
    url=e["SUPABASE_URL"].rstrip("/")
    if not url.startswith("http"): url="https://"+url
    return url, e["SUPABASE_KEY"]

def split_name(n):
    n=(n or "").strip()
    if not n: return "", ""
    parts=n.split(None,1)
    return parts[0], (parts[1] if len(parts)>1 else "")

def rows():
    seen={}
    for r in csv.DictReader(CSV.open(encoding="utf-8-sig")):
        em=(r.get("Email") or "").strip().lower()
        if not em or "@" not in em: continue
        d=(r.get("Date Added") or "").strip()
        if em not in seen or d>seen[em]["d"]:
            seen[em]={"n":(r.get("Name") or "").strip(),"d":d,"s":(r.get("Source") or "").strip()}
    out=[]
    for em,v in seen.items():
        fn,ln=split_name(v["n"])
        out.append({
            "email":em,"fname":fn or None,"lname":ln or None,
            "domain":em.split("@",1)[1],
            "data":{"email":em,"apollo":None,
                    "source":{"name":"production-ready-enterprise-ai-architecture",
                              "type":"maven_lightning_session","channel":v["s"]},
                    "company":"","first_name":fn,"last_name":ln,"signup_date":v["d"]},
        })
    return out

def post(url,key,chunk):
    h={"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json",
       "Prefer":"resolution=ignore-duplicates,return=representation","Content-Profile":"public"}
    req=urllib.request.Request(url+"/rest/v1/leads?on_conflict=email",
        data=json.dumps(chunk).encode(),headers=h,method="POST")
    with urllib.request.urlopen(req,timeout=60) as resp:
        return resp.status, json.loads(resp.read() or b"[]")

if __name__=="__main__":
    url,key=env()
    data=rows()
    print(f"parsed {len(data)} unique emails from CSV")
    inserted=0
    for i in range(0,len(data),500):
        ch=data[i:i+500]
        st,body=post(url,key,ch)
        inserted+=len(body)
        print(f"  batch {i//500+1}: HTTP {st}, newly-inserted this batch = {len(body)}")
    print(f"DONE. total newly-inserted (new emails) = {inserted}; already-existed (skipped) = {len(data)-inserted}")
