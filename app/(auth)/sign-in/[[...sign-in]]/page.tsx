import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    // Wrapper div to center content (basic CSS, no Tailwind)
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <SignIn />
    </div>
  );
}