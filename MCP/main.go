package main

import (
	"context"
	"fmt"

	// Using Mark lab
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

func main() {
	ser := server.NewMCPServer(
		"MCTools",
		"1.0.0",
	)

	// Attach Tools
	templateTool := mcp.NewTool("Tool1",
		mcp.WithDescription("Description"),
		// // Example of parameters (if this was a calculator, "add", "sub", "mul")
		// mcp.WithString("A Requring Parameter",
		// 	mcp.Required(),
		// 	mcp.Description("..."),
		// 	mcp.Enum("Option1", "Option2", "Option3"),
		// ),
	)
	ser.AddTool(templateTool, tool1)

	// Begin to serve
	if err := server.ServeStdio(ser); err != nil {
		fmt.Printf("Server Error: %v\n", err)
	}

}

// Just for future reference
func tool1(ctx context.Context, req mcp.CallToolRequest,
) (*mcp.CallToolResult, error) {
	return mcp.NewToolResultText("Successfully Executed tool1"), nil
}
