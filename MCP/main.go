package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"time"


	// Using Mark lab
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	// API
	"net/http"
	"strconv"
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

func main() {
	ser := server.NewMCPServer(
		"MC_INTERFACE",
		"1.0.0",
	)

	// Attach Tools
	// ActionJump := mcp.NewTool("Jump",
	// 	mcp.WithDescription("Make your minecraft player jump in game"),
	// 	// Example of parameters (if this was a calculator, "add", "sub", "mul")
	// 	mcp.WithInteger("Jump Count",
	// 		mcp.Description("Specify how many consecative jumps to perform - Type:Integer, Default:1"),
	// 		mcp.DefaultNumber(1),
	// 		//mcp.Enum("Option1", "Option2", "Option3"),
	// 	),
	// )

	Chat := mcp.NewTool("chat",
		mcp.WithDescription("Send a chat in-game"),
		// Example of parameters (if this was a calculator, "add", "sub", "mul")
		mcp.WithString("text",
			mcp.Required()
			mcp.Description("text to display ingame (string)"),
		),
	)
	


	ser.AddTool(Chat)
	ser.AddTool(ActionJump, InGameMechanic_Jump)

	// Begin to serve
	if err := server.ServeStdio(ser); err != nil {
		fmt.Printf("Server Error: %v\n", err)
	}
}


/* TOOLS */
/* API Tools */
func API_GET(page string, q map[string]string) {
	queryStr := ""
	// Prep URL Query Parameters
	for key, val := range q {
		queryStr = queryStr + key + "=" + val + "&"
	}

	// Currently, the Receiver in game client isnt setup to serve any data back.
	client := &http.Client{Timeout: 3 * time.Second}
	fmt.Println("Sending GET...")
	URL := fmt.Sprintf("http://127.0.0.1:8080/%s?%s", page, queryStr)
	response, err := client.Get(URL)
	fmt.Println("Sent GET")
	if err != nil {
		fmt.Printf("Req Failed: %s\n", err)
		return
	}

	defer response.Body.Close()

	// //- Not yet Implemented
	// // Read the response body
	body, err := io.ReadAll(response.Body)
	if err != nil {
		fmt.Printf("Failed to read body: %s\n", err)
		return
	}

	// Print the status code and body
	fmt.Printf("Status: %s\n", response.Status)
	fmt.Println(string(body))
}

/* Specific */

func Chat(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	text, err := req.RequireString("text")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	} else {

		GETParams := map[string]string{
			"quantity": strconv.Itoa(quantity),
		}
		API_GET("jump", GETParams)
		return mcp.NewToolResultText("Successfully Sent message action to game"), nil
	}
}

func InGameMechanic_Jump(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	quantity, err := req.RequireInt("Jump Count")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	} else {

		GETParams := map[string]string{
			"quantity": strconv.Itoa(quantity),
		}
		API_GET("jump", GETParams)
		return mcp.NewToolResultText("Successfully Sent Jump Action to game"), nil
	}
}

func GetMCData(ctx context.Context, req mcp.CallToolRequest) {
	// Get ingame states (player location, mainplayer location, time of day, etc)

}

func InputMCData(ctx context.Context, req mcp.CallToolRequest) {
	// Move player, attack, go to location, (do something in game)
}
