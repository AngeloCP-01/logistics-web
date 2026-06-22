# Event-Bus Topology

A single topic exchange (`logistics.events`) fans events to per-service durable
queues. Each consumer is idempotent and has its own dead-letter queue; failures
retry via a delay exchange before landing in the DLQ. The notification service
binds `#` (every event).

```mermaid
flowchart LR
    order[order-service] -->|order.created<br/>order.cancelled| ex
    dispatch[dispatch-service] -->|dispatch.driver.assigned<br/>dispatch.assignment.failed| ex
    tracking[tracking-service] -->|delivery.in_transit<br/>delivery.completed| ex
    auth[auth-service] -->|user.registered ...| ex

    ex{{"logistics.events<br/>topic exchange"}}

    ex -->|order.* · delivery.*| dq[(dispatch queue)]
    ex -->|# all events| nq[(notification queue)]
    ex -->|order.created<br/>dispatch.driver.assigned| tq[(tracking queue)]

    dq --> dc[dispatch consumer]
    nq --> nc[notification consumer]
    tq --> tc[tracking consumer]

    dc -. on failure .-> delay{{logistics.events.delay}}
    delay -. retry x3 .-> ex
    dc -. exhausted .-> ddlq[(dispatch.dlq)]
    nc -. exhausted .-> ndlq[(notification.dlq)]
    tc -. exhausted .-> tdlq[(tracking.dlq)]
```
