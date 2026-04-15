import { Suspense } from "react";
import CreateEditReading from "@/app/reading/create-bacaan/CreateEditReading";

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateEditReading/>
        </Suspense>
    )
}