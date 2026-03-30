import swaggerJsdoc from "swagger-jsdoc";
import { Express } from "express";
import swaggerUi from "swagger-ui-express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Wasel Palestine API",
      version: "1.0.0",
      description: "API documentation for Wasel Palestine Backend",
    },
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Reports", description: "Reports endpoints" },
      { name: "Alerts", description: "Alerts and subscriptions endpoints" },
      { name: "Checkpoints", description: "Checkpoint endpoints" },
      { name: "Incidents", description: "Incident endpoints" },
      { name: "Integrations", description: "External API integration endpoints" },
      { name: "Routes", description: "Route estimation endpoints" },
      { name: "Health", description: "Health and readiness endpoints" },
    ],
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Unauthorized",
            },
          },
        },

        SuccessMessageResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Operation completed successfully",
            },
          },
        },

        RegisterRequest: {
          type: "object",
          required: ["fullName", "email", "password"],
          properties: {
            fullName: {
              type: "string",
              example: "Shahd Alawneh",
            },
            email: {
              type: "string",
              format: "email",
              example: "shahdalawneh0@gmail.com",
            },
            password: {
              type: "string",
              minLength: 8,
              example: "Password1234",
            },
          },
        },

        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "shahdalawneh0@gmail.com",
            },
            password: {
              type: "string",
              example: "Password1234",
            },
          },
        },

        RefreshRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: {
              type: "string",
              example: "your-refresh-token",
            },
          },
        },

        AuthTokens: {
          type: "object",
          properties: {
            accessToken: {
              type: "string",
              example: "jwt-access-token",
            },
            refreshToken: {
              type: "string",
              example: "jwt-refresh-token",
            },
          },
        },

        LoginResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
              properties: {
                user: {
                  type: "object",
                  properties: {
                    id: {
                      type: "integer",
                      example: 1,
                    },
                    fullName: {
                      type: "string",
                      example: "Shahd",
                    },
                    email: {
                      type: "string",
                      example: "shahdalawneh0@gmail.com",
                    },
                    role: {
                      type: "string",
                      example: "admin",
                    },
                  },
                },
                accessToken: {
                  type: "string",
                  example: "jwt-access-token",
                },
                refreshToken: {
                  type: "string",
                  example: "jwt-refresh-token",
                },
              },
            },
          },
        },

        CreateReportRequest: {
          type: "object",
          required: ["category", "description", "lat", "lng"],
          properties: {
            category: {
              type: "string",
              example: "ACCIDENT",
            },
            description: {
              type: "string",
              example: "Minor accident near checkpoint",
            },
            lat: {
              type: "number",
              example: 31.529,
            },
            lng: {
              type: "number",
              example: 35.189,
            },
            reportedAt: {
              type: "string",
              format: "date-time",
              example: "2026-03-24T15:30:00.000Z",
            },
          },
        },

        VoteReportRequest: {
          type: "object",
          required: ["value"],
          properties: {
            value: {
              type: "integer",
              enum: [1, -1],
              example: 1,
            },
          },
        },

        ModerateReportRequest: {
          type: "object",
          required: ["action"],
          properties: {
            action: {
              type: "string",
              enum: ["APPROVE", "REJECT", "MARK_SPAM"],
              example: "APPROVE",
            },
            reason: {
              type: "string",
              example: "Verified by moderator",
            },
          },
        },

        CreateIncidentRequest: {
          type: "object",
          required: ["title", "description", "type", "severity", "startTime"],
          properties: {
            checkpointId: {
              type: "integer",
              example: 1,
            },
            title: {
              type: "string",
              example: "Road closure near checkpoint",
            },
            description: {
              type: "string",
              example: "Traffic blocked due to an accident",
            },
            type: {
              type: "string",
              enum: ["closure", "delay", "accident", "weather_hazard", "other"],
              example: "closure",
            },
            severity: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
              example: "high",
            },
            startTime: {
              type: "string",
              example: "2026-03-24 15:30:00",
            },
          },
        },

        UpdateIncidentRequest: {
          type: "object",
          properties: {
            checkpointId: {
              type: "integer",
              nullable: true,
              example: 1,
            },
            title: {
              type: "string",
              example: "Updated incident title",
            },
            description: {
              type: "string",
              example: "Updated description",
            },
            type: {
              type: "string",
              enum: ["closure", "delay", "accident", "weather_hazard", "other"],
            },
            severity: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
            },
          },
        },

        CreateCheckpointRequest: {
          type: "object",
          required: ["name", "latitude", "longitude"],
          properties: {
            name: {
              type: "string",
              example: "Huwara Checkpoint",
            },
            latitude: {
              type: "number",
              example: 32.153,
            },
            longitude: {
              type: "number",
              example: 35.256,
            },
          },
        },

        SetCheckpointStatusRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["open", "closed", "delayed", "hazard", "unknown"],
              example: "open",
            },
            note: {
              type: "string",
              example: "Checkpoint reopened",
            },
          },
        },

        CreateSubscriptionRequest: {
          type: "object",
          required: ["areaType", "areaValue"],
          properties: {
            areaType: {
              type: "string",
              enum: ["city", "governorate", "bbox"],
              example: "city",
            },
            areaValue: {
              type: "object",
              example: {
                name: "Nablus",
              },
            },
            incidentCategory: {
              type: "string",
              nullable: true,
              example: "accident",
            },
          },
        },

        UpdateSubscriptionRequest: {
          type: "object",
          properties: {
            areaType: {
              type: "string",
              enum: ["city", "governorate", "bbox"],
              example: "governorate",
            },
            areaValue: {
              type: "object",
              example: {
                name: "Ramallah",
              },
            },
            incidentCategory: {
              type: "string",
              nullable: true,
              example: "closure",
            },
            isActive: {
              type: "boolean",
              example: true,
            },
          },
        },

        EstimateRouteRequest: {
          type: "object",
          required: ["origin", "destination"],
          properties: {
            origin: {
              type: "object",
              example: {
                lat: 31.529,
                lng: 35.189,
              },
            },
            destination: {
              type: "object",
              example: {
                name: "Ramallah",
              },
            },
            avoidCheckpoints: {
              type: "boolean",
              example: false,
            },
            avoidAreas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  minLat: { type: "number", example: 31.4 },
                  minLng: { type: "number", example: 35.1 },
                  maxLat: { type: "number", example: 31.6 },
                  maxLng: { type: "number", example: 35.3 },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    "./src/app.ts",
    "./src/modules/**/*.ts",
    "./src/integrations/**/*.ts",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}