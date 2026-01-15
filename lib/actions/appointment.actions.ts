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
} from "../appwrite.config";

import { formatDateTime, parseStringify } from "../utils";

//  CREATE APPOINTMENT
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
    console.error("An error occurred while creating a new appointment:", error);
  }
};

//  GET RECENT APPOINTMENTS
export const getRecentAppointmentList = async () => {
  try {
    const appointments = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_TABLE_ID!,
      [Query.orderDesc("$createdAt")]
    );

    const initialCounts = {
      scheduledCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
    };

    // Cast docs
    const appointmentDocs = appointments.documents.map(
      (doc) => doc as unknown as Appointment
    );

    // Counts (your existing logic)
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
     * ✅ NORMALIZE PATIENT FIELD
     * Sometimes appointment.patient is a string (patientId)
     * We fetch all needed patients once, build a map, and replace strings with objects.
     */

    // 1) collect patient IDs (only those that are strings)
    const patientIds = appointmentDocs
      .map((a) => (typeof a.patient === "string" ? a.patient : a.patient?.$id))
      .filter(Boolean) as string[];

    // 2) fetch patients in ONE query (if we have any)
    let patientMap = new Map<string, Patient>();

    if (patientIds.length > 0) {
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

    // 3) normalize appointments so patient is always an object with name
    const normalizedAppointments = appointmentDocs.map((a) => {
      if (typeof a.patient === "string") {
        const p = patientMap.get(a.patient);

        return {
          ...a,
          patient:
            p ??
            ({
              $id: a.patient,
              name: "Unknown",
            } as any),
        };
      }

      return a;
    });

    const data = {
      totalCount: appointments.total,
      ...counts,
      documents: normalizedAppointments, // ✅ IMPORTANT: use normalized
    };

    return parseStringify(data);
  } catch (error) {
    console.error(
      "An error occurred while retrieving the recent appointments:",
      error
    );
  }
};

//  SEND SMS NOTIFICATION
export const sendSMSNotification = async (userId: string, content: string) => {
  try {
    const message = await messaging.createSms(ID.unique(), content, [], [userId]);
    return parseStringify(message);
  } catch (error) {
    console.error("An error occurred while sending sms:", error);
  }
};

//  UPDATE APPOINTMENT
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

    if (!updatedAppointment) throw Error;

    const smsMessage = `Greetings from JMAX Technical Services!${
      type === 'schedule'
        ? `Your appointment is confirmed for ${formatDateTime(
            appointment.schedule!,
            timeZone
          ).dateTime} as per your requested service of ${appointment.primaryPhysician}`
        : `We regret to inform that your appointment for ${formatDateTime(
            appointment.schedule!,
            timeZone
          ).dateTime} is cancelled for the following reason:  ${appointment.cancellationReason}`
    }.`;

    await sendSMSNotification(userId, smsMessage);

    revalidatePath("/admin");
    return parseStringify(updatedAppointment);
  } catch (error) {
    console.error("An error occurred while scheduling an appointment:", error);
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
    console.error(
      "An error occurred while retrieving the existing patient:",
      error
    );
  }
};
