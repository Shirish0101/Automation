import Link from "next/link";
import { notFound } from "next/navigation";
import { saveFlatAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";

export default async function EditFlatPage({ params }: { params: { id: string } }) {
  const flat = await prisma.flat.findUnique({ where: { id: params.id } });
  if (!flat) notFound();

  return (
    <>
      <div className="topbar">
        <div className="title">
          <h1>Edit Room {flat.roomNo}</h1>
          <p>Change room number, owner details, area, rates, parking, and monthly charges.</p>
        </div>
        <Link href="/admin/flats" className="btn soft">Back to Flats</Link>
      </div>
      <section className="card">
        <form action={saveFlatAction} className="form-grid">
          <input type="hidden" name="id" defaultValue={flat.id} />
          <div className="field"><label>Room No</label><input name="roomNo" defaultValue={flat.roomNo} required /></div>
          <div className="field"><label>Owner Name</label><input name="ownerName" defaultValue={flat.ownerName} required /></div>
          <div className="field"><label>Owner Email</label><input name="ownerEmail" defaultValue={flat.ownerEmail || ""} /></div>
          <div className="field"><label>Owner Phone</label><input name="ownerPhone" defaultValue={flat.ownerPhone || ""} /></div>
          <div className="field"><label>Square Feet</label><input name="sqft" defaultValue={String(flat.sqft)} /></div>
          <div className="field"><label>Rate / Sqft</label><input name="ratePerSqft" defaultValue={String(flat.ratePerSqft)} /></div>
          <div className="field"><label>Car Parking Count</label><input name="carParkingCount" defaultValue={flat.carParkingCount} /></div>
          <div className="field"><label>Car Parking Rate</label><input name="carParkingRate" defaultValue={String(flat.carParkingRate)} /></div>
          <div className="field"><label>2 Wheeler Count</label><input name="twoWheelerCount" defaultValue={flat.twoWheelerCount} /></div>
          <div className="field"><label>2 Wheeler Rate</label><input name="twoWheelerRate" defaultValue={String(flat.twoWheelerRate)} /></div>
          <div className="field"><label>Water Bill</label><input name="waterBill" defaultValue={String(flat.waterBill)} /></div>
          <div className="field"><label>Light Bill</label><input name="lightBill" defaultValue={String(flat.lightBill)} /></div>
          <div className="field"><label>Other Charges</label><input name="otherCharges" defaultValue={String(flat.otherCharges)} /></div>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label>Notes</label><textarea name="notes" defaultValue={flat.notes || ""} /></div>
          <button className="btn" type="submit">Save Changes</button>
        </form>
      </section>
    </>
  );
}
