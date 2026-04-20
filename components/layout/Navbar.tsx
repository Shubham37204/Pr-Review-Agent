"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 20px",
        borderBottom: "1px solid #ccc",
      }}
    >
      {/* Left */}
      <h2>PR Review Agent</h2>

      {/* Right */}
      <div>
        {!isLoaded && <span>Loading...</span>}

        {isLoaded && user && (
          <>
            <span style={{ marginRight: "10px" }}>
              {user.primaryEmailAddress?.emailAddress}
            </span>
            <button onClick={handleSignOut}>Sign Out</button>
          </>
        )}
      </div>
    </nav>
  );
}
