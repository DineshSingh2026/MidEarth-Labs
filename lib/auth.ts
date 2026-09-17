import type { NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import AzureADProvider from "next-auth/providers/azure-ad";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

/*
  OAuth sign-in. Each provider switches on only when its credentials are in the
  environment (see .env.example), so a server missing one still starts and the
  sign-in card can say which button is not set up yet.

  No database: sessions are signed JWTs in a cookie, which is all a landing page
  needs to know who is signed in.
*/

export type ProviderId = "google" | "azure-ad" | "github";

const env = (name: string) => process.env[name]?.trim() || undefined;

const google = { id: env("GOOGLE_CLIENT_ID"), secret: env("GOOGLE_CLIENT_SECRET") };
const microsoft = {
  id: env("AZURE_AD_CLIENT_ID"),
  secret: env("AZURE_AD_CLIENT_SECRET"),
  // "common" accepts both work/school and personal Microsoft accounts
  tenant: env("AZURE_AD_TENANT_ID") ?? "common",
};
const github = { id: env("GITHUB_CLIENT_ID"), secret: env("GITHUB_CLIENT_SECRET") };

export const configuredProviders: Record<ProviderId, boolean> = {
  google: Boolean(google.id && google.secret),
  "azure-ad": Boolean(microsoft.id && microsoft.secret),
  github: Boolean(github.id && github.secret),
};

const providers: Provider[] = [];

if (google.id && google.secret) {
  providers.push(GoogleProvider({ clientId: google.id, clientSecret: google.secret }));
}

if (microsoft.id && microsoft.secret) {
  providers.push(
    AzureADProvider({
      clientId: microsoft.id,
      clientSecret: microsoft.secret,
      tenantId: microsoft.tenant,
      // The stock profile inlines the Graph photo as base64, which would ride in
      // the session cookie on every request. Name and email are enough here.
      profile: (profile) => ({
        id: profile.sub,
        name: profile.name,
        email: profile.email ?? profile.preferred_username ?? null,
        image: null,
      }),
    }),
  );
}

if (github.id && github.secret) {
  providers.push(GitHubProvider({ clientId: github.id, clientSecret: github.secret }));
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: env("NEXTAUTH_SECRET"),
  session: { strategy: "jwt" },
  // our own card instead of the built-in page, for both sign-in and errors
  pages: { signIn: "/signin", error: "/signin" },
};
