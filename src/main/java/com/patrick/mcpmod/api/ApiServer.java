package com.patrick.mcpmod.api;


import com.patrick.mcpmod.MCPMod;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import net.minecraftforge.event.server.ServerStartingEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.ConcurrentLinkedQueue;

@Mod.EventBusSubscriber(modid = MCPMod.MOD_ID, bus = Mod.EventBusSubscriber.Bus.FORGE)
public class ApiServer {
    public static final ConcurrentLinkedQueue<String> INGAME_CMD_QUEUE = new ConcurrentLinkedQueue<>();

    @SubscribeEvent
    public static void onServerStarting(ServerStartingEvent event) {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
            server.createContext("/MCAction", new APIRecvHandle());
            // Can I create two contexts? the other being /MCGetInfo
            server.setExecutor(null);
            server.start();
            System.out.println("API Started! On port 8080");
        }
        catch (IOException exception) {
            System.out.println("Error Starting HTTP Server! Inside API bridge");
            exception.printStackTrace();
        }
    }

    static class APIRecvHandle implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // POST - Input Into Game - Perform In game actions
            if (exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                String body = new String(exchange.getRequestBody().readAllBytes());
                System.out.println("Recv Post: " + body);
            }
            // GET - Output From Game - Retrieve In Game Information
            else if (exchange.getRequestMethod().equalsIgnoreCase("GET")) {
                String query = exchange.getRequestURI().getQuery();
                System.out.println("Recv Get: " + query);
                INGAME_CMD_QUEUE.add(query);
            }

        }
    }
}
