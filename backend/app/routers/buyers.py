from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from ..db import get_connection

router = APIRouter(prefix="/api/buyers", tags=["buyers"])

# --- Models ---
class BuyerBase(BaseModel):
    name: str
    designation: Optional[str] = None
    gstin: str
    billing_address: str
    shipping_address: Optional[str] = None
    place_of_supply: str
    state: Optional[str] = None
    state_code: Optional[str] = None
    
class BuyerCreate(BuyerBase):
    pass

class BuyerUpdate(BuyerBase):
    pass

class Buyer(BuyerBase):
    id: int
    is_default: bool
    is_active: bool
    created_at: str

@router.get("", response_model=List[Buyer])
async def list_buyers():
    """List all active buyers."""
    conn = get_connection()
    try:
        rows = conn.execute("""
            SELECT id, name, designation, gstin, billing_address, shipping_address, 
                   place_of_supply, state, state_code, is_default, is_active, created_at
            FROM buyers
            WHERE is_active = 1
            ORDER BY is_default DESC, name ASC
        """).fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("", response_model=Buyer)
async def create_buyer(buyer: BuyerCreate):
    """Create a new buyer entity."""
    conn = get_connection()
    try:
        # Check duplicate GSTIN
        existing = conn.execute("SELECT 1 FROM buyers WHERE gstin = ? AND is_active = 1", (buyer.gstin,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail=f"Active buyer with GSTIN {buyer.gstin} already exists")

        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO buyers (name, designation, gstin, billing_address, shipping_address, place_of_supply, state, state_code, is_default)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        """, (buyer.name, buyer.designation, buyer.gstin, buyer.billing_address, buyer.shipping_address, buyer.place_of_supply, buyer.state, buyer.state_code))
        buyer_id = cursor.lastrowid
        conn.commit()
        
        row = conn.execute("SELECT * FROM buyers WHERE id = ?", (buyer_id,)).fetchone()
        return dict(row)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/{buyer_id}", response_model=Buyer)
async def update_buyer(buyer_id: int, buyer: BuyerUpdate):
    """Update an existing buyer."""
    conn = get_connection()
    try:
        # Check exists
        existing = conn.execute("SELECT 1 FROM buyers WHERE id = ?", (buyer_id,)).fetchone()
        if not existing:
             raise HTTPException(status_code=404, detail="Buyer not found")

        conn.execute("""
            UPDATE buyers 
            SET name = ?, designation = ?, gstin = ?, billing_address = ?, shipping_address = ?, place_of_supply = ?, state = ?, state_code = ?
            WHERE id = ?
        """, (buyer.name, buyer.designation, buyer.gstin, buyer.billing_address, buyer.shipping_address, buyer.place_of_supply, buyer.state, buyer.state_code, buyer_id))
        conn.commit()
        
        row = conn.execute("SELECT * FROM buyers WHERE id = ?", (buyer_id,)).fetchone()
        return dict(row)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/{buyer_id}/default", response_model=Buyer)
async def set_default_buyer(buyer_id: int):
    """Set a buyer as the default, unsetting others."""
    conn = get_connection()
    try:
        # Transaction to ensure atomic switch
        cursor = conn.cursor()
        cursor.execute("BEGIN TRANSACTION")
        
        # Unset all
        cursor.execute("UPDATE buyers SET is_default = 0")
        
        # Set new default
        cursor.execute("UPDATE buyers SET is_default = 1 WHERE id = ?", (buyer_id,))
        if cursor.rowcount == 0:
             conn.rollback()
             raise HTTPException(status_code=404, detail="Buyer not found")
             
        conn.commit()
        
        row = conn.execute("SELECT * FROM buyers WHERE id = ?", (buyer_id,)).fetchone()
        return dict(row)
    except HTTPException as he:
        raise he
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/{buyer_id}")
async def delete_buyer(buyer_id: int):
    """Soft delete a buyer."""
    conn = get_connection()
    try:
        # Prevent deleting the Default buyer
        is_default = conn.execute("SELECT is_default FROM buyers WHERE id = ?", (buyer_id,)).fetchone()
        if not is_default:
             raise HTTPException(status_code=404, detail="Buyer not found")
        if is_default['is_default']:
             raise HTTPException(status_code=400, detail="Cannot delete the default buyer. Set another buyer as default first.")

        conn.execute("UPDATE buyers SET is_active = 0 WHERE id = ?", (buyer_id,))
        conn.commit()
        return {"success": True}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
