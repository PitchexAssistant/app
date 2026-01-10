import os
from typing import List, Optional
import structlog
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.messages import HumanMessage, SystemMessage
from langchain.tools import tool
from core.config import settings
from langchain_classic.memory import ConversationBufferMemory
# Imports the template from your existing folder
from Reasoning import utility


logger = structlog.get_logger()

# creating my reasnoning file as a useable module
class Reasoning:
    def __init__(self):
        logger.info("Initializing Reasoning")

        # initializing all the api's
        self.api_key = settings.GOOGLE_API_KEY
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
        # initializing vector store
        self.vector_store = Chroma(
            persist_directory="./chroma_db",
            embedding_function=self.embeddings_model)

        # initializing Tavily Search Tool (For networksearch)
        self.search_tool = TavilySearchResults(max_results = 3,
                            search_depth = "advanced", # or "basic"
                            api_wrapper_kwargs={
                            "tavily_api_key": self.tavily_api_key})

        # list of tools
        self.tools = [self.smart_RAG_search]

        # Bind tools to model so it can call them
        self.model_with_tools = self.model.bind_tools(self.tools)

        # initializing buffer memory for chat history
        self.memory = ConversationBufferMemory(memory_key="chat_history",
                                            return_messages=True,
                                            output_key="output"
                                            )
    def smart_RAG_search(self, user_prompt: str) -> str:
        """
        Searches an internal knowledge base first. 
        If relevant info is not found, performs a live web search using Tavily.
        """
        logger.info("smart_rag_search_activated", query=user_prompt)
        # Search Local DB
        relevant_docs = self.vector_store.similarity_search(user_prompt, k=3)
        
        if relevant_docs:
            logger.info("smart_search_found_local_docs")
            return "\n\n".join([doc.page_content for doc in relevant_docs])
        else:
            # Search Web
            logger.info("smart_search_using_web_search")
            try:
                search_results = self.search_tool.invoke(user_prompt)
                
                if search_results:
                    texts = [r['content'] for r in search_results]
                    metas = [{"source": "tavily_web_search"} for _ in texts]
                    
                    self.vector_store.add_texts(texts, metadatas=metas)
                    return "\n\n".join(texts)
            except Exception as e:
                logger.warning("web_search_failed", error=str(e))
                
            return "No relevant information was found."

    async def generate_response(self, user_input: str) -> str:
        """
        Fast Pipeline: Search -> Prompt -> Answer (Single LLM Call)
        """
        try:
            # 1. Load History
            memory_variables = self.memory.load_memory_variables({})
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
            
            # 4. Save to Memory
            self.memory.save_context(
                {"input": user_input},
                {"output": response.content}
            )
            
            return response.content
                
        except Exception as e:
            logger.error("reasoning_generation_failed", error=str(e))
            raise e