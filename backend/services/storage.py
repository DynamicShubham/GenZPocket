"""
Storage Service — Handles receipt file uploads.

Supports:
1. Cloudflare R2 / AWS S3 (via boto3) if credentials are present in backend/.env
2. Local disk storage fallback (backend/uploads/) if credentials are omitted.
"""

import os
import uuid
from pathlib import Path
from fastapi import UploadFile

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def save_receipt_file(file: UploadFile) -> str:
    """
    Saves an uploaded file to R2 if configured, otherwise to local uploads folder.
    Returns public/relative URL for the stored file.
    """
    r2_account_id = os.getenv("R2_ACCOUNT_ID")
    r2_access_key = os.getenv("R2_ACCESS_KEY")
    r2_secret_key = os.getenv("R2_SECRET_KEY")

    ext = Path(file.filename or "receipt.jpg").suffix
    if not ext:
        ext = ".jpg"
    filename = f"{uuid.uuid4()}{ext}"

    content = await file.read()

    # Cloudflare R2 Upload
    if r2_account_id and r2_access_key and r2_secret_key and r2_account_id != "your_r2_account_id_here":
        try:
            import boto3
            endpoint_url = f"https://{r2_account_id}.r2.cloudflarestorage.com"
            s3_client = boto3.client(
                "s3",
                endpoint_url=endpoint_url,
                aws_access_key_id=r2_access_key,
                aws_secret_access_key=r2_secret_key,
                region_name="auto",
            )
            bucket_name = os.getenv("R2_BUCKET_NAME", "genzpocket-receipts")
            s3_client.put_object(
                Bucket=bucket_name,
                Key=filename,
                Body=content,
                ContentType=file.content_type or "image/jpeg",
            )
            public_domain = os.getenv("R2_PUBLIC_DOMAIN", f"{endpoint_url}/{bucket_name}")
            return f"{public_domain}/{filename}"
        except Exception as e:
            print(f"[R2 Storage Error] {e}. Falling back to local storage.")

    # Local Disk Fallback
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        f.write(content)

    return f"/uploads/{filename}"
