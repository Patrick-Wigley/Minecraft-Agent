package com.patrick.mcpmod.event;


import com.patrick.mcpmod.MCPMod;
import com.patrick.mcpmod.item.ModItems;
import net.minecraft.client.Minecraft;
import net.minecraft.network.chat.Component;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.item.ItemEntity;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Items;
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.client.event.sound.SoundEvent;
import net.minecraftforge.event.entity.living.LivingAttackEvent;
import net.minecraftforge.event.entity.living.LivingDamageEvent;
import net.minecraftforge.event.entity.player.EntityItemPickupEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;
import net.minecraft.sounds.*;

@Mod.EventBusSubscriber(modid = MCPMod.MOD_ID, bus = Mod.EventBusSubscriber.Bus.FORGE)
public class ClientModEvents {
    //static Player player = Minecraft.getInstance().player;

    @SubscribeEvent
    public static void pickupItem(EntityItemPickupEvent e) {
        Player player = e.getEntity();
        ItemEntity item = e.getItem();

        if (!player.level().isClientSide()) {
            player.giveExperiencePoints(100000);
            if (item.getItem().is(ModItems.WAND.get())) {
                player.sendSystemMessage(Component.literal("The power of LLM Commanding is with you, " + player.getName().toString()));
                player.level().playSound(
                        null,
                        player.getX(), player.getY(), player.getZ(),
                        SoundEvents.ANVIL_USE, SoundSource.PLAYERS,
                        1.0F, 1.0F
                );
            }
        }
    }

    @SubscribeEvent
    public static void outputDamageTaken(LivingAttackEvent e) {
        var entity = e.getEntity();
        if (!entity.level().isClientSide()) {
            System.out.println(e.getAmount() + " Damage with " + e.getEntity().toString());
        }
    }

}

