# An Agent in Minecraft Project
## Agent Code 
### Current setup (17/09/2026)
Simple self-coded python based agent

- Purely local (Ollama)
- Knowledge limited to LLM & previous thinking, tool calls & user/system messages withing context window limit


### In progess
- Can utilise the new, fast & efficient decision model "Jev" released the other day by TypeSafe. Although only limited to 50 uses a day

- LangChain & LangGraph based agent
- Using Neo4J & converting LLM thoughts into entities & relationships (knowledge graph)
    - 1. For reteiving details about progressing in the game
    - 2. For remembering important things within the game/world instance

    Invoked when player agent needs ingame knowledge


## Tool
### Current Setup (17/09/2026)
- Mineflayer API
    - Received GET for handling incoming tool calls on minecraft side
- MCP Tools in Go. 
    - Compiled as STDIO
    - Handles tool calls on agent side, pushes corresponding tool call to API sides tool call listener


## Configurations

### Ports
Mineflayer Bot: 3000

Minecraft LAN: 43412
