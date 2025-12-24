import sys
import logging

logger = logging.getLogger("app.core.multipart_fix")

def apply_multipart_fix():
    """
    Patch python-multipart and starlette to increase file upload limits.
    Must be called before FastAPI app initialization.
    """
    try:
        # 1. Patch python-multipart
        # Note: The package is 'python-multipart' but module is 'multipart'
        import multipart
        from multipart.multipart import MultipartParser
        
        # Default is 1000, verify current
        old_limit = getattr(MultipartParser, 'max_files', 'unknown')
        
        # Set new limits
        MultipartParser.max_files = 10000
        MultipartParser.max_fields = 10000
        
        logger.info(f"✅ patched python-multipart: max_files {old_limit} -> 10000")
        
        # 2. Patch Starlette (if it has its own reference)
        try:
            from starlette import formparsers
            # Check if it uses the same class or a wrapper
            if hasattr(formparsers, 'MultiPartParser'):
                formparsers.MultiPartParser.max_files = 10000
                formparsers.MultiPartParser.max_fields = 10000
                logger.info("✅ patched starlette.formparsers matches")
        except ImportError:
            pass
            
    except ImportError:
        logger.warning("⚠️ Could not import 'multipart'. Is python-multipart installed?")
    except Exception as e:
        logger.warning(f"⚠️ Error applying multipart fix: {e}")

# Apply immediately on import
apply_multipart_fix()
