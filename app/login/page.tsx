import { redirect } from "next/navigation";
import { requireUppercaseInitials, verifyPartnerPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string; from?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const fromValue = params?.from ?? "";
  const rawErrorMessage = params?.error ?? "";
  const hasPlaintextPassword =
    Boolean(process.env.PLAINTEXT_PASSWORD?.trim()) ||
    Boolean(process.env.ACW_PASSWORD?.trim()) ||
    Boolean(process.env.SLS_PASSWORD?.trim());
  const errorMessage =
    rawErrorMessage ===
      "Password is not configured. Set ACW_PASSWORD_HASH and SLS_PASSWORD_HASH." &&
    hasPlaintextPassword
      ? ""
      : rawErrorMessage;

  async function handleLogin(formData: FormData) {
    "use server";

    const fromRaw = formData.get("from")?.toString() ?? "";
    const fromParam = fromRaw ? `&from=${encodeURIComponent(fromRaw)}` : "";

    const initialsRaw = formData.get("initials")?.toString();
    const password = formData.get("password")?.toString() ?? "";

    const initials = requireUppercaseInitials(initialsRaw);
    if (!initials) {
      redirect(
        `/login?error=${encodeURIComponent(
          "Initials must be ACW or SLS in uppercase."
        )}${fromParam}`
      );
    }

    if (!password) {
      redirect(
        `/login?error=${encodeURIComponent("Password is required.")}${fromParam}`
      );
    }

    const isValid = await verifyPartnerPassword(initials, password);
    if (!isValid) {
      redirect(
        `/login?error=${encodeURIComponent(
          "That password does not match our records."
        )}${fromParam}`
      );
    }

    await setSessionCookie(initials);

    const destination = fromRaw || "/write";
    redirect(destination);
  }

  return (
    <main>
      <section className="card">
        <div className="hero">
          <h1>Welcome back, lovebirds.</h1>
          <p>
            Enter your initials and secret password to unlock this year's time
            capsule.
          </p>
        </div>
        {errorMessage ? (
          <div className="error">{errorMessage}</div>
        ) : null}
        <form action={handleLogin}>
          <input type="hidden" name="from" value={fromValue} />
          <label>
            Initials
            <select name="initials" defaultValue="ACW">
              <option value="ACW">ACW</option>
              <option value="SLS">SLS</option>
            </select>
          </label>
          <label>
            Password
            <input name="password" type="password" />
          </label>
          <div className="notice">Hint: lovebirds</div>
          <button className="button" type="submit">
            Unlock the Capsule
          </button>
        </form>
      </section>
    </main>
  );
}
