# System Architecture

The browser is the only client. All HTTP traffic enters through the gateway (the
single public ingress); the tracking WebSocket is the one other public path.
Each service owns its own database and **never** touches another service's data —
cross-service effects flow through RabbitMQ.

```mermaid
flowchart TB
    web["logistics-web<br/>(React SPA + auth BFF)"]

    web -->|HTTPS /api/*| gw
    web -.->|WSS /v1/tracking| gw

    gw["logistics-gateway<br/>Express · JWT verify · rate limit · CORS<br/>(only public ingress)"]

    gw --> auth & user & order & dispatch & tracking & notif

    subgraph services[Services - private, one DB each]
        auth["auth-service"]
        user["user-service"]
        order["order-service"]
        dispatch["dispatch-service"]
        tracking["tracking-service"]
        notif["notification-service"]
    end

    auth --> authdb[(Neon · auth)]
    user --> userdb[(Neon · user)]
    order --> orderdb[(Neon · order)]
    dispatch --> dispdb[(Neon · dispatch)]
    tracking --> trackdb[("Mongo Atlas · tracking")]
    notif --> notifdb[("Mongo Atlas · notification")]

    auth & order & dispatch & tracking & notif <-->|publish / consume| mq{{"RabbitMQ · logistics.events"}}
    gw & auth & dispatch & tracking --> redis[("Redis<br/>cache · pub/sub · counters")]
```
