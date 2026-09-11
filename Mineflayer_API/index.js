const { Vec3 } = require("vec3")

const mineflayer = require("mineflayer")
const mineflayertool = require("mineflayer-tool").plugin
const { pathfinder, Movements, goals: { GoalBlock }} = require("mineflayer-pathfinder") 

const USERNAME = "Hermes_Gemma4E4b"
const LAPTOP = "314159"
const bot = mineflayer.createBot({
    host: LAPTOP, //"localhost",
    port: 43412,
    username: USERNAME,
    // password: "" // If Using Actual Account
    version: "1.21"
})

bot.loadPlugin(mineflayertool)
bot.loadPlugin(pathfinder)

// API Packages
const express = require("express")
const app = express()
const PORT = 3000
app.use(express.json())

app.listen(PORT, ()=> {
    console.log(`BOT SERVER OPEN - Listening for requests on http://localhost:${PORT}`)
})

app.get("/chat", (req, res) => {
    console.log("Sending a chat")
    if (Object.hasOwn(req.query, "message")) {
        bot.chat(`/me ${req.query.message}`)
        return res.status(200).json("SUCCESS: In-game chat sent")
    }
    return res.status(400).json("FAILURE: Did not send chat in-game, missing 'message' parameter in URL")
})

app.get("/move", (req, res) => {
    console.log("MOVE: Query Recv:", req.query)
    
    const defMve = new Movements(bot)
    bot.pathfinder.setMovements(defMve)

    if (Object.hasOwn(req.query, "x") && Object.hasOwn(req.query, "y") && Object.hasOwn(req.query, "z")) {
        // const coords = req.query.coordinates.split(",")
        const coords = [Number(req.query.x), Number(req.query.y), Number(req.query.z)]
        const goal = new GoalBlock(coords[0], coords[1], coords[2])
        // console.log(coords)
        inGameStatus.traversingStatus.movingToCoordinates = true
        inGameStatus.traversingStatus.newCoordinatesGoal = coords
        bot.chat(`/me [BOT] I am going to travel to: x=${coords[0]}, y=${coords[1]}, z=${coords[2]}`)
         let lastPosition = bot.entity.position.clone()
        let lastMoveTime = Date.now()


        // Stuck monitor
        const checkStall = () => {
        const currentPosition = bot.entity.position
        // Check if the bot has moved at least 1 full block distance
        if (currentPosition.distanceTo(lastPosition) >= 1) {
            lastPosition = currentPosition.clone()
            lastMoveTime = Date.now()
        } else if (Date.now() - lastMoveTime > 5000) { // 5 seconds of standing still
            console.warn("[Pathfinder] Bot is stuck or cannot reach the exact block. Forcing cancel.")
            bot.chat("/me [BOT] I can't reach the exact destination!")
            
            // Setting the goal to null instantly interrupts the active goto() promise,
            // forcing it to reject and jump straight into your .catch() block below.
            bot.pathfinder.setGoal(null) 
        }
        }
        // Attach to move listener
        bot.on('move', checkStall)

        bot.pathfinder.goto(goal)
            .then(() => {
                bot.chat('/me [BOT] Arrived at my destination!')
            })
            .catch((error) => {
                // Normalize the error to a string so we can safely check its contents
                const errorString = error instanceof Error ? error.message : String(error);
                bot.chat("/me I can't path find to the exact location!");
                bot.pathfinder.setGoal(null) 
                inGameStatus.traversingStatus.movingToCoordinates = false
                inGameStatus.traversingStatus.newCoordinatesGoal = []

                // 1. Check for our manual watchdog cancellation
                if (errorString.includes('Goal changed')) {
                    console.log("[Pathfinder] Path cancelled gracefully by stall watchdog.");
                    
                } 
                // 2. Check for the native pathfinder timeout (Handles both String and Error objects)
                else if (errorString.includes('Took to long to decide path to goal')) {
                    console.warn(`[Pathfinder] Timed out trying to reach x=${coords[0]}, y=${coords[1]}, z=${coords[2]}`);
                    
                    // Use a slight timeout delay to let the bot's internal tick queue clear before chatting
                    setTimeout(() => {
                        if (bot.isPlaying) bot.chat('/me Pathfinding timed out! The destination is unreachable.');
                    }, 200);
                } 
                // 3. Fallback for any other unexpected error
                else {
                    console.error('[Pathfinder] Unexpected error during traversal:', error);
                }
            })
            .finally(() => {
                // Clean up the event listener and statuses regardless of success or failure
                bot.removeListener('move', checkStall)
                inGameStatus.traversingStatus.movingToCoordinates = false
                inGameStatus.traversingStatus.newCoordinatesGoal = []
        })
        return res.status(200).json(`Currently moving to location x=${coords[0]}, y=${coords[1]}, z=${coords[2]}`)
    }
    return res.status(400).json("FAILURE: Did not move in-game, missing 'x', 'y' and/or 'z' parameters in URL")
})

app.get("/see", async (req, res) => {
    console.log("SEE: Query Recv:",  req.query)
    
    // pitch = UP & DOWN - 180 - in game it is -90 (UP) to 90 (DOWN)
    // yaw = LEFT & RIGHT - 360 - in game it is -180 to +180        
    // converting yaw: 0/360 = -180 - 180 (therefore, 0/360 or -180ingame is north)
    // north: 0 or 180ingame
    // east: 90 or -90ingame
    // south: 180 or 0ingame
    // west: 270 or 90ingame

    // In context of X,Y,Z coordinates, 
    // North takes you negative Z
    // East take you positive X
    // South takes you positive Z
    // West takes you negative X


  

    const blocksData = await see(
        req.query
    )

    res.status(200).json({
        seenBlocks: blocksData
    })
})
app.get("/break", async (req, res) => {
    if (Object.hasOwn(req.query, "x") && Object.hasOwn(req.query, "y") && Object.hasOwn(req.query, "z")) {
        const blockVec = new Vec3(Number(req.query.x), Number(req.query.y), Number(req.query.z))
        const blockInstance = bot.blockAt(blockVec)

        if (bot.canDigBlock(blockInstance)){
            // Return will take however long it takes to break the block
            let equipped = false
            try {
                // TODO: This selects the best tool but - does not prevent the bot from
                // obtaining the block if theyre not allowed still
                await bot.tool.equipForBlock(blockInstance, {})
                equipped = true
            } finally {
                await bot.dig(blockInstance)
                // Currently, not doing item drops - just giving the player the block they broke
                // Need to put limiter on for stopping block obtaining with hands OR 
                // preferably, make the bot collect the item on floor
                if (equipped) {
                    bot.chat(`/give ${bot.username} ${blockInstance.name}`)
                }
            }
            return res.status(200).json({
                "Success": true,
                "Coordinates of block just broke": [blockVec.x, blockVec.y, blockVec.z],
                "Name of block just broke": blockInstance.name,
                "Item stored into inventory": equipped,
                "Equipment used to break block": bot.heldItem?.name ?? "hand"
            })

        } else {
            return res.status(200).json({
                "Success": false,
                "Reason For Failure": "Not permitted to break this block in game OR the block does not exist (air block) OR you're too far away from the block"
            })
        }
    }
    return res.status(400).json("TOOL USE FAILURE: Did not move in-game, missing 'x', 'y' and/or 'z' parameters in URL")
})

app.get("/status", (req, res) => {
    const rad_to_deg = (rad) => {return rad * 180/PI}

    res.status(200).json({
            traversingStatus: {
                movingToCoordinates:    inGameStatus.traversingStatus.movingToCoordinates,
                newCoordinatesGoal:     inGameStatus.traversingStatus.newCoordinatesGoal
            },
            directionFacing: {
                yaw:  rad_to_deg(bot.entity.yaw),
                pitch: rad_to_deg(bot.entity.pitch)
            },
            position: bot.entity.position,
            health: bot.health
        })
})


//const delay = (time_ms) => new Promise((resolve) => setTimeout(resolve, time_ms))


var inGameStatus = {}

function getDirectionVector(p, y) {
    const cosPitch = Math.cos(p);
    const sinPitch = Math.sin(p);
    const cosYaw = Math.cos(y);
    const sinYaw = Math.sin(y);
    return new Vec3(-sinYaw * cosPitch, -sinPitch, -cosYaw * cosPitch);
}



async function see(query) {
    const YAW_OFFSET = 179
    const PITCH_OFFSET = 90

    const degree_to_radian = (deg, ingame_offset, max_rot) => {
        // Convert 0-360 to -179-180 
        const ingame_degrees = (deg % max_rot) - ingame_offset
        console.log("Ingame deg: " + ingame_degrees)
        return ingame_degrees * (PI/180)
    }
    
    let new_yaw = bot.entity.yaw
    if (Object.hasOwn(query, "yaw")) {
        inGameStatus.directionFacing.yaw = Number.parseFloat(query.yaw)

        // Translate to ingame value system
        new_yaw = degree_to_radian(Number.parseFloat(query.yaw), YAW_OFFSET, 360)
    }

    let new_pitch = bot.entity.pitch
    if (Object.hasOwn(query, "pitch")) {
        inGameStatus.directionFacing.pitch = Number.parseFloat(query.pitch)

        // Translate to ingame value system
        new_pitch = degree_to_radian(Number.parseFloat(query.pitch), PITCH_OFFSET, 180)
    }

    
    // const new_yaw = Object.hasOwn(query, "yaw") ? 
    // degree_to_radian(Number.parseFloat(query.yaw), YAW_OFFSET, 360) : bot.entity.yaw



    if (new_yaw != null || new_pitch != null) {
        console.log(`[BOT] Moving head to: yaw=${new_yaw}, pitch=${new_pitch}`)
        bot.look(new_yaw, new_pitch, true)
        console.log("[BOT] Finished turning")
    } else {
        console.log("[BOT] Not moving head!")
    }

    //const radian_to_deg = (rad) => {return rad * (180/PI)}


    const pitch =   new_pitch-3.14159 //bot.entity.pitch;
    const yaw =     new_yaw-3.14159 //bot.entity.yaw;
    const eyePosition = bot.entity.position.offset(0, bot.entity.height, 0)
    
    const maxDistance = 50;
    const totalRays = 125 // Increase this to make the spiral denser
    const maxSpread = 0.5  // The maximum angle of your outer peripheral vision (in radians)
    
    // The Golden Angle (~137.5 degrees) creates an optimal, non-overlapping spiral distributions
    const GOLDEN_ANGLE = 2.39996 
    let blockIDs = []
    let blocksSeen = []
    let blocksSeenReturn = []
    // Loop through the ray count. Ray 0 is the dead center, later rays spiral outwards.
    for (let i = 0; i < totalRays; i++) {
        // Center ray handles index 0 perfectly
        if (i === 0) {
            const rayDirection = getDirectionVector(pitch, yaw)
            processRay(rayDirection)
            continue
        }
        
        // 1. Calculate how far out this ray is (0.0 to 1.0)
        // Using Math.sqrt creates an even distribution across the circle area
        const distanceRatio = Math.sqrt(i / (totalRays - 1))
        const currentSpread = distanceRatio * maxSpread
        
        // 2. Calculate the rotational angle around the center point
        const theta = i * GOLDEN_ANGLE
        
        // 3. Convert the spiral's polar coordinates to Pitch and Yaw offsets
        const offsetX = Math.cos(theta) * currentSpread // Horizontal shift (Yaw)
        const offsetY = Math.sin(theta) * currentSpread // Vertical shift (Pitch)
        
        const rayDirection = getDirectionVector(pitch + offsetY, yaw + offsetX)
        processRay(rayDirection)
        showRay(rayDirection)
    }
    
    function showRay(direction) {
        const startPos = bot.entity.position.offset(0, bot.entity.eyeHeight, 0);

        const step = 1; 
        const raycastMaxDistance = maxDistance;
        for (let d = 0; d <= raycastMaxDistance; d += step) {
            // Calculate point along the ray: Start + (Direction * Distance)
            // USE: /gamerule sendcommandfeedback false

            const particlePos = startPos.plus(direction.scaled(d));
            const msg = `/particle minecraft:flame ${particlePos.x} ${particlePos.y} ${particlePos.z}`
            setTimeout(bot.chat, 5, msg)
        }
    }

    function processRay(direction) {
        const block = bot.world.raycast(eyePosition, direction, maxDistance)
        
        // For MCP
        if (block) {
            const blocksUniqueID = block.position.toString()
            // Filters block instances in the world if mutliple rays hit the same block
            if (!blockIDs.includes(blocksUniqueID)) {
                blockIDs.push(blocksUniqueID)
                blocksSeenReturn.push({
                    BlockName: block.name,
                    blockPos: block.position
                })
            }

        }

    }

    // blocksSeen.forEach((block) => {
    //     const blockPos = block.position
    //     bot.chat(`/setblock ${blockPos.x} ${blockPos.y} ${blockPos.z} minecraft:red_stained_glass`)   
    // })
    
    return blocksSeenReturn
}





var tick_counter = 400
const TICK_PER_SEC = 40
const PI = 3.1415926535897932384626433837910

function onTick() {
    if (tick_counter >= 40) {
        turn_right = bot.entity.yaw + (PI / 2)
        see4(0,0)
        // console.log("done")
        tick_counter = 0
    } 
    tick_counter += 1


}

bot.once("spawn", () => {
    inGameStatus = {
        traversingStatus: {
            movingToCoordinates: false,
            newCoordinatesGoal: []
        },
        directionFacing: {
            yaw:    "not set",
            pitch:  "not set"
        },
        position: bot.entity.position,
        health: bot.health
    }
    setTimeout(() => {
        console.log("Bot In Game")
        bot.chat("/me Setting Status")
        bot.chat("/gamerule sendCommandFeedback false")
        bot.chat("/gamerule doTileDrops false")
        
        

    }, 1000)
})

if (false)
    bot.on("physicTick", onTick)









// function see2(yaw, pitch) {
//     bot.look(yaw, pitch)

//     const block = bot.blockAtCursor(BOT_VISION_DISTANCE)
//     const entity = bot.entityAtCursor(BOT_VISION_DISTANCE)
//     if (block) {
//         // Inform AI 
//         block_details = block
//         bot.chat("/me I am looking at a " + block.name)
//     }

//     bot.chat

// }

// function see(yaw, pitch) {
//     bot.look(yaw, pitch)
    
//     identified_blocks = []
//     radius = 1
//     botLocation = bot.entity.position.floored()

//     for (let x = -radius; x <= radius; x++) {
//         for (let y = -radius; y <= radius; y++) {
//             for (let z = -radius; z <= radius; z++) {
//                 const checkPos = botLocation.offset(x, y, z);
//                 const block = bot.blockAt(checkPos);
//                 //console.log(block.name)

//                 if (block && block.name !== 'air') {
//                     // Do something with the block data
//                     // block.name gives the type, block.position gives where it is
//                     if (block.name === "oak_log") {
//                         bot.chat("/me " + block.name + " at " + block.position + " - I am at: " + botLocation)
//                     }
//                     // identified_blocks[identified_blocks.length] = block.name//{name: block.name, loc:block.position}
//                 }
//             }
//         }
//     }
//     // console.log("/me I can see: " + identified_blocks)
//     // bot.chat("/me I can see: " + identified_blocks)
// }




// function getRaycastDirections() {
//     //
//     //              #
//     //          #       #
//     //            # # #
//     //       #    # # #     #
//     //            # # # 
//     //         #        #
//     //              #
//     //
//     const spreadAngle = 0.04; // How far apart the outer rays spread (in radians)
    
//     // First ray is center ray (At Cursor)
//     var rayOffsets = [{ x: 0, y: 0, z: 0 }]
//     for (let castCircle = 0; castCircle < 16; castCircle += 1) {
//         spreadAngleOffset = spreadAngle*castCircle    
    
//         rayOffsets.push({ x: spreadAngleOffset, y: 0, z: 0 })  // Spread Right
//         rayOffsets.push({ x: -spreadAngleOffset, y: 0, z: 0 }) // Spread Left
//         rayOffsets.push({ x: 0, y: spreadAngleOffset, z: 0 })  // Spread Up
//         rayOffsets.push({ x: 0, y: -spreadAngleOffset, z: 0 })  // Spread Down
        
//         rayOffsets.push({ x: spreadAngleOffset, y: spreadAngleOffset, z: 0 })  // Spread Right Up
//         rayOffsets.push({ x: -spreadAngleOffset, y: spreadAngleOffset, z: 0 }) // Spread Left Up
//         rayOffsets.push({ x: spreadAngleOffset, y: -spreadAngleOffset, z: 0 })  // Spread Right Down
//         rayOffsets.push({ x: -spreadAngleOffset, y: -spreadAngleOffset, z: 0 })  // Spread Left Down
    
//     }

//     return rayOffsets;
// }

// function see3(yaw, pitch) {
//     bot.look(yaw, pitch)
//     seen_blocks = [] 

//     // 1. Get the direction the bot is facing as a unit vector
//     //const baseDirection = bot.util.getViewDirection(bot.entity.pitch, bot.entity.yaw);
//     const eyePosition = bot.entity.position.offset(0, bot.entity.height, 0);

//     const maxDistance = 10; // How far the raycasts should reach
   
//     // 2. Define offsets to create a grid of rays around the center
//     // (Center, Up, Down, Left, Right)
//     function getDirectionVector(p, y) {
//         const cosPitch = Math.cos(p);
//         const sinPitch = Math.sin(p);
//         const cosYaw = Math.cos(y);
//         const sinYaw = Math.sin(y);
        
//         // Minecraft's coordinate mapping for looking vectors
//         return new Vec3(-sinYaw * cosPitch, -sinPitch, -cosYaw * cosPitch);
//     }



//     var rayOffSets = getRaycastDirections();
//     rayOffSets.forEach((offset, index) => {
//         // Apply the pitch/yaw offsets to get the peripheral directions
//         const rayDirection = getDirectionVector(
//             bot.entity.pitch + offset.y, 
//             bot.entity.yaw + offset.x
//         );

//         // 3. Perform the manual raycast
//         // bot.world.raycast takes (origin, direction, maxDistance)
//         const block = bot.world.raycast(eyePosition, rayDirection, maxDistance);
//         if (block) {
//             const blockPos = block.position
//             bot.chat(`/setblock ${blockPos.x} ${blockPos.y} ${blockPos.z} minecraft:lime_stained_glass`)   
//         }


//         // seen_blocks.push(block)

//         // if (block) {
//         //     console.log(`Ray ${index} hit: ${block.name} at ${block.position}`);
//         // } else {
//         //     console.log(`Ray ${index} didn't hit anything within range.`);
//         // }

//         // const actualDistance = block ? eyePosition.distanceTo(block.position) : maxDistance;

//         // // --- VISUALIZATION LOGIC ---
//         // // Spawn a particle every 0.5 blocks along the ray's path
//         // for (let d = 0.5; d <= actualDistance; d += 0.5) {
//         //     const particlePos = eyePosition.plus(rayDirection.scaled(d));
            
//         //     // Using vanilla command routing via bot.chat
//         //     // 'dust 0 1 0 1' creates green particles (Red, Green, Blue, Size)
//         //     bot.chat(`/particle dust 0 1 0 1 ${particlePos.x} ${particlePos.y} ${particlePos.z} 0 0 0 0 1`);
//         // }

//         // if (block) {
//         //     // Optional: Draw a flame particle precisely where the ray collides
//         //     bot.chat(`/particle flame ${block.position.x + 0.5} ${block.position.y + 0.5} ${block.position.z + 0.5} 0 0 0 0 1`);
//         // }
//     });
// }