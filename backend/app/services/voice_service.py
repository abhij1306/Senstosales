from typing import Dict, Any, Optional, List, AsyncGenerator
import logging
import uuid
import json
import os
import sqlite3
from datetime import datetime

from app.services.llm_client import get_llm_client
from app.services.context_manager import context_manager
from app.services.reference_resolver import resolve_references, extract_entities
from app.core.config import settings
from app.core.result import ServiceResult
from app.core.exceptions import BusinessRuleViolation

logger = logging.getLogger(__name__)

class VoiceService:
    """
    Core logic for Voice Agent.
    Handles STT, Context Resolution, LLM Orchestration, and Action Execution.
    """
    
    async def process_command(
        self, 
        message: str, 
        session_id: Optional[str] = None, 
        ui_context: Optional[Dict[str, Any]] = None,
        stream: bool = False
    ) -> Any: # Returns Dict or AsyncGenerator
        """
        Process a user voice/text command.
        
        Args:
            message: The user's input text (or transcribed text)
            session_id: Unique session ID (generated if None)
            ui_context: Current state of the Frontend UI
            stream: Whether to return a generator for SSE
        """
        # 1. Session & Context Setup
        session_id = session_id or str(uuid.uuid4())
        
        if ui_context:
            await context_manager.update_ui_context(session_id, ui_context)
            
        # 2. Reference Resolution (Deictic)
        resolved_message = resolve_references(message, ui_context)
        
        # 3. Entity Extraction & Update
        entities = extract_entities(resolved_message)
        if entities:
            await context_manager.update_entities(session_id, entities)
            
        # 4. Update Conversation History
        # We store the *resolved* message so context is preserved clearly
        await context_manager.add_message(session_id, "user", resolved_message)
        
        history = await context_manager.get_messages_for_llm(session_id)
        # Add current message to context window
        history.append({"role": "user", "content": resolved_message})
        
        # 5. LLM Execution
        provider = os.getenv("LLM_PROVIDER", "groq") # Still allowed to override via env, or use settings? 
        # Using env var directly for provider choice is fine as it's often a runtime toggle.
        
        llm_client = get_llm_client()
        
        if stream:
            return self._stream_response(llm_client, history, provider, session_id)
        else:
            return await self._unary_response(llm_client, history, provider, session_id, resolved_message)

    async def _unary_response(self, llm_client, history, provider, session_id, resolved_message) -> Dict[str, Any]:
        """Handle non-streaming response"""
        try:
            response = await llm_client.chat(
                messages=history,
                provider=provider,
                temperature=0.7
            )
            response_text = response["content"]
            
            # Save assistant response
            await context_manager.add_message(session_id, "assistant", response_text)
            
            # Parse & Verify Action
            return await self._parse_and_verify_action(response_text, session_id, resolved_message)
            
        except Exception as e:
            logger.error(f"Voice processing failed: {e}", exc_info=True)
            raise

    async def _stream_response(self, llm_client, history, provider, session_id) -> AsyncGenerator[str, None]:
        """Handle streaming response"""
        try:
            # Yield initial status
            yield f"data: {json.dumps({'type': 'thinking', 'message': 'Processing...', 'session_id': session_id})}\n\n"
            
            full_response = ""
            async for chunk in llm_client.stream(messages=history, provider=provider):
                full_response += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'text': chunk, 'session_id': session_id})}\n\n"
            
            # Save full response to history API
            await context_manager.add_message(session_id, "assistant", full_response)
            
            # Send done signal
            yield f"data: {json.dumps({'type': 'done', 'session_id': session_id})}\n\n"
            
        except Exception as e:
            logger.error(f"Voice streaming failed: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    async def _parse_and_verify_action(self, response_text: str, session_id: str, resolved_message: str) -> Dict[str, Any]:
        """
        Parse LLM JSON response and run specific verification logic for critical actions.
        """
        try:
            action = json.loads(response_text)
            action["session_id"] = session_id
            
            # SAFETY LAYER: Intercept confirmation requests
            if action.get("type") == "confirm" and action.get("confirm", {}).get("action") == "create_dc":
                return await self._verify_create_dc(action, resolved_message)

            # NEW: Handle Query Intents (Ask Data)
            if action.get("type") == "query":
                return await self._handle_query_intent(action, session_id)
                
            return action
            
        except json.JSONDecodeError:
            # Fallback for plain text responses
            return {
                "type": "message",
                "message": response_text,
                "session_id": session_id
            }

    async def _handle_query_intent(self, action: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        """
        Execute safe read-only queries against smart reports.
        """
        from app.services.reports_service import reports_service
        from app.db import get_db
        
        query_type = action.get("query_type") # kpi, pending, summary
        params = action.get("params", {})
        
        try:
            # DB connection for this request
            # Logic: We open a new connection or need to inject dependency.
            # Ideally this service should not manage DB connections directly if using FastAPI Depends.
            # But for async internal calls, we often need to manage it.
            # Using a context manager pattern for safety.
            
            with sqlite3.connect(settings.DATABASE_URL.replace("sqlite:///", "")) as db:
                db.row_factory = sqlite3.Row
                
                if query_type == "kpi":
                    # We reuse reports_service logic but need to adapt it since reports_service expects a text range?
                    # No, let's call the specific methods.
                    # Actually smart_reports logic was in the router. reports_service has diff methods.
                    # We'll implement specific safe queries here or call reports_service if suitable.
                    
                    if params.get("metric") == "pending_items":
                        data = reports_service.get_pending_dcs(db) # Reuse pending DCs? Or pending PO items?
                        # Let's use the robust pending logic from reports_service.get_dashboard_insights
                        # Actually simpler: let's expose specific data.
                        
                        # Re-implementing a safe retrieval here for flexibility or calling reports_service
                        pass 

                    # Using pre-defined safe queries based on Implementation Plan
                    if query_type == "get_pending":
                        # Maps to "Show me pending items"
                        # Use logic similar to get_pending in smart_reports router
                         query = """
                            SELECT po.po_number, poi.material_description, (poi.ord_qty - COALESCE(SUM(dci.dispatch_qty), 0)) as pending
                            FROM purchase_orders po
                            JOIN purchase_order_items poi ON po.po_number = poi.po_number
                            LEFT JOIN delivery_challan_items dci ON poi.id = dci.po_item_id
                            GROUP BY poi.id
                            HAVING pending > 0
                            ORDER BY pending DESC LIMIT 5
                        """
                         rows = db.execute(query).fetchall()
                         data = [dict(row) for row in rows]
                         
                         return {
                             "type": "widget",
                             "widget_type": "table",
                             "title": "Pending Items",
                             "data": data,
                             "message": f"Here are the top {len(data)} pending items.",
                             "session_id": session_id
                         }

                    elif query_type == "get_summary":
                        # Maps to "How are sales?"
                        sales = db.execute("SELECT SUM(total_invoice_value) FROM gst_invoices WHERE strftime('%Y-%m', invoice_date) = strftime('%Y-%m', 'now')").fetchone()[0] or 0
                        return {
                            "type": "widget",
                            "widget_type": "kpi",
                            "data": {"label": "Sales This Month", "value": f"₹{sales:,.2f}"},
                            "message": f"Total sales for this month are ₹{sales:,.2f}.",
                            "session_id": session_id
                        }
                        
            return {
                "type": "message",
                "message": "I understood your query but I don't have a specific report for that yet.",
                "session_id": session_id
            }
            
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            return {
                "type": "error",
                "message": "I couldn't fetch that data right now.",
                "session_id": session_id
            }

    async def _verify_create_dc(self, action: Dict[str, Any], resolved_message: str) -> Dict[str, Any]:
        """Verify DC creation request"""
        from app.services.verification import VerificationService
        verifier = VerificationService()
        
        confirm_payload = action["confirm"]
        data = confirm_payload.get("data", {})
        
        # Try to find PO number in data or fallback to message
        po_number = data.get("po_number") or extract_entities(resolved_message).get("po_number")
        items = data.get("items", [])
        
        if not po_number:
            return {
                "type": "error", 
                "message": "I need a PO number to create a Delivery Challan. Which PO are we talking about?",
                "session_id": action["session_id"]
            }
            
        try:
            verification = await verifier.verify_create_dc(po_number, items)
            
            if not verification["valid"]:
                return {
                    "type": "error",
                    "message": f"Cannot create DC. {verification['summary']}",
                    "error": {
                        "message": verification['summary'],
                        "suggestions": verification['warnings']
                    },
                    "session_id": action["session_id"]
                }
            
            # Start success path - Enrich data
            action["confirm"]["data"] = verification["data"]
            action["confirm"]["message"] = f"Verified: {verification['summary']}. Ready to create?"
            return action
            
        except Exception as e:
            logger.error(f"Verification check failed: {e}", exc_info=True)
            return {
                "type": "error",
                "message": f"I hit a system error checking that PO. {str(e)}",
                "session_id": action["session_id"]
            }

    async def execute_confirmed_action(self, action_type: str, data: Dict[str, Any], db: sqlite3.Connection) -> ServiceResult[Dict[str, Any]]:
        """
        Execute a side-effect action after user confirmation.
        Returns ServiceResult for explicit success/failure.
        """
        if action_type == "create_dc":
            from app.services.dc import create_dc as create_dc_service
            from app.models import DCCreate
            import random
            
            # Business Logic for DC Generation
            # In production, use a sequence generator
            dc_number = f"DC-{random.randint(1000, 9999)}"
            dc_date = datetime.now().strftime("%Y-%m-%d")
            
            dc_model = DCCreate(
                dc_number=dc_number,
                dc_date=dc_date,
                po_number=data.get("po_number"),
                remarks="Created via Voice Agent"
            )
            
            # Map Items
            items = []
            for item in data.get("items", []):
                items.append({
                    "po_item_id": item.get("po_item_id"),
                    "dispatch_qty": item.get("dispatch_qty"),
                    "lot_no": item.get("lot_no", 1)
                })
                
            result = create_dc_service(dc_model, items, db)
            
            if result.success:
                return ServiceResult.ok({
                    "message": f"Created Delivery Challan {dc_number}",
                    "data": result.value
                })
            else:
                return ServiceResult.fail(result.message, "DC_CREATION_FAILED")
                
        raise BusinessRuleViolation(f"Action '{action_type}' not implemented")

voice_service = VoiceService()
