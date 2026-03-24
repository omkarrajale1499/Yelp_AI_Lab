import os
import json
from langchain_community.chat_models import ChatOllama
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.agents import initialize_agent, AgentType

def generate_restaurant_recommendation(message: str, history_text: str, user_prefs: dict, db_context: str) -> dict:
    """
    Handles the heavy lifting of communicating with Llama 3.1 via LangChain.
    Returns a dictionary containing the AI's response and recommendations.
    """
    try:
        llm = ChatOllama(model="llama3.1:latest", temperature=0.1)
        
        tools = []
        if os.getenv("TAVILY_API_KEY"):
            tools.append(TavilySearchResults(max_results=2))
            
        system_prompt = f"""
        You are a highly helpful, conversational restaurant discovery assistant for YelpAI.
        User's Dining Preferences: {json.dumps(user_prefs)}
        Recent Conversation History:
        {history_text}
        
        {db_context}
        
        Instructions:
        1. Analyze the user's message: "{message}"
        2. Check the 'Available Database Restaurants'. If there is a matching restaurant, YOU MUST USE IT and DO NOT use the Tavily tool.
        3. ONLY use Tavily if the user asks for real-time news or events.
        
        CRITICAL FORMATTING INSTRUCTION:
        Your FINAL output must ALWAYS be a raw JSON object with EXACTLY these two keys: "response" and "recommendations". 
        Do NOT output an "action" key. 
        """
        
        agent = initialize_agent(
            tools=tools,
            llm=llm,
            agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True,
            max_iterations=3,
            handle_parsing_errors=True
        )
        
        result = agent.run(system_prompt)
        
        # Defensive Parsing Logic
        parsed_result = None
        if isinstance(result, dict):
            parsed_result = result
        else:
            clean_result = result.strip()
            if "```json" in clean_result:
                clean_result = clean_result.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_result:
                clean_result = clean_result.split("```")[1].strip()
            parsed_result = json.loads(clean_result)
            
        if "response" not in parsed_result or "recommendations" not in parsed_result:
            raise ValueError(f"LLM returned an invalid schema: {parsed_result}")
            
        return parsed_result
        
    except Exception as e:
        print(f"AI Service Error: {e}")
        # Fallback dictionary if the LLM crashes
        return {
            "response": "I'm having a little trouble formatting my thoughts right now! Could you try asking that in a slightly different way?",
            "recommendations": []
        }