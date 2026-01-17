import os
from typing import List, Optional
import structlog
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.documents import Document
from langchain.tools import tool
from core.config import settings
from langchain.memory import ConversationBufferMemory
# Imports the template from your existing folder
from Reasoning import utility


logger = structlog.get_logger()

# creating my reasnoning file as a useable module
class Reasoning:
    def __init__(self):
        logger.info("Initializing Reasoning")

        # initializing all the api's
        self.api_key = settings.GEMINI_API_KEY
        self.tavily_api_key = settings.TAVILY_API_KEY

        # initializing reasoning model
        self.model = ChatGoogleGenerativeAI(model = "gemini-2.5-flash",
                                            google_api_key = self.api_key,
                                            verbose = False,
                                            temperature = 0.7)
        # initializing embedding model
        self.embedding_model_name = "all-MiniLM-L6-v2"
        self.embedding_model_kwargs = {"device": "cpu"}
        self.embeddings_model = HuggingFaceEmbeddings(model_name=self.embedding_model_name,
                                                        model_kwargs=self.embedding_model_kwargs)
        # initializing vector store (Using FAISS instead of Chroma for Python 3.14 compatibility)
        self.vector_store_path = "./faiss_db"
        if os.path.exists(self.vector_store_path):
            self.vector_store = FAISS.load_local(
                self.vector_store_path, 
                self.embeddings_model,
                allow_dangerous_deserialization=True
            )
        else:
            # Create a dummy index to initialize
            self.vector_store = FAISS.from_texts(
                ["initialization"], 
                self.embeddings_model
            )
            self.vector_store.save_local(self.vector_store_path)

        # initializing Tavily Search Tool (For networksearch) - Only if API key is available
        self.search_tool = None
        if self.tavily_api_key:
            try:
                self.search_tool = TavilySearchResults(max_results = 3,
                                    search_depth = "advanced", # or "basic"
                                    api_wrapper_kwargs={
                                    "tavily_api_key": self.tavily_api_key})
                logger.info("tavily_search_initialized")
            except Exception as e:
                logger.warning("tavily_search_initialization_failed", error=str(e))
        else:
            logger.warning("tavily_api_key_not_set", message="Web search will be disabled")

        # list of tools
        self.tools = [self.smart_RAG_search]

        # Bind tools to model so it can call them
        self.model_with_tools = self.model.bind_tools(self.tools)

        # Session-based memory management for concurrent sessions
        self.session_memories: dict[str, ConversationBufferMemory] = {}

        # Keep default memory for backward compatibility
        self.memory = ConversationBufferMemory(memory_key="chat_history",
                                            return_messages=True,
                                            output_key="output"
                                            )

    def get_or_create_memory(self, session_id: str) -> ConversationBufferMemory:
        """Get existing memory for session or create new one"""
        if session_id not in self.session_memories:
            self.session_memories[session_id] = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True,
                output_key="output"
            )
            logger.info("created_session_memory", session_id=session_id)
        return self.session_memories[session_id]

    def clear_session(self, session_id: str):
        """Clear memory for a specific session"""
        if session_id in self.session_memories:
            del self.session_memories[session_id]
            logger.info("cleared_session_memory", session_id=session_id)

    def save_memory_to_dict(self, session_id: str) -> List[dict]:
        """Serialize session memory to JSON-compatible list for persistence"""
        if session_id not in self.session_memories:
            return []
        
        memory = self.session_memories[session_id]
        messages = memory.load_memory_variables({}).get("chat_history", [])

        # Convert to simple dicts for JSON serialization
        history = [
            {"role": "human" if msg.type == "human" else "ai", "content": msg.content}
            for msg in messages
        ][-20:]  # Keep last 20 messages max

        logger.info("saved_session_memory", session_id=session_id, message_count=len(history))
        return history

    def load_memory_from_dict(self, session_id: str, history: List[dict]):
        """Restore session memory from JSON data"""
        if not history:
            return

        memory = self.get_or_create_memory(session_id)

        # Clear existing and reload
        memory.clear()

        for msg in history:
            if msg.get("role") == "human":
                memory.chat_memory.add_user_message(msg.get("content", ""))
            else:
                memory.chat_memory.add_ai_message(msg.get("content", ""))

        logger.info("loaded_session_memory", session_id=session_id, message_count=len(history))

    def ingest_documents(self, documents: List[Document]):
        """
        Add new processed document chunks to the global vector store and persist to disk.
        """
        if not documents:
            return
            
        logger.info("ingesting_documents_to_global_rag", count=len(documents))
        
        # Add to existing vector store
        self.vector_store.add_documents(documents)
        
        # Persist to disk
        self.vector_store.save_local(self.vector_store_path)
        logger.info("global_rag_updated_and_saved", path=self.vector_store_path)

    def smart_RAG_search(self, user_prompt: str) -> str:
        """
        Searches an internal knowledge base first. 
        If relevant info is not found, performs a live web search using Tavily.
        """
        logger.info("smart_rag_search_activated", query=user_prompt)
        # Search Local DB
        relevant_docs = self.vector_store.similarity_search(user_prompt, k=3)
        
        # Check if any actual document content was found (ignore the 'initialization' dummy text)
        filtered_docs = [doc for doc in relevant_docs if doc.page_content != "initialization"]
        
        if filtered_docs:
            logger.info("smart_search_found_local_docs")
            return "\n\n".join([doc.page_content for doc in filtered_docs])
        else:
            # Search Web - only if Tavily is configured
            if self.search_tool is None:
                logger.info("smart_search_web_unavailable", message="Tavily API key not configured")
                return "No relevant information was found."
                
            logger.info("smart_search_using_web_search")
            try:
                search_results = self.search_tool.invoke(user_prompt)
                
                if search_results:
                    # Extract content strings for indexing
                    texts = []
                    if isinstance(search_results, list):
                        for res in search_results:
                            if isinstance(res, dict) and "content" in res:
                                texts.append(res["content"])
                            elif isinstance(res, str):
                                texts.append(res)
                    
                    if texts:
                        new_metas = [{"source": "tavily_web_search"} for _ in texts]
                        self.vector_store.add_texts(texts, metadatas=new_metas)
                        self.vector_store.save_local(self.vector_store_path)
                        return "\n\n".join(texts)
            except Exception as e:
                logger.warning("web_search_failed", error=str(e))
                
            return "No relevant information was found."

    async def generate_response(self, user_input: str, session_id: str = "default") -> str:
        """
        Fast Pipeline: Search -> Prompt -> Answer (Single LLM Call)

        Args:
            user_input: The user's message/transcript
            session_id: Session identifier for memory isolation
        """
        try:
            # 1. Load History (session-specific)
            memory = self.get_or_create_memory(session_id)
            # converting raw memory into text (for chat history)
            memory_variables = memory.load_memory_variables({})
            chat_history = memory_variables.get("chat_history", [])
            
            history_text = "No previous conversation."
            if chat_history:
                if isinstance(chat_history, list):
                    history_text = "\n".join([f"{msg.type}: {msg.content}" for msg in chat_history])
                else:
                    history_text = str(chat_history)

            # 2. Get Context (Programmatic Call)
            context = self.smart_RAG_search(user_input)

            # 3. SINGLE LLM Call
            logger.info("generating_answer_with_context")
            response = await self.model.ainvoke([
                SystemMessage(content=utility.Simplified_Agent_template.format(
                    context=context,
                    chat_history=history_text,
                    input=user_input
                )),
                HumanMessage(content=user_input)
            ])
            
            # 4. Save to Memory (session-specific)
            memory.save_context(
                {"input": user_input},
                {"output": response.content}
            )

            logger.info("reasoning_response_generated",
                       session_id=session_id,
                       response_length=len(response.content))
            return response.content
                
        except Exception as e:
            logger.error("reasoning_generation_failed", error=str(e))
            raise e

    async def generate_critique(self, user_input: str, session_id: str = "default") -> str:
        """
        Critique Pipeline: Search -> Critique Prompt -> JSON Answer
        Used for recorded sessions to provide deep feedback on tone, vocab, etc.
        """
        try:
            # 1. Get Context (Programmatic Call)
            context = self.smart_RAG_search(user_input)

            # 2. SINGLE LLM Call with Critique Template
            logger.info("generating_critique_with_context")
            response = await self.model.ainvoke([
                SystemMessage(content=utility.Critique_Template.format(
                    context=context,
                    input=user_input
                )),
                HumanMessage(content="Please analyze my pitch based on the criteria provided.")
            ])

            logger.info("critique_generated",
                       session_id=session_id,
                       response_length=len(response.content))
            return response.content
                
        except Exception as e:
            logger.error("critique_generation_failed", error=str(e))
            raise e


# Singleton instance for shared use across the application
_reasoning_instance: Optional[Reasoning] = None


def get_reasoning_instance() -> Reasoning:
    """Get or create singleton Reasoning instance"""
    global _reasoning_instance
    if _reasoning_instance is None:
        _reasoning_instance = Reasoning()
    return _reasoning_instance