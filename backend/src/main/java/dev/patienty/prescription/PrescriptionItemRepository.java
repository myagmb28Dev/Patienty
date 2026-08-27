package dev.patienty.prescription;
import java.time.Instant;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface PrescriptionItemRepository extends JpaRepository<PrescriptionItem, UUID> {
    @Query("""
            select new dev.patienty.prescription.PrescriptionRecord(p.id,p.prescribedAt,p.status,i.id,m.id,m.code,m.name,i.doseValue,i.doseUnit,i.frequencyPerDay,i.route,i.startDate,i.endDate,i.instructions)
            from PrescriptionItem i join Prescription p on p.id=i.prescriptionId join Medication m on m.id=i.medicationId
            where p.patientId=:patientId and p.status in :statuses order by p.prescribedAt desc,m.name
            """)
    List<PrescriptionRecord> findByPatientAndStatuses(@Param("patientId") UUID patientId, @Param("statuses") Collection<String> statuses);
    @Query("""
            select new dev.patienty.prescription.PrescriptionRecord(p.id,p.prescribedAt,p.status,i.id,m.id,m.code,m.name,i.doseValue,i.doseUnit,i.frequencyPerDay,i.route,i.startDate,i.endDate,i.instructions)
            from PrescriptionItem i join Prescription p on p.id=i.prescriptionId join Medication m on m.id=i.medicationId
            where p.patientId=:patientId and p.prescribedAt>=:after order by p.prescribedAt desc,p.id desc,m.name
            """)
    List<PrescriptionRecord> findRecent(@Param("patientId") UUID patientId, @Param("after") Instant after);
}
