"use client";

import { signIn, signOut } from "next-auth/react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import type { ProviderId } from "@/lib/auth";

import {
  ArrowLeft,
  ArrowRight,
  CoinbaseMark,
  EyeIcon,
  GitHubMark,
  GoogleMark,
  KeyIcon,
  MailIcon,
  MetaMaskMark,
  MicrosoftMark,
  OkxMark,
  WalletMark,
} from "./signInMarks";

/*
  The sign-in card. Two views share one panel: the provider list with the
  email form, and the wallet list behind "Sign in with Wallet". A signed-in
  visitor gets a third: who they are, and a way out.

  Google, Microsoft and GitHub run real OAuth through NextAuth (lib/auth.ts).
  A provider without credentials on the server says so instead of redirecting
  into an error. Email and password have no account store behind them yet, and
  the status line says that too. The wallet asks a detected extension for an
  account, and links a missing one to its official download page.
*/

type Eip1193 = {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isBraveWallet?: boolean;
  isOkxWallet?: boolean;
  providers?: Eip1193[];
  request: (args: { method: string }) => Promise<unknown>;
};

type WalletWindow = Window & {
  ethereum?: Eip1193;
  okxwallet?: Eip1193;
  coinbaseWalletExtension?: Eip1193;
};

type WalletId = "metamask" | "coinbase" | "okx";

type Wallet = {
  id: WalletId;
  name: string;
  install: string;
  mark: ReactNode;
  find: (w: WalletWindow) => Eip1193 | undefined;
};

/** Every injected provider, including the ones stacked behind a shared window.ethereum. */
const injected = (w: WalletWindow): Eip1193[] =>
  w.ethereum?.providers ?? (w.ethereum ? [w.ethereum] : []);

const WALLETS: Wallet[] = [
  {
    id: "metamask",
    name: "MetaMask",
    install: "https://metamask.io/download/",
    mark: <MetaMaskMark />,
    // other wallets set isMetaMask for compatibility, so rule them out
    find: (w) =>
      injected(w).find(
        (p) => p.isMetaMask && !p.isCoinbaseWallet && !p.isBraveWallet && !p.isOkxWallet,
      ),
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    install: "https://www.coinbase.com/wallet/downloads",
    mark: <CoinbaseMark />,
    find: (w) => w.coinbaseWalletExtension ?? injected(w).find((p) => p.isCoinbaseWallet),
  },
  {
    id: "okx",
    name: "OKX Wallet",
    install: "https://www.okx.com/web3",
    mark: <OkxMark />,
    find: (w) => w.okxwallet ?? injected(w).find((p) => p.isOkxWallet),
  },
];

type Notice = { tone: "info" | "error" | "success"; text: string };

type OAuthButton = { id: ProviderId; name: string; env: string; mark: ReactNode };

const OAUTH: OAuthButton[] = [
  { id: "google", name: "Google", env: "GOOGLE_CLIENT_ID", mark: <GoogleMark /> },
  { id: "azure-ad", name: "Microsoft", env: "AZURE_AD_CLIENT_ID", mark: <MicrosoftMark /> },
  {
    id: "github",
    name: "GitHub",
    env: "GITHUB_CLIENT_ID",
    mark: (
      <span className="si-provider-ink">
        <GitHubMark />
      </span>
    ),
  },
];

/** NextAuth sends failures back here as ?error=<code>. */
const AUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "That email is already signed in with a different provider. Use the one you signed in with first.",
  AccessDenied: "Sign in was cancelled or denied.",
  Configuration: "Sign in is misconfigured on the server. Check the auth settings.",
  OAuthSignin: "Couldn't start sign in with that provider. Try again.",
  OAuthCallback: "The provider sent back an error. Try again.",
  Callback: "The provider sent back an error. Try again.",
  SessionRequired: "Sign in to continue.",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

type Props = {
  providers: Record<ProviderId, boolean>;
  user: { name: string | null; email: string | null } | null;
  error?: string;
};

export default function SignInCard({ providers, user, error }: Props) {
  const [view, setView] = useState<"options" | "wallet">("options");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [invalid, setInvalid] = useState<{ email?: boolean; password?: boolean }>({});
  const [notice, setNotice] = useState<Notice | null>(() =>
    error
      ? { tone: "error", text: AUTH_ERRORS[error] ?? "Sign in failed. Try again." }
      : null,
  );
  const [redirecting, setRedirecting] = useState<ProviderId | "signout" | null>(null);
  const [detected, setDetected] = useState<Record<WalletId, boolean>>({
    metamask: false,
    coinbase: false,
    okx: false,
  });
  const [pending, setPending] = useState<WalletId | null>(null);

  const backRef = useRef<HTMLButtonElement>(null);
  const walletRef = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);

  const signingUp = mode === "signup";

  // Extensions inject after load, so detection waits for the wallet view.
  useEffect(() => {
    if (view !== "wallet") return;
    const w = window as WalletWindow;
    setDetected({
      metamask: Boolean(WALLETS[0].find(w)),
      coinbase: Boolean(WALLETS[1].find(w)),
      okx: Boolean(WALLETS[2].find(w)),
    });
  }, [view]);

  // Back from the provider restores this page from the bfcache, buttons still
  // locked mid-redirect; unlock them.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setRedirecting(null);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  // Focus follows the swap, so keyboard users are not dropped on <body>.
  useEffect(() => {
    if (!moved.current) return;
    (view === "wallet" ? backRef : walletRef).current?.focus();
  }, [view]);

  function go(next: "options" | "wallet") {
    moved.current = true;
    setNotice(null);
    setView(next);
  }

  function oauth(provider: OAuthButton) {
    if (!providers[provider.id]) {
      setNotice({
        tone: "info",
        text:
          process.env.NODE_ENV === "development"
            ? `${provider.name} sign in needs credentials: set ${provider.env} and its secret in .env.local, then restart the server.`
            : `${provider.name} sign in isn't available yet.`,
      });
      return;
    }
    setNotice(null);
    setRedirecting(provider.id);
    // navigates away to the provider; the pending label covers the gap
    signIn(provider.id, { callbackUrl: "/signin" }).catch(() => {
      setRedirecting(null);
      setNotice({ tone: "error", text: `Couldn't reach ${provider.name}. Try again.` });
    });
  }

  function notWired(what: string) {
    setNotice({ tone: "info", text: `${what} isn't connected to an account service yet.` });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    const next = {
      email: !EMAIL.test(email),
      password: signingUp ? password.length < 8 : password.length === 0,
    };
    setInvalid(next);

    if (next.email) {
      setNotice({ tone: "error", text: "Enter a valid email address." });
      return;
    }
    if (next.password) {
      setNotice({
        tone: "error",
        text: signingUp
          ? "Use at least 8 characters for your password."
          : "Enter your password.",
      });
      return;
    }
    notWired(signingUp ? "Account creation" : "Email sign in");
  }

  async function connect(wallet: Wallet) {
    const provider = wallet.find(window as WalletWindow);
    if (!provider) return;
    setPending(wallet.id);
    setNotice(null);
    try {
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      const address = accounts?.[0];
      setNotice(
        address
          ? {
              tone: "success",
              text: `${wallet.name} connected as ${shortAddress(address)}. Wallet accounts aren't linked to MidEarth Labs yet.`,
            }
          : { tone: "error", text: `${wallet.name} didn't share an account.` },
      );
    } catch (error) {
      const code = (error as { code?: number })?.code;
      setNotice({
        tone: "error",
        text:
          code === 4001
            ? `Request cancelled in ${wallet.name}.`
            : `${wallet.name} couldn't connect. Unlock it and try again.`,
      });
    } finally {
      setPending(null);
    }
  }

  const status = (
    <p
      className={`si-notice${notice ? ` is-${notice.tone}` : ""}`}
      role="status"
      aria-live="polite"
    >
      {notice?.text}
    </p>
  );

  const legal = (
    <p className="si-legal">
      By signing up, you agree to our <span>privacy policy</span> and{" "}
      <span>terms of service</span>, and acknowledge our <span>GDPR notice</span>.
    </p>
  );

  if (user) {
    const label = user.name || user.email || "your account";
    return (
      <div className="si-card">
        <h2 id="si-title" className="si-title">
          Signed In
        </h2>

        <div className="si-account mt-6">
          <span className="si-avatar" aria-hidden="true">
            {label.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="si-account-name">{label}</span>
            {user.email && user.name && <span className="si-account-mail">{user.email}</span>}
          </span>
        </div>

        <div className="si-stack mt-6">
          <a className="si-submit si-submit-link" href="/">
            Continue to MidEarth Labs
          </a>
          <button
            type="button"
            className="si-provider si-signout"
            disabled={redirecting !== null}
            onClick={() => {
              setRedirecting("signout");
              signOut({ callbackUrl: "/signin" });
            }}
          >
            {redirecting === "signout" ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    );
  }

  if (view === "wallet") {
    return (
      <div className="si-card">
        <button ref={backRef} type="button" className="si-back" onClick={() => go("options")}>
          <ArrowLeft />
          Previous
        </button>

        <h2 id="si-title" className="si-title mt-5">
          Sign In
        </h2>
        <p className="si-hint">Choose the wallet you want to use.</p>

        <ul className="si-stack mt-6">
          {WALLETS.map((wallet) => (
            <li key={wallet.id} className="si-wallet">
              <span className="si-wallet-mark">{wallet.mark}</span>
              <span className="si-wallet-name">{wallet.name}</span>
              {detected[wallet.id] ? (
                <button
                  type="button"
                  className="si-pill is-primary"
                  onClick={() => connect(wallet)}
                  disabled={pending !== null}
                  aria-label={`Connect ${wallet.name}`}
                >
                  {pending === wallet.id ? "Connecting…" : "Connect"}
                </button>
              ) : (
                <a
                  className="si-pill"
                  href={wallet.install}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Install ${wallet.name} (opens in a new tab)`}
                >
                  Install
                </a>
              )}
            </li>
          ))}
        </ul>

        {status}
        {legal}
      </div>
    );
  }

  return (
    <div className="si-card">
      <h2 id="si-title" className="si-title">
        {signingUp ? "Create Account" : "Sign In"}
      </h2>

      <div className="si-stack mt-6">
        {OAUTH.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="si-provider"
            onClick={() => oauth(provider)}
            disabled={redirecting !== null}
            aria-busy={redirecting === provider.id || undefined}
          >
            {provider.mark}
            <span>
              {redirecting === provider.id
                ? `Redirecting to ${provider.name}…`
                : `${signingUp ? "Sign up" : "Sign in"} with ${provider.name}`}
            </span>
            <ArrowRight />
          </button>
        ))}
        <button
          ref={walletRef}
          type="button"
          className="si-provider"
          disabled={redirecting !== null}
          onClick={() => go("wallet")}
        >
          <span className="si-provider-muted">
            <WalletMark />
          </span>
          <span>{signingUp ? "Sign up" : "Sign in"} with Wallet</span>
          <ArrowRight />
        </button>
      </div>

      <p className="si-or" aria-hidden="true">
        <span>OR</span>
      </p>

      <form className="si-stack" noValidate onSubmit={onSubmit}>
        <div className="si-field" data-invalid={invalid.email || undefined}>
          <label htmlFor="si-email" className="sr-only">
            Email address
          </label>
          <MailIcon />
          <input
            id="si-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="example@site.com"
            aria-invalid={invalid.email || undefined}
            onChange={() => invalid.email && setInvalid((v) => ({ ...v, email: false }))}
            required
          />
        </div>

        <div className="si-field" data-invalid={invalid.password || undefined}>
          <label htmlFor="si-password" className="sr-only">
            Password
          </label>
          <KeyIcon />
          <input
            id="si-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={signingUp ? "new-password" : "current-password"}
            placeholder="Password"
            aria-invalid={invalid.password || undefined}
            onChange={() => invalid.password && setInvalid((v) => ({ ...v, password: false }))}
            required
          />
          <button
            type="button"
            className="si-eye"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>

        {!signingUp && (
          <button type="button" className="si-forgot" onClick={() => notWired("Password reset")}>
            Forgot your password?
          </button>
        )}

        <button type="submit" className="si-submit">
          {signingUp ? "Sign Up" : "Sign In"}
        </button>
      </form>

      {status}

      <p className="si-switch">
        {signingUp ? "Already have a MidEarth Labs account?" : "Don't have a MidEarth Labs account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(signingUp ? "signin" : "signup");
            setInvalid({});
            setNotice(null);
          }}
        >
          {signingUp ? "Sign In" : "Sign Up"}
        </button>
      </p>

      {legal}
    </div>
  );
}
