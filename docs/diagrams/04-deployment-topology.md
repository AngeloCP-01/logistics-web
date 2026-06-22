# Deployment Topology (target)

> **Target topology — not yet provisioned.** Phase 8 ships the config + runbook
> ([`logistics-infrastructure/DEPLOY.md`](../../../logistics-infrastructure/DEPLOY.md));
> the live deploy is a follow-up.

```mermaid
flowchart TB
    subgraph vercel[Vercel]
        spa["logistics-web SPA"]
        bff["auth BFF functions"]
    end
    subgraph render[Render]
        gw["gateway (public)"]
        svcs["6 private services"]
    end
    subgraph managed[Managed data tiers]
        neon[(Neon Postgres ×4)]
        atlas[("Mongo Atlas ×2")]
        amqp{{CloudAMQP}}
        redis[(Redis)]
        resend[Resend email]
    end

    spa --> bff --> gw
    spa -. WSS .-> gw
    gw --> svcs
    svcs --> neon & atlas & amqp & redis & resend
```
