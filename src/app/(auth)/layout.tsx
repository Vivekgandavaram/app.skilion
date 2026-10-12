export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main id="main" style={{ minHeight: "100dvh" }}>{children}</main>;
}
