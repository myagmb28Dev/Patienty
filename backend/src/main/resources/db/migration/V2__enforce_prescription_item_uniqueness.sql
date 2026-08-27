ALTER TABLE prescription_item
    ADD CONSTRAINT uq_prescription_item_medication
    UNIQUE (prescription_id, medication_id);

ALTER TABLE examination_result
    ADD CONSTRAINT uq_examination_result_metric
    UNIQUE (examination_id, metric_code);
