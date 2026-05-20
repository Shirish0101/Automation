import { loginAction } from "@/lib/actions";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="login-page">
      <section className="card login-card">
        <h1>StarnX Socienty Application</h1>
        <p>Secure maintenance dashboard for admins and room owners.</p>
        {searchParams.error ? <p className="danger">Invalid email or password.</p> : null}
        <form action={loginAction} className="grid">
          <div className="field">
            <label>Email</label>
            <input name="email" type="email" placeholder="admin@starnx.local" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input name="password" type="password" placeholder="Password" required />
          </div>
          <button className="btn" type="submit">Login</button>
        </form>
        <p className="notice">First deployment: run seed to create admin. No flat details are added automatically.</p>
      </section>
    </main>
  );
}
