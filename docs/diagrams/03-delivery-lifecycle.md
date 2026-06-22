# Delivery Lifecycle

The closed loop: a customer places an order, dispatch offers it to an available
driver, the driver runs the delivery streaming location over the tracking
WebSocket, and completion ripples back through events to update the order and
notify the customer. Solid arrows are synchronous HTTP/WS; dashed arrows are
asynchronous RabbitMQ events.

```mermaid
sequenceDiagram
    actor C as Customer (web)
    participant GW as Gateway
    participant O as Order
    participant MQ as RabbitMQ
    participant D as Dispatch
    actor DR as Driver (web)
    participant T as Tracking
    participant N as Notification

    C->>GW: POST /v1/orders
    GW->>O: create order
    O--)MQ: order.created
    MQ--)N: order.created
    N--)C: in-app + email "order placed"
    MQ--)D: order.created
    D->>DR: offer (polled GET /v1/dispatch/offers/current)
    DR->>GW: POST /v1/dispatch/assignments/:id/accept
    GW->>D: accept
    D--)MQ: dispatch.driver.assigned
    MQ--)T: dispatch.driver.assigned
    MQ--)N: dispatch.driver.assigned
    DR->>T: WS delivery:pickup / location:update
    T--)MQ: delivery.in_transit
    T->>C: WS driver:location (live)
    DR->>T: WS delivery:complete
    T--)MQ: delivery.completed
    MQ--)O: delivery.completed (reflect status)
    MQ--)N: delivery.completed
    N--)C: in-app + email "delivered"
```
