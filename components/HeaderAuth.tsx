"use client";

import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";

/*
  The header's way in. Asked for the session in the browser rather than on the
  server, so the home page stays statically rendered: it paints "Sign in" and
  flips to "Account" once a session turns up. Both go to /signin, which shows
  the signed-in view and sign-out.
*/
export default function HeaderAuth() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let live = true;
    getSession()
      .then((session) => live && setSignedIn(Boolean(session?.user)))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  return (
    <a className="signin-link" href="/signin">
      {signedIn ? "Account" : "Sign in"}
    </a>
  );
}
