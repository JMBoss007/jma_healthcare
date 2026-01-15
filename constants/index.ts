export const GenderOptions = ["male", "female", "other"];

export const PatientFormDefaultValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthDate: new Date(Date.now()),
  gender: "male" as Gender,
  address: "",
  occupation: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  primaryPhysician: "",
  insuranceProvider: "",
  insurancePolicyNumber: "",
  allergies: "",
  currentMedication: "",
  familyMedicalHistory: "",
  pastMedicalHistory: "",
  identificationType: "", 
  identificationNumber: "",
  identificationDocument: [],
  treatmentConsent: false,
  disclosureConsent: false,
  privacyConsent: false,
};

export const IdentificationTypes = [
  "Vehicle Damage Photo",
  "Laptop Damage Photo",
  "Website Logo",
];

export const Doctors = [
  {
    name: "Engine Oil Filter Change",
  },
  {
    name: "Brake Pad Repair",
  },
  {
    name: "Battery & Spark Pkug Replacement",
  },
  {
    name: "Air & A/C Filter Change",
  },
  {
    name: "Starter Motor & Alternator Replacement",
  },
  {
    name: "Web Designing",
  },
  {
    name: "Web Development",
  },
  {
    name: "Dashboard/Portal Development",
  },
  {
    name: "Logo Creation",
  },
  {
    name: "Social Media Posts/Reel Creation",
  },
  {
    name: "Computer/IT Solutions",
  },
];

export const StatusIcon = {
  scheduled: "/assets/icons/check.svg",
  pending: "/assets/icons/pending.svg",
  cancelled: "/assets/icons/cancelled.svg",
};