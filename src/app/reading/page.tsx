import Link from "next/link";

export default function BacaanPage() {
    return (
        <div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Link href="/create-bacaan" className="btn" style={{ background : "lightblue", color : "black"}}>
                    + Create a reading exercise
                </Link>
            </div>

            <div style={{ textAlign: "center", marginTop: "3rem" }}>
                <h1>Welcome friendss!!</h1>
                <h1>Let's get started to read our materials</h1>
            </div>

        </div>
    );
}