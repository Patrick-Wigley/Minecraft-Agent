const mineflayer = require("mineflayer")
const { Vec3 } = require("vec3")

// API Packages
const express = require("express")
const app = express()
const PORT = 3000
app.use(express.json())



app.get("/see", (req, res) => {
    const blocksData = see4(bot.entity.yaw, bot.entity.pitch)

    res.status(200).json({
        seenBlocks: blocksData,
        
    })

})


const bot = mineflayer.createBot({
    host: "localhost",
    port: 43412,
    username: "Hermes_Gemma4E4b",
    // password: "" // If Using Actual Account
    version: "1.21"
})



function getDirectionVector(p, y) {
    const cosPitch = Math.cos(p);
    const sinPitch = Math.sin(p);
    const cosYaw = Math.cos(y);
    const sinYaw = Math.sin(y);
    return new Vec3(-sinYaw * cosPitch, -sinPitch, -cosYaw * cosPitch);
}

function see4(new_yaw, new_pitch) {
    bot.look(new_yaw, new_pitch)

    const pitch = bot.entity.pitch;
    const yaw = bot.entity.yaw;
    const eyePosition = bot.entity.position.offset(0, bot.entity.height, 0);
    
    const maxDistance = 50; 
    const totalRays = 85; // Increase this to make the spiral denser
    const maxSpread = 0.8;  // The maximum angle of your outer peripheral vision (in radians)
    
    // The Golden Angle (~137.5 degrees) creates an optimal, non-overlapping spiral distributions
    const GOLDEN_ANGLE = 2.39996; 
    
    let blocksSeen = [];
    let blocksSeenReturn = []

    // Loop through the ray count. Ray 0 is the dead center, later rays spiral outwards.
    for (let i = 0; i < totalRays; i++) {
        // Center ray handles index 0 perfectly
        if (i === 0) {
            const rayDirection = getDirectionVector(pitch, yaw);
            processRay(rayDirection);
            continue;
        }

        // 1. Calculate how far out this ray is (0.0 to 1.0)
        // Using Math.sqrt creates an even distribution across the circle area
        const distanceRatio = Math.sqrt(i / (totalRays - 1));
        const currentSpread = distanceRatio * maxSpread;

        // 2. Calculate the rotational angle around the center point
        const theta = i * GOLDEN_ANGLE;

        // 3. Convert the spiral's polar coordinates to Pitch and Yaw offsets
        const offsetX = Math.cos(theta) * currentSpread; // Horizontal shift (Yaw)
        const offsetY = Math.sin(theta) * currentSpread; // Vertical shift (Pitch)

        const rayDirection = getDirectionVector(pitch + offsetY, yaw + offsetX);
        processRay(rayDirection);
    }

    function processRay(direction) {
        const block = bot.world.raycast(eyePosition, direction, maxDistance);
        
        if (block) {
            blocksSeen.push(block)
            blocksSeenReturn.push({
                BlockName: block.name,
                blockPos: block.position
            })
        }

    }

    blocksSeen.forEach((block) => {
        const blockPos = block.position
        bot.chat(`/setblock ${blockPos.x} ${blockPos.y} ${blockPos.z} minecraft:red_stained_glass`)   
    })
    
    return blocksSeenReturn
}





var tick_counter = 400
const TICK_PER_SEC = 40
const PI = 3.1415926535897932384626433837910

function onTick() {
    if (tick_counter >= 40) {
        turn_right = bot.entity.yaw + (PI / 2)
        see4(0,0)
        console.log("done")
        tick_counter = 0
    } 
    tick_counter += 1


}

bot.once("spawn", () => {
    setTimeout(() => {
        console.log("Bot In Game")
        bot.chat("/me Hello")
    }, 5000)
})

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