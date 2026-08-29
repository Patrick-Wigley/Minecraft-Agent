package com.patrick.mcpmod.Events;


import com.patrick.mcpmod.MCPMod;
import net.minecraft.client.KeyMapping;
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.client.event.RegisterKeyMappingsEvent;
import net.minecraftforge.fml.common.Mod;
import org.lwjgl.glfw.GLFW;

@Mod.EventBusSubscriber(modid = MCPMod.MOD_ID, bus = Mod.EventBusSubscriber.Bus.MOD, value = Dist.CLIENT)
public class ClientModEvents {
    public static final KeyMapping GET_DETAILS_KEYMAP = new KeyMapping(
            "key.mcpmod.print_text",
            GLFW.GLFW_KEY_RIGHT_CONTROL,
            "key.categories.mcpmod");

    public static void registerKeys(RegisterKeyMappingsEvent e) {
        e.register(GET_DETAILS_KEYMAP);
    }
}

