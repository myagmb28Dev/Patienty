import { Suspense } from "react";
import { PageLoader } from "@/components/ui/states";
import { PatientListPage } from "@/features/patients/patient-list-page";

export default function PatientsPage() {
  return (
    <Suspense fallback={<PageLoader label="환자 검색을 준비하는 중" />}>
      <PatientListPage />
    </Suspense>
  );
}
