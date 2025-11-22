"""
Business Context Management Service
Handles PDF upload, parsing, and context management for AI coaching
Maximum 2 PDFs per session
"""

import os
import hashlib
import structlog
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from pathlib import Path
import tempfile

# Document parsing libraries
import pypdf
from docx import Document as DocxDocument

# LangChain for text processing
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document

from core.config import settings

logger = structlog.get_logger()


class ContextService:
    """Service for managing business proposal contexts"""
    
    MAX_PDFS_PER_SESSION = 2
    MAX_FILE_SIZE_MB = 10
    MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
    ALLOWED_EXTENSIONS = {'.pdf', '.docx'}
    
    def __init__(self):
        self.upload_dir = Path("./uploads")
        self.upload_dir.mkdir(exist_ok=True)
        
        # Initialize embeddings
        try:
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=settings.GEMINI_API_KEY
            )
            logger.info("context_service_initialized")
        except Exception as e:
            logger.error("context_service_initialization_failed", error=str(e))
            self.embeddings = None
        
        # In-memory storage for session contexts
        # In production, use Redis or database
        self.session_contexts: Dict[str, Dict] = {}
    
    async def upload_pdf(
        self,
        file_content: bytes,
        filename: str,
        session_id: str,
        file_index: int = 0
    ) -> Dict:
        """
        Upload and process a business proposal document (PDF or DOCX)
        
        Args:
            file_content: Document file bytes
            filename: Original filename
            session_id: Session identifier
            file_index: Index of the file (0 or 1)
            
        Returns:
            Dictionary with upload status and metadata
        """
        try:
            # Validate input
            validation_result = self._validate_pdf_upload(
                file_content, filename, session_id, file_index
            )
            if not validation_result["valid"]:
                return {
                    "success": False,
                    "error": validation_result["error"],
                    "file_index": file_index
                }
            
            # Generate unique file ID
            file_id = self._generate_file_id(file_content, filename)
            
            # Save file temporarily
            temp_path = self._save_temp_file(file_content, file_id)
            
            try:
                # Extract text based on file type (PDF or DOCX)
                extracted_text = await self._extract_document_text(temp_path, filename)
                
                if not extracted_text or len(extracted_text.strip()) < 100:
                    return {
                        "success": False,
                        "error": "Document appears to be empty or contains no extractable text",
                        "file_index": file_index
                    }
                
                # Parse and structure the content
                structured_content = self._structure_content(extracted_text)
                
                # Create document chunks for vector storage
                documents = self._create_document_chunks(
                    extracted_text,
                    filename,
                    file_id
                )
                
                # Store context in session
                context_data = {
                    "file_id": file_id,
                    "filename": filename,
                    "file_index": file_index,
                    "upload_timestamp": datetime.utcnow().isoformat(),
                    "file_size": len(file_content),
                    "text_length": len(extracted_text),
                    "structured_content": structured_content,
                    "documents": documents,
                    "summary": self._create_summary(extracted_text)
                }
                
                # Initialize or update session context
                if session_id not in self.session_contexts:
                    self.session_contexts[session_id] = {
                        "files": {},
                        "vector_store": None,
                        "created_at": datetime.utcnow().isoformat()
                    }
                
                self.session_contexts[session_id]["files"][file_index] = context_data
                
                # Build/update vector store for semantic search
                await self._update_vector_store(session_id)
                
                logger.info(
                    "document_uploaded_successfully",
                    session_id=session_id,
                    file_id=file_id,
                    filename=filename,
                    text_length=len(extracted_text)
                )
                
                return {
                    "success": True,
                    "file_id": file_id,
                    "filename": filename,
                    "file_index": file_index,
                    "file_size": len(file_content),
                    "text_length": len(extracted_text),
                    "chunks_created": len(documents),
                    "summary": context_data["summary"],
                    "structured_content": {
                        "sections": len(structured_content.get("sections", [])),
                        "key_points": len(structured_content.get("key_points", []))
                    }
                }
                
            finally:
                # Clean up temporary file
                if temp_path.exists():
                    temp_path.unlink()
                    
        except Exception as e:
            logger.error(
                "pdf_upload_failed",
                session_id=session_id,
                filename=filename,
                error=str(e),
                error_type=type(e).__name__
            )
            return {
                "success": False,
                "error": f"Failed to process PDF: {str(e)}",
                "file_index": file_index
            }
    
    def _validate_pdf_upload(
        self,
        file_content: bytes,
        filename: str,
        session_id: str,
        file_index: int
    ) -> Dict:
        """Validate PDF upload request"""
        
        # Check file extension
        file_ext = Path(filename).suffix.lower()
        if file_ext not in self.ALLOWED_EXTENSIONS:
            return {
                "valid": False,
                "error": f"Invalid file type. Only PDF and DOCX files are allowed."
            }
        
        # Check file size
        if len(file_content) > self.MAX_FILE_SIZE_BYTES:
            return {
                "valid": False,
                "error": f"File size exceeds maximum limit of {self.MAX_FILE_SIZE_MB}MB"
            }
        
        if len(file_content) == 0:
            return {
                "valid": False,
                "error": "File is empty"
            }
        
        # Check file index
        if file_index not in [0, 1]:
            return {
                "valid": False,
                "error": "File index must be 0 or 1 (maximum 2 files allowed)"
            }
        
        # Check if session already has this file index
        if session_id in self.session_contexts:
            existing_files = self.session_contexts[session_id].get("files", {})
            if file_index in existing_files:
                return {
                    "valid": False,
                    "error": f"File slot {file_index + 1} is already occupied. Please delete it first."
                }
            
            # Check total file count
            if len(existing_files) >= self.MAX_PDFS_PER_SESSION:
                return {
                    "valid": False,
                    "error": f"Maximum {self.MAX_PDFS_PER_SESSION} files allowed per session"
                }
        
        return {"valid": True}
    
    async def _extract_pdf_text(self, pdf_path: Path) -> str:
        """
        Extract text from PDF using pypdf library
        """
        try:
            reader = pypdf.PdfReader(str(pdf_path))
            extracted_text = ""
            for page in reader.pages:
                extracted_text += page.extract_text()
            
            if not extracted_text.strip():
                raise ValueError("Could not extract text from PDF - file may be empty or contain only images")
            
            logger.info("pdf_extracted_successfully", length=len(extracted_text))
            return extracted_text
            
        except Exception as e:
            logger.error("pdf_extraction_failed", error=str(e))
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")
    
    async def _extract_docx_text(self, docx_path: Path) -> str:
        """
        Extract text from DOCX using python-docx library
        """
        try:
            doc = DocxDocument(str(docx_path))
            extracted_text = ""
            
            # Extract text from paragraphs
            for para in doc.paragraphs:
                if para.text.strip():
                    extracted_text += para.text + "\n"
            
            # Extract text from tables
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        if cell.text.strip():
                            extracted_text += cell.text + " "
                    extracted_text += "\n"
            
            if not extracted_text.strip():
                raise ValueError("Could not extract text from DOCX - file may be empty")
            
            logger.info("docx_extracted_successfully", length=len(extracted_text))
            return extracted_text
            
        except Exception as e:
            logger.error("docx_extraction_failed", error=str(e))
            raise ValueError(f"Failed to extract text from DOCX: {str(e)}")
    
    async def _extract_document_text(self, file_path: Path, filename: str) -> str:
        """
        Extract text from document (PDF or DOCX) based on file extension
        """
        file_ext = filename.lower().split('.')[-1]
        
        if file_ext == 'pdf':
            return await self._extract_pdf_text(file_path)
        elif file_ext == 'docx':
            return await self._extract_docx_text(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")
    
    def _structure_content(self, text: str) -> Dict:
        """Structure extracted text into sections and key points"""
        lines = text.split('\n')
        
        sections = []
        key_points = []
        current_section = {"title": "Introduction", "content": ""}
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Detect section headers (simple heuristic)
            if len(line) < 100 and (
                line.isupper() or 
                line.endswith(':') or
                any(keyword in line.lower() for keyword in [
                    'executive summary', 'problem', 'solution', 
                    'market', 'business model', 'team', 'financial',
                    'introduction', 'overview', 'conclusion'
                ])
            ):
                if current_section["content"]:
                    sections.append(current_section)
                current_section = {"title": line, "content": ""}
            else:
                current_section["content"] += line + " "
                
                # Extract key points (lines starting with bullet or number)
                if line.startswith(('•', '-', '*', '1.', '2.', '3.')):
                    key_points.append(line)
        
        if current_section["content"]:
            sections.append(current_section)
        
        return {
            "sections": sections[:20],  # Limit to 20 sections
            "key_points": key_points[:50]  # Limit to 50 key points
        }
    
    def _create_document_chunks(
        self,
        text: str,
        filename: str,
        file_id: str
    ) -> List[Document]:
        """Create document chunks for vector storage"""
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        
        chunks = text_splitter.split_text(text)
        
        documents = []
        for i, chunk in enumerate(chunks):
            doc = Document(
                page_content=chunk,
                metadata={
                    "source": filename,
                    "file_id": file_id,
                    "chunk_index": i,
                    "total_chunks": len(chunks)
                }
            )
            documents.append(doc)
        
        logger.info("document_chunks_created", filename=filename, chunks=len(documents))
        return documents
    
    def _create_summary(self, text: str, max_length: int = 500) -> str:
        """Create a brief summary of the document"""
        # Take first significant portion
        summary = text[:max_length].strip()
        if len(text) > max_length:
            summary += "..."
        return summary
    
    async def _update_vector_store(self, session_id: str):
        """Build or update FAISS vector store for the session"""
        if not self.embeddings:
            logger.warning("embeddings_not_available_skipping_vector_store")
            return
        
        try:
            session = self.session_contexts.get(session_id)
            if not session:
                return
            
            # Collect all documents from all files
            all_documents = []
            for file_data in session["files"].values():
                all_documents.extend(file_data["documents"])
            
            if not all_documents:
                return
            
            # Create vector store
            vector_store = FAISS.from_documents(all_documents, self.embeddings)
            session["vector_store"] = vector_store
            
            logger.info(
                "vector_store_updated",
                session_id=session_id,
                total_documents=len(all_documents)
            )
            
        except Exception as e:
            logger.error("vector_store_update_failed", session_id=session_id, error=str(e))
    
    def get_context(self, session_id: str) -> Optional[Dict]:
        """Get full context for a session"""
        session = self.session_contexts.get(session_id)
        if not session:
            return None
        
        files_info = {}
        for idx, file_data in session["files"].items():
            files_info[idx] = {
                "filename": file_data["filename"],
                "file_id": file_data["file_id"],
                "upload_timestamp": file_data["upload_timestamp"],
                "text_length": file_data["text_length"],
                "summary": file_data["summary"]
            }
        
        return {
            "session_id": session_id,
            "files": files_info,
            "total_files": len(files_info),
            "created_at": session["created_at"]
        }
    
    async def search_context(
        self,
        session_id: str,
        query: str,
        top_k: int = 5
    ) -> List[Dict]:
        """Search context using semantic similarity"""
        session = self.session_contexts.get(session_id)
        if not session or not session.get("vector_store"):
            return []
        
        try:
            vector_store = session["vector_store"]
            results = vector_store.similarity_search_with_score(query, k=top_k)
            
            formatted_results = []
            for doc, score in results:
                formatted_results.append({
                    "content": doc.page_content,
                    "score": float(score),
                    "source": doc.metadata.get("source"),
                    "chunk_index": doc.metadata.get("chunk_index")
                })
            
            return formatted_results
            
        except Exception as e:
            logger.error("context_search_failed", session_id=session_id, error=str(e))
            return []
    
    def get_full_context_text(self, session_id: str) -> str:
        """Get concatenated text from all uploaded PDFs"""
        session = self.session_contexts.get(session_id)
        if not session:
            return ""
        
        full_text = ""
        for file_data in session["files"].values():
            full_text += f"\n\n=== {file_data['filename']} ===\n\n"
            for section in file_data["structured_content"]["sections"]:
                full_text += f"\n{section['title']}\n{section['content']}\n"
        
        return full_text
    
    async def get_session_context(self, session_id: str, max_length: int = 4000) -> Optional[str]:
        """
        Get session context for AI analysis
        Returns concatenated text from all uploaded documents, truncated to max_length
        """
        session = self.session_contexts.get(session_id)
        if not session or not session.get("files"):
            return None
        
        context_parts = []
        for file_data in session["files"].values():
            context_parts.append(f"=== {file_data['filename']} ===")
            context_parts.append(file_data.get("summary", ""))
            
            # Add first chunk of actual content if available
            if file_data.get("documents") and len(file_data["documents"]) > 0:
                context_parts.append(file_data["documents"][0].page_content)
        
        full_context = "\n\n".join(context_parts)
        
        # Truncate if too long
        if len(full_context) > max_length:
            full_context = full_context[:max_length] + "\n\n[... content truncated ...]"
        
        logger.info(
            "session_context_retrieved",
            session_id=session_id,
            context_length=len(full_context),
            files_count=len(session["files"])
        )
        
        return full_context
    
    def delete_file(self, session_id: str, file_index: int) -> Dict:
        """Delete a specific file from session"""
        session = self.session_contexts.get(session_id)
        if not session:
            return {"success": False, "error": "Session not found"}
        
        if file_index not in session["files"]:
            return {"success": False, "error": "File not found"}
        
        deleted_file = session["files"].pop(file_index)
        
        # Rebuild vector store if files remain
        if session["files"]:
            # This should be async but keeping simple for now
            import asyncio
            try:
                asyncio.create_task(self._update_vector_store(session_id))
            except:
                pass
        else:
            session["vector_store"] = None
        
        logger.info(
            "file_deleted",
            session_id=session_id,
            file_index=file_index,
            filename=deleted_file["filename"]
        )
        
        return {
            "success": True,
            "deleted_file": deleted_file["filename"],
            "remaining_files": len(session["files"])
        }
    
    def delete_session(self, session_id: str) -> Dict:
        """Delete entire session context"""
        if session_id in self.session_contexts:
            session = self.session_contexts.pop(session_id)
            logger.info("session_deleted", session_id=session_id)
            return {
                "success": True,
                "deleted_files": len(session["files"])
            }
        return {"success": False, "error": "Session not found"}
    
    def _generate_file_id(self, content: bytes, filename: str) -> str:
        """Generate unique file ID based on content hash"""
        hash_obj = hashlib.sha256()
        hash_obj.update(content)
        hash_obj.update(filename.encode())
        return hash_obj.hexdigest()[:16]
    
    def _save_temp_file(self, content: bytes, file_id: str) -> Path:
        """Save file temporarily for processing"""
        temp_path = self.upload_dir / f"{file_id}.pdf"
        with open(temp_path, 'wb') as f:
            f.write(content)
        return temp_path


# Singleton instance
_context_service_instance = None


def get_context_service() -> ContextService:
    """Get singleton instance of ContextService"""
    global _context_service_instance
    if _context_service_instance is None:
        _context_service_instance = ContextService()
    return _context_service_instance
