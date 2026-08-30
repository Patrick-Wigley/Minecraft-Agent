package com.patrick.mcpmod.api;

import com.patrick.mcpmod.MCPMod;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.entity.player.Player;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

@Mod.EventBusSubscriber(modid = MCPMod.MOD_ID)
public class ApiGameHandle {
    static final String LLM_NAME = "Dev";


    @SubscribeEvent
    public static void onPlayerTick(TickEvent.PlayerTickEvent.Pre event) {
        Player player = event.player;

        while (!ApiServer.INGAME_CMD_QUEUE.isEmpty() && player.level().isClientSide()) {
            String cmd = ApiServer.INGAME_CMD_QUEUE.poll();

            if (cmd.equalsIgnoreCase("Jump")) {
                //player.setJumping(true);
                player.jumpFromGround();
                player.sendSystemMessage(Component.literal("I am Jumping!"));
            }
        }


        //event.player.level().getNearbyEntities()

    }
}