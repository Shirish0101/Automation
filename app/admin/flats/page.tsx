import Link from "next/link";
import { bulkUploadFlatsAction, saveFlatAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";

export default async function FlatsPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q || "";
  const flats = await prisma.flat.findMany({
    where: q ? {
      OR: [
        { roomNo: { contains: q, mode: "insensitive" } },
        { ownerName: { contains: q, mode: "insensitive" } },
        { ownerPhone: { contains: q, mode: "insensitive" } },
        { ownerEmail: { contains: q, mode: "insensitive" } }
      ]
    } : {},
    orderBy: { roomNo: "asc" }
  });

  return (
    <>
      <div className="topbar">
        <div className="title">
          <h1>Flats & Owners</h1>
          <p>Add manually, edit room details, or bulk upload from CSV.</p>
        </div>
        <Link className="btn soft" href="/templates/flat-upload-template.csv" download>Download Sample CSV</Link>
      </div>

      <section className="grid grid-2">
        <div className="card">
          <h2>Add / Update Flat</h2>
          <form action={saveFlatAction} className="form-grid">
            <input type="hidden" name="id" />
            {[
              ["roomNo", "Room No"], ["ownerName", "Owner Name"], ["ownerEmail", "Owner Email"], ["ownerPhone", "Owner Phone"],
              ["sqft", "Square Feet"], ["ratePerSqft", "Rate / Sqft"], ["carParkingCount", "Car Count"], ["carParkingRate", "Car Rate"],
              ["twoWheelerCount", "2W Count"], ["twoWheelerRate", "2W Rate"], ["waterBill", "Water Bill"], ["lightBill", "Light Bill"],
              ["otherCharges", "Other Charges"]
            ].map(([name, label]) => (
              <div className="field" key={name}>
                <label>{label}</label>
                <input name={name} type={name.includes("Email") ? "email" : "text"} />
              </div>
            ))}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Notes</label>
              <textarea name="notes" />
            </div>
            <button className="btn" type="submit">Save Flat</button>
          </form>
        </div>

        <div className="card">
          <h2>Bulk Upload Flats</h2>
          <p className="notice">Upload CSV with your real flat details. Existing room numbers are updated automatically.</p>
          <form action={bulkUploadFlatsAction} className="grid">
            <div className="field">
              <label>CSV File</label>
              <input name="file" type="file" accept=".csv" required />
            </div>
            <button className="btn" type="submit">Upload & Auto Map</button>
          </form>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <form className="actions" action="/admin/flats">
          <input name="q" placeholder="Search room, owner, phone, email" defaultValue={q} />
          <button className="btn secondary" type="submit">Search</button>
        </form>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead><tr><th>Action</th><th>Room</th><th>Owner</th><th>Phone</th><th>Email</th><th>Sqft</th><th>Rate</th><th>Car</th><th>2W</th><th>Water</th><th>Light</th><th>Other</th></tr></thead>
            <tbody>
              {flats.map((flat) => (
                <tr key={flat.id}>
                  <td><Link className="btn soft" href={`/admin/flats/${flat.id}`}>Edit</Link></td>
                  <td>{flat.roomNo}</td><td>{flat.ownerName}</td><td>{flat.ownerPhone}</td><td>{flat.ownerEmail}</td>
                  <td>{String(flat.sqft)}</td><td>{String(flat.ratePerSqft)}</td><td>{flat.carParkingCount}</td><td>{flat.twoWheelerCount}</td>
                  <td>{String(flat.waterBill)}</td><td>{String(flat.lightBill)}</td><td>{String(flat.otherCharges)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
