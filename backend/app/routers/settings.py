"""
Business Settings Router
Manages global configuration for supplier (your company) and buyer details.
"""
from fastapi import APIRouter, Depends, HTTPException
from app.db import get_db
from app.models import Settings, SettingsUpdate
from typing import List
import sqlite3
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/")
def get_settings(db: sqlite3.Connection = Depends(get_db)):
    """Fetch all business settings"""
    try:
        rows = db.execute("SELECT key, value FROM business_settings").fetchall()
        settings_dict = {row['key']: row['value'] for row in rows}
        return settings_dict
    except Exception as e:
        logger.error(f"Failed to fetch settings: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch settings: {str(e)}")

@router.post("/")
def update_setting(setting: SettingsUpdate, db: sqlite3.Connection = Depends(get_db)):
    """Update a single setting"""
    try:
        db.execute("INSERT OR REPLACE INTO business_settings (key, value) VALUES (?, ?)", 
                   (setting.key, setting.value))
        db.commit()
        return {"success": True, "key": setting.key}
    except Exception as e:
        logger.error(f"Failed to update setting {setting.key}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update setting: {str(e)}")

@router.post("/batch")
def update_settings_batch(settings: List[SettingsUpdate], db: sqlite3.Connection = Depends(get_db)):
    """Update multiple settings at once"""
    try:
        for setting in settings:
            db.execute("INSERT OR REPLACE INTO business_settings (key, value) VALUES (?, ?)", 
                       (setting.key, setting.value))
        db.commit()
        return {"success": True, "updated": len(settings)}
    except Exception as e:
        logger.error(f"Failed to batch update settings: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to batch update: {str(e)}")
