import { createUserAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
  const users = await prisma.user.findMany({ include: { flat: true }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <div className="topbar"><div className="title"><h1>User Access</h1><p>Create admin and room-owner accounts.</p></div></div>
      <section className="card">
        <h2>Create Account</h2>
        <form action={createUserAction} className="form-grid">
          <div className="field"><label>Name</label><input name="name" required /></div>
          <div className="field"><label>Email</label><input name="email" type="email" required /></div>
          <div className="field"><label>Phone</label><input name="phone" /></div>
          <div className="field"><label>Password</label><input name="password" type="password" required /></div>
          <div className="field"><label>Role</label><select name="role"><option value="OWNER">Room Owner</option><option value="ADMIN">Admin</option></select></div>
          <div className="field"><label>Room No</label><input name="roomNo" placeholder="Required for owner" /></div>
          <button className="btn" type="submit">Create User</button>
        </form>
      </section>
      <section className="card" style={{ marginTop: 16 }}>
        <h2>Users</h2>
        <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Room</th><th>Active</th><th>Created</th></tr></thead><tbody>
          {users.map((user) => <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td>{user.role}</td><td>{user.flat?.roomNo || "-"}</td><td>{user.isActive ? "Yes" : "No"}</td><td>{user.createdAt.toLocaleDateString()}</td></tr>)}
        </tbody></table></div>
      </section>
    </>
  );
}
