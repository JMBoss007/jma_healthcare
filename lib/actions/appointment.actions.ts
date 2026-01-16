"use server";

import { revalidatePath } from "next/cache";
import { ID, Query } from "node-appwrite";

import { Appointment, Patient } from "@/types/appwrite.types";
import {
  APPOINTMENT_TABLE_ID,
  DATABASE_ID,
  PATIENT_TABLE_ID,
  databases,
  messaging,
} from "../appwrite.server";
import { formatDateTime, parseStringify } from "../utils";

// CREATE APPOINTMENT
export const createAppointment = async (appointment: CreateAppointmentParams) => {
  try {
    const newAppointment = await databases.createDocument(
      DATABASE_ID!,
      APPOINTMENT_TABLE_ID!,
      ID.unique(),
      appointment
    );

    revalidatePath("/admin");
    return parseStringify(newAppointment);
  } catch (error) {
    console.error("createAppointment error:", error);
    throw error;
  }
};

// GET RECENT APPOINTMENTS (hydrate patient)
export const getRecentAppointmentList = async () => {
  try {
    const appointments = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_TABLE_ID!,
      [Query.orderDesc("$createdAt")]
    );

    const appointmentDocs = appointments.documents.map(
      (doc) => doc as unknown as Appointment
    );

    // counts
    const initialCounts = {
      scheduledCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
    };

    const counts = appointmentDocs.reduce((acc, appointment) => {
      switch (appointment.status) {
        case "scheduled":
          acc.scheduledCount++;
          break;
        case "pending":
          acc.pendingCount++;
          break;
        case "cancelled":
          acc.cancelledCount++;
          break;
      }
      return acc;
    }, initialCounts);

    /**
     * Normalize patient so UI can safely show patient.name
     * If appointment.patient is an ID string -> fetch matching patient documents and replace.
     */

    const patientIds = Array.from(
      new Set(
        appointmentDocs
          .map((a) =>
            typeof a.patient === "string" ? a.patient : a.patient?.$id
          )
          .filter(Boolean) as string[]
      )
    );

    const patientMap = new Map<string, Patient>();

    if (patientIds.length > 0) {
      // NOTE: Query.equal("$id", [...]) is the correct way to fetch many IDs in Appwrite
      const patientsRes = await databases.listDocuments(
        DATABASE_ID!,
        PATIENT_TABLE_ID!,
        [Query.equal("$id", patientIds)]
      );

      patientsRes.documents.forEach((p) => {
        const patientDoc = p as unknown as Patient;
        patientMap.set(patientDoc.$id, patientDoc);
      });
    }

    const normalizedAppointments: Appointment[] = appointmentDocs.map((a) => {
      if (typeof a.patient === "string") {
        const p = patientMap.get(a.patient);

        return {
          ...a,
          patient:
            p ??
            ({
              $id: a.patient,
              name: a.patient, // fallback: show ID if missing
            } as unknown as Patient),
        };
      }

      // if already object, keep as-is
      return a;
    });

    const data = {
      totalCount: appointments.total,
      ...counts,
      documents: normalizedAppointments,
    };

    return parseStringify(data);
  } catch (error) {
    console.error("getRecentAppointmentList error:", error);
    throw error;
  }
};

// SEND SMS NOTIFICATION
export const sendSMSNotification = async (userId: string, content: string) => {
  try {
    const message = await messaging.createSms(ID.unique(), content, [], [userId]);
    return parseStringify(message);
  } catch (error) {
    console.error("sendSMSNotification error:", error);
    // Don't break the app if SMS fails
    return null;
  }
};

// UPDATE APPOINTMENT
export const updateAppointment = async ({
  appointmentId,
  userId,
  timeZone,
  appointment,
  type,
}: UpdateAppointmentParams) => {
  try {
    const updatedAppointment = await databases.updateDocument(
      DATABASE_ID!,
      APPOINTMENT_TABLE_ID!,
      appointmentId,
      appointment
    );

    const smsMessage = `Greetings from JMAX Technical Services! ${
      type === "schedule"
        ? `Your appointment is confirmed for ${
            formatDateTime(appointment.schedule!, timeZone).dateTime
          } as per your requested service of ${appointment.primaryPhysician}.`
        : `We regret to inform that your appointment for ${
            formatDateTime(appointment.schedule!, timeZone).dateTime
          } is cancelled for the following reason: ${appointment.cancellationReason}.`
    }`;

    await sendSMSNotification(userId, smsMessage);

    revalidatePath("/admin");
    return parseStringify(updatedAppointment);
  } catch (error) {
    console.error("updateAppointment error:", error);
    throw error;
  }
};

// GET APPOINTMENT
export const getAppointment = async (appointmentId: string) => {
  try {
    const appointment = await databases.getDocument(
      DATABASE_ID!,
      APPOINTMENT_TABLE_ID!,
      appointmentId
    );

    return parseStringify(appointment);
  } catch (error) {
    console.error("getAppointment error:", error);
    throw error;
  }
};
