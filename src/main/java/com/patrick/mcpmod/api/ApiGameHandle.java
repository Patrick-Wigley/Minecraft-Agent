package com.patrick.mcpmod.api;

import com.patrick.mcpmod.MCPMod;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.entity.player.Player;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

import java.util.HashMap;
import java.util.Map;

@Mod.EventBusSubscriber(modid = MCPMod.MOD_ID)
public class ApiGameHandle {
    static final String LLM_NAME = "Dev";

    private class Actions {
        static final String JUMP = "JUMP";
        static final String MOVETOCOORDS = "MOVE TO COORDINATES";

    }

    @SubscribeEvent
    public static void onPlayerTick(TickEvent.PlayerTickEvent.Pre event) {
        Player player = event.player;

        while (!ApiServer.API_REQ_QUEUE.isEmpty() && player.level().isClientSide()) {
            HashMap<String, String> req = ApiServer.API_REQ_QUEUE.poll();
            System.out.println("Handling: " + req);
            if (req != null) {
                for (String key : req.keySet()) {
                    switch (key.toUpperCase()) {
                        case "ACTION":
                            inGameActionHandle(event, player, req.get(key));
                            break;
                        case "MSG":
                            player.sendSystemMessage(Component.literal(req.get(key)));
                            break;
                        default:
                            System.out.println("[API ERROR] Received an unexpected KEY request in: " + req);
                            break;
                    }
                }
            }
        }
        //event.player.level().getNearbyEntities()
    }


    private static void inGameActionHandle(TickEvent.PlayerTickEvent.Pre event, Player player, String action) {
        System.out.println("Performing In-game Action: " + action);
    
        switch (action.toUpperCase()){
            case Actions.JUMP:
                player.jumpFromGround();
                break;
            case Actions.MOVETOCOORDS:
                player.teleportTo(player.getX()+2, player.getY()+2, player.getZ());
                break;

            default:
                System.out.println("[API ERROR] Received an unexpected ACTION VALUE request: " + action);
                break;

        }
        
        
    }

}