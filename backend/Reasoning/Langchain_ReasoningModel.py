import utility
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.messages import HumanMessage, SystemMessage
from langchain.tools import tool
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_community.vectorstores import Chroma # private and fast search vector store
from langchain_community.embeddings import HuggingFaceEmbeddings # for local embedding model
from langchain_classic.memory import ConversationBufferMemory
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_core.runnables import RunnablePassthrough
# from langchain_core.output_parsers import StrOutputParser
# from langchain.agents import initialize_agent, AgentType
# from langchain.chains import LLMChain

from dotenv import load_dotenv
import os
load_dotenv()

#++++++++++++++++++++++++++++++++++++++++++++
# ----- Initializations for use --------
#++++++++++++++++++++++++++++++++++++++++++++

API_key = os.getenv("API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# 1. initializing reasoning model
model_name = "gemini-2.5-flash"
model = ChatGoogleGenerativeAI(model = model_name,
                                google_api_key = API_key,
                                verbose = False,
                                temperature = 0.7)

# 2. initializing embedding creation model (using a local model for cost efficiency and speed)
embedding_model_name = "all-MiniLM-L6-v2"
embedding_model_kwargs = {"device": "cpu"}
embeddings_model = HuggingFaceEmbeddings(model_name=embedding_model_name,
                                        model_kwargs=embedding_model_kwargs)

# 3. Initializing vector store (Chroma)
vector_store = Chroma(
    persist_directory="./chroma_db",
    embedding_function=embeddings_model)

# 4. initializing Tavily Search Tool (For networksearch)
search_tool = TavilySearchResults(max_results = 3,
                            search_depth = "advanced", # or "basic"
                            api_wrapper_kwargs={
                            "tavily_api_key": TAVILY_API_KEY})

#++++++++++++++++++++++++++++++++++++++++++++
# ----------- Functionalities ---------------
#++++++++++++++++++++++++++++++++++++++++++++

# searches RAG, if similar data to query not found, does web search and updates vector store
@tool
def smart_RAG_search(user_prompt: str) -> str:
    """
    Searches an internal knowledge base (a vector database) first for fast, curated answers. 
    If relevant information is not found in the internal notes, this tool will then perform a live web search using Tavily to find up-to-the-minute information. 
    New information found on the web is automatically saved to the internal knowledge base for future use. 
    Use this tool for any questions about market trends, specific companies, financial data, competitive analysis, or recent news.
    """
    print(f"\n>> [Smart Search Activated]: Checking internal notes for '{user_prompt}'...")
    relevant_docs = vector_store.similarity_search(user_prompt, k=3)
    
    if relevant_docs:
        print(">> [Smart Search]: Found relevant info in local notes. Using that.")
        context = "\n\n".join([doc.page_content for doc in relevant_docs])
        return context
    else:
        print("\n>> [Smart Search]: No relevant documents found. Doing a web search...")
        # This returns a list of dictionaries: [{'content': '...'}, {'content': '...'}]
        search_results = search_tool.invoke(user_prompt)
        
        # --- THIS IS THE KEY FIX ---
        if search_results:
            # 1. Extract just the 'content' string from each dictionary in the list.
            #    This creates the LIST OF STRINGS that add_texts requires.
            texts_to_add = [result['content'] for result in search_results]
            
            # 2. Create corresponding metadata for each new text chunk.
            metadatas_to_add = [{"source": "tavily_web_search"} for _ in texts_to_add]

            print(f">> [Smart Search]: Found {len(texts_to_add)} new snippets. Adding to notes for next time.")
            
            # 3. Add the correctly formatted list of strings to the vector store.
            vector_store.add_texts(texts=texts_to_add, metadatas=metadatas_to_add)
            
            # 4. Return a single, clean string of context to the agent.
            return "\n\n".join(texts_to_add)
        else:
            return "No relevant information was found from a web search."

def main():
    
    # list of tools
    tools = [smart_RAG_search]

    # Bind tools to model so it can call them
    model_with_tools = model.bind_tools(tools)

    # initializing buffer memory for chat history
    memory = ConversationBufferMemory(memory_key="chat_history",
                                    return_messages=True,
                                    output_key="output"
                                    )

    while True:
        user_input = input("\nEnter your question (or type 'exit' to quit): ")
        if user_input.lower() == 'exit':
            break
        
        try:
           
           # Get conversation history from memory
            memory_variables = memory.load_memory_variables({})
            chat_history = memory_variables.get("chat_history", [])
            
            # Format chat history as text for the prompt
            if chat_history:
                history_text = "\n".join([
                    f"{msg.type}: {msg.content}" for msg in chat_history[-4:]  # Last 4 messages
                ])
            else:
                history_text = "No previous conversation."
            
            # Step 1: Let the model decide if it needs to use tools
            print("\n[Processing your question...]")
            
            # First LLM call - model decides if it needs tools
            response = model_with_tools.invoke([
                SystemMessage(content=utility.Simplified_Agent_template.format(
                    context="",
                    chat_history=history_text,
                    input=user_input
                )),
                HumanMessage(content=user_input)
            ])
            
            # Step 2: Check if model wants to use tools
            if hasattr(response, 'tool_calls') and response.tool_calls:
                print("\n[Model is gathering information...]")
                
                # Execute the tool calls
                tool_results = []
                for tool_call in response.tool_calls:
                    if tool_call['name'] == 'smart_RAG_search':
                        result = smart_RAG_search.invoke(tool_call['args'])
                        tool_results.append(result)
                
                context = "\n\n".join(tool_results)
                
                # Step 3: Second LLM call with tool results
                final_response = model.invoke([
                    SystemMessage(content=utility.Simplified_Agent_template.format(
                        context=context,
                        chat_history=history_text,
                        input=user_input
                    )),
                    HumanMessage(content=user_input)
                ])
                
                print(f"\n{final_response.content}\n")
                response_text = final_response.content
            else:
                # Model didn't need tools
                print(f"\n{response.content}\n")
                response_text = response.content
            
            # Save conversation to memory (ensure response_text is a string)
            memory.save_context(
                {"input": user_input},
                {"output": str(response_text)}
            )
            
            print(f"[Memory Updated] Total messages in history: {len(memory.chat_memory.messages)}")
            
        except Exception as e:
            print(f"\nError: {str(e)}\n")
            import traceback
            traceback.print_exc()

        

if __name__ == "__main__":
    main()



