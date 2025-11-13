"""
Document upload and management endpoints
Handles business proposal PDF uploads (max 2 per session)
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import List, Optional
import structlog

from services.context_service import get_context_service

logger = structlog.get_logger()
router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    session_id: str = Form(...),
    file_index: int = Form(...)
):
    """
    Upload a business proposal PDF
    
    Maximum 2 PDFs per session (file_index: 0 or 1)
    Maximum file size: 10MB
    
    Args:
        file: PDF file to upload
        session_id: Session identifier
        file_index: File slot (0 or 1)
    
    Returns:
        Upload status and document metadata
    """
    try:
        # Validate file type
        allowed_extensions = ('.pdf', '.docx')
        if not file.filename.lower().endswith(allowed_extensions):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF and DOCX files are allowed"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Process with context service
        context_service = get_context_service()
        result = await context_service.upload_pdf(
            file_content=file_content,
            filename=file.filename,
            session_id=session_id,
            file_index=file_index
        )
        
        if not result["success"]:
            status_code = status.HTTP_400_BAD_REQUEST
            
            # Check for specific error types
            error_msg = result.get("error", "")
            if "exceeds maximum" in error_msg or "File size" in error_msg:
                status_code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            elif "already occupied" in error_msg:
                status_code = status.HTTP_409_CONFLICT
            
            raise HTTPException(status_code=status_code, detail=result["error"])
        
        logger.info(
            "document_uploaded",
            session_id=session_id,
            filename=file.filename,
            file_index=file_index,
            file_id=result["file_id"]
        )
        
        return {
            "success": True,
            "message": "Document uploaded and processed successfully",
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "document_upload_error",
            session_id=session_id,
            filename=file.filename if file else "unknown",
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )


@router.get("/context/{session_id}")
async def get_session_context(session_id: str):
    """
    Get context information for a session
    
    Args:
        session_id: Session identifier
    
    Returns:
        Session context with uploaded documents info
    """
    try:
        context_service = get_context_service()
        context = context_service.get_context(session_id)
        
        if not context:
            return {
                "success": True,
                "session_id": session_id,
                "files": {},
                "total_files": 0,
                "message": "No documents uploaded yet"
            }
        
        return {
            "success": True,
            "data": context
        }
        
    except Exception as e:
        logger.error("get_context_error", session_id=session_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve context: {str(e)}"
        )


@router.post("/search")
async def search_context(
    session_id: str = Form(...),
    query: str = Form(...),
    top_k: int = Form(5)
):
    """
    Search uploaded documents using semantic similarity
    
    Args:
        session_id: Session identifier
        query: Search query
        top_k: Number of results to return
    
    Returns:
        Relevant document chunks with similarity scores
    """
    try:
        context_service = get_context_service()
        results = await context_service.search_context(
            session_id=session_id,
            query=query,
            top_k=top_k
        )
        
        return {
            "success": True,
            "query": query,
            "results": results,
            "total_results": len(results)
        }
        
    except Exception as e:
        logger.error("search_context_error", session_id=session_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search context: {str(e)}"
        )


@router.delete("/file")
async def delete_file(
    session_id: str = Form(...),
    file_index: int = Form(...)
):
    """
    Delete a specific file from session
    
    Args:
        session_id: Session identifier
        file_index: File slot to delete (0 or 1)
    
    Returns:
        Deletion status
    """
    try:
        context_service = get_context_service()
        result = context_service.delete_file(session_id, file_index)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        
        logger.info(
            "file_deleted",
            session_id=session_id,
            file_index=file_index,
            deleted_file=result["deleted_file"]
        )
        
        return {
            "success": True,
            "message": f"File deleted successfully",
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("delete_file_error", session_id=session_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )


@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """
    Delete all documents for a session
    
    Args:
        session_id: Session identifier
    
    Returns:
        Deletion status
    """
    try:
        context_service = get_context_service()
        result = context_service.delete_session(session_id)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        
        logger.info("session_deleted", session_id=session_id)
        
        return {
            "success": True,
            "message": "Session context deleted successfully",
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("delete_session_error", session_id=session_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete session: {str(e)}"
        )
