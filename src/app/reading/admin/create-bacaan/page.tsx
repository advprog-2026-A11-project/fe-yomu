import { Suspense } from "react";
import CreateEditReading from "@/app/reading/admin/create-bacaan/CreateEditReading";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function Page() {
    return (
        <ProtectedRoute description="Sign in to create or edit reading materials.">
            <Suspense fallback={<div>Loading...</div>}>
                <CreateEditReading/>
            </Suspense>
        </ProtectedRoute>
    )
}
