from typing import Any, Union
import time
VERBOSE = False
# Ollama running local model - Try OPENAI, antropic or other online models too


# Langgraph for stateful memory saving & invoking (searching relevant past experience)

# Local STDIO MCP Tools (Go Tools)
from ollama import AsyncClient, Message
import asyncio
from MCPClient import MCPClientHandler

class OllamaAgent:

    def __init__(self, name:str="QwenCrafter"):
        self.AGENT_NAME = name

        self.BASE_MESSAGE_TEMPLATE = {
            "role": "system",
            "content": 
                f"""# Your name is "{self.AGENT_NAME}". You're an actual in-game player in minecraft. Infact, you are your OWN PLAYER, your players location is your location, your players hunger is your hunger and so on.
            
                ## Core Directive
                You are NOT an AI assisant, modding assistant, a developer tool, nor an AI helper sitting outside the game. You are an actual human player inside the Minecraft world. You have control over your body in the game, and your only way to interact with the world is by using the available tools.
            
                ## Rules of Engagement:
                1. Never make anything up about "where you are", "what you see", "what you are doing" and etc. If you cannot see anything due to a lack of incoming information (from tools or prompts), be honest and say that. You must rely on your available tool calls to give you this information, if they are not yet available, say so.
                2. Always speak as if you are standing in a blocks-based world (e.g., "I see a tree in front of me", NOT "According to the tool payload...").
                3. Tools are your sensory inputs, if you use a tool such as "find blocks", this is coming from your eyes, nose and ears ingame. Use them as often as possible, don't always rely on the user to prompt tool use, keep observing your environment 
                4. Your goal is survival, exploration, and progression in the minecraft world. Learning as you go.
                5. Never mention code, MCP Tool binaries, APIs, or files to the user or other players."""
        }
                

        self._OLLAMA_HOST = "http://127.0.0.1:11434"
        self.MODEL = "qwen3.5:2b"

        self.memory = [self.BASE_MESSAGE_TEMPLATE]
        self._loaded_tools = []

        # NEED CLOSING WHEN DONE __AEXIT__() - Opened without with for persistence during runtime
        self._mcp_client:Union[MCPClientHandler, None] = None

        print("CONNECTING TO OLLAMA")
        self.ollama_client = AsyncClient(host=self._OLLAMA_HOST)
        print("CONNECTED")

        print("SETTING UP TOOLS")
        print("FINISHED SETTING UP TOOLS")


        # Ingame stuff
        self.new_chats = asyncio.Queue()


        # activate begins
        self.activate()

    def update_content_history(self, role:str, content:str, tools_called:Union[Any, None] = None):
        # Inputs from "assistant", "user" and, can do "game" to let the model know "you are getting low on hunger" or "you are low on health" (unsolicited game information)

        new_msg = { "role": role, "content": content }
        if tools_called: new_msg["tools_called"] = tools_called
        self.memory.append(new_msg)


    def update_content_history_with_tool_result(self, content, tool_used):
        self.memory.append({
            "role": "tool",
            "content": content,
            "name": tool_used
        })


    async def setup_tools(self,):
        self._mcp_client = MCPClientHandler(
            command="D:\\Patrick\\Dev\\AI\\Minecraft-LLM-Mod\\MCP\\builds\\MCTools.exe",
            args=[],
            env={"MCAGENT_PORT": "25565"}
        )
        try:
            # 1. One flat initialization call
            await self._mcp_client.start()
            
            # 2. Variable is now accessible as a regular property anywhere else
            print(f"Session object memory location: {self._mcp_client.session}")
            
            # 3. Call your methods with zero nested indenting
            tools = await self._mcp_client.get_tools_flatly()
            print(f"Discovered server tools: {tools}")

        except:
            pass
            

        mcp_tools = await self._mcp_client.session.list_tools()
        print(f"{len(mcp_tools.tools)} Tools Registered:\n")

        for tool in mcp_tools.tools:
            self._loaded_tools.append({
                "type": "function",
                "function": {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.input_schema
                }
            })
            if VERBOSE: print(f"{tool.name}: {tool.description}\n{tool.input_schema}\n")


    async def _stop(self,):
        # Cleanup
        await self._mcp_client.stop()

    async def _listen_for_outside(self,):
        """ Ears - Taking in user speaking """
        print("👂Ears are listening👂")

        while True:
            await asyncio.sleep(2)
            new_chats = await self.handle_tool_call("checkChat", save_to_history=False)
            if new_chats != "":
                print(F"🗣️New chats: {new_chats}🗣️")
                await self.new_chats.put(new_chats)



    async def _brain(self,):
        operating_solo:bool = True
        print("🧠Brain Awaken🧠")

        while True:
            if operating_solo:

                # External
                while not self.new_chats.empty():
                    new_chat_to_observe = await self.new_chats.get()
                    print("👂Listening to message(s)👂")
                    self.memory.append({
                        "role": "user",
                        "content": f"[Incoming Message(s)]: {new_chat_to_observe}"
                    })

                # Internal
                response = await self.ollama_client.chat(
                    model=self.MODEL,
                    messages=self.memory,
                    tools=self._loaded_tools
                )

                new_content = response.message
                if hasattr(new_content, "tool_calls") and "tool_calls" in new_content:
                    tool_calls:list[Message.ToolCall] = new_content["tool_calls"]
                
                    # Model is executing MC tool
                    self.update_content_history("assistant", new_content["thinking"], new_content["tool_calls"])
                    print(f"💭Tool Strategising💭:\n\n {new_content.thinking}")
                    print(f'🔨Agent is Calling tools🔨: {tool_calls}')

                    for agent_tool_call in tool_calls:
                        tool_name = agent_tool_call.function.name
                        tool_args = agent_tool_call.function.arguments
                        print(f"🔨Executing: {tool_name}, with: {tool_args} 🔨")

                        await self.handle_tool_call(tool_name, tool_args)
                        
                else:
                    # Model is just talking
                    self.update_content_history("assistant", new_content)
                    await self.handle_tool_call("chat", args={"message": new_content.content}, save_to_history=False)
                    print(f"💭:\n\n {new_content.thinking}💭")
                    print(f"💬:\n\n {new_content.content}💬")

                    break

        print("🧠Brain Shutting Off🧠")

    async def activate(self,):
        """ main function """

        await self.setup_tools()

        await asyncio.gather(
            self._brain(),
            self._listen_for_outside(),
        )
        
        

        await self._stop(); return


        # Make it so server side sends messages here and handle them when they arrive
        MSG_IN = False
        while True:
            # Await new incoming messages for now - later get agent doing its own stuff and have incoming messages as an interupt
            
            if not MSG_IN:
                ingame_msg = await self.handle_tool_call("checkChat", save_to_history=False)
                #print(f"'{ingame_msg}'")
                if ingame_msg != "":
                    # Use json to convert this string to dict
                    print(dict(ingame_msg))

                    MSG_IN = True
                    print("giving llm:" + f"{ingame_msg.username} said: {ingame_msg['message']}")
                    await self._handle_user_chat({"role": "user", "content": f"{ingame_msg['username']} said: {ingame_msg['message']}"})
                    MSG_IN = False


        await self._stop()
        


    async def _handle_user_chat(self, msg, **params):    
        print("LLM active")
        self.memory.append(msg)

        while True:
            response = await self.ollama_client.chat(
                model=self.MODEL,
                messages=self.memory,
                tools=self._loaded_tools
            )

            new_content = response.message
            if hasattr(new_content, "tool_calls") and "tool_calls" in new_content:
                tool_calls:list[Message.ToolCall] = new_content["tool_calls"]
            
                # Model is executing MC tool
                self.update_content_history("assistant", new_content["thinking"], new_content["tool_calls"])
                print(f"Tool Strategising💭:\n\n {new_content.thinking}")
                print(f'Agent is Calling tools: {tool_calls}')

                for agent_tool_call in tool_calls:
                    tool_name = agent_tool_call.function.name
                    tool_args = agent_tool_call.function.arguments
                    print(f"Executing: {tool_name}, with: {tool_args}")

                    await self.handle_tool_call(tool_name, tool_args)
                    
            else:
                # Model is just talking
                self.update_content_history("assistant", new_content)
                await self.handle_tool_call("chat", args={"message": new_content.content}, save_to_history=False)
                print(f"💭:\n\n {new_content.thinking}")
                print(f"💬:\n\n {new_content.content}")

                break


        # Retain Tool Call Information

    async def handle_tool_call(self, name, args={}, save_to_history=True):
        try:
            exec_result = await self._mcp_client.session.call_tool(
                name=name,
                arguments=args
            )

            for item in exec_result.content:
                if hasattr(item, "text"):
                    if save_to_history: self.update_content_history_with_tool_result(item.text, name)
                    return item.text 


        except Exception as e:
            print(f"[TOOL CALL ERROR]: {e}")
            if save_to_history: self.update_content_history_with_tool_result(f"TOOL CALL ERROR: {e}", name)
                    


async def environment():
    agent = OllamaAgent()
    await agent.activate()

if __name__ == "__main__":
    # DO NOT MAKE MORE SUBPROCESSES INSIDE THIS RUN - Will lose MCPClientHandler persitent session
    
    asyncio.run(environment())