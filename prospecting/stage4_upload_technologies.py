#!/usr/bin/env python3
"""Stage 4 — sync stage4_target_technologies.json to S3.

The target-technology list (CDP + MAP names/uids) is the input the Stage 4 probe runs
on. This uploads it to the S3 folder in `.env` (`AWS_APOLLO_COMPANY_PATH`, e.g.
`datawhistl/companies/technologies`) so the canonical list is available outside the repo.
Re-run whenever the list changes.

Creds (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_REGION`) are read from `.env` and
passed to the `aws` CLI via its environment — never printed. boto3 is not installed here;
the AWS CLI is (`aws s3 cp`).

Usage:
  python3 stage4_upload_technologies.py            # upload
  python3 stage4_upload_technologies.py --dry-run  # print destination, no upload
"""
import os
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
FILE = HERE / "stage4_target_technologies.json"


def env(name, required=True):
    for line in (HERE / ".env").read_text().splitlines():
        if line.startswith(name + "="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    if required:
        sys.exit(f"{name} not found in .env")
    return None


def main():
    dry = "--dry-run" in sys.argv
    if not FILE.exists():
        sys.exit(f"missing {FILE.name}")

    path = env("AWS_APOLLO_COMPANY_PATH").strip("/")   # datawhistl/companies/technologies
    bucket, _, prefix = path.partition("/")
    dest = f"s3://{bucket}/{prefix}/{FILE.name}"
    print(f"{FILE.name} -> {dest}")
    if dry:
        print("dry-run — no upload")
        return

    child_env = dict(os.environ)
    child_env["AWS_ACCESS_KEY_ID"] = env("AWS_ACCESS_KEY_ID")
    child_env["AWS_SECRET_ACCESS_KEY"] = env("AWS_SECRET_ACCESS_KEY")
    child_env["AWS_DEFAULT_REGION"] = env("AWS_REGION", required=False) or "ap-south-1"

    r = subprocess.run(
        ["aws", "s3", "cp", str(FILE), dest, "--content-type", "application/json"],
        env=child_env, capture_output=True, text=True,
    )
    print(r.stdout.strip())
    if r.returncode != 0:
        sys.exit(f"upload failed: {r.stderr.strip()}")
    print("done")


if __name__ == "__main__":
    main()
