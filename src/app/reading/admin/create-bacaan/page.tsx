import { Suspense } from "react";
import CreateEditReading from "@/app/reading/admin/create-bacaan/CreateEditReading";

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateEditReading/>
        </Suspense>
    )
}