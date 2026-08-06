const { betterAuth } = require("better-auth");
const { mongodbAdapter } = require("better-auth/adapters/mongodb");
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017/promptbase");
const db = client.db();

const auth = betterAuth({
  database: mongodbAdapter(db),
  trustedOrigins: [process.env.CLIENT_URL || "http://localhost:3000", "https://prompt-client-suf9.vercel.app"],
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "User",
      },
      subscription: {
        type: "string",
        required: false,
        defaultValue: "Free",
      }
    }
  }
});

module.exports = { auth, db };
