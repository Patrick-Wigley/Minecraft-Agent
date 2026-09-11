package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"strings"
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

	ChatAction := mcp.NewTool("chat",
		mcp.WithDescription("Send a chat in-game"),
		mcp.WithString("message",
			mcp.Required(),
			mcp.Description("message to display ingame (string)"),
		),
	)
	MoveAction := mcp.NewTool("move",
		mcp.WithDescription("Request your in-game player to begin travelling to the specified coordinates - Takes arguments: x, y, z - NOTE: This tool is asyncronous ingame, this tool does not wait for the player to reach the destination, instead it sets a goal and your player will begin traversing; You can check your players location & travelling status by calling the status tool - Also, your ingame player will attempt to break blocks in the way while travelling. If the coordinates you specify has a block(s), your player will break the block(s) to stand their at your specified coordinates"),
		mcp.WithNumber("x",
			mcp.Required(),
			mcp.Description("x coordinate to travel to"),
		),
		mcp.WithNumber("y",
			mcp.Required(),
			mcp.Description("y coordinate to travel to"),
		),
		mcp.WithNumber("z",
			mcp.Required(),
			mcp.Description("z coordinate to travel to"),
		),
	)
	SeeAction := mcp.NewTool("see",
		mcp.WithDescription("Returns blocks that your player can see within visual peripheral. You can see anywhere from 0-359 degrees on the yaw axis (horizontal head-movement) and 0-179 degrees on the pitch axis (vertical head-movement)"),
		mcp.WithNumber("yaw",
			mcp.Description("New yaw value for your player to face - IN DEGREES 0-359 - Turning on North, East, South West axis; The degrees you specify will face your player towards: 0=South towards Positive Z axis, 90=East towards Positive X axis ; 180=North towards Negative Z axis; 270=West towards Negative X axis coordinates"),
			mcp.Max(359),
			mcp.Min(0),
		),
		mcp.WithNumber("pitch",
			mcp.Description("New pitch value for your player to face - IN DEGREES 0-179 - Turning on UP & DOWN axis; The degrees you specify will face your player towards: 0=Max Downwards, 90=Straight ahead, 179=Max Upwards"),
			mcp.Max(179),
			mcp.Min(0),
		),
	)
	BreakAction := mcp.NewTool("breakBlock",
		mcp.WithDescription("Request your in-game player to break a block at the specified coordinates - Takes arguments: x, y, z - This tool will return if the block break suceeded or failed with the reason of failure"),
		mcp.WithNumber("x",
			mcp.Required(),
			mcp.Description("The block's x coordinate"),
		),
		mcp.WithNumber("y",
			mcp.Required(),
			mcp.Description("The block's y coordinate"),
		),
		mcp.WithNumber("z",
			mcp.Required(),
			mcp.Description("The block's z coordinate"),
		),
	)
	StatusAction := mcp.NewTool("status",
		mcp.WithDescription("Returns your players ingame status consisting of: 1. location (x,y,z), 2. direction (yaw, pitch) PLEASE NOTE direction is returning yaw & pitch as represented in game and will be unexpected, 3. is currently travelling to your previous x,y,z request (boolean), 4. new coordinate goal (if performing a movement goal else will return empty array), 5. health"),
	)

	ser.AddTool(ChatAction, Chat)
	ser.AddTool(MoveAction, Move)
	ser.AddTool(SeeAction, See)
	ser.AddTool(BreakAction, Break)
	ser.AddTool(StatusAction, Status)

	// Begin to serve
	if err := server.ServeStdio(ser); err != nil {
		//fmt.Printf("Server Error: %v\n", err)
		os.Exit(1)
	}
}

/* TOOLS */
/* API Tools */
func API_GET(page string, q map[string]string) ([]byte, error) {
	queryStr := ""
	// Prep URL Query Parameters
	for key, val := range q {
		queryStr = queryStr + key + "=" + val + "&"
	}

	// Currently, the Receiver in game client isnt setup to serve any data back.
	client := &http.Client{Timeout: 30 * time.Second}
	URL := fmt.Sprintf("http://127.0.0.1:3000/%s?%s", page, queryStr)
	response, err := client.Get(URL)
	if err != nil {
		return nil, err
	}

	defer response.Body.Close()
	JSONBody, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	return JSONBody, nil
}

/* Specific */

func Chat(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	message, err := req.RequireString("message")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	} else {
		GETParams := map[string]string{
			"message": strings.ReplaceAll(message, " ", "%20"),
		}

		response, err := API_GET("Chat", GETParams)
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return mcp.NewToolResultText(string(response)), nil
	}
}
func Move(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	x, x_err := req.RequireFloat("x")
	y, y_err := req.RequireFloat("y")
	z, z_err := req.RequireFloat("z")
	if x_err != nil {
		return mcp.NewToolResultError(x_err.Error()), nil
	} else if y_err != nil {
		return mcp.NewToolResultError(y_err.Error()), nil
	} else if z_err != nil {
		return mcp.NewToolResultError(z_err.Error()), nil
	} else {
		GETParams := map[string]string{
			"x": strconv.FormatFloat(x, 'f', -1, 64),
			"y": strconv.FormatFloat(y, 'f', -1, 64),
			"z": strconv.FormatFloat(z, 'f', -1, 64),
		}

		response, err := API_GET("Move", GETParams)
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return mcp.NewToolResultText(string(response)), nil
	}
}
func See(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	GETParams := map[string]string{}
	yaw, yaw_err := req.RequireFloat("yaw")
	pitch, pitch_err := req.RequireFloat("pitch")
	if yaw_err == nil {
		GETParams["yaw"] = strconv.FormatFloat(yaw, 'f', -1, 64)
		// return mcp.NewToolResultError(yaw_err.Error()), nil
	}
	if pitch_err == nil {
		GETParams["pitch"] = strconv.FormatFloat(pitch, 'f', -1, 64)
		// return mcp.NewToolResultError(pitch_err.Error()), nil
	}

	response, err := API_GET("See", GETParams)
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return &mcp.CallToolResult{
		Content: []mcp.Content{
			mcp.NewTextContent(string(response)),
		},
		IsError: false,
	}, nil
}
func Break(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	x, x_err := req.RequireFloat("x")
	y, y_err := req.RequireFloat("y")
	z, z_err := req.RequireFloat("z")
	if x_err != nil {
		return mcp.NewToolResultError(x_err.Error()), nil
	} else if y_err != nil {
		return mcp.NewToolResultError(y_err.Error()), nil
	} else if z_err != nil {
		return mcp.NewToolResultError(z_err.Error()), nil
	} else {
		GETParams := map[string]string{
			"x": strconv.FormatFloat(x, 'f', -1, 64),
			"y": strconv.FormatFloat(y, 'f', -1, 64),
			"z": strconv.FormatFloat(z, 'f', -1, 64),
		}
		response, err := API_GET("Break", GETParams)
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return mcp.NewToolResultText(string(response)), nil
	}
}

func Status(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	response, err := API_GET("Status", map[string]string{})
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	return mcp.NewToolResultText(string(response)), nil
}
