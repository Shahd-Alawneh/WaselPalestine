import swaggerJsdoc from "swagger-jsdoc";
import { Express } from "express";
import swaggerUi from "swagger-ui-express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Wasel Palestine API",
      version: "1.0.0",
      description: "API documentation for Wasel Palestine Backend"

    },
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Reports", description: "Reports endpoints" },
      { name: "Alerts", description: "Alerts and subscriptions endpoints" },
      { name: "Checkpoints", description: "Checkpoint endpoints" },
      { name: "Incidents", description: "Incident endpoints" },
      { name: "Integrations", description: "External API integration endpoints" },
      { name: "Routes", description: "Route estimation endpoints" }
    ],
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Unauthorized"
            }
          }
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              example: "user@email.com"
            },
            password: {
              type: "string",
              example: "Password1234"
            }
          }
        },
        LoginResponse: {
          type: "object",
          properties: {
            accessToken: {
              type: "string",
              example: "jwt-access-token"
            },
            refreshToken: {
              type: "string",
              example: "jwt-refresh-token"
            }
          }
        },
        ReportVoteRequest: {
          type: "object",
          required: ["voteType"],
          properties: {
            voteType: {
              type: "string",
              enum: ["upvote", "downvote"],
              example: "upvote"
            }
          }
        },
        ModerateReportRequest: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["approved", "rejected"],
              example: "approved"
            },
            reason: {
              type: "string",
              example: "Validated by moderator"
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ["./src/modules/**/*.ts", "./src/integrations/**/*.ts"]
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}