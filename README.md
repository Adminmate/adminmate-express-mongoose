# Adminmate (Express.js + Mongoose)

Adminmate is a powerful & flexible back-office solution build for small to big teams. ✌️

It provides an extremely flexible API developed in NodeJS that communicate with a powerful frontend back-office we host.

As the security & privacy of your data is our main focus, the Data API is host by yourself and secured by your own credentials.

## Getting started

[https://adminmate.io](https://adminmate.io)

## Databases compatibility

Adminmate is compatible with the most famous database systems like **MySQL**, **PostgreSQL**, **SQLite** and **MongoDB**. We are working hard on adding more soon!

## Features

Adminmate comes with all the features you need for your back-office:
* **Data**: Data Explorer, CRUD, Filters, Segments, Actions
* **Dashboards & Charts**: Unlimited Dashboards & Charts
* **Collaboration**: Powerful collaboration tool
* **Activity**: Track everything that happening on your database data
* **Access Control**: Team-based Access Control

### Data explorer

![Alt text](https://adminmate.io/github/list-screen.svg)

### Dashboards & Charts

![Alt text](https://adminmate.io/github/homepage-screen.svg)

### Activity

![Alt text](https://adminmate.io/github/activity-screen.svg)

## AI agents & MCP (1.4+)

This connector ships an MCP server (through `adminmate-express-core` 1.3+) so that AI agents can query your
data and propose business actions with a human approval, under your team permissions.

* MCP endpoint: `POST <your endpoint>/adminmate/mcp`, authenticated with an agent token created in Adminmate (Settings › AI Agents).
* Agents are read-only on records; actions are queued for approval unless declared `approval: 'none'`.
* Approval requests and the agent calls journal are stored in your own MongoDB, in two dedicated collections:
  `adminmate_agent_requests` and `adminmate_agent_logs` (created on the connection of your first configured model).

```js
Adminmate.init({
  projectId, secretKey, authKey, masterPassword,
  models: [{
    slug: 'users',
    model: UserModel,
    actions: [{
      label: 'Grant access',
      code: 'grant_access',
      target: ['item'],
      approval: 'required', // default; 'none' lets agents execute it directly
      handler: (attrs, success, error) => {
        // attrs.agent = { key_id, name, request_id } when triggered by an AI agent
        success({ reload: true });
      }
    }]
  }],
  agentKeyVerification: true,                    // optional (default true): revocation check of agent keys
  agentKeyVerifyUrl: 'https://api.adminmate.io'  // optional override
});
```

Client configuration (Claude Desktop / Cursor / Claude Code):

```json
{
  "mcpServers": {
    "adminmate-my-project": {
      "url": "https://api.my-company.com/adminmate/mcp",
      "headers": { "Authorization": "Bearer <agent token>" }
    }
  }
}
```

### Security hardening in 1.4

* Filters and search values are escaped before being used in regular expressions (no ReDoS / injection).
* Chart fields (`field`, `group_by`, ranking fields) and ordering fields are validated against the mongoose schema.
* `rows` is capped to 500 per page, error responses no longer include stack traces.

### Tests

`npm test` runs the unit tests and the MongoDB tests against an in-memory MongoDB (`mongodb-memory-server`).
Set `MONGO_URL` to use your own instance instead.

## Who are the contributors ?

Adminmate is a bootstrapped project tailored by **Marc Delalonde** and aims to stay an *independent project, driven by the community*.