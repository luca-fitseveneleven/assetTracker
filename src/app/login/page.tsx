import LoginForm from "./LoginForm";

export default function LoginPage() {
  const isDemo = process.env.DEMO_MODE === "true";
  const microsoftEnabled =
    !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);

  return <LoginForm isDemo={isDemo} microsoftEnabled={microsoftEnabled} />;
}
