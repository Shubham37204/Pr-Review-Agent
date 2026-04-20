import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    // Wrapper div to center content (no Tailwind)
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <SignUp />
    </div>
  );
}
