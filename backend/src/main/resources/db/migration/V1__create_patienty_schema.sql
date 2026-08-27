CREATE TABLE department (
    code varchar(64) PRIMARY KEY,
    display_name varchar(100) NOT NULL
);

CREATE TABLE patient (
    id uuid PRIMARY KEY,
    patient_number varchar(32) NOT NULL UNIQUE,
    name varchar(100) NOT NULL,
    birth_date date NOT NULL,
    sex_code varchar(16) NOT NULL CHECK (sex_code IN ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN')),
    phone_normalized varchar(32),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_lower_name ON patient (lower(name));

CREATE TABLE clinician (
    id uuid PRIMARY KEY,
    email varchar(254) NOT NULL,
    name varchar(100) NOT NULL,
    password_hash varchar(100) NOT NULL,
    role varchar(16) NOT NULL CHECK (role IN ('DOCTOR', 'ADMIN')),
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_clinician_lower_email ON clinician (lower(email));

CREATE TABLE clinician_patient_assignment (
    clinician_id uuid NOT NULL REFERENCES clinician(id),
    patient_id uuid NOT NULL REFERENCES patient(id),
    assigned_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clinician_id, patient_id)
);

CREATE INDEX idx_assignment_patient ON clinician_patient_assignment(patient_id, clinician_id);

CREATE TABLE appointment (
    id uuid PRIMARY KEY,
    patient_id uuid NOT NULL REFERENCES patient(id),
    department_code varchar(64) NOT NULL REFERENCES department(code),
    scheduled_start timestamptz NOT NULL,
    scheduled_end timestamptz NOT NULL,
    status varchar(24) NOT NULL CHECK (status IN ('SCHEDULED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'MISSED')),
    reason varchar(500),
    CHECK (scheduled_end > scheduled_start)
);

CREATE INDEX idx_appointment_patient_start ON appointment(patient_id, scheduled_start DESC);
CREATE INDEX idx_appointment_status_start ON appointment(status, scheduled_start);

CREATE TABLE encounter (
    id uuid PRIMARY KEY,
    patient_id uuid NOT NULL REFERENCES patient(id),
    appointment_id uuid UNIQUE REFERENCES appointment(id),
    department_code varchar(64) NOT NULL REFERENCES department(code),
    occurred_at timestamptz NOT NULL,
    chief_complaint varchar(500),
    note text,
    status varchar(24) NOT NULL CHECK (status IN ('COMPLETED', 'VOIDED'))
);

CREATE INDEX idx_encounter_patient_occurred ON encounter(patient_id, occurred_at DESC);

CREATE TABLE examination (
    id uuid PRIMARY KEY,
    patient_id uuid NOT NULL REFERENCES patient(id),
    encounter_id uuid REFERENCES encounter(id),
    performed_at timestamptz NOT NULL,
    type varchar(64) NOT NULL,
    status varchar(24) NOT NULL CHECK (status IN ('FINAL', 'PRELIMINARY', 'CANCELLED'))
);

CREATE INDEX idx_examination_patient_performed ON examination(patient_id, performed_at DESC);

CREATE TABLE examination_result (
    id uuid PRIMARY KEY,
    examination_id uuid NOT NULL REFERENCES examination(id),
    metric_code varchar(64) NOT NULL,
    display_name varchar(100) NOT NULL,
    numeric_value numeric(14,4),
    text_value text,
    unit varchar(32),
    reference_min numeric(14,4),
    reference_max numeric(14,4),
    abnormal_flag varchar(24) NOT NULL CHECK (abnormal_flag IN ('NORMAL', 'LOW', 'HIGH', 'ABNORMAL', 'UNKNOWN')),
    CHECK ((numeric_value IS NOT NULL) <> (text_value IS NOT NULL)),
    CHECK (reference_min IS NULL OR reference_max IS NULL OR reference_min <= reference_max)
);

CREATE INDEX idx_result_metric_examination ON examination_result(metric_code, examination_id);

CREATE TABLE medication (
    id uuid PRIMARY KEY,
    code varchar(64) NOT NULL UNIQUE,
    name varchar(120) NOT NULL,
    default_unit varchar(32)
);

CREATE TABLE prescription (
    id uuid PRIMARY KEY,
    patient_id uuid NOT NULL REFERENCES patient(id),
    encounter_id uuid REFERENCES encounter(id),
    prescribed_at timestamptz NOT NULL,
    status varchar(24) NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED', 'SUPERSEDED'))
);

CREATE INDEX idx_prescription_patient_prescribed ON prescription(patient_id, prescribed_at DESC);

CREATE TABLE prescription_item (
    id uuid PRIMARY KEY,
    prescription_id uuid NOT NULL REFERENCES prescription(id),
    medication_id uuid NOT NULL REFERENCES medication(id),
    dose_value numeric(10,3) NOT NULL CHECK (dose_value > 0),
    dose_unit varchar(32) NOT NULL,
    frequency_per_day numeric(5,2) NOT NULL CHECK (frequency_per_day > 0),
    route varchar(64),
    start_date date NOT NULL,
    end_date date,
    instructions varchar(500),
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_prescription_item_prescription ON prescription_item(prescription_id);
