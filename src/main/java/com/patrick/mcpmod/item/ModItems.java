package com.patrick.mcpmod.item;

import com.patrick.mcpmod.MCPMod;
import net.minecraft.world.item.Item;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public class ModItems {

    public static final DeferredRegister<Item> ITEMS = DeferredRegister.create(ForgeRegistries.ITEMS, MCPMod.MOD_ID);
    public static final RegistryObject<Item> WAND = ITEMS.register("wand", () -> new Item(new Item.Properties().stacksTo(1).durability(10000)));

    public static void register(IEventBus eBus) {
        ITEMS.register(eBus);
    }
}
