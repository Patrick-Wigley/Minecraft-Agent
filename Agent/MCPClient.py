import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

class MCPClientHandler:
    def __init__(self, **stdio_server_params):
        self.server_params = StdioServerParameters(**stdio_server_params)
        
        # This will hold your ready-to-use session variable
        self.session: ClientSession | None = None
        
        # Lifecycle controls
        self._background_loop_task: asyncio.Task | None = None
        self._ready_event = asyncio.Event()

    async def start(self):
        """Spawns the background session thread and awaits full initialization."""
        print("Launching background MCP connection manager...")
        self._background_loop_task = asyncio.create_task(self._run_persistent_session())
        
        # Wait completely until the protocol handshake finishes inside the loop
        await self._ready_event.wait()
        print("Client class is initialized")

    async def _run_persistent_session(self):
        """Keeps the context loop active in a controlled background task."""
        try:
            async with stdio_client(self.server_params) as (read_stream, write_stream):
                async with ClientSession(read_stream, write_stream) as session:
                    self.session = session
                    
                    await self.session.initialize()
                    
                    self._ready_event.set()
                    
                    while True:
                        await asyncio.sleep(3600)  # 1 hour
                        
        except asyncio.CancelledError:
            print("Background connection task safely interrupted.")
        except Exception as e:
            print(f"Connection dropped: {e}")
            self._ready_event.set()  # Prevent start() from waiting forever on failure

    async def stop(self):
        """Cancels the background context block, killing the server cleanly."""
        if self._background_loop_task:
            print("Winding down connection loops...")
            self._background_loop_task.cancel()
            try:
                await self._background_loop_task
            except asyncio.CancelledError:
                pass
        self.session = None
        self._ready_event.clear()

    # ---- Any other method can now interact directly with self.session ----
    async def get_tools_flatly(self):
        if not self.session:
            raise RuntimeError("MCP Session is not live")
            
        response = await self.session.list_tools()
        return [tool.name for tool in response.tools]


# --- Usage Example ---
async def main():
    client = MCPClientHandler(
            command="D:\\Patrick\\Dev\\AI\\Minecraft-LLM-Mod\\MCP\\builds\\MCTools.exe",
            args=[],
            env={"MCAGENT_PORT": "25565"}
        )
    
    try:
        await client.start()
      
        print(f"Session object memory location: {client.session}")

        tools = await client.get_tools_flatly()
        print(f"Discovered server tools: {tools}")
        
    finally:
        await client.stop()

if __name__ == "__main__":
    asyncio.run(main())
